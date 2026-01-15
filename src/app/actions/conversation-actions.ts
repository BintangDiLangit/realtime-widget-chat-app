/**
 * Conversation Server Actions
 */

"use server";

import { prisma } from "@/src/lib/prisma";
import { requireAuth } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import type { ConversationStatus } from "@/src/types";

/**
 * Assign conversation to current agent
 */
export async function assignConversationAction(conversationId: string) {
  const agent = await requireAuth();

  try {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        agentId: agent.id,
        status: "assigned",
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            isOnline: true,
          },
        },
      },
    });

    revalidatePath("/admin");
    return { success: true, data: conversation };
  } catch (error) {
    console.error("Failed to assign conversation:", error);
    return { success: false, error: "Failed to assign conversation" };
  }
}

/**
 * Update conversation status
 */
export async function updateConversationStatusAction(
  conversationId: string,
  status: ConversationStatus
) {
  await requireAuth();

  try {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
    });

    revalidatePath("/admin");
    return { success: true, data: conversation };
  } catch (error) {
    console.error("Failed to update conversation status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

/**
 * Close conversation
 */
export async function closeConversationAction(conversationId: string) {
  await requireAuth();

  try {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "closed" },
    });

    revalidatePath("/admin");
    return { success: true, data: conversation };
  } catch (error) {
    console.error("Failed to close conversation:", error);
    return { success: false, error: "Failed to close conversation" };
  }
}

/**
 * Reopen conversation
 */
export async function reopenConversationAction(conversationId: string) {
  const agent = await requireAuth();

  try {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: "assigned",
        agentId: agent.id,
      },
    });

    revalidatePath("/admin");
    return { success: true, data: conversation };
  } catch (error) {
    console.error("Failed to reopen conversation:", error);
    return { success: false, error: "Failed to reopen conversation" };
  }
}

/**
 * Get conversation statistics
 */
export async function getConversationStatsAction() {
  await requireAuth();

  try {
    const [total, open, assigned, closed] = await Promise.all([
      prisma.conversation.count(),
      prisma.conversation.count({ where: { status: "open" } }),
      prisma.conversation.count({ where: { status: "assigned" } }),
      prisma.conversation.count({ where: { status: "closed" } }),
    ]);

    return {
      success: true,
      data: { total, open, assigned, closed },
    };
  } catch (error) {
    console.error("Failed to get stats:", error);
    return { success: false, error: "Failed to get statistics" };
  }
}
