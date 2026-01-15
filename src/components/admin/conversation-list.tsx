/**
 * Conversation List Component
 * Sidebar showing all conversations with filters
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MessageSquare, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { formatConversationTime, truncate, getInitials, stringToColor } from "@/src/lib/utils";
import { useAgentEvents } from "@/src/hooks/use-socket";
import type { ConversationListItem, ConversationStatus } from "@/src/types";

interface ConversationListProps {
  initialConversations: ConversationListItem[];
  selectedId?: string;
  onSelect: (conversation: ConversationListItem) => void;
  className?: string;
}

type FilterStatus = ConversationStatus | "all";

const statusConfig: Record<FilterStatus, { label: string; icon: React.ReactNode }> = {
  all: { label: "All", icon: <MessageSquare className="w-4 h-4" /> },
  open: { label: "Open", icon: <Clock className="w-4 h-4" /> },
  assigned: { label: "Assigned", icon: <MessageSquare className="w-4 h-4" /> },
  closed: { label: "Closed", icon: <CheckCircle2 className="w-4 h-4" /> },
};

export function ConversationList({
  initialConversations,
  selectedId,
  onSelect,
  className,
}: ConversationListProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle real-time updates
  const handleConversationCreated = useCallback((conv: ConversationListItem) => {
    setConversations((prev) => {
      // Check if already exists
      if (prev.some((c) => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
  }, []);

  const handleConversationUpdated = useCallback((conv: ConversationListItem) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === conv.id ? { ...c, ...conv, updatedAt: new Date(conv.updatedAt || Date.now()) } : c
      );
      // Re-sort by updatedAt to move updated conversation to top
      return updated.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  }, []);

  useAgentEvents({
    onConversationCreated: handleConversationCreated,
    onConversationUpdated: handleConversationUpdated,
  });

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // Status filter
    if (filter !== "all" && conv.status !== filter) return false;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        conv.customerName?.toLowerCase().includes(searchLower) ||
        conv.customerEmail?.toLowerCase().includes(searchLower) ||
        conv.customerId.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Sort by updated time
  const sortedConversations = [...filteredConversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);

      const response = await fetch(`/api/conversations?${params}`);
      const data = await response.json();

      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, search]);

  // Fetch on filter/search change
  useEffect(() => {
    const debounce = setTimeout(fetchConversations, 300);
    return () => clearTimeout(debounce);
  }, [fetchConversations]);

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <h2 className="font-semibold">Conversations</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {(Object.keys(statusConfig) as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "text-xs font-medium whitespace-nowrap",
                "transition-colors",
                filter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {statusConfig[status].icon}
              {statusConfig[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No conversations found</p>
          </div>
        ) : (
          <div className="divide-y">
            {sortedConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={conv.id === selectedId}
                onClick={() => onSelect(conv)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Conversation item component
interface ConversationItemProps {
  conversation: ConversationListItem;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const displayName = conversation.customerName || "Anonymous";
  const initials = getInitials(displayName);
  const avatarColor = stringToColor(conversation.customerId);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 text-left",
        "transition-colors hover:bg-secondary/50",
        isSelected && "bg-secondary"
      )}
    >
      {/* Avatar */}
      <Avatar className="w-10 h-10 shrink-0">
        <AvatarFallback
          style={{ backgroundColor: avatarColor }}
          className="text-white text-sm font-medium"
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{displayName}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatConversationTime(conversation.updatedAt)}
          </span>
        </div>

        {/* Email */}
        {conversation.customerEmail && (
          <p className="text-xs text-muted-foreground truncate">
            {conversation.customerEmail}
          </p>
        )}

        {/* Last message */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <p className="text-sm text-muted-foreground truncate">
            {conversation.lastMessage
              ? truncate(conversation.lastMessage.content, 40)
              : "No messages yet"}
          </p>

          {/* Unread badge */}
          {conversation.unreadCount > 0 && (
            <Badge
              variant="default"
              className="shrink-0 h-5 min-w-[20px] px-1.5 text-xs"
            >
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Badge>
          )}
        </div>

        {/* Status badge */}
        <div className="mt-2">
          <Badge
            variant={
              conversation.status === "open"
                ? "secondary"
                : conversation.status === "assigned"
                ? "default"
                : "outline"
            }
            className="text-xs"
          >
            {conversation.status}
          </Badge>
        </div>
      </div>
    </button>
  );
}

export default ConversationList;
