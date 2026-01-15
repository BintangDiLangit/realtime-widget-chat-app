/**
 * Chat Window Component
 * Main chat interface combining header, messages, and input
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { CustomerForm } from "./customer-form";
import { useSocket, useConversationEvents, useAgentEvents } from "@/src/hooks/use-socket";
import { getSocket, connectSocket } from "@/src/lib/socket-client";
import {
  getOrCreateCustomerId,
  saveCustomerInfo,
  getCustomerInfo,
  playNotificationSound,
  debounce,
} from "@/src/lib/utils";
import type { Message, Conversation, TypingIndicatorPayload } from "@/src/types";

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onUnreadChange?: (count: number) => void;
  headerTitle?: string;
  welcomeMessage?: string;
  requireName?: boolean;
  requireEmail?: boolean;
  className?: string;
}

type ChatState = "form" | "chat";

export function ChatWindow({
  isOpen,
  onClose,
  onMinimize,
  onUnreadChange,
  headerTitle = "Support Chat",
  welcomeMessage,
  requireName = false,
  requireEmail = false,
  className,
}: ChatWindowProps) {
  // Customer state
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string | undefined>();
  const [customerEmail, setCustomerEmail] = useState<string | undefined>();
  const [chatState, setChatState] = useState<ChatState>("form");

  // Conversation state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [typingUser, setTypingUser] = useState<TypingIndicatorPayload | null>(null);
  const [agentOnline, setAgentOnline] = useState(false);
  const [agentName, setAgentName] = useState<string | undefined>();

  // Socket connection
  const { isConnected } = useSocket({ autoConnect: true });
  const socketRef = useRef(getSocket());

  // Initialize customer ID
  useEffect(() => {
    const info = getCustomerInfo();
    if (info) {
      setCustomerId(info.id);
      setCustomerName(info.name);
      setCustomerEmail(info.email);
      // Skip form if we have customer info
      if (info.name || info.email || (!requireName && !requireEmail)) {
        setChatState("chat");
      }
    } else {
      const newId = getOrCreateCustomerId();
      setCustomerId(newId);
      // Skip form if not required
      if (!requireName && !requireEmail) {
        setChatState("chat");
      }
    }
  }, [requireName, requireEmail]);

  // Load existing conversation
  useEffect(() => {
    if (!customerId || chatState !== "chat") return;

    const loadConversation = async () => {
      setIsLoading(true);
      try {
        // Find existing conversation for this customer
        const response = await fetch(
          `/api/conversations?customerId=${customerId}&status=open`
        );
        const data = await response.json();

        if (data.success && data.data?.length > 0) {
          const conv = data.data[0];
          setConversationId(conv.id);
          setAgentName(conv.agent?.name);
          setAgentOnline(conv.agent?.isOnline ?? false);

          // Load messages
          const msgResponse = await fetch(
            `/api/messages?conversationId=${conv.id}&limit=50`
          );
          const msgData = await msgResponse.json();

          if (msgData.success) {
            setMessages(msgData.data || []);
            setHasMore(msgData.pagination?.hasMore ?? false);
          }
        }
      } catch (error) {
        console.error("Failed to load conversation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [customerId, chatState]);

  // Join conversation room when connected
  useEffect(() => {
    if (!isConnected || !customerId) return;

    const socket = socketRef.current;

    // Join customer room
    socket.emit("customer:join", {
      customerId,
      customerName,
      customerEmail,
      conversationId: conversationId || undefined,
    });
  }, [isConnected, customerId, customerName, customerEmail, conversationId]);

  // Handle incoming messages
  const handleMessage = useCallback(
    (message: Message) => {
      // Only handle messages for this conversation
      if (conversationId && message.conversationId !== conversationId) return;

      // Update conversation ID if new
      if (!conversationId && message.conversationId) {
        setConversationId(message.conversationId);
      }

      setMessages((prev) => {
        // Check for duplicates or temp messages
        const existingIndex = prev.findIndex(
          (m) => m.id === message.id || (m.id.startsWith("temp-") && m.content === message.content)
        );

        if (existingIndex >= 0) {
          // Replace temp message with real one
          const updated = [...prev];
          updated[existingIndex] = message;
          return updated;
        }

        return [...prev, message];
      });

      // Play sound for agent messages
      if (message.senderType === "agent" && message.senderId !== customerId) {
        playNotificationSound();
        onUnreadChange?.(1);
      }
    },
    [conversationId, customerId, onUnreadChange]
  );

  // Handle typing indicators
  const handleTypingStart = useCallback(
    (data: TypingIndicatorPayload) => {
      if (data.senderId !== customerId && data.senderType === "agent") {
        setTypingUser(data);
      }
    },
    [customerId]
  );

  const handleTypingStop = useCallback(
    (data: TypingIndicatorPayload) => {
      if (data.senderId !== customerId) {
        setTypingUser(null);
      }
    },
    [customerId]
  );

  // Subscribe to conversation events
  useConversationEvents(conversationId, {
    onMessage: handleMessage,
    onTypingStart: handleTypingStart,
    onTypingStop: handleTypingStop,
  });

  // Handle agent status updates
  useAgentEvents({
    onAgentStatus: (data) => {
      // Update agent status if it's our agent
      setAgentOnline(data.isOnline);
    },
    onConversationUpdated: (conv) => {
      if (conv.id === conversationId) {
        setAgentName(conv.agent?.name);
        setAgentOnline(conv.agent?.isOnline ?? false);
      }
    },
  });

  // Handle customer form submission
  const handleCustomerSubmit = useCallback(
    (data: { name?: string; email?: string }) => {
      setCustomerName(data.name);
      setCustomerEmail(data.email);
      saveCustomerInfo({
        id: customerId,
        name: data.name,
        email: data.email,
      });
      setChatState("chat");
    },
    [customerId]
  );

  // Send message
  const handleSendMessage = useCallback(
    (content: string, fileUrl?: string, fileName?: string) => {
      if (!customerId) return;

      const socket = socketRef.current;
      const tempId = `temp-${Date.now()}`;

      // Optimistic update
      const optimisticMessage: Message = {
        id: tempId,
        conversationId: conversationId || "",
        senderId: customerId,
        senderType: "customer",
        senderName: customerName || "You",
        content,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        isRead: false,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      // Emit to socket
      socket.emit("customer:message", {
        conversationId: conversationId || undefined,
        customerId,
        customerName,
        customerEmail,
        content,
        fileUrl,
        fileName,
        tempId,
      });
    },
    [customerId, customerName, customerEmail, conversationId]
  );

  // Send typing indicator (debounced)
  const handleTyping = useCallback(
    debounce(() => {
      if (!conversationId || !customerId) return;

      const socket = socketRef.current;
      socket.emit("customer:typing", {
        conversationId,
        senderId: customerId,
        senderType: "customer",
      });
    }, 500),
    [conversationId, customerId]
  );

  // Load more messages
  const handleLoadMore = useCallback(async () => {
    if (!conversationId || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const oldestMessage = messages[0];
      const response = await fetch(
        `/api/messages?conversationId=${conversationId}&before=${oldestMessage?.createdAt}&limit=50`
      );
      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [...(data.data || []), ...prev]);
        setHasMore(data.pagination?.hasMore ?? false);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, isLoading, hasMore, messages]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50",
        "w-[380px] h-[600px]",
        "max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)]",
        "bottom-24 right-4",
        "flex flex-col",
        "bg-background rounded-xl shadow-2xl",
        "border overflow-hidden",
        "widget-enter",
        // Mobile: full screen
        "sm:w-[380px] sm:h-[600px] sm:bottom-24 sm:right-4",
        "max-sm:w-full max-sm:h-full max-sm:bottom-0 max-sm:right-0 max-sm:rounded-none max-sm:max-w-full max-sm:max-h-full",
        className
      )}
      role="dialog"
      aria-label="Chat window"
    >
      {/* Header */}
      <ChatHeader
        title={headerTitle}
        agentName={agentName}
        isOnline={agentOnline || isConnected}
        onMinimize={onMinimize}
        onClose={onClose}
      />

      {/* Content */}
      {chatState === "form" ? (
        <CustomerForm
          requireName={requireName}
          requireEmail={requireEmail}
          onSubmit={handleCustomerSubmit}
        />
      ) : (
        <>
          {/* Welcome message */}
          {welcomeMessage && messages.length === 0 && !isLoading && (
            <div className="px-4 py-3 bg-primary/5 border-b">
              <p className="text-sm text-muted-foreground">{welcomeMessage}</p>
            </div>
          )}

          {/* Messages */}
          <MessageList
            messages={messages}
            currentUserId={customerId}
            typingUser={typingUser}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            className="flex-1"
          />

          {/* Input */}
          <MessageInput
            onSend={handleSendMessage}
            onTyping={handleTyping}
            placeholder="Type a message..."
          />
        </>
      )}

      {/* Connection status indicator */}
      {!isConnected && chatState === "chat" && (
        <div className="absolute top-14 left-0 right-0 bg-yellow-500/90 text-yellow-950 text-xs text-center py-1">
          Connecting...
        </div>
      )}
    </div>
  );
}

export default ChatWindow;
