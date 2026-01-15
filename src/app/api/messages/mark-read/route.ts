/**
 * Mark Messages as Read API Route
 * POST: Mark multiple messages as read
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";

const MarkReadSchema = z.object({
  conversationId: z.string().cuid(),
  messageIds: z.array(z.string().cuid()),
});

/**
 * POST /api/messages/mark-read
 * Mark multiple messages as read and reset unread count
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = MarkReadSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { conversationId, messageIds } = validated.data;

    // Update messages
    await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        conversationId,
      },
      data: { isRead: true },
    });

    // Reset unread count for the conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });

    return NextResponse.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("[API] Error marking messages as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
