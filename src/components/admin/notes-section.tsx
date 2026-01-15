/**
 * Notes Section Component
 * Internal notes for agents on conversations
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  StickyNote,
  Plus,
  Pin,
  Trash2,
  Loader2,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { formatRelativeTime } from "@/src/lib/utils";
import { cn } from "@/lib/utils";
import type { Note } from "@/src/types";

interface NotesSectionProps {
  conversationId: string;
  className?: string;
}

export function NotesSection({ conversationId, className }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/notes`
      );
      const data = await response.json();
      if (data.success) {
        setNotes(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newNote.trim() }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotes([data.data, ...notes]);
        setNewNote("");
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // Toggle pin
  const handleTogglePin = async (noteId: string, isPinned: boolean) => {
    setActionLoading(noteId);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/notes/${noteId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPinned: !isPinned }),
        }
      );

      const data = await response.json();
      if (data.success) {
        // Re-sort with pinned at top
        setNotes((prev) => {
          const updated = prev.map((n) => (n.id === noteId ? data.data : n));
          return updated.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        });
      }
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    setActionLoading(noteId);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/notes/${noteId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotes(notes.filter((n) => n.id !== noteId));
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Update note
  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    setActionLoading(noteId);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/notes/${noteId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent.trim() }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotes(notes.map((n) => (n.id === noteId ? data.data : n)));
        setEditingId(null);
        setEditContent("");
      }
    } catch (error) {
      console.error("Failed to update note:", error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-yellow-600" />
          Internal Notes
        </h3>
        <span className="text-xs text-muted-foreground">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </span>
      </div>

      {/* Add note form */}
      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note (only visible to agents)..."
          className="min-h-[80px] text-sm resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) {
              e.preventDefault();
              handleAddNote();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            ⌘ + Enter to save
          </span>
          <Button
            onClick={handleAddNote}
            disabled={isAdding || !newNote.trim()}
            size="sm"
            className="gap-1"
          >
            {isAdding ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            Add Note
          </Button>
        </div>
      </div>

      <Separator />

      {/* Notes list */}
      <ScrollArea className="h-[350px] pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add internal notes to keep track of important details
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  note.isPinned
                    ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900"
                    : "bg-muted/30 border-border"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {note.agent.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(note.createdAt)}
                      {note.updatedAt !== note.createdAt && " (edited)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleTogglePin(note.id, note.isPinned)}
                      disabled={actionLoading === note.id}
                    >
                      {actionLoading === note.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Pin
                          className={cn(
                            "w-3 h-3",
                            note.isPinned && "fill-current text-yellow-600"
                          )}
                        />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditContent(note.content);
                      }}
                      disabled={actionLoading === note.id}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={actionLoading === note.id}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px] text-sm resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={actionLoading === note.id || !editContent.trim()}
                        className="gap-1"
                      >
                        {actionLoading === note.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditContent("");
                        }}
                        className="gap-1"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                )}

                {/* Pinned indicator */}
                {note.isPinned && editingId !== note.id && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-yellow-700 dark:text-yellow-500">
                    <Pin className="w-2.5 h-2.5 fill-current" />
                    Pinned
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default NotesSection;
