/**
 * Chat Header Component
 * Header for the chat widget with agent info and controls
 */

"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Minus, X, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  title?: string;
  subtitle?: string;
  isOnline?: boolean;
  agentName?: string;
  onMinimize?: () => void;
  onClose?: () => void;
  onEndChat?: () => void;
  className?: string;
}

export function ChatHeader({
  title = "Support Chat",
  subtitle,
  isOnline = false,
  agentName,
  onMinimize,
  onClose,
  onEndChat,
  className,
}: ChatHeaderProps) {
  const displaySubtitle =
    subtitle ||
    (agentName
      ? `Chatting with ${agentName}`
      : isOnline
      ? "We're online"
      : "We'll respond soon");

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        "bg-primary text-primary-foreground",
        "rounded-t-xl",
        className
      )}
    >
      {/* Avatar */}
      <Avatar className="w-10 h-10 border-2 border-primary-foreground/20">
        <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-semibold">
          {agentName ? agentName[0].toUpperCase() : "S"}
        </AvatarFallback>
      </Avatar>

      {/* Title and status */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-sm truncate">{title}</h2>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              isOnline ? "bg-green-400" : "bg-primary-foreground/40"
            )}
          />
          <span className="text-xs text-primary-foreground/80 truncate">
            {displaySubtitle}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "p-1.5 rounded-full",
                "hover:bg-primary-foreground/10",
                "transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
              )}
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {onEndChat && (
              <DropdownMenuItem onClick={onEndChat} className="text-destructive">
                End conversation
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Minimize button */}
        {onMinimize && (
          <button
            onClick={onMinimize}
            className={cn(
              "p-1.5 rounded-full",
              "hover:bg-primary-foreground/10",
              "transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
            )}
            aria-label="Minimize chat"
          >
            <Minus className="w-4 h-4" />
          </button>
        )}

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "p-1.5 rounded-full",
              "hover:bg-primary-foreground/10",
              "transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
            )}
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatHeader;
