/**
 * Admin Dashboard Client Component
 * Handles state management for conversation selection
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { ConversationList, ConversationView } from "@/src/components/admin";
import { MessageSquare } from "lucide-react";
import { useSocket, useAgentEvents } from "@/src/hooks/use-socket";
import { connectSocket } from "@/src/lib/socket-client";
import type { ConversationListItem } from "@/src/types";

interface AdminDashboardProps {
  initialConversations: ConversationListItem[];
  agent: {
    id: string;
    name: string;
    email: string;
  };
}

export function AdminDashboard({
  initialConversations,
  agent,
}: AdminDashboardProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationListItem | null>(null);

  // Connect socket
  const { isConnected } = useSocket({ autoConnect: true });

  // Set agent online when connected
  useEffect(() => {
    if (isConnected) {
      const socket = connectSocket();
      socket.emit("agent:online", { agentId: agent.id });
    }
  }, [isConnected, agent.id]);

  // Handle real-time conversation updates
  const handleConversationCreated = useCallback((conv: ConversationListItem) => {
    setConversations((prev) => {
      if (prev.some((c) => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
  }, []);

  const handleConversationUpdated = useCallback((conv: ConversationListItem) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv.id ? { ...c, ...conv } : c
      )
    );

    // Update selected conversation if it's the same
    setSelectedConversation((prev) =>
      prev?.id === conv.id ? { ...prev, ...conv } : prev
    );
  }, []);

  useAgentEvents({
    onConversationCreated: handleConversationCreated,
    onConversationUpdated: handleConversationUpdated,
  });

  // Handle conversation selection
  const handleSelectConversation = useCallback(
    (conv: ConversationListItem) => {
      setSelectedConversation(conv);
    },
    []
  );

  // Handle conversation update from view
  const handleConversationUpdate = useCallback((conv: ConversationListItem) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv.id ? { ...c, ...conv } : c
      )
    );
    setSelectedConversation((prev) =>
      prev?.id === conv.id ? { ...prev, ...conv } : prev
    );
  }, []);

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      {/* Sidebar */}
      <ConversationList
        initialConversations={conversations}
        selectedId={selectedConversation?.id}
        onSelect={handleSelectConversation}
        className="w-80 shrink-0 min-h-0"
      />

      {/* Main content */}
      {selectedConversation ? (
        <ConversationView
          key={selectedConversation.id}
          conversation={selectedConversation}
          agentId={agent.id}
          agentName={agent.name}
          onUpdate={handleConversationUpdate}
          className="flex-1"
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/30">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
          <p className="text-muted-foreground text-center max-w-sm">
            Choose a conversation from the sidebar to view messages and respond
            to customers.
          </p>

          {/* Connection status */}
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            {isConnected ? "Connected" : "Connecting..."}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
