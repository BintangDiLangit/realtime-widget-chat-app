/**
 * File Upload API Route
 * POST: Upload a file and return its URL
 * 
 * Note: This implementation stores files as base64 data URLs.
 * For production, consider using cloud storage (S3, Cloudinary, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const MAX_FILE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || "5242880"); // 5MB default

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/**
 * POST /api/upload
 * Upload a file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "bin";
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Return file URL
    const url = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
    });
  } catch (error) {
    console.error("[API] Error uploading file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload
 * Get upload configuration
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      maxFileSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_TYPES,
    },
  });
}
