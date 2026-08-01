import { requireAdmin } from "@/lib/auth";
import { deleteImage, publicIdFromUrl } from "@/lib/cloudinary";
import { apiError, parseJson, slugify } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { categoryInputSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  try {
    const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ categories });
  } catch (error) { console.error("Fetch categories error:", error); return apiError("Failed to fetch categories", 500); }
}

export async function POST(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const parsed = categoryInputSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError("Invalid category", 422, parsed.error.flatten());
  try {
    const category = await prisma.category.create({ data: { ...parsed.data, slug: slugify(parsed.data.name) } });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    await deleteImage(parsed.data.imagePublicId).catch((cleanupError) => console.error("Unused category image cleanup error:", cleanupError));
    if (error.code === "P2002") return apiError("A category with this name already exists", 409);
    console.error("Create category error:", error); return apiError("Failed to create category", 500);
  }
}

export async function DELETE(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return apiError("Category ID is required");
  try {
    const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
    if (!category) return apiError("Category not found", 404);
    if (category._count.products) return apiError("Move or delete this category's products first", 409);
    await prisma.category.delete({ where: { id } });
    const publicId = category.imagePublicId || publicIdFromUrl(category.imageUrl);
    if (publicId) await deleteImage(publicId).catch((error) => console.error("Category image cleanup error:", error));
    return NextResponse.json({ success: true });
  } catch (error) { console.error("Delete category error:", error); return apiError("Failed to delete category", 500); }
}
