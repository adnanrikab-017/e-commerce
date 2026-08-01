import { requireAdmin } from "@/lib/auth";
import { deleteImage, publicIdFromUrl } from "@/lib/cloudinary";
import { apiError, parseJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { heroBannerInputSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  try {
    const banners = await prisma.banner.findMany({ where: { type: "HERO" }, orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json({ banners });
  } catch (error) { console.error("Fetch hero banners error:", error); return apiError("Failed to fetch hero banners", 500); }
}

async function cleanupReplacedImages(previous, next) {
  const obsolete = [
    previous.imagePublicId || publicIdFromUrl(previous.imageUrl),
    previous.mobileImagePublicId || publicIdFromUrl(previous.mobileImageUrl),
  ].filter((id) => id && id !== next.imagePublicId && id !== next.mobileImagePublicId);
  await Promise.allSettled(obsolete.map(deleteImage));
}

export async function POST(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const parsed = heroBannerInputSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError("Invalid hero banner", 422, parsed.error.flatten());
  try {
    const banner = await prisma.banner.create({ data: { ...parsed.data, type: "HERO" } });
    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    await Promise.allSettled([parsed.data.imagePublicId, parsed.data.mobileImagePublicId].filter(Boolean).map(deleteImage));
    console.error("Create hero banner error:", error); return apiError("Failed to create hero banner", 500);
  }
}

export async function PATCH(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const body = await parseJson(request);
  const parsed = heroBannerInputSchema.safeParse(body);
  if (!body?.id || !parsed.success) return apiError("Invalid hero banner", 422, parsed.error?.flatten());
  try {
    const previous = await prisma.banner.findUnique({ where: { id: body.id } });
    if (!previous) return apiError("Hero banner not found", 404);
    const banner = await prisma.banner.update({ where: { id: body.id }, data: parsed.data });
    await cleanupReplacedImages(previous, parsed.data);
    return NextResponse.json({ banner });
  } catch (error) { console.error("Update hero banner error:", error); return apiError("Failed to update hero banner", 500); }
}

export async function DELETE(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return apiError("Hero banner ID is required");
  try {
    const banner = await prisma.banner.delete({ where: { id } });
    await cleanupReplacedImages(banner, {});
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === "P2025") return apiError("Hero banner not found", 404);
    console.error("Delete hero banner error:", error); return apiError("Failed to delete hero banner", 500);
  }
}
