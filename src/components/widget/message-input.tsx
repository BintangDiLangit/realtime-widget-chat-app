/**
 * Message Input Component - 2025 Modern Design
 * Glassmorphism with gradient send button
 */

"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, FileText, Loader2, Image, Smile } from "lucide-react";
import { formatFileSize, isValidFileType } from "@/src/lib/utils";

interface MessageInputProps {
  onSend: (content: string, fileUrl?: string, fileName?: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  variant?: "widget" | "admin"; // Context for styling
}

interface FilePreview {
  file: File;
  url: string;
  isImage: boolean;
}

const MAX_FILE_SIZE = parseInt(
  process.env.NEXT_PUBLIC_MAX_FILE_SIZE || "5242880"
);

export function MessageInput({
  onSend,
  onTyping,
  disabled,
  placeholder = "Type a message...",
  className,
  variant = "widget",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file
      if (file.size > MAX_FILE_SIZE) {
        setError(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
        return;
      }

      if (!isValidFileType(file)) {
        setError("File type not supported");
        return;
      }

      setError(null);

      // Create preview
      const isImage = file.type.startsWith("image/");
      const url = isImage ? URL.createObjectURL(file) : "";

      setFilePreview({ file, url, isImage });

      // Reset input
      event.target.value = "";
    },
    []
  );

  // Remove file preview
  const removeFile = useCallback(() => {
    if (filePreview?.url) {
      URL.revokeObjectURL(filePreview.url);
    }
    setFilePreview(null);
    setError(null);
  }, [filePreview]);

  // Upload file and send message
  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && !filePreview) return;

    let fileUrl: string | undefined;
    let fileName: string | undefined;

    // Upload file if present
    if (filePreview) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", filePreview.file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        const data = await response.json();
        fileUrl = data.data.url;
        fileName = data.data.fileName;
      } catch (err) {
        setError("Failed to upload file. Please try again.");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // Send message
    onSend(trimmedMessage || "📎 Sent a file", fileUrl, fileName);

    // Clear state
    setMessage("");
    removeFile();
    textareaRef.current?.focus();
  }, [message, filePreview, onSend, removeFile]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter (without Shift)
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Handle input change
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(event.target.value);
      onTyping?.();
    },
    [onTyping]
  );

  const canSend = !disabled && !isUploading && (message.trim() || filePreview);

  return (
    <div className={cn("relative", className)}>
      {/* Error message */}
      {error && (
        <div 
          className={cn(
            "absolute -top-12 left-4 right-4",
            "px-3 py-2 rounded-lg",
            "bg-red-500/90 backdrop-blur-sm",
            "text-white text-xs",
            "flex items-center justify-between gap-2",
            "slide-down"
          )}
        >
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="hover:opacity-70 transition-opacity"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* File preview */}
      {filePreview && (
        <div 
          className={cn(
            "px-4 py-3",
            "border-t border-white/5",
            "bg-white/[0.03]",
            "slide-down"
          )}
        >
          <div className="flex items-center gap-3">
            {filePreview.isImage ? (
              <div className="relative">
                <img
                  src={filePreview.url}
                  alt="Preview"
                  className="w-16 h-16 rounded-lg object-cover border border-white/10"
                />
              </div>
            ) : (
              <div 
                className={cn(
                  "w-16 h-16 rounded-lg",
                  "bg-zinc-500/20 border border-zinc-500/30",
                  "flex items-center justify-center"
                )}
              >
                <FileText className="w-7 h-7 text-zinc-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {filePreview.file.name}
              </p>
              <p className="text-xs text-gray-400">
                {formatFileSize(filePreview.file.size)}
              </p>
            </div>
            <button
              onClick={removeFile}
              className={cn(
                "p-2 rounded-lg",
                "hover:bg-white/10",
                "text-gray-400 hover:text-white",
                "transition-colors duration-200"
              )}
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div 
        className={cn(
          "flex items-end gap-2 p-3",
          variant === "widget"
            ? [
                "bg-white/[0.03]",
                "border-t border-white/10",
                isFocused && "bg-white/[0.05]",
              ]
            : [
                "bg-muted/50",
                "border-t border-border",
                isFocused && "bg-muted",
              ],
          "transition-all duration-200"
        )}
      >
        {/* File upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload file"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className={cn(
            "flex items-center justify-center",
            "w-9 h-9 rounded-xl",
            "transition-all duration-200",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            variant === "widget"
              ? [
                  "text-gray-400 hover:text-white",
                  "hover:bg-white/10",
                  "focus:outline-none focus:ring-2 focus:ring-zinc-400/40",
                ]
              : [
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-accent",
                  "focus:outline-none focus:ring-2 focus:ring-ring",
                ]
          )}
          aria-label="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled || isUploading}
            className={cn(
              "min-h-[40px] max-h-[100px] resize-none",
              "py-2.5 px-4 text-sm",
              "rounded-xl",
              "transition-all duration-200",
              variant === "widget"
                ? [
                    "bg-white/[0.08] text-white placeholder:text-gray-500",
                    "border border-white/10",
                    "focus-visible:ring-1 focus-visible:ring-zinc-400/50 focus-visible:border-zinc-400/50",
                  ]
                : [
                    "bg-background text-foreground placeholder:text-muted-foreground",
                    "border border-input",
                    "focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring",
                  ]
            )}
            rows={1}
          />
        </div>

        {/* Emoji button (placeholder) */}
        <button
          type="button"
          className={cn(
            "flex items-center justify-center",
            "w-9 h-9 rounded-xl",
            "transition-all duration-200",
            variant === "widget"
              ? [
                  "text-gray-500 hover:text-gray-300",
                  "hover:bg-white/10",
                  "focus:outline-none focus:ring-2 focus:ring-zinc-400/40",
                ]
              : [
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-accent",
                  "focus:outline-none focus:ring-2 focus:ring-ring",
                ]
          )}
          aria-label="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "flex items-center justify-center",
            "w-10 h-10 rounded-xl",
            "transition-all duration-300",
            canSend
              ? [
                  "bg-gradient-to-br from-zinc-700 to-zinc-900",
                  "dark:from-zinc-200 dark:to-zinc-400",
                  "text-white dark:text-zinc-900",
                  "shadow-lg shadow-black/30",
                  "hover:shadow-xl hover:shadow-black/40",
                  "hover:scale-105 active:scale-95",
                ]
              : [
                  "bg-white/5",
                  "text-gray-600",
                  "cursor-not-allowed",
                ],
            "focus:outline-none focus:ring-2 focus:ring-zinc-400/40"
          )}
          aria-label="Send message"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
