/**
 * Typing Indicator Component
 * Shows animated dots when someone is typing
 */

"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  senderName?: string;
  className?: string;
}

export function TypingIndicator({
  senderName,
  className,
}: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2",
        "text-sm text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center gap-1">
        <span className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
        <span className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
        <span className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
      </div>
      {senderName && (
        <span className="text-xs">{senderName} is typing...</span>
      )}
    </div>
  );
}

export default TypingIndicator;
