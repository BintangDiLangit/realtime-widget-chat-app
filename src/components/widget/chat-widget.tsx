/**
 * Chat Widget Component
 * Complete embeddable chat widget with button and window
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatButton } from "./chat-button";
import { ChatWindow } from "./chat-window";
import { ChatErrorBoundary } from "@/src/components/error-boundary";
import type { WidgetConfig } from "@/src/types";

interface ChatWidgetProps extends WidgetConfig {
  defaultOpen?: boolean;
}

export function ChatWidget({
  position = "bottom-right",
  primaryColor,
  headerText = "Support Chat",
  placeholderText,
  welcomeMessage = "Hi there! 👋 How can we help you today?",
  requireEmail = false,
  requireName = false,
  defaultOpen = false,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [unreadCount, setUnreadCount] = useState(0);

  // Handle open/close
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    // Clear unread when opening
    if (!isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle unread count changes
  const handleUnreadChange = useCallback(
    (count: number) => {
      if (!isOpen) {
        setUnreadCount((prev) => prev + count);
      }
    },
    [isOpen]
  );

  // Apply custom primary color
  useEffect(() => {
    if (primaryColor) {
      document.documentElement.style.setProperty(
        "--widget-primary",
        primaryColor
      );
    }
  }, [primaryColor]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  // Position classes
  const positionClasses =
    position === "bottom-left"
      ? "left-4 sm:left-6"
      : "right-4 sm:right-6";

  return (
    <ChatErrorBoundary>
      {/* Chat Window */}
      <ChatWindow
        isOpen={isOpen}
        onClose={handleClose}
        onMinimize={handleMinimize}
        onUnreadChange={handleUnreadChange}
        headerTitle={headerText}
        welcomeMessage={welcomeMessage}
        requireName={requireName}
        requireEmail={requireEmail}
      />

      {/* Chat Button */}
      <div className={`fixed bottom-4 sm:bottom-6 z-50 ${positionClasses}`}>
        <ChatButton
          isOpen={isOpen}
          onClick={handleToggle}
          unreadCount={unreadCount}
        />
      </div>
    </ChatErrorBoundary>
  );
}

export default ChatWidget;
