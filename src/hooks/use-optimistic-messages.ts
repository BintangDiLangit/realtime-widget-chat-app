/**
 * Optimistic Messages Hook
 * Uses React 19's useOptimistic for instant UI updates
 */

"use client";

import { useOptimistic, useCallback, startTransition } from "react";
import type { Message } from "@/src/types";

type OptimisticAction =
  | { type: "add"; message: Message }
  | { type: "update"; id: string; updates: Partial<Message> }
  | { type: "remove"; id: string }
  | { type: "replace"; id: string; message: Message };

/**
 * Hook for optimistic message updates
 */
export function useOptimisticMessages(initialMessages: Message[]) {
  const [optimisticMessages, addOptimistic] = useOptimistic<
    Message[],
    OptimisticAction
  >(initialMessages, (state, action) => {
    switch (action.type) {
      case "add":
        // Check for duplicates
        if (state.some((m) => m.id === action.message.id)) {
          return state;
        }
        return [...state, action.message];

      case "update":
        return state.map((m) =>
          m.id === action.id ? { ...m, ...action.updates } : m
        );

      case "remove":
        return state.filter((m) => m.id !== action.id);

      case "replace":
        return state.map((m) => (m.id === action.id ? action.message : m));

      default:
        return state;
    }
  });

  /**
   * Add a message optimistically
   */
  const addMessage = useCallback(
    (message: Message) => {
      startTransition(() => {
        addOptimistic({ type: "add", message });
      });
    },
    [addOptimistic]
  );

  /**
   * Update a message optimistically
   */
  const updateMessage = useCallback(
    (id: string, updates: Partial<Message>) => {
      startTransition(() => {
        addOptimistic({ type: "update", id, updates });
      });
    },
    [addOptimistic]
  );

  /**
   * Remove a message optimistically
   */
  const removeMessage = useCallback(
    (id: string) => {
      startTransition(() => {
        addOptimistic({ type: "remove", id });
      });
    },
    [addOptimistic]
  );

  /**
   * Replace a temporary message with the real one
   */
  const replaceMessage = useCallback(
    (tempId: string, realMessage: Message) => {
      startTransition(() => {
        addOptimistic({ type: "replace", id: tempId, message: realMessage });
      });
    },
    [addOptimistic]
  );

  /**
   * Mark messages as read optimistically
   */
  const markAsRead = useCallback(
    (messageIds: string[]) => {
      startTransition(() => {
        messageIds.forEach((id) => {
          addOptimistic({ type: "update", id, updates: { isRead: true } });
        });
      });
    },
    [addOptimistic]
  );

  return {
    messages: optimisticMessages,
    addMessage,
    updateMessage,
    removeMessage,
    replaceMessage,
    markAsRead,
  };
}

export default useOptimisticMessages;
