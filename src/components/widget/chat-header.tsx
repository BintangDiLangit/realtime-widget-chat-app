/**
 * Chat Header Component - 2025 Modern Design
 * Glassmorphism with status indicator and micro-interactions
 */

"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Minus, X } from "lucide-react";

interface ChatHeaderProps {
  title?: string;
  agentName?: string;
  agentAvatar?: string;
  isOnline?: boolean;
  onMinimize?: () => void;
  onClose?: () => void;
  className?: string;
}

export function ChatHeader({
  title = "Support Chat",
  agentName,
  agentAvatar,
  isOnline = false,
  onMinimize,
  onClose,
  className,
}: ChatHeaderProps) {
  const displayName = agentName || title;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className={cn(
        "relative flex items-center justify-between",
        "h-[60px] px-4",
        // Glassmorphism
        "bg-white/5 backdrop-blur-xl",
        "border-b border-white/10",
        className
      )}
    >
      {/* Agent Info */}
      <div className="flex items-center gap-3">
        {/* Avatar with status */}
        <div className="relative">
          <Avatar className="w-9 h-9 border-2 border-white/20">
            {agentAvatar ? (
              <AvatarImage src={agentAvatar} alt={displayName} />
            ) : null}
            <AvatarFallback 
              className={cn(
                "text-xs font-semibold",
                "bg-gradient-to-br from-neutral-700 to-neutral-900",
                "text-white"
              )}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {/* Online status dot */}
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5",
              "w-3 h-3 rounded-full",
              "border-2 border-[#0A0E27]",
              "transition-colors duration-300",
              isOnline 
                ? "bg-emerald-500 status-glow" 
                : "bg-gray-500"
            )}
            aria-label={isOnline ? "Online" : "Offline"}
          />
        </div>

        {/* Name & Status */}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white leading-tight">
            {displayName}
          </span>
          <span 
            className={cn(
              "text-[11px] leading-tight flex items-center gap-1",
              isOnline ? "text-emerald-400" : "text-gray-400"
            )}
          >
            <span 
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isOnline ? "bg-emerald-500" : "bg-gray-500"
              )}
            />
            {isOnline ? "Online • Replies in ~2 min" : "Offline"}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {/* Minimize */}
        {onMinimize && (
          <button
            onClick={onMinimize}
            className={cn(
              "group flex items-center justify-center",
              "w-8 h-8 rounded-lg",
              "text-gray-400 hover:text-white",
              "hover:bg-white/10",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-neutral-400/40"
            )}
            aria-label="Minimize chat"
          >
            <Minus 
              className={cn(
                "w-4 h-4",
                "transition-transform duration-200",
                "group-hover:-rotate-90"
              )} 
            />
          </button>
        )}

        {/* Close */}
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "group flex items-center justify-center",
              "w-8 h-8 rounded-lg",
              "text-gray-400",
              "hover:text-white hover:bg-red-500/80",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-red-500/40"
            )}
            aria-label="Close chat"
          >
            <X 
              className={cn(
                "w-4 h-4",
                "transition-transform duration-200",
                "group-hover:rotate-90 group-hover:scale-110"
              )} 
            />
          </button>
        )}
      </div>

      {/* Subtle gradient line at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)"
        }}
      />
    </header>
  );
}

export default ChatHeader;
