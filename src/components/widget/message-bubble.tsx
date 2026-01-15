/**
 * Message Bubble Component - Black & White Modern Design
 * Clean, elegant styling with proper contrast
 */

"use client";

import { cn } from "@/lib/utils";
import { formatMessageTime } from "@/src/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Check, CheckCheck, Download } from "lucide-react";
import type { Message } from "@/src/types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  className?: string;
  variant?: "widget" | "admin"; // Context for styling
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  className,
  variant = "widget",
}: MessageBubbleProps) {
  const initials = message.senderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isImage = message.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isTemp = message.id.startsWith("temp-");

  // Determine styling based on variant and ownership
  const getBubbleStyles = () => {
    if (variant === "admin") {
      // Admin panel: Agent messages on right (dark bg), Customer messages on left (light bg)
      if (isOwn) {
        // Agent message (right side, dark bubble)
        return [
          "bg-zinc-900 dark:bg-zinc-100",
          "text-white dark:text-zinc-900",
          "rounded-2xl rounded-br-md",
          "shadow-md",
        ];
      } else {
        // Customer message (left side, light bubble)
        return [
          "bg-zinc-100 dark:bg-zinc-800",
          "text-zinc-900 dark:text-zinc-100",
          "border border-zinc-200 dark:border-zinc-700",
          "rounded-2xl rounded-bl-md",
        ];
      }
    } else {
      // Widget: Own messages (customer) on right, Agent messages on left
      if (isOwn) {
        // Customer own message (right side, dark bubble)
        return [
          "bg-zinc-900 dark:bg-zinc-100",
          "text-white dark:text-zinc-900",
          "rounded-2xl rounded-br-md",
          "shadow-lg",
        ];
      } else {
        // Agent message in widget (left side, glass effect)
        return [
          "bg-white/80 dark:bg-zinc-800/80",
          "backdrop-blur-sm",
          "border border-zinc-200 dark:border-zinc-700",
          "text-zinc-900 dark:text-zinc-100",
          "rounded-2xl rounded-bl-md",
        ];
      }
    }
  };

  const getAvatarStyles = () => {
    if (variant === "admin") {
      return isOwn
        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200";
    }
    return "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900";
  };

  return (
    <div
      className={cn(
        "flex gap-2.5",
        isOwn ? "flex-row-reverse" : "flex-row",
        // Animation based on sender
        isOwn ? "message-send" : "message-slide-left",
        className
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <Avatar className="w-8 h-8 shrink-0 border border-zinc-200 dark:border-zinc-700">
          <AvatarFallback className={cn("text-[10px] font-bold", getAvatarStyles())}>
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col max-w-[75%]",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {/* Sender name (for non-own messages) */}
        {!isOwn && (
          <span className="text-[10px] text-zinc-500 mb-1 px-1 font-medium">
            {message.senderName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "relative px-4 py-2.5",
            "break-words whitespace-pre-wrap",
            "transition-all duration-200",
            ...getBubbleStyles(),
            // Temp message opacity
            isTemp && "opacity-70"
          )}
        >
          {/* File attachment */}
          {message.fileUrl && (
            <div className="mb-2">
              {isImage ? (
                <div className="relative group">
                  <img
                    src={message.fileUrl}
                    alt={message.fileName || "Attached image"}
                    className="max-w-full rounded-xl max-h-48 object-cover"
                    loading="lazy"
                  />
                  {/* Hover overlay for image */}
                  <div 
                    className={cn(
                      "absolute inset-0 rounded-xl",
                      "bg-black/40 backdrop-blur-sm",
                      "flex items-center justify-center",
                      "opacity-0 group-hover:opacity-100",
                      "transition-opacity duration-200"
                    )}
                  >
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5",
                        "bg-white/20 rounded-full",
                        "text-white text-sm font-medium",
                        "hover:bg-white/30 transition-colors"
                      )}
                    >
                      <Download className="w-4 h-4" />
                      View
                    </a>
                  </div>
                </div>
              ) : (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl",
                    "bg-black/10 hover:bg-black/20",
                    "dark:bg-white/10 dark:hover:bg-white/20",
                    "transition-colors duration-200",
                    "group"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-900/20 dark:bg-zinc-100/20 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {message.fileName || "File attachment"}
                    </p>
                    <p className="text-xs opacity-60">Click to download</p>
                  </div>
                  <Download className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                </a>
              )}
            </div>
          )}

          {/* Message text */}
          {message.content && (
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}
        </div>

        {/* Timestamp and read status */}
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1 px-1",
            "text-[10px] text-zinc-500"
          )}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {isOwn && (
            <span className="flex items-center">
              {message.isRead ? (
                <CheckCheck 
                  className={cn(
                    "w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400",
                    "checkmark-appear"
                  )} 
                />
              ) : (
                <Check 
                  className={cn(
                    "w-3.5 h-3.5",
                    isTemp ? "text-zinc-400" : "text-zinc-500"
                  )} 
                />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Spacer for own messages without avatar */}
      {showAvatar && isOwn && <div className="w-8 shrink-0" />}
    </div>
  );
}

export default MessageBubble;
