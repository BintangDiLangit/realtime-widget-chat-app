/**
 * Canned Responses API
 * GET - List canned responses (personal + shared)
 * POST - Create new canned response
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { CreateCannedResponseSchema } from "@/src/types";

// GET - List canned responses
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const responses = await prisma.cannedResponse.findMany({
      where: {
        isActive: true,
        OR: [
          { agentId: null }, // Shared responses
          { agentId: session.user.id }, // Personal responses
        ],
        ...(category && { category }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { shortcut: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }),
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

    // Group by category
    const categories = Array.from(
      new Set(
        responses
          .map((r: (typeof responses)[number]) => r.category)
          .filter((cat: string | null): cat is string => cat !== null && cat !== undefined)
      )
    );

    return NextResponse.json({ 
      success: true, 
      data: responses,
      categories,
    });
  } catch (error) {
    console.error("Error fetching canned responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch canned responses" },
      { status: 500 }
    );
  }
}

// POST - Create canned response
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateCannedResponseSchema.parse(body);

    // Check if shortcut already exists for this agent (or shared)
    const existing = await prisma.cannedResponse.findFirst({
      where: {
        shortcut: validated.shortcut,
        OR: [
          { agentId: validated.isShared ? null : session.user.id },
          ...(validated.isShared ? [{ agentId: null }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Shortcut already exists" },
        { status: 400 }
      );
    }

    const response = await prisma.cannedResponse.create({
      data: {
        shortcut: validated.shortcut,
        title: validated.title,
        content: validated.content,
        category: validated.category || null,
        agentId: validated.isShared ? null : session.user.id,
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
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data", details: error },
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
