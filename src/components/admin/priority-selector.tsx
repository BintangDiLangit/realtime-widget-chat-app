/**
 * Priority Selector Component
 * Dropdown to change conversation priority
 */

"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2 } from "lucide-react";
import { PriorityBadge } from "./priority-badge";
import { cn } from "@/lib/utils";
import type { Priority } from "@/src/types";

interface PrioritySelectorProps {
  conversationId: string;
  currentPriority: Priority;
  onUpdate?: (priority: Priority) => void;
  disabled?: boolean;
}

const priorities: Priority[] = ["urgent", "high", "normal", "low"];

export function PrioritySelector({
  conversationId,
  currentPriority,
  onUpdate,
  disabled,
}: PrioritySelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handlePriorityChange = async (priority: Priority) => {
    if (priority === currentPriority) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/priority`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority }),
        }
      );

      const data = await response.json();
      if (data.success) {
        onUpdate?.(priority);
      }
    } catch (error) {
      console.error("Failed to update priority:", error);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          disabled={isUpdating || disabled}
          className="h-7 px-2 gap-1"
        >
          {isUpdating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <PriorityBadge priority={currentPriority} size="sm" />
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {priorities.map((priority) => (
          <DropdownMenuItem
            key={priority}
            onClick={() => handlePriorityChange(priority)}
            className={cn(
              "cursor-pointer",
              priority === currentPriority && "bg-muted"
            )}
          >
            <PriorityBadge priority={priority} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PrioritySelector;
