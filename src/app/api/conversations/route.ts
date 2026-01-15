/**
 * Conversations API Route
 * GET: List all conversations (with filters)
 * POST: Create a new conversation
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { CreateConversationSchema } from "@/src/types";
import type { ConversationStatus } from "@/src/types";

/**
 * GET /api/conversations
 * List conversations with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ConversationStatus | "all" | null;
    const search = searchParams.get("search");
    const agentId = searchParams.get("agentId");
    const customerId = searchParams.get("customerId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (agentId) {
      where.agentId = agentId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { customerId: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.conversation.count({ where });

    // Get conversations with last message
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            isOnline: true,
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
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform to include lastMessage
    const transformedConversations = conversations.map((conv: typeof conversations[number]) => ({
      ...conv,
      lastMessage: conv.messages[0] || null,
      messages: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: transformedConversations,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("[API] Error fetching conversations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateConversationSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: validated.error.issues },
        { status: 400 }
      );
    }

    const { customerId, customerName, customerEmail } = validated.data;

    // Check if customer already has an open conversation
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        customerId,
        status: { in: ["open", "assigned"] },
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        data: existingConversation,
        message: "Existing conversation found",
      });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        customerId,
        customerName,
        customerEmail,
        status: "open",
      },
    });

    return NextResponse.json(
      { success: true, data: conversation },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Error creating conversation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
