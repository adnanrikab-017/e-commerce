import { authorizeAdmin } from "@/lib/auth";
import { deleteImage, uploadImage } from "@/lib/cloudinary";
import { apiError } from "@/lib/http";
import { NextResponse } from "next/server";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 8 * 1024 * 1024;

export async function POST(request) {
  const authorization = await authorizeAdmin();
  if (authorization.error) return apiError(authorization.error, authorization.status);
  try {
    const form = await request.formData();
    const files = form.getAll("files");
    if (!files.length || files.length > 12) return apiError("Upload between 1 and 12 images");
    for (const file of files) {
      if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > maxSize) {
        return apiError("Images must be JPG, PNG, or WebP and no larger than 8 MB", 422);
      }
    }
    const results = await Promise.allSettled(files.map(uploadImage));
    const failed = results.find((result) => result.status === "rejected");
    if (failed) {
      await Promise.allSettled(results.filter((result) => result.status === "fulfilled").map((result) => deleteImage(result.value.publicId)));
      throw failed.reason;
    }
    const images = results.map((result) => result.value);
    return NextResponse.json({ images });
  } catch (error) {
    console.error("Image upload error:", error);
    const configurationError = error.message?.includes("configuration is incomplete");
    return apiError(error.message || "Image upload failed", configurationError ? 503 : 502);
  }
}

export async function DELETE(request) {
  const authorization = await authorizeAdmin();
  if (authorization.error) return apiError(authorization.error, authorization.status);
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
