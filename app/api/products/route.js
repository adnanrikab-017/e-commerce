import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/http";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const arrivalOnly = searchParams.get("newArrival") === "true";
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED", stock: { gt: 0 }, ...(arrivalOnly ? { isNewArrival: true } : {}) },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { position: "asc" } },
      reviews: { where: { isVisible: true }, include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products: products.map(serializeProduct) });
}
