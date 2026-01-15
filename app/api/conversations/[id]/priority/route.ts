/**
 * Conversation Priority API Route
 * Handles updating conversation priority
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";

const UpdatePrioritySchema = z.object({
  priority: z.enum(["low", "normal", "high", "urgent"]),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/conversations/[id]/priority
 * Update conversation priority
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validated = UpdatePrioritySchema.parse(body);

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { priority: validated.priority },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            isOnline: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            senderType: true,
            createdAt: true,
          },
        },
        _count: {
          select: { notes: true },
        },
      },
    });

    // Format for ConversationListItem
    const formatted = {
      ...conversation,
      lastMessage: conversation.messages[0] || null,
      messages: undefined,
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating priority:", error);
    return NextResponse.json(
      { error: "Failed to update priority" },
      { status: 500 }
    );
  }
}
