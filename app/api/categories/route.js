import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, products: { some: { status: "PUBLISHED", stock: { gt: 0 } } } },
    select: { id: true, name: true, slug: true, imageUrl: true, isFeatured: true, _count: { select: { products: true } } },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });
  return NextResponse.json({ categories });
}
