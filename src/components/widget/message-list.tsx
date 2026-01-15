/**
 * Message List Component - 2025 Modern Design
 * With skeleton loaders and scroll-to-bottom button
 */

"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { ChevronDown, MessageCircle, Sparkles } from "lucide-react";
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

// Skeleton loader for messages
function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={cn("flex gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full skeleton shrink-0" />
      )}
      <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
        <div 
          className={cn(
            "rounded-2xl skeleton",
            isOwn ? "rounded-br-md" : "rounded-bl-md"
          )}
          style={{ 
            width: `${Math.random() * 40 + 60}%`,
            minWidth: "120px",
            maxWidth: "200px",
            height: "44px"
          }}
        />
        <div className="w-12 h-3 skeleton rounded mt-1.5" />
      </div>
      {isOwn && <div className="w-8 shrink-0" />}
    </div>
  );
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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadBelow, setUnreadBelow] = useState(0);
  const isAtBottomRef = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottomRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (messages.length > 0) {
      // Increment unread count if not at bottom
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId !== currentUserId) {
        setUnreadBelow(prev => prev + 1);
      }
    }
  }, [messages, typingUser, currentUserId]);

  // Track scroll position
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const isAtBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    isAtBottomRef.current = isAtBottom;
    setShowScrollButton(!isAtBottom);
    
    if (isAtBottom) {
      setUnreadBelow(0);
    }

    // Load more when scrolled to top
    if (target.scrollTop < 100 && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Scroll to bottom button click
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadBelow(0);
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
      {/* Gradient fade at top */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none",
          "bg-gradient-to-b from-[#0A0E27] to-transparent"
        )}
      />

      <div
        ref={scrollRef}
        className="h-full overflow-y-auto chat-scrollbar px-4 py-4"
        onScroll={handleScroll}
      >
        {/* Loading skeletons */}
        {isLoading && messages.length === 0 && (
          <div className="space-y-4 py-2">
            <MessageSkeleton />
            <MessageSkeleton isOwn />
            <MessageSkeleton />
            <MessageSkeleton isOwn />
          </div>
        )}

        {/* Load more indicator */}
        {hasMore && !isLoading && (
          <div className="flex justify-center py-3">
            <button
              onClick={onLoadMore}
              className={cn(
                "px-4 py-1.5 rounded-full",
                "text-xs font-medium text-gray-400",
                "bg-white/5 hover:bg-white/10",
                "border border-white/10",
                "transition-all duration-200",
                "hover:scale-105"
              )}
            >
              Load earlier messages
            </button>
          </div>
        )}

        {/* Loading more indicator */}
        {isLoading && hasMore && (
          <div className="flex justify-center py-3">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-zinc-500/50 typing-dot" />
                <span className="w-2 h-2 rounded-full bg-zinc-500/50 typing-dot" />
                <span className="w-2 h-2 rounded-full bg-zinc-500/50 typing-dot" />
              </div>
              <span className="text-xs">Loading...</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            {/* Animated icon */}
            <div 
              className={cn(
                "relative w-20 h-20 mb-6",
                "rounded-2xl",
                "bg-gradient-to-br from-zinc-600/20 to-zinc-800/20",
                "border border-white/10",
                "flex items-center justify-center",
                "scale-in"
              )}
            >
              <MessageCircle className="w-9 h-9 text-zinc-400" />
              <Sparkles 
                className={cn(
                  "absolute -top-2 -right-2 w-6 h-6",
                  "text-zinc-400",
                  "animate-pulse"
                )} 
              />
            </div>
            <h3 className="font-semibold text-white mb-2 text-lg">
              Start a conversation
            </h3>
            <p className="text-sm text-gray-400 max-w-[220px] leading-relaxed">
              Send a message to begin chatting with our support team
            </p>
          </div>
        )}

        {/* Messages grouped by date */}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span 
                className={cn(
                  "px-3 py-1 rounded-full",
                  "text-[10px] font-medium text-gray-400",
                  "bg-white/5 border border-white/10"
                )}
              >
                {date === new Date().toLocaleDateString() ? "Today" : date}
              </span>
              <div className="flex-1 h-px bg-white/10" />
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
            className="mt-3"
          />
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && messages.length > 0 && (
        <button
          onClick={scrollToBottom}
          className={cn(
            "absolute bottom-4 right-4 z-20",
            "w-10 h-10 rounded-full",
            "bg-gradient-to-br from-zinc-600/90 to-zinc-800/90",
            "backdrop-blur-sm",
            "border border-white/20",
            "shadow-lg shadow-black/30",
            "flex items-center justify-center",
            "hover:scale-110 active:scale-95",
            "transition-all duration-300",
            "scroll-bounce",
            "slide-up"
          )}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5 text-white" />
          
          {/* Unread count badge */}
          {unreadBelow > 0 && (
            <span 
              className={cn(
                "absolute -top-2 -right-1",
                "min-w-[18px] h-[18px] px-1",
                "bg-red-500 rounded-full",
                "text-white text-[10px] font-bold",
                "flex items-center justify-center",
                "badge-pop"
              )}
            >
              {unreadBelow > 9 ? "9+" : unreadBelow}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

export default MessageList;
