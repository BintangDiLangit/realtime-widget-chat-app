/**
 * Conversation Tags API
 * POST - Add tag to conversation
 * DELETE - Remove tag from conversation
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

// POST - Add tag to conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { tagId } = await request.json();

    if (!tagId) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 }
      );
    }

    // Check if tag already exists on conversation
    const existing = await prisma.conversationTag.findUnique({
      where: {
        conversationId_tagId: {
          conversationId,
          tagId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Tag already added to conversation" },
        { status: 400 }
      );
    }

    const conversationTag = await prisma.conversationTag.create({
      data: {
        conversationId,
        tagId,
        addedBy: session.user.id,
      },
      include: {
        tag: true,
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: conversationTag });
  } catch (error) {
    console.error("Error adding tag:", error);
    return NextResponse.json(
      { error: "Failed to add tag" },
      { status: 500 }
    );
  }
}

// DELETE - Remove tag from conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 }
      );
    }

    await prisma.conversationTag.deleteMany({
      where: {
        conversationId,
        tagId,
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing tag:", error);
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    );
  }
}
