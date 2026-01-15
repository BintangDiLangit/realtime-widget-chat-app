/**
 * Widget Page - 2025 Modern Design
 * Standalone page for the chat widget (used in iframe embeds)
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChatWidget } from "@/src/components/widget";

function WidgetContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Get configuration from URL params
  const position = (searchParams.get("position") as "bottom-right" | "bottom-left") || "bottom-right";
  const headerTitle = searchParams.get("header") || "Support Chat";
  const welcomeMessage = searchParams.get("welcome") || "Hi there! 👋 How can we help you today?";
  const requireName = searchParams.get("requireName") === "true";
  const requireEmail = searchParams.get("requireEmail") === "true";

  useEffect(() => {
    setMounted(true);

    // Listen for messages from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "open") {
        document.dispatchEvent(new CustomEvent("widget-open"));
      } else if (event.data.type === "close") {
        document.dispatchEvent(new CustomEvent("widget-close"));
      } else if (event.data.type === "toggle") {
        document.dispatchEvent(new CustomEvent("widget-toggle"));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Notify parent when widget state changes
  useEffect(() => {
    const notifyParent = (isOpen: boolean) => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: isOpen ? "widget-open" : "widget-close" },
          "*"
        );
      }
    };

    const handleOpen = () => notifyParent(true);
    const handleClose = () => notifyParent(false);

    document.addEventListener("widget-opened", handleOpen);
    document.addEventListener("widget-closed", handleClose);

    return () => {
      document.removeEventListener("widget-opened", handleOpen);
      document.removeEventListener("widget-closed", handleClose);
    };
  }, []);

  if (!mounted) {
    return (
      <div 
        style={{ 
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 9999,
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)"
        }}
      >
        <div 
          style={{ 
            width: "24px", 
            height: "24px", 
            border: "2px solid white",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} 
        />
        <style>
          {`@keyframes spin { to { transform: rotate(360deg); } }`}
        </style>
      </div>
    );
  }

  return (
    <ChatWidget
      position={position}
      headerTitle={headerTitle}
      welcomeMessage={welcomeMessage}
      requireName={requireName}
      requireEmail={requireEmail}
    />
  );
}

export default function WidgetPage() {
  return (
    <div 
      style={{ 
        minHeight: "100vh", 
        position: "relative",
        background: "transparent"
      }}
    >
      <Suspense 
        fallback={
          <div 
            style={{ 
              position: "fixed",
              bottom: "1.5rem",
              right: "1.5rem",
              zIndex: 9999,
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)"
            }}
          >
            <div 
              style={{ 
                width: "24px", 
                height: "24px", 
                border: "2px solid white",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} 
            />
            <style>
              {`@keyframes spin { to { transform: rotate(360deg); } }`}
            </style>
          </div>
        }
      >
        <WidgetContent />
      </Suspense>
    </div>
  );
}
