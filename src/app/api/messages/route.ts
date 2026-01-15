/**
 * Messages API Route
 * GET: List messages for a conversation (with pagination)
 * POST: Create a new message
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { CreateMessageSchema } from "@/src/types";

/**
 * GET /api/messages
 * List messages for a conversation with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before"); // For cursor-based pagination

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "conversationId is required" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = { conversationId };

    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    // Get total count
    const total = await prisma.message.count({
      where: { conversationId },
    });

    // Get messages
    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: before ? 0 : (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        hasMore: before ? messages.length === limit : page * limit < total,
      },
    });
  } catch (error) {
    console.error("[API] Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages
 * Create a new message (primarily for REST API usage, Socket.io is preferred)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateMessageSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: validated.error.issues },
        { status: 400 }
      );
    }

    const {
      conversationId,
      senderId,
      senderType,
      senderName,
      content,
      fileUrl,
      fileName,
    } = validated.data;

    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        senderType,
        senderName,
        content,
        fileUrl,
        fileName,
      },
    });

    // Update conversation
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Increment unread count if customer sent the message
    if (senderType === "customer") {
      updateData.unreadCount = { increment: 1 };
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
    });

    return NextResponse.json(
      { success: true, data: message },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Error creating message:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create message" },
      { status: 500 }
    );
  }
}
