/**
 * Widget Page
 * Standalone page for the chat widget (used in iframe embeds)
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChatWidget } from "@/src/components/widget";

export default function WidgetPage() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Get configuration from URL params
  const position = (searchParams.get("position") as "bottom-right" | "bottom-left") || "bottom-right";
  const primaryColor = searchParams.get("color") || undefined;
  const headerText = searchParams.get("header") || "Support Chat";
  const welcomeMessage = searchParams.get("welcome") || "Hi there! 👋 How can we help you today?";
  const requireName = searchParams.get("requireName") === "true";
  const requireEmail = searchParams.get("requireEmail") === "true";

  useEffect(() => {
    setMounted(true);

    // Listen for messages from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "open") {
        // Trigger open
        document.dispatchEvent(new CustomEvent("widget-open"));
      } else if (event.data.type === "close") {
        // Trigger close
        document.dispatchEvent(new CustomEvent("widget-close"));
      } else if (event.data.type === "toggle") {
        // Trigger toggle
        document.dispatchEvent(new CustomEvent("widget-toggle"));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Notify parent when widget state changes
  useEffect(() => {
    const notifyParent = (isOpen: boolean) => {
      window.parent.postMessage(
        { type: isOpen ? "widget-open" : "widget-close" },
        "*"
      );
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-transparent">
      <ChatWidget
        position={position}
        primaryColor={primaryColor}
        headerText={headerText}
        welcomeMessage={welcomeMessage}
        requireName={requireName}
        requireEmail={requireEmail}
      />
    </div>
  );
}
