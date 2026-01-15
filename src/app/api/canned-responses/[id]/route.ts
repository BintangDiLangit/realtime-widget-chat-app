/**
 * Canned Response API - Single Resource
 * PATCH - Update canned response (or increment usage)
 * DELETE - Delete canned response
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { UpdateCannedResponseSchema } from "@/src/types";

// PATCH - Update canned response or increment usage
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

    // Check if just incrementing usage
    if (body.incrementUsage) {
      const response = await prisma.cannedResponse.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      });
      return NextResponse.json({ success: true, data: response });
    }

    // Otherwise, update the canned response
    const validated = UpdateCannedResponseSchema.parse(body);

    // Check ownership (must own or be shared)
    const existing = await prisma.cannedResponse.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Canned response not found" },
        { status: 404 }
      );
    }

    if (existing.agentId && existing.agentId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own canned responses" },
        { status: 403 }
      );
    }

    const response = await prisma.cannedResponse.update({
      where: { id },
      data: validated,
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
    console.error("Error updating canned response:", error);
    return NextResponse.json(
      { error: "Failed to update canned response" },
      { status: 500 }
    );
  }
}

// DELETE - Delete canned response
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existing = await prisma.cannedResponse.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Canned response not found" },
        { status: 404 }
      );
    }

    if (existing.agentId && existing.agentId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own canned responses" },
        { status: 403 }
      );
    }

    await prisma.cannedResponse.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting canned response:", error);
    return NextResponse.json(
      { error: "Failed to delete canned response" },
      { status: 500 }
    );
  }
}
