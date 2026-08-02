import { prisma } from "@/lib/prisma";
import { apiError, serializeProduct } from "@/lib/http";
import { NextResponse } from "next/server";

export async function GET(_request, { params }) {
  const { productId } = await params;
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }], status: "PUBLISHED" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
      reviews: { where: { isVisible: true }, include: { user: { select: { name: true } } } },
    },
  });
  if (!product) return apiError("Product not found", 404);
  return NextResponse.json({ product: serializeProduct(product) });
}
