/**
 * Chat Button Component
 * Floating button to open/close the chat widget
 */

"use client";

import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatButtonProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
  className?: string;
}

export function ChatButton({
  isOpen,
  onClick,
  unreadCount = 0,
  className,
}: ChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center",
        "w-14 h-14 rounded-full",
        "bg-primary text-primary-foreground",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-300 ease-out",
        "hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
        className
      )}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {/* Pulse ring when there are unread messages */}
      {!isOpen && unreadCount > 0 && (
        <span className="absolute inset-0 rounded-full bg-primary pulse-ring" />
      )}

      {/* Icon with rotation animation */}
      <span
        className={cn(
          "transition-transform duration-300",
          isOpen ? "rotate-90" : "rotate-0"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </span>

      {/* Unread badge */}
      {!isOpen && unreadCount > 0 && (
        <span
          className={cn(
            "absolute -top-1 -right-1",
            "flex items-center justify-center",
            "min-w-[20px] h-5 px-1.5",
            "bg-destructive text-destructive-foreground",
            "text-xs font-semibold rounded-full",
            "animate-in zoom-in-50 duration-200"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export default ChatButton;
