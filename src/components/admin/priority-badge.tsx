/**
 * Priority Badge Component
 * Displays a color-coded priority indicator
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowUp, Minus, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Priority } from "@/src/types";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "default";
}

const priorityConfig: Record<Priority, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof AlertCircle;
}> = {
  urgent: {
    label: "Urgent",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-800",
    icon: AlertCircle,
  },
  high: {
    label: "High",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800",
    icon: ArrowUp,
  },
  normal: {
    label: "Normal",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800",
    icon: Minus,
  },
  low: {
    label: "Low",
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700",
    icon: ArrowDown,
  },
};

export function PriorityBadge({ 
  priority, 
  className, 
  showIcon = true,
  size = "default",
}: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium gap-1",
        config.color,
        config.bgColor,
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs",
        className
      )}
    >
      {showIcon && <Icon className={cn(size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3")} />}
      {config.label}
    </Badge>
  );
}

export { priorityConfig };
export default PriorityBadge;
