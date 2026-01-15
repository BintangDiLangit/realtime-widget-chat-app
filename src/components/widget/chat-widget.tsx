/**
 * Chat Widget Component - 2025 Modern Design
 * Main widget container with button entrance animation
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatButton } from "./chat-button";
import { ChatWindow } from "./chat-window";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  headerTitle?: string;
  welcomeMessage?: string;
  requireName?: boolean;
  requireEmail?: boolean;
  position?: "bottom-right" | "bottom-left";
  buttonSize?: "small" | "medium" | "large";
  className?: string;
}

export function ChatWidget({
  headerTitle = "Support Chat",
  welcomeMessage = "Hi there! 👋 How can we help you today?",
  requireName = false,
  requireEmail = false,
  position = "bottom-right",
  buttonSize = "medium",
  className,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showButton, setShowButton] = useState(false);

  // Delayed button entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 1000); // 1 second delay after page load

    return () => clearTimeout(timer);
  }, []);

  const handleToggle = useCallback(() => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
    if (!isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    setIsOpen(false);
  }, []);

  const handleUnreadChange = useCallback((count: number) => {
    if (!isOpen) {
      setUnreadCount((prev) => Math.max(0, prev + count));
    }
  }, [isOpen]);

  // Position classes
  const positionClasses = {
    "bottom-right": "right-6 bottom-6",
    "bottom-left": "left-6 bottom-6",
  };

  // Button size classes
  const buttonSizeClasses = {
    small: "w-12 h-12",
    medium: "w-14 h-14 sm:w-16 sm:h-16",
    large: "w-16 h-16 sm:w-18 sm:h-18",
  };

  return (
    <div 
      className={cn("fixed z-[9999]", positionClasses[position], className)}
      role="region"
      aria-label="Chat support widget"
    >
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <ChatWindow
          isOpen={isOpen}
          onClose={handleClose}
          onMinimize={handleMinimize}
          onUnreadChange={handleUnreadChange}
          headerTitle={headerTitle}
          welcomeMessage={welcomeMessage}
          requireName={requireName}
          requireEmail={requireEmail}
          className={cn(
            "absolute",
            position === "bottom-right" 
              ? "bottom-20 right-0" 
              : "bottom-20 left-0"
          )}
        />
      )}

      {/* Chat Button */}
      {showButton && (
        <div 
          className={cn(
            "slide-up",
            buttonSizeClasses[buttonSize]
          )}
        >
          <ChatButton
            isOpen={isOpen}
            onClick={handleToggle}
            unreadCount={unreadCount}
            className={buttonSizeClasses[buttonSize]}
          />
        </div>
      )}

      {/* Skip link for screen readers */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:p-2 focus:bg-background focus:text-foreground"
      >
        Skip to main content
      </a>
    </div>
  );
}

export default ChatWidget;
