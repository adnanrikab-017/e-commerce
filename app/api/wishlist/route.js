import { requireAuth } from "@/lib/auth";
import { apiError, serializeProduct, serverError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Unauthorized", 401);
  try {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.sub, product: { status: "PUBLISHED" } },
    include: { product: { include: { category: true, images: { orderBy: { position: "asc" } }, reviews: { where: { isVisible: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items: items.map((item) => ({ createdAt: item.createdAt, product: serializeProduct(item.product) })) });
  } catch (error) {
    return serverError("Fetch wishlist error", error, "Could not load wishlist");
  }
}

export async function POST(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Please sign in to use your wishlist", 401);
  try {
  const body = await request.json().catch(() => null);
  if (!body?.productId) return apiError("Product ID is required");
  const product = await prisma.product.findFirst({ where: { id: body.productId, status: "PUBLISHED" }, select: { id: true } });
  if (!product) return apiError("Product not found", 404);
  await prisma.wishlistItem.upsert({ where: { userId_productId: { userId: session.sub, productId: product.id } }, create: { userId: session.sub, productId: product.id }, update: {} });
  return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return serverError("Add wishlist item error", error, "Could not update wishlist");
  }
}

export async function DELETE(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Unauthorized", 401);
  try {
  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId) return apiError("Product ID is required");
  await prisma.wishlistItem.deleteMany({ where: { userId: session.sub, productId } });
  return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Delete wishlist item error", error, "Could not update wishlist");
  }
}
