import { requireAdmin } from "@/lib/auth";
import { deleteImage, uploadImage } from "@/lib/cloudinary";
import { apiError } from "@/lib/http";
import { NextResponse } from "next/server";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxSize = 8 * 1024 * 1024;

export async function POST(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  try {
    const form = await request.formData();
    const files = form.getAll("files");
    if (!files.length || files.length > 12) return apiError("Upload between 1 and 12 images");
    for (const file of files) {
      if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > maxSize) {
        return apiError("Images must be JPG, PNG, WebP, or AVIF and no larger than 8 MB");
      }
    }
    const images = await Promise.all(files.map(uploadImage));
    return NextResponse.json({ images });
  } catch (error) {
    console.error("Image upload error:", error);
    return apiError(error.message || "Image upload failed", 500);
  }
}

export async function DELETE(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const body = await request.json().catch(() => null);
  if (!body?.publicId) return apiError("Cloudinary public ID is required");
  try {
    await deleteImage(body.publicId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Image delete error:", error);
    return apiError(error.message || "Image deletion failed", 500);
  }
}
