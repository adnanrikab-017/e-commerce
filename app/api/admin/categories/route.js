import { authorizeAdmin } from "@/lib/auth";
import { deleteImage, publicIdFromUrl } from "@/lib/cloudinary";
import { apiError, parseJson, serverError, slugify } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { categoryInputSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET() {
  const authorization = await authorizeAdmin();
  if (authorization.error) return apiError(authorization.error, authorization.status);
  try {
    const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ categories });
  } catch (error) { return serverError("Fetch categories error", error, "Could not load categories"); }
}

export async function POST(request) {
  const authorization = await authorizeAdmin();
  if (authorization.error) return apiError(authorization.error, authorization.status);
  const parsed = categoryInputSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError("Invalid category", 422, parsed.error.flatten());
  try {
    const categorySlug = slugify(parsed.data.name) || `category-${crypto.randomUUID().slice(0, 8)}`;
    const category = await prisma.category.create({ data: { ...parsed.data, slug: categorySlug } });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    await deleteImage(parsed.data.imagePublicId).catch((cleanupError) => console.error("Unused category image cleanup error:", cleanupError));
    if (error.code === "P2002") return apiError("A category with this name already exists", 409);
    return serverError("Create category error", error, "Could not create category");
  }
}

export async function DELETE(request) {
  const authorization = await authorizeAdmin();
  if (authorization.error) return apiError(authorization.error, authorization.status);
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
  } catch (error) { return serverError("Delete category error", error, "Could not delete category"); }
}
