/**
 * Tag API - Single Resource
 * PATCH - Update tag
 * DELETE - Delete tag
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { UpdateTagSchema } from "@/src/types";

// PATCH - Update tag
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
    const validated = UpdateTagSchema.parse(body);

    // Check if name conflicts with existing tag
    if (validated.name) {
      const existing = await prisma.tag.findFirst({
        where: {
          name: validated.name,
          NOT: { id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Tag with this name already exists" },
          { status: 400 }
        );
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: validated,
      include: {
        _count: {
          select: { conversations: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: tag });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid data", details: error },
        { status: 400 }
      );
    }
    console.error("Error updating tag:", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE - Delete tag
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

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
