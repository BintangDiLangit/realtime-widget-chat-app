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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  X,
  RotateCcw,
  Mail,
  User,
  Hash,
  Clock,
  Loader2,
  Tag,
  StickyNote,
} from "lucide-react";
import { MessageBubble } from "@/src/components/widget/message-bubble";
import { MessageInput } from "@/src/components/widget/message-input";
import { TypingIndicator } from "@/src/components/widget/typing-indicator";
import { PrioritySelector } from "./priority-selector";
import { TagSelector } from "./tag-selector";
import { NotesSection } from "./notes-section";
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
import type { ConversationListItem, Message, TypingIndicatorPayload, Priority, ConversationTag } from "@/src/types";

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
  const [currentPriority, setCurrentPriority] = useState<Priority>(conversation.priority || "normal");
  const [currentTags, setCurrentTags] = useState<ConversationTag[]>(conversation.tags || []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef(getSocket());

  // Reset state when conversation changes
  useEffect(() => {
    setCurrentPriority(conversation.priority || "normal");
    setCurrentTags(conversation.tags || []);
  }, [conversation.id, conversation.priority, conversation.tags]);

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

  // Auto-scroll to bottom when messages load or conversation changes
  useEffect(() => {
    if (!isLoading && messages.length > 0 && scrollRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "auto", // Instant scroll on load
        });
      }, 100);
    }
  }, [isLoading, messages.length, conversation.id]);

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

  // Handle priority update
  const handlePriorityUpdate = useCallback((priority: Priority) => {
    setCurrentPriority(priority);
    onUpdate?.({ ...conversation, priority });
  }, [conversation, onUpdate]);

  // Handle tags update
  const handleTagsUpdate = useCallback((tags: ConversationTag[]) => {
    setCurrentTags(tags);
    onUpdate?.({ ...conversation, tags });
  }, [conversation, onUpdate]);

  const displayName = conversation.customerName || "Anonymous";
  const avatarColor = stringToColor(conversation.customerId);
  const isAssigned = conversation.agentId === agentId;
  const canReply = isAssigned && conversation.status !== "closed";

  return (
    <div className={cn("flex flex-col h-full min-h-0 bg-background", className)}>
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
          {/* Priority selector */}
          <PrioritySelector
            conversationId={conversation.id}
            currentPriority={currentPriority}
            onUpdate={handlePriorityUpdate}
          />

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
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col min-h-0">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-6 py-4 chat-scrollbar"
          >
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
                    variant="admin"
                  />
                ))}
                {typingUser && <TypingIndicator senderName="Customer" />}
              </div>
            )}
          </div>
          {/* Input */}
          {canReply ? (
            <MessageInput
              onSend={handleSendMessage}
              onTyping={handleTyping}
              placeholder="Type a reply..."
              variant="admin"
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

        {/* Sidebar with tabs */}
        <div className="w-80 border-l bg-card hidden lg:flex flex-col min-h-0">
          <Tabs defaultValue="info" className="flex flex-col h-full">
            <TabsList className="w-full justify-start px-4 pt-4 bg-transparent">
              <TabsTrigger value="info" className="gap-1.5">
                <User className="w-4 h-4" />
                Info
              </TabsTrigger>
              <TabsTrigger value="tags" className="gap-1.5">
                <Tag className="w-4 h-4" />
                Tags
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5">
                <StickyNote className="w-4 h-4" />
                Notes
              </TabsTrigger>
            </TabsList>

            {/* Customer info tab */}
            <TabsContent value="info" className="flex-1 p-4 mt-0">
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
            </TabsContent>

            {/* Tags tab */}
            <TabsContent value="tags" className="flex-1 p-4 mt-0">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Conversation Tags
                </h3>
                <TagSelector
                  conversationId={conversation.id}
                  selectedTags={currentTags}
                  onUpdate={handleTagsUpdate}
                />
              </div>
            </TabsContent>

            {/* Notes tab */}
            <TabsContent value="notes" className="flex-1 p-4 mt-0 overflow-hidden">
              <NotesSection conversationId={conversation.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default ConversationView;
