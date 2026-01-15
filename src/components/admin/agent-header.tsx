/**
 * Agent Header Component
 * Shows agent info, status toggle, and logout
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ChevronDown, Circle } from "lucide-react";
import { logoutAction } from "@/src/app/actions/auth-actions";
import { getSocket, connectSocket } from "@/src/lib/socket-client";
import { getInitials } from "@/src/lib/utils";

interface AgentHeaderProps {
  agent: {
    id: string;
    name: string;
    email: string;
  };
  className?: string;
}

export function AgentHeader({ agent, className }: AgentHeaderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Connect socket and set online status
  useEffect(() => {
    const socket = connectSocket();

    // Set online status
    socket.emit("agent:online", { agentId: agent.id });

    // Handle disconnect
    const handleDisconnect = () => {
      socket.emit("agent:offline", { agentId: agent.id });
    };

    window.addEventListener("beforeunload", handleDisconnect);

    return () => {
      handleDisconnect();
      window.removeEventListener("beforeunload", handleDisconnect);
    };
  }, [agent.id]);

  // Toggle online status
  const toggleStatus = useCallback(() => {
    const socket = getSocket();
    const newStatus = !isOnline;
    setIsOnline(newStatus);

    if (newStatus) {
      socket.emit("agent:online", { agentId: agent.id });
    } else {
      socket.emit("agent:offline", { agentId: agent.id });
    }
  }, [isOnline, agent.id]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    const socket = getSocket();
    socket.emit("agent:offline", { agentId: agent.id });
    await logoutAction();
  }, [agent.id]);

  return (
    <header
      className={cn(
        "flex items-center justify-between",
        "px-6 py-4 border-b bg-card",
        className
      )}
    >
      {/* Logo/Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <svg
            className="w-5 h-5 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <div>
          <h1 className="font-semibold text-lg">Support Dashboard</h1>
          <p className="text-xs text-muted-foreground">Manage conversations</p>
        </div>
      </div>

      {/* Agent info and actions */}
      <div className="flex items-center gap-4">
        {/* Status toggle */}
        <button
          onClick={toggleStatus}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full",
            "text-sm font-medium transition-colors",
            isOnline
              ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
          )}
        >
          <Circle
            className={cn(
              "w-2 h-2",
              isOnline ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
            )}
          />
          {isOnline ? "Online" : "Offline"}
        </button>

        {/* Agent dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(agent.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium">{agent.name}</p>
                <p className="text-xs text-muted-foreground">{agent.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 sm:hidden">
              <p className="text-sm font-medium">{agent.name}</p>
              <p className="text-xs text-muted-foreground">{agent.email}</p>
            </div>
            <DropdownMenuSeparator className="sm:hidden" />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default AgentHeader;
