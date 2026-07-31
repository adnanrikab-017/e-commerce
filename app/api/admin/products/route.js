import { requireAdmin } from "@/lib/auth";
import { apiError, parseJson, slugify } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/validation";
import { NextResponse } from "next/server";
import { deleteImage, publicIdFromUrl } from "@/lib/cloudinary";

const productInclude = {
  category: { select: { id: true, name: true } },
  brand: { select: { id: true, name: true } },
  images: { orderBy: { position: "asc" } },
};

export async function GET() {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ include: productInclude, orderBy: { createdAt: "desc" } }),
      prisma.category.findMany({ select: { id: true, name: true }, where: { isActive: true }, orderBy: { name: "asc" } }),
    ]);
    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error("Fetch products error:", error);
    return apiError("Failed to fetch products", 500);
  }
}

export async function POST(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const parsed = productInputSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError("Invalid product", 422, parsed.error.flatten());
  const { images, ...data } = parsed.data;
  try {
    const product = await prisma.product.create({
      data: {
        ...data,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        salePrice: data.salePrice ?? null,
        slug: `${slugify(data.name)}-${Date.now().toString(36)}`,
        images: { create: images.map((url, position) => ({ url, position, isFeatured: position === 0 })) },
      },
      include: productInclude,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") return apiError("SKU already exists", 409);
    if (error.code === "P2003") return apiError("Category does not exist", 422);
    console.error("Create product error:", error);
    return apiError("Failed to create product", 500);
  }
}

export async function PATCH(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const body = await parseJson(request);
  const parsed = productInputSchema.safeParse(body);
  if (!body?.id || !parsed.success) return apiError("Invalid product", 422, parsed.error?.flatten());
  const { images, ...data } = parsed.data;
  try {
    const previousImages = await prisma.productImage.findMany({ where: { productId: body.id }, select: { url: true } });
    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: body.id } });
      return tx.product.update({
        where: { id: body.id },
        data: {
          ...data,
          shortDescription: data.shortDescription || null,
          description: data.description || null,
          salePrice: data.salePrice ?? null,
          images: { create: images.map((url, position) => ({ url, position, isFeatured: position === 0 })) },
        },
        include: productInclude,
      });
    });
    const retained = new Set(images);
    await Promise.allSettled(previousImages.filter((image) => !retained.has(image.url)).map((image) => publicIdFromUrl(image.url)).filter(Boolean).map(deleteImage));
    return NextResponse.json({ product });
  } catch (error) {
    if (error.code === "P2002") return apiError("SKU already exists", 409);
    console.error("Update product error:", error);
    return apiError("Failed to update product", 500);
  }
}

export async function DELETE(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return apiError("Product ID is required");
  try {
    const images = await prisma.productImage.findMany({ where: { productId: id }, select: { url: true } });
    await prisma.product.delete({ where: { id } });
    await Promise.allSettled(images.map((image) => publicIdFromUrl(image.url)).filter(Boolean).map(deleteImage));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === "P2025") return apiError("Product not found", 404);
    console.error("Delete product error:", error);
    return apiError("Failed to permanently delete product", 500);
  }
}
