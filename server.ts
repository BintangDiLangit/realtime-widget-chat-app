/**
 * Custom Node.js Server with Socket.io Integration
 * Handles real-time communication for the chat widget system
 */

// Load environment variables FIRST (before any other imports that might use them)
import "dotenv/config";

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "./src/lib/prisma";
import {
  CustomerJoinSchema,
  CustomerMessageSchema,
  AgentJoinSchema,
  AgentMessageSchema,
  TypingSchema,
  MarkReadSchema,
} from "./src/types";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active connections
interface ActiveConnection {
  socketId: string;
  conversationId?: string;
  userId: string;
  userType: "agent" | "customer";
}

const activeConnections = new Map<string, ActiveConnection>();
const typingUsers = new Map<string, NodeJS.Timeout>();

/**
 * Test database connection on startup
 */
async function testDatabaseConnection(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✓ Database connection successful");
  } catch (error: any) {
    console.error("✗ Database connection failed:", error?.code || error?.message);
    console.error("  → Check DATABASE_URL in .env file");
    console.error("  → Make sure PostgreSQL is running");
    // Don't exit - let the server start anyway, errors will be logged
  }
}

app.prepare().then(async () => {
  // Test database connection on startup
  await testDatabaseConnection();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(",") || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket.io connection handler
  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // ============================================
    // CUSTOMER EVENTS
    // ============================================

    /**
     * Customer joins a conversation
     */
    socket.on("customer:join", async (data) => {
      try {
        const validated = CustomerJoinSchema.safeParse(data);
        if (!validated.success) {
          socket.emit("message:error", {
            error: "Invalid join data",
          });
          return;
        }

        const { customerId, customerName, customerEmail, conversationId } =
          validated.data;

        // Store connection
        activeConnections.set(socket.id, {
          socketId: socket.id,
          conversationId,
          userId: customerId,
          userType: "customer",
        });

        // Join conversation room if exists
        if (conversationId) {
          socket.join(`conversation:${conversationId}`);
          console.log(
            `[Socket] Customer ${customerId} joined conversation ${conversationId}`
          );
        }

        // Join customer's personal room
        socket.join(`customer:${customerId}`);

        // Update customer info if provided
        if (conversationId && (customerName || customerEmail)) {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: {
              customerName: customerName || undefined,
              customerEmail: customerEmail || undefined,
            },
          });
        }
      } catch (error) {
        console.error("[Socket] Error in customer:join:", error);
        socket.emit("message:error", { error: "Failed to join conversation" });
      }
    });

    /**
     * Customer sends a message
     */
    socket.on("customer:message", async (data) => {
      try {
        const validated = CustomerMessageSchema.safeParse(data);
        if (!validated.success) {
          socket.emit("message:error", {
            tempId: data.tempId,
            error: "Invalid message data",
          });
          return;
        }

        const {
          conversationId,
          customerId,
          customerName,
          customerEmail,
          content,
          fileUrl,
          fileName,
          tempId,
        } = validated.data;

        let conversation;

        // Create or get conversation
        if (!conversationId) {
          // First, check if customer already has an open/assigned conversation
          conversation = await prisma.conversation.findFirst({
            where: {
              customerId,
              status: { in: ["open", "assigned"] },
            },
            orderBy: { updatedAt: "desc" }, // Get the most recent one
          });

          // If no existing conversation, create a new one
          if (!conversation) {
            conversation = await prisma.conversation.create({
              data: {
                customerId,
                customerName,
                customerEmail,
                status: "open",
                unreadCount: 1,
              },
            });

            // Broadcast new conversation to all agents (with proper format)
            const newConversationWithDetails = await prisma.conversation.findUnique({
              where: { id: conversation.id },
              include: {
                agent: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    isOnline: true,
                  },
                },
                messages: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                  select: {
                    id: true,
                    content: true,
                    senderType: true,
                    createdAt: true,
                  },
                },
              },
            });

            if (newConversationWithDetails) {
              const formattedConversation = {
                ...newConversationWithDetails,
                lastMessage: newConversationWithDetails.messages[0] || null,
                messages: undefined,
              };
              io.to("agents").emit("conversation:created", formattedConversation);
            }

            console.log(
              `[Socket] New conversation created: ${conversation.id}`
            );
          } else {
            // Update existing conversation with latest customer info
            conversation = await prisma.conversation.update({
              where: { id: conversation.id },
              data: {
                customerName: customerName || conversation.customerName,
                customerEmail: customerEmail || conversation.customerEmail,
                updatedAt: new Date(),
              },
            });

            console.log(
              `[Socket] Using existing conversation: ${conversation.id}`
            );
          }

          // Update connection with conversation ID
          const conn = activeConnections.get(socket.id);
          if (conn) {
            conn.conversationId = conversation.id;
          }

          // Join conversation room
          socket.join(`conversation:${conversation.id}`);
        } else {
          conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
          });

          if (!conversation) {
            socket.emit("message:error", {
              tempId,
              error: "Conversation not found",
            });
            return;
          }
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: customerId,
            senderType: "customer",
            senderName: customerName || "Customer",
            content,
            fileUrl,
            fileName,
          },
        });

        // Update conversation
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            updatedAt: new Date(),
            unreadCount: { increment: 1 },
          },
        });

        // Broadcast message to conversation room
        io.to(`conversation:${conversation.id}`).emit(
          "message:received",
          message
        );

        // Notify all agents about updated conversation
        const updatedConversation = await prisma.conversation.findUnique({
          where: { id: conversation.id },
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                email: true,
                isOnline: true,
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                content: true,
                senderType: true,
                createdAt: true,
              },
            },
          },
        });

        if (updatedConversation) {
          // Format conversation to match ConversationListItem type
          const formattedConversation = {
            ...updatedConversation,
            lastMessage: updatedConversation.messages[0] || null,
            messages: undefined, // Remove messages array
          };
          io.to("agents").emit("conversation:updated", formattedConversation);
        }

        console.log(
          `[Socket] Message from customer ${customerId} in conversation ${conversation.id}`
        );
      } catch (error) {
        console.error("[Socket] Error in customer:message:", error);
        socket.emit("message:error", {
          tempId: data.tempId,
          error: "Failed to send message",
        });
      }
    });

    /**
     * Customer typing indicator
     */
    socket.on("customer:typing", (data) => {
      try {
        const validated = TypingSchema.safeParse(data);
        if (!validated.success) return;

        const { conversationId, senderId, senderType } = validated.data;
        const typingKey = `${conversationId}:${senderId}`;

        // Clear existing timeout
        const existingTimeout = typingUsers.get(typingKey);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Broadcast typing start
        socket.to(`conversation:${conversationId}`).emit("typing:start", {
          conversationId,
          senderId,
          senderType,
        });

        // Set timeout to stop typing
        const timeout = setTimeout(() => {
          socket.to(`conversation:${conversationId}`).emit("typing:stop", {
            conversationId,
            senderId,
            senderType,
          });
          typingUsers.delete(typingKey);
        }, 3000);

        typingUsers.set(typingKey, timeout);
      } catch (error) {
        console.error("[Socket] Error in customer:typing:", error);
      }
    });

    // ============================================
    // AGENT EVENTS
    // ============================================

    /**
     * Agent joins a conversation
     */
    socket.on("agent:join", async (data) => {
      try {
        const validated = AgentJoinSchema.safeParse(data);
        if (!validated.success) {
          socket.emit("message:error", { error: "Invalid join data" });
          return;
        }

        const { agentId, conversationId } = validated.data;

        // Store connection
        activeConnections.set(socket.id, {
          socketId: socket.id,
          conversationId,
          userId: agentId,
          userType: "agent",
        });

        // Join rooms
        socket.join(`conversation:${conversationId}`);
        socket.join("agents");
        socket.join(`agent:${agentId}`);

        console.log(
          `[Socket] Agent ${agentId} joined conversation ${conversationId}`
        );
      } catch (error) {
        console.error("[Socket] Error in agent:join:", error);
        socket.emit("message:error", { error: "Failed to join conversation" });
      }
    });

    /**
     * Agent sends a message
     */
    socket.on("agent:message", async (data) => {
      try {
        const validated = AgentMessageSchema.safeParse(data);
        if (!validated.success) {
          socket.emit("message:error", {
            tempId: data.tempId,
            error: "Invalid message data",
          });
          return;
        }

        const { conversationId, agentId, content, fileUrl, fileName, tempId } =
          validated.data;

        // Get agent info
        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
        });

        if (!agent) {
          socket.emit("message:error", {
            tempId,
            error: "Agent not found",
          });
          return;
        }

        // Get conversation
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversation) {
          socket.emit("message:error", {
            tempId,
            error: "Conversation not found",
          });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: agentId,
            senderType: "agent",
            senderName: agent.name,
            content,
            fileUrl,
            fileName,
          },
        });

        // Update conversation (assign if not assigned)
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            updatedAt: new Date(),
            agentId: conversation.agentId || agentId,
            status:
              conversation.status === "open" ? "assigned" : conversation.status,
          },
        });

        // Broadcast message to conversation room
        io.to(`conversation:${conversationId}`).emit(
          "message:received",
          message
        );

        // Notify customer directly (even if not in conversation room)
        io.to(`customer:${conversation.customerId}`).emit(
          "message:received",
          message
        );

        console.log(
          `[Socket] Agent message sent - Conversation: ${conversationId}, Customer: ${conversation.customerId}, Rooms: conversation:${conversationId}, customer:${conversation.customerId}`
        );

        // Notify all agents about updated conversation
        const updatedConversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });

        if (updatedConversation) {
          io.to("agents").emit("conversation:updated", updatedConversation);
        }

        console.log(
          `[Socket] Message from agent ${agentId} in conversation ${conversationId}`
        );
      } catch (error) {
        console.error("[Socket] Error in agent:message:", error);
        socket.emit("message:error", {
          tempId: data.tempId,
          error: "Failed to send message",
        });
      }
    });

    /**
     * Agent typing indicator
     */
    socket.on("agent:typing", (data) => {
      try {
        const validated = TypingSchema.safeParse(data);
        if (!validated.success) return;

        const { conversationId, senderId, senderType } = validated.data;
        const typingKey = `${conversationId}:${senderId}`;

        // Clear existing timeout
        const existingTimeout = typingUsers.get(typingKey);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Broadcast typing start
        socket.to(`conversation:${conversationId}`).emit("typing:start", {
          conversationId,
          senderId,
          senderType,
        });

        // Set timeout to stop typing
        const timeout = setTimeout(() => {
          socket.to(`conversation:${conversationId}`).emit("typing:stop", {
            conversationId,
            senderId,
            senderType,
          });
          typingUsers.delete(typingKey);
        }, 3000);

        typingUsers.set(typingKey, timeout);
      } catch (error) {
        console.error("[Socket] Error in agent:typing:", error);
      }
    });

    /**
     * Agent goes online
     */
    socket.on("agent:online", async (data) => {
      try {
        const { agentId } = data;

        // Update database (non-blocking - don't fail if DB is down)
        prisma.agent.update({
          where: { id: agentId },
          data: {
            isOnline: true,
            lastSeen: new Date(),
          },
        }).catch((error) => {
          console.warn(`[Socket] Failed to update agent online status:`, error?.code || error?.message);
        });

        // Join agents room
        socket.join("agents");
        socket.join(`agent:${agentId}`);

        // Broadcast status to all (optimistic update - always emit even if DB fails)
        io.emit("agent:status", {
          agentId,
          isOnline: true,
          lastSeen: new Date(),
        });

        console.log(`[Socket] Agent ${agentId} is now online`);
      } catch (error) {
        console.error("[Socket] Error in agent:online:", error);
      }
    });

    /**
     * Agent goes offline
     */
    socket.on("agent:offline", async (data) => {
      try {
        const { agentId } = data;

        // Update database (non-blocking - don't fail if DB is down)
        prisma.agent.update({
          where: { id: agentId },
          data: {
            isOnline: false,
            lastSeen: new Date(),
          },
        }).catch((error) => {
          console.warn(`[Socket] Failed to update agent offline status:`, error?.code || error?.message);
        });

        // Broadcast status to all (optimistic update - always emit even if DB fails)
        io.emit("agent:status", {
          agentId,
          isOnline: false,
          lastSeen: new Date(),
        });

        console.log(`[Socket] Agent ${agentId} is now offline`);
      } catch (error) {
        console.error("[Socket] Error in agent:offline:", error);
      }
    });

    // ============================================
    // SHARED EVENTS
    // ============================================

    /**
     * Mark messages as read
     */
    socket.on("messages:mark-read", async (data) => {
      try {
        const validated = MarkReadSchema.safeParse(data);
        if (!validated.success) return;

        const { conversationId, messageIds, readBy, readByType } =
          validated.data;

        // Update messages
        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            conversationId,
          },
          data: { isRead: true },
        });

        // Reset unread count if agent is reading
        if (readByType === "agent") {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { unreadCount: 0 },
          });
        }

        // Broadcast read receipt
        io.to(`conversation:${conversationId}`).emit("messages:read", {
          conversationId,
          messageIds,
          readBy,
        });
      } catch (error) {
        console.error("[Socket] Error in messages:mark-read:", error);
      }
    });

    // ============================================
    // DISCONNECT HANDLER
    // ============================================

    socket.on("disconnect", async (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);

      const connection = activeConnections.get(socket.id);
      if (connection) {
        // If agent disconnected, update their status
        if (connection.userType === "agent") {
          // Update database (non-blocking - don't fail if DB is down)
          prisma.agent.update({
            where: { id: connection.userId },
            data: {
              isOnline: false,
              lastSeen: new Date(),
            },
          }).catch((error) => {
            console.warn(`[Socket] Failed to update agent offline status on disconnect:`, error?.code || error?.message);
          });

          // Always emit status update (optimistic update)
          io.emit("agent:status", {
            agentId: connection.userId,
            isOnline: false,
            lastSeen: new Date(),
          });
        }

        activeConnections.delete(socket.id);
      }

      // Clear any typing indicators
      for (const [key, timeout] of typingUsers.entries()) {
        if (key.includes(socket.id)) {
          clearTimeout(timeout);
          typingUsers.delete(key);
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server running`);
    console.log(`> Environment: ${dev ? "development" : "production"}`);
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});
