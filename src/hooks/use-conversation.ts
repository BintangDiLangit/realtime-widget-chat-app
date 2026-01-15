/**
 * Conversation State Management Hook
 * Manages conversation data, messages, and real-time updates
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getSocket, connectSocket } from "@/src/lib/socket-client";
import { useConversationEvents } from "./use-socket";
import type {
  Conversation,
  Message,
  TypingIndicatorPayload,
} from "@/src/types";

interface UseConversationOptions {
  conversationId?: string | null;
  userId: string;
  userType: "agent" | "customer";
  customerName?: string;
  customerEmail?: string;
  autoConnect?: boolean;
}

interface UseConversationReturn {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  typingUser: TypingIndicatorPayload | null;
  sendMessage: (content: string, fileUrl?: string, fileName?: string) => void;
  sendTyping: () => void;
  markAsRead: (messageIds: string[]) => void;
  loadMessages: (page?: number) => Promise<void>;
  hasMore: boolean;
}

/**
 * Hook to manage a single conversation
 */
export function useConversation(
  options: UseConversationOptions
): UseConversationReturn {
  const {
    conversationId: initialConversationId,
    userId,
    userType,
    customerName,
    customerEmail,
    autoConnect = true,
  } = options;

  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState<TypingIndicatorPayload | null>(
    null
  );
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const socketRef = useRef(getSocket());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to socket and join conversation
  useEffect(() => {
    if (!autoConnect) return;

    const socket = connectSocket();

    if (conversationId) {
      if (userType === "customer") {
        socket.emit("customer:join", {
          customerId: userId,
          customerName,
          customerEmail,
          conversationId,
        });
      } else {
        socket.emit("agent:join", {
          agentId: userId,
          conversationId,
        });
      }
    }
  }, [
    conversationId,
    userId,
    userType,
    customerName,
    customerEmail,
    autoConnect,
  ]);

  // Handle incoming messages
  const handleMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Check if message already exists (prevent duplicates)
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });

    // Update conversation ID if this is a new conversation
    if (!conversationId && message.conversationId) {
      setConversationId(message.conversationId);
    }
  }, [conversationId]);

  // Handle typing indicators
  const handleTypingStart = useCallback(
    (data: TypingIndicatorPayload) => {
      // Don't show typing indicator for own messages
      if (data.senderId === userId) return;
      setTypingUser(data);
    },
    [userId]
  );

  const handleTypingStop = useCallback(
    (data: TypingIndicatorPayload) => {
      if (data.senderId === userId) return;
      setTypingUser(null);
    },
    [userId]
  );

  // Handle messages read
  const handleMessagesRead = useCallback(
    (data: { conversationId: string; messageIds: string[]; readBy: string }) => {
      if (data.readBy !== userId) {
        setMessages((prev) =>
          prev.map((m) =>
            data.messageIds.includes(m.id) ? { ...m, isRead: true } : m
          )
        );
      }
    },
    [userId]
  );

  // Subscribe to conversation events
  useConversationEvents(conversationId, {
    onMessage: handleMessage,
    onTypingStart: handleTypingStart,
    onTypingStop: handleTypingStop,
    onMessagesRead: handleMessagesRead,
  });

  // Load messages from API
  const loadMessages = useCallback(
    async (pageNum: number = 1) => {
      if (!conversationId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/messages?conversationId=${conversationId}&page=${pageNum}&limit=50`
        );

        if (!response.ok) {
          throw new Error("Failed to load messages");
        }

        const data = await response.json();

        if (pageNum === 1) {
          setMessages(data.data || []);
        } else {
          setMessages((prev) => [...(data.data || []), ...prev]);
        }

        setHasMore(data.pagination?.hasMore ?? false);
        setPage(pageNum);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  // Load conversation details
  useEffect(() => {
    if (!conversationId) return;

    const loadConversation = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`);
        if (response.ok) {
          const data = await response.json();
          setConversation(data.data);
        }
      } catch {
        // Ignore errors
      }
    };

    loadConversation();
    loadMessages(1);
  }, [conversationId, loadMessages]);

  // Send message
  const sendMessage = useCallback(
    (content: string, fileUrl?: string, fileName?: string) => {
      const socket = socketRef.current;
      const tempId = `temp-${Date.now()}`;

      // Optimistic update
      const optimisticMessage: Message = {
        id: tempId,
        conversationId: conversationId || "",
        senderId: userId,
        senderType: userType,
        senderName: userType === "customer" ? customerName || "Customer" : "Agent",
        content,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        isRead: false,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      // Emit socket event
      if (userType === "customer") {
        socket.emit("customer:message", {
          conversationId: conversationId || undefined,
          customerId: userId,
          customerName,
          customerEmail,
          content,
          fileUrl,
          fileName,
          tempId,
        });
      } else {
        socket.emit("agent:message", {
          conversationId: conversationId!,
          agentId: userId,
          content,
          fileUrl,
          fileName,
          tempId,
        });
      }

      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    },
    [conversationId, userId, userType, customerName, customerEmail]
  );

  // Send typing indicator
  const sendTyping = useCallback(() => {
    if (!conversationId) return;

    const socket = socketRef.current;
    const event = userType === "customer" ? "customer:typing" : "agent:typing";

    socket.emit(event, {
      conversationId,
      senderId: userId,
      senderType: userType,
    });
  }, [conversationId, userId, userType]);

  // Mark messages as read
  const markAsRead = useCallback(
    (messageIds: string[]) => {
      if (!conversationId || messageIds.length === 0) return;

      const socket = socketRef.current;
      socket.emit("messages:mark-read", {
        conversationId,
        messageIds,
        readBy: userId,
        readByType: userType,
      });
    },
    [conversationId, userId, userType]
  );

  return {
    conversation,
    messages,
    isLoading,
    error,
    isTyping: !!typingUser,
    typingUser,
    sendMessage,
    sendTyping,
    markAsRead,
    loadMessages: () => loadMessages(page + 1),
    hasMore,
  };
}

export default useConversation;
