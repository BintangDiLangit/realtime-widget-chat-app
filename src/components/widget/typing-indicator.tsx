/**
 * Typing Indicator Component - 2025 Modern Design
 * Animated dots with glassmorphism
 */

"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TypingIndicatorProps {
  senderName?: string;
  className?: string;
}

export function TypingIndicator({
  senderName = "Agent",
  className,
}: TypingIndicatorProps) {
  const initials = senderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div 
      className={cn(
        "flex items-center gap-2.5",
        "slide-up",
        className
      )}
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 shrink-0 border border-white/10">
        <AvatarFallback
          className={cn(
            "text-[10px] font-bold",
            "bg-gradient-to-br from-zinc-600/80 to-zinc-800/80",
            "text-white"
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Typing bubble */}
      <div
        className={cn(
          "flex items-center gap-1",
          "px-4 py-2.5",
          "rounded-2xl rounded-bl-md",
          // Glassmorphism
          "bg-white/[0.08]",
          "backdrop-blur-sm",
          "border border-white/10"
        )}
      >
        {/* Animated dots */}
        <div className="flex items-center gap-1">
          <span 
            className={cn(
              "w-2 h-2 rounded-full",
              "bg-gray-400",
              "typing-dot"
            )} 
          />
          <span 
            className={cn(
              "w-2 h-2 rounded-full",
              "bg-gray-400",
              "typing-dot"
            )} 
          />
          <span 
            className={cn(
              "w-2 h-2 rounded-full",
              "bg-gray-400",
              "typing-dot"
            )} 
          />
        </div>
      </div>

      {/* Text label */}
      <span className="text-[11px] text-gray-500">
        {senderName} is typing...
      </span>
    </div>
  );
}

export default TypingIndicator;
