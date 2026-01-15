/**
 * Conversation Priority API
 * PATCH - Update conversation priority
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { UpdatePrioritySchema } from "@/src/types";

// PATCH - Update conversation priority
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = UpdatePrioritySchema.parse(body);

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { 
        priority: validated.priority,
        updatedAt: new Date(),
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
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data", details: error },
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
