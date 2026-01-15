/**
 * Single Conversation API Route
 * GET: Get conversation by ID
 * PATCH: Update conversation (status, assignment)
 * DELETE: Delete conversation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { UpdateConversationSchema } from "@/src/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/conversations/[id]
 * Get a single conversation with messages
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error("[API] Error fetching conversation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/conversations/[id]
 * Update conversation status or assignment
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = UpdateConversationSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { status, agentId } = validated.data;

    // Check if conversation exists
    const existing = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (agentId !== undefined) {
      updateData.agentId = agentId;
      // Auto-set status to assigned if assigning an agent
      if (agentId && !status) {
        updateData.status = "assigned";
      }
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error("[API] Error updating conversation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]
 * Delete a conversation and all its messages
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if conversation exists
    const existing = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Delete conversation (messages will cascade delete)
    await prisma.conversation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("[API] Error deleting conversation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
