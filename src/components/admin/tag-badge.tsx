/**
 * Tag Badge Component
 * Displays a colored tag with optional remove button
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tag } from "@/src/types";

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "default";
}

export function TagBadge({ tag, onRemove, className, size = "default" }: TagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium gap-1 transition-colors",
        size === "sm" ? "text-[10px] px-1.5 py-0 h-5" : "text-xs h-6",
        className
      )}
      style={{
        borderColor: tag.color,
        color: tag.color,
        backgroundColor: `${tag.color}15`,
      }}
    >
      <span 
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "ml-0.5 rounded-full p-0.5",
            "hover:bg-black/10 dark:hover:bg-white/10",
            "transition-colors"
          )}
          aria-label={`Remove ${tag.name} tag`}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </Badge>
  );
}

export default TagBadge;
