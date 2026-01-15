/**
 * Chat Button Component - 2025 Modern Design
 * Floating button with glassmorphism, gradient, and micro-interactions
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
        "group relative flex items-center justify-center",
        "w-14 h-14 sm:w-16 sm:h-16 rounded-full",
        // Monochrome gradient background
        "bg-gradient-to-br from-neutral-800 to-neutral-950",
        "dark:from-neutral-100 dark:to-neutral-300",
        // Shadow with glow effect
        "shadow-lg shadow-black/30",
        "hover:shadow-xl hover:shadow-black/40",
        "dark:shadow-white/20 dark:hover:shadow-white/30",
        // Transitions
        "transition-all duration-300 ease-out",
        "hover:scale-110 active:scale-95",
        // Pulse animation when closed
        !isOpen && "chat-button-pulse",
        // Focus state
        "focus:outline-none focus:ring-2 focus:ring-neutral-400/50 focus:ring-offset-2 focus:ring-offset-transparent",
        className
      )}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {/* Animated pulse ring when there are unread messages */}
      {!isOpen && unreadCount > 0 && (
        <span 
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-br from-neutral-800 to-neutral-950",
            "dark:from-neutral-100 dark:to-neutral-300",
            "pulse-ring"
          )} 
        />
      )}

      {/* Shine effect overlay */}
      <span 
        className={cn(
          "absolute inset-0 rounded-full overflow-hidden",
          "before:absolute before:inset-0",
          "before:bg-gradient-to-tr before:from-white/20 before:via-transparent before:to-transparent",
          "before:opacity-0 group-hover:before:opacity-100",
          "before:transition-opacity before:duration-300"
        )}
      />

      {/* Icon with rotation animation */}
      <span
        className={cn(
          "relative z-10 text-white dark:text-neutral-900",
          "transition-all duration-300 ease-out",
          isOpen ? "rotate-180 scale-90" : "rotate-0 scale-100",
          "group-hover:scale-110"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
        ) : (
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
        )}
      </span>

      {/* Unread count badge */}
      {!isOpen && unreadCount > 0 && (
        <span
          className={cn(
            "absolute -top-1 -right-1",
            "flex items-center justify-center",
            "min-w-[22px] h-[22px] px-1.5",
            // Red gradient
            "bg-gradient-to-br from-red-500 to-rose-600",
            "text-white text-xs font-bold rounded-full",
            // Shadow
            "shadow-lg shadow-red-500/40",
            // Animation
            "badge-pop"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export default ChatButton;
