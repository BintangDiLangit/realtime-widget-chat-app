/**
 * Socket.io Client Setup
 * Singleton pattern for client-side socket connection
 */

import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/src/types";

// Type-safe socket instance
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

/**
 * Get or create socket connection
 */
export function getSocket(): TypedSocket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";

    socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ["websocket", "polling"],
    });

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      socket.on("connect", () => {
        console.log("[Socket] Connected:", socket?.id);
      });

      socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
      });

      socket.on("connect_error", (error) => {
        console.error("[Socket] Connection error:", error.message);
      });
    }
  }

  return socket;
}

/**
 * Connect socket if not already connected
 */
export function connectSocket(): TypedSocket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Emit event with type safety
 */
export function emitEvent<K extends keyof ClientToServerEvents>(
  event: K,
  data: Parameters<ClientToServerEvents[K]>[0]
): void {
  const s = getSocket();
  if (s.connected) {
    // @ts-expect-error - Socket.io typing issue with generic emit
    s.emit(event, data);
  } else {
    console.warn("[Socket] Cannot emit, socket not connected");
  }
}

/**
 * Subscribe to event with type safety
 */
export function onEvent<K extends keyof ServerToClientEvents>(
  event: K,
  callback: ServerToClientEvents[K]
): () => void {
  const s = getSocket();
  s.on(event, callback as never);

  // Return unsubscribe function
  return () => {
    s.off(event, callback as never);
  };
}

/**
 * Join a conversation room
 */
export function joinConversation(
  conversationId: string,
  userId: string,
  userType: "agent" | "customer"
): void {
  const s = connectSocket();

  if (userType === "customer") {
    s.emit("customer:join", {
      customerId: userId,
      conversationId,
    });
  } else {
    s.emit("agent:join", {
      agentId: userId,
      conversationId,
    });
  }
}

/**
 * Send typing indicator
 */
let typingTimeout: NodeJS.Timeout | null = null;

export function sendTypingIndicator(
  conversationId: string,
  senderId: string,
  senderType: "agent" | "customer"
): void {
  const s = getSocket();

  if (!s.connected) return;

  // Clear existing timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }

  // Emit typing event
  const event = senderType === "customer" ? "customer:typing" : "agent:typing";
  s.emit(event, { conversationId, senderId, senderType });

  // Auto-stop typing after 3 seconds
  typingTimeout = setTimeout(() => {
    // Typing will naturally stop when no more events are sent
  }, 3000);
}

export default getSocket;
