/**
 * Canned Responses API Route
 * Handles listing and creating canned responses
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";

const CreateCannedResponseSchema = z.object({
  shortcut: z.string().min(1).max(50).regex(/^\/[a-z0-9-]+$/),
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
  category: z.string().optional(),
  isShared: z.boolean().default(false),
});

/**
 * GET /api/canned-responses
 * List canned responses for the current agent
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const responses = await prisma.cannedResponse.findMany({
      where: {
        isActive: true,
        OR: [
          { agentId: null }, // Shared responses
          { agentId: session.user.id }, // Personal responses
        ],
        ...(category && { category }),
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { usageCount: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ success: true, data: responses });
  } catch (error) {
    console.error("Error fetching canned responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch canned responses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/canned-responses
 * Create a new canned response
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateCannedResponseSchema.parse(body);

    const response = await prisma.cannedResponse.create({
      data: {
        shortcut: validated.shortcut,
        title: validated.title,
        content: validated.content,
        category: validated.category,
        agentId: validated.isShared ? null : session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating canned response:", error);
    return NextResponse.json(
      { error: "Failed to create canned response" },
      { status: 500 }
    );
  }
}
