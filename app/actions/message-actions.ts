/**
 * Message Server Actions
 */

"use server";

import { prisma } from "@/src/lib/prisma";
import { requireAuth } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Mark messages as read
 */
export async function markMessagesAsReadAction(
  conversationId: string,
  messageIds: string[]
) {
  await requireAuth();

  try {
    await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        conversationId,
      },
      data: { isRead: true },
    });

    // Reset unread count
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark messages as read:", error);
    return { success: false, error: "Failed to mark messages as read" };
  }
}

/**
 * Delete a message
 */
export async function deleteMessageAction(messageId: string) {
  await requireAuth();

  try {
    await prisma.message.delete({
      where: { id: messageId },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete message:", error);
    return { success: false, error: "Failed to delete message" };
  }
}
