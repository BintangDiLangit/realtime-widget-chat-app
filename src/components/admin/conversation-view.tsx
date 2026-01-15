/**
 * Conversation View Component
 * Main chat view for agents to interact with customers
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  UserPlus,
  X,
  RotateCcw,
  Mail,
  User,
  Hash,
  Clock,
  Loader2,
} from "lucide-react";
import { MessageBubble } from "@/src/components/widget/message-bubble";
import { MessageInput } from "@/src/components/widget/message-input";
import { TypingIndicator } from "@/src/components/widget/typing-indicator";
import { useConversationEvents } from "@/src/hooks/use-socket";
import { getSocket, connectSocket } from "@/src/lib/socket-client";
import {
  assignConversationAction,
  closeConversationAction,
  reopenConversationAction,
} from "@/src/app/actions/conversation-actions";
import { markMessagesAsReadAction } from "@/src/app/actions/message-actions";
import {
  formatRelativeTime,
  getInitials,
  stringToColor,
  debounce,
  playNotificationSound,
} from "@/src/lib/utils";
import type { ConversationListItem, Message, TypingIndicatorPayload } from "@/src/types";

interface ConversationViewProps {
  conversation: ConversationListItem;
  agentId: string;
  agentName: string;
  onUpdate?: (conversation: ConversationListItem) => void;
  className?: string;
}

export function ConversationView({
  conversation,
  agentId,
  agentName,
  onUpdate,
  className,
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUser, setTypingUser] = useState<TypingIndicatorPayload | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef(getSocket());

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/messages?conversationId=${conversation.id}&limit=100`
        );
        const data = await response.json();
        if (data.success) {
          setMessages(data.data || []);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversation.id]);

  // Join conversation room
  useEffect(() => {
    const socket = connectSocket();
    socket.emit("agent:join", {
      agentId,
      conversationId: conversation.id,
    });
  }, [agentId, conversation.id]);

  // Mark messages as read
  useEffect(() => {
    const unreadMessages = messages.filter(
      (m) => !m.isRead && m.senderType === "customer"
    );

    if (unreadMessages.length > 0) {
      markMessagesAsReadAction(
        conversation.id,
        unreadMessages.map((m) => m.id)
      );

      // Also emit socket event
      const socket = socketRef.current;
      socket.emit("messages:mark-read", {
        conversationId: conversation.id,
        messageIds: unreadMessages.map((m) => m.id),
        readBy: agentId,
        readByType: "agent",
      });
    }
  }, [messages, conversation.id, agentId]);

  // Handle incoming messages
  const handleMessage = useCallback(
    (message: Message) => {
      if (message.conversationId !== conversation.id) return;

      setMessages((prev) => {
        // Check for duplicates
        if (prev.some((m) => m.id === message.id)) return prev;

        // Replace temp message
        const tempIndex = prev.findIndex(
          (m) => m.id.startsWith("temp-") && m.content === message.content
        );
        if (tempIndex >= 0) {
          const updated = [...prev];
          updated[tempIndex] = message;
          return updated;
        }

        return [...prev, message];
      });

      // Play sound for customer messages
      if (message.senderType === "customer") {
        playNotificationSound();
      }

      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    },
    [conversation.id]
  );

  // Handle typing
  const handleTypingStart = useCallback(
    (data: TypingIndicatorPayload) => {
      if (data.conversationId === conversation.id && data.senderType === "customer") {
        setTypingUser(data);
      }
    },
    [conversation.id]
  );

  const handleTypingStop = useCallback(
    (data: TypingIndicatorPayload) => {
      if (data.conversationId === conversation.id) {
        setTypingUser(null);
      }
    },
    [conversation.id]
  );

  useConversationEvents(conversation.id, {
    onMessage: handleMessage,
    onTypingStart: handleTypingStart,
    onTypingStop: handleTypingStop,
  });

  // Send message
  const handleSendMessage = useCallback(
    (content: string, fileUrl?: string, fileName?: string) => {
      const socket = socketRef.current;
      const tempId = `temp-${Date.now()}`;

      // Optimistic update
      const optimisticMessage: Message = {
        id: tempId,
        conversationId: conversation.id,
        senderId: agentId,
        senderType: "agent",
        senderName: agentName,
        content,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        isRead: false,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      // Emit to socket
      socket.emit("agent:message", {
        conversationId: conversation.id,
        agentId,
        content,
        fileUrl,
        fileName,
        tempId,
      });

      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    },
    [conversation.id, agentId, agentName]
  );

  // Send typing indicator
  const handleTyping = useCallback(
    debounce(() => {
      const socket = socketRef.current;
      socket.emit("agent:typing", {
        conversationId: conversation.id,
        senderId: agentId,
        senderType: "agent",
      });
    }, 500),
    [conversation.id, agentId]
  );

  // Assign conversation
  const handleAssign = useCallback(async () => {
    setIsAssigning(true);
    const result = await assignConversationAction(conversation.id);
    if (result.success && result.data) {
      onUpdate?.(result.data);
    }
    setIsAssigning(false);
  }, [conversation.id, onUpdate]);

  // Close conversation
  const handleClose = useCallback(async () => {
    setIsClosing(true);
    const result = await closeConversationAction(conversation.id);
    if (result.success && result.data) {
      onUpdate?.(result.data);
    }
    setIsClosing(false);
  }, [conversation.id, onUpdate]);

  // Reopen conversation
  const handleReopen = useCallback(async () => {
    setIsClosing(true);
    const result = await reopenConversationAction(conversation.id);
    if (result.success && result.data) {
      onUpdate?.(result.data);
    }
    setIsClosing(false);
  }, [conversation.id, onUpdate]);

  const displayName = conversation.customerName || "Anonymous";
  const avatarColor = stringToColor(conversation.customerId);
  const isAssigned = conversation.agentId === agentId;
  const canReply = isAssigned && conversation.status !== "closed";

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback
              style={{ backgroundColor: avatarColor }}
              className="text-white font-medium"
            >
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{displayName}</h2>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  conversation.status === "open"
                    ? "secondary"
                    : conversation.status === "assigned"
                    ? "default"
                    : "outline"
                }
                className="text-xs"
              >
                {conversation.status}
              </Badge>
              {conversation.agent && (
                <span className="text-xs text-muted-foreground">
                  Assigned to {conversation.agent.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {conversation.status === "open" && (
            <Button
              variant="default"
              size="sm"
              onClick={handleAssign}
              disabled={isAssigning}
            >
              {isAssigning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Assign to me
            </Button>
          )}

          {conversation.status === "closed" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReopen}
              disabled={isClosing}
            >
              {isClosing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Reopen
            </Button>
          ) : (
            isAssigned && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isClosing}
              >
                {isClosing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                Close
              </Button>
            )
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderType === "agent"}
                  />
                ))}
                {typingUser && <TypingIndicator senderName="Customer" />}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          {canReply ? (
            <MessageInput
              onSend={handleSendMessage}
              onTyping={handleTyping}
              placeholder="Type a reply..."
            />
          ) : (
            <div className="px-6 py-4 border-t bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                {conversation.status === "closed"
                  ? "This conversation is closed. Reopen to reply."
                  : "Assign this conversation to yourself to reply."}
              </p>
            </div>
          )}
        </div>

        {/* Customer info sidebar */}
        <div className="w-72 border-l bg-card p-4 hidden lg:block">
          <h3 className="font-semibold mb-4">Customer Info</h3>

          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm">{displayName}</p>
              </div>
            </div>

            {/* Email */}
            {conversation.customerEmail && (
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm break-all">{conversation.customerEmail}</p>
                </div>
              </div>
            )}

            {/* Customer ID */}
            <div className="flex items-start gap-3">
              <Hash className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Customer ID</p>
                <p className="text-sm font-mono text-xs break-all">
                  {conversation.customerId}
                </p>
              </div>
            </div>

            <Separator />

            {/* Created */}
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Started</p>
                <p className="text-sm">{formatRelativeTime(conversation.createdAt)}</p>
              </div>
            </div>

            {/* Last updated */}
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Last activity</p>
                <p className="text-sm">{formatRelativeTime(conversation.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConversationView;
