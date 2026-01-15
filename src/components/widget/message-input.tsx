/**
 * Message Input Component
 * Text input with file upload support
 */

"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, X, Image, FileText, Loader2 } from "lucide-react";
import { formatFileSize, isValidFileType } from "@/src/lib/utils";

interface MessageInputProps {
  onSend: (content: string, fileUrl?: string, fileName?: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
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
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <div className={cn("border-t bg-background", className)}>
      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File preview */}
      {filePreview && (
        <div className="px-4 py-3 border-b bg-secondary/30">
          <div className="flex items-center gap-3">
            {filePreview.isImage ? (
              <div className="relative">
                <img
                  src={filePreview.url}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {filePreview.file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(filePreview.file.size)}
              </p>
            </div>
            <button
              onClick={removeFile}
              className="p-1.5 rounded-full hover:bg-secondary transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        {/* File upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload file"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="shrink-0 h-9 w-9"
          aria-label="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className={cn(
            "min-h-[40px] max-h-[120px] resize-none",
            "py-2.5 px-3 text-sm",
            "bg-secondary/50 border-0",
            "focus-visible:ring-1 focus-visible:ring-primary/50"
          )}
          rows={1}
        />

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={disabled || isUploading || (!message.trim() && !filePreview)}
          className="shrink-0 h-9 w-9"
          aria-label="Send message"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default MessageInput;
