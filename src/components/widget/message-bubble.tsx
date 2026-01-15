/**
 * Message Bubble Component
 * Displays a single message in the chat
 */

"use client";

import { cn } from "@/lib/utils";
import { formatMessageTime } from "@/src/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Image as ImageIcon, Check, CheckCheck } from "lucide-react";
import type { Message } from "@/src/types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  className?: string;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  className,
}: MessageBubbleProps) {
  const initials = message.senderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isImage = message.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <div
      className={cn(
        "flex gap-2 message-appear",
        isOwn ? "flex-row-reverse" : "flex-row",
        className
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback
            className={cn(
              "text-xs font-medium",
              message.senderType === "agent"
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-secondary-foreground"
            )}
          >
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
        {/* Sender name (for agent messages) */}
        {!isOwn && message.senderType === "agent" && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {message.senderName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl",
            "break-words whitespace-pre-wrap",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-secondary text-secondary-foreground rounded-bl-md"
          )}
        >
          {/* File attachment */}
          {message.fileUrl && (
            <div className="mb-2">
              {isImage ? (
                <img
                  src={message.fileUrl}
                  alt={message.fileName || "Attached image"}
                  className="max-w-full rounded-lg max-h-48 object-cover"
                />
              ) : (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg",
                    "bg-background/20 hover:bg-background/30",
                    "transition-colors"
                  )}
                >
                  <FileText className="w-5 h-5 shrink-0" />
                  <span className="text-sm truncate">
                    {message.fileName || "Download file"}
                  </span>
                </a>
              )}
            </div>
          )}

          {/* Message text */}
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* Timestamp and read status */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1 px-1",
            "text-[10px] text-muted-foreground"
          )}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {isOwn && (
            <span className="ml-0.5">
              {message.isRead ? (
                <CheckCheck className="w-3 h-3 text-primary" />
              ) : (
                <Check className="w-3 h-3" />
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
