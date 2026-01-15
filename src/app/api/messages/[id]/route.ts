/**
 * Single Message API Route
 * GET: Get message by ID
 * PATCH: Update message (mark as read)
 * DELETE: Delete message
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/messages/[id]
 * Get a single message
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error("[API] Error fetching message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/messages/[id]
 * Update message (primarily for marking as read)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if message exists
    const existing = await prisma.message.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    // Only allow updating isRead
    const message = await prisma.message.update({
      where: { id },
      data: {
        isRead: body.isRead ?? existing.isRead,
      },
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error("[API] Error updating message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update message" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/messages/[id]
 * Delete a message
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if message exists
    const existing = await prisma.message.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 }
      );
    }

    await prisma.message.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("[API] Error deleting message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
