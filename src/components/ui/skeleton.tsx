/**
 * Skeleton Component
 * Loading placeholder with shimmer animation
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton rounded-md",
        className
      )}
    />
  );
}

/**
 * Message skeleton for loading states
 */
export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-2",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isOwn && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[75%]",
          isOwn ? "items-end" : "items-start"
        )}
      >
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <Skeleton className="h-3 w-16" />
      </div>
      {isOwn && <div className="w-8 shrink-0" />}
    </div>
  );
}

/**
 * Conversation list item skeleton
 */
export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-border">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

/**
 * Multiple message skeletons for loading
 */
export function MessageListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <MessageSkeleton key={i} isOwn={i % 3 === 0} />
      ))}
    </div>
  );
}

/**
 * Multiple conversation skeletons for loading
 */
export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <ConversationSkeleton key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
