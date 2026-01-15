/**
 * Custom Socket.io Hook
 * Manages socket connection lifecycle and event subscriptions
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  isSocketConnected,
} from "@/src/lib/socket-client";
import type {
  ServerToClientEvents,
  Message,
  Conversation,
  TypingIndicatorPayload,
  AgentStatusUpdatePayload,
  MessagesReadPayload,
} from "@/src/types";

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

interface UseSocketReturn {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  socket: ReturnType<typeof getSocket>;
}

/**
 * Hook to manage socket connection
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    const handleConnect = () => {
      setIsConnected(true);
      onConnect?.();
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      onDisconnect?.(reason);
    };

    const handleError = (error: Error) => {
      onError?.(error);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);

    // Auto-connect if enabled
    if (autoConnect && !socket.connected) {
      socket.connect();
    }

    // Update initial state
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
    };
  }, [autoConnect, onConnect, onDisconnect, onError]);

  const connect = useCallback(() => {
    connectSocket();
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    socket: socketRef.current,
  };
}

/**
 * Hook to subscribe to conversation events
 */
export function useConversationEvents(
  conversationId: string | null,
  callbacks: {
    onMessage?: (message: Message) => void;
    onTypingStart?: (data: TypingIndicatorPayload) => void;
    onTypingStop?: (data: TypingIndicatorPayload) => void;
    onMessagesRead?: (data: MessagesReadPayload) => void;
  }
) {
  const { onMessage, onTypingStart, onTypingStop, onMessagesRead } = callbacks;
  const socketRef = useRef(getSocket());

  useEffect(() => {
    if (!conversationId) return;

    const socket = socketRef.current;

    const handleMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        onMessage?.(message);
      }
    };

    const handleTypingStart = (data: TypingIndicatorPayload) => {
      if (data.conversationId === conversationId) {
        onTypingStart?.(data);
      }
    };

    const handleTypingStop = (data: TypingIndicatorPayload) => {
      if (data.conversationId === conversationId) {
        onTypingStop?.(data);
      }
    };

    const handleMessagesRead = (data: MessagesReadPayload) => {
      if (data.conversationId === conversationId) {
        onMessagesRead?.(data);
      }
    };

    socket.on("message:received", handleMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("messages:read", handleMessagesRead);

    return () => {
      socket.off("message:received", handleMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("messages:read", handleMessagesRead);
    };
  }, [conversationId, onMessage, onTypingStart, onTypingStop, onMessagesRead]);
}

/**
 * Hook to subscribe to agent-specific events
 */
export function useAgentEvents(callbacks: {
  onConversationCreated?: (conversation: Conversation) => void;
  onConversationUpdated?: (conversation: Conversation) => void;
  onAgentStatus?: (data: AgentStatusUpdatePayload) => void;
}) {
  const { onConversationCreated, onConversationUpdated, onAgentStatus } =
    callbacks;
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    if (onConversationCreated) {
      socket.on("conversation:created", onConversationCreated);
    }

    if (onConversationUpdated) {
      socket.on("conversation:updated", onConversationUpdated);
    }

    if (onAgentStatus) {
      socket.on("agent:status", onAgentStatus);
    }

    return () => {
      if (onConversationCreated) {
        socket.off("conversation:created", onConversationCreated);
      }
      if (onConversationUpdated) {
        socket.off("conversation:updated", onConversationUpdated);
      }
      if (onAgentStatus) {
        socket.off("agent:status", onAgentStatus);
      }
    };
  }, [onConversationCreated, onConversationUpdated, onAgentStatus]);
}

/**
 * Hook to check socket connection status
 */
export function useSocketStatus() {
  const [status, setStatus] = useState<
    "connected" | "disconnected" | "connecting" | "error"
  >("disconnected");
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    const updateStatus = () => {
      if (socket.connected) {
        setStatus("connected");
      } else {
        setStatus("disconnected");
      }
    };

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));

    // Initial status
    updateStatus();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  return status;
}

export default useSocket;
