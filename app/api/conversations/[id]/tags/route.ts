/**
 * Conversation Tags API Route
 * Handles adding and removing tags from conversations
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/conversations/[id]/tags
 * Add a tag to a conversation
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { tagId } = await request.json();

    if (!tagId) {
      return NextResponse.json({ error: "Tag ID required" }, { status: 400 });
    }

    const conversationTag = await prisma.conversationTag.create({
      data: {
        conversationId: id,
        tagId,
        addedBy: session.user.id,
      },
      include: {
        tag: true,
      },
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

/**
 * DELETE /api/conversations/[id]/tags?tagId=xxx
 * Remove a tag from a conversation
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json({ error: "Tag ID required" }, { status: 400 });
    }

    await prisma.conversationTag.deleteMany({
      where: {
        conversationId: id,
        tagId,
      },
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
