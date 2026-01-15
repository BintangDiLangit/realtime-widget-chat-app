/**
 * Message List Component
 * Scrollable list of messages with auto-scroll
 */

"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Loader2 } from "lucide-react";
import type { Message, TypingIndicatorPayload } from "@/src/types";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  typingUser?: TypingIndicatorPayload | null;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

export function MessageList({
  messages,
  currentUserId,
  typingUser,
  isLoading,
  hasMore,
  onLoadMore,
  className,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottomRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUser]);

  // Track scroll position
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isAtBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    isAtBottomRef.current = isAtBottom;

    // Load more when scrolled to top
    if (target.scrollTop < 100 && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Scroll to bottom button click
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className={cn("relative flex-1 overflow-hidden", className)}>
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto chat-scrollbar px-4 py-4"
        onScroll={handleScroll}
      >
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Load more indicator */}
        {hasMore && !isLoading && (
          <div className="flex justify-center py-2">
            <button
              onClick={onLoadMore}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Load earlier messages
            </button>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="font-medium text-foreground mb-1">
              Start a conversation
            </h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Send a message to begin chatting with our support team
            </p>
          </div>
        )}

        {/* Messages grouped by date */}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="px-3 text-xs text-muted-foreground bg-background">
                {date === new Date().toLocaleDateString() ? "Today" : date}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {dateMessages.map((message, index) => {
                const prevMessage = dateMessages[index - 1];
                const showAvatar =
                  !prevMessage ||
                  prevMessage.senderId !== message.senderId ||
                  new Date(message.createdAt).getTime() -
                    new Date(prevMessage.createdAt).getTime() >
                    60000; // 1 minute gap

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === currentUserId}
                    showAvatar={showAvatar}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typingUser && (
          <TypingIndicator
            senderName={typingUser.senderName}
            className="mt-2"
          />
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottomRef.current && messages.length > 0 && (
        <button
          onClick={scrollToBottom}
          className={cn(
            "absolute bottom-4 right-4",
            "w-8 h-8 rounded-full",
            "bg-background border shadow-md",
            "flex items-center justify-center",
            "hover:bg-secondary transition-colors",
            "animate-in fade-in slide-in-from-bottom-2"
          )}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default MessageList;
