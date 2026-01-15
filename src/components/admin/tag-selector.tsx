/**
 * Tag Selector Component
 * Add/remove tags from a conversation
 */

"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Tag as TagIcon } from "lucide-react";
import { TagBadge } from "./tag-badge";
import { cn } from "@/lib/utils";
import type { Tag, ConversationTag } from "@/src/types";

interface TagSelectorProps {
  conversationId: string;
  selectedTags: ConversationTag[];
  onUpdate?: (tags: ConversationTag[]) => void;
  compact?: boolean;
}

export function TagSelector({
  conversationId,
  selectedTags,
  onUpdate,
  compact = false,
}: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch all tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/tags");
        const data = await response.json();
        if (data.success) {
          setAllTags(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      }
    };

    fetchTags();
  }, []);

  const handleAddTag = async (tagId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/tags`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagId }),
        }
      );

      const data = await response.json();
      if (data.success) {
        onUpdate?.([...selectedTags, data.data]);
      }
    } catch (error) {
      console.error("Failed to add tag:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/tags?tagId=${tagId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      if (data.success) {
        onUpdate?.(selectedTags.filter((t) => t.tagId !== tagId));
      }
    } catch (error) {
      console.error("Failed to remove tag:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTagIds = selectedTags.map((t) => t.tagId);
  const availableTags = allTags.filter(
    (tag) =>
      !selectedTagIds.includes(tag.id) &&
      tag.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("flex flex-wrap gap-1.5", compact ? "items-center" : "")}>
      {/* Selected tags */}
      {selectedTags.map((convTag) => (
        <TagBadge
          key={convTag.id}
          tag={convTag.tag}
          onRemove={() => handleRemoveTag(convTag.tagId)}
          size={compact ? "sm" : "default"}
        />
      ))}

      {/* Add tag button */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1",
              compact ? "h-5 text-[10px] px-1.5" : "h-6 text-xs"
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Plus className="w-3 h-3" />
                {!compact && "Add Tag"}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {/* Search */}
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tags..."
                className="h-8 pl-7 text-xs"
              />
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Available tags */}
          <div className="max-h-64 overflow-y-auto">
            {availableTags.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground text-center">
                <TagIcon className="w-4 h-4 mx-auto mb-1 opacity-50" />
                {search ? "No matching tags" : "No more tags available"}
              </div>
            ) : (
              availableTags.map((tag) => (
                <DropdownMenuItem
                  key={tag.id}
                  onClick={() => handleAddTag(tag.id)}
                  className="cursor-pointer"
                >
                  <TagBadge tag={tag} size="sm" />
                  {tag._count && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {tag._count.conversations}
                    </span>
                  )}
                </DropdownMenuItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default TagSelector;
