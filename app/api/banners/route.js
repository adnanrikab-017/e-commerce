import { prisma } from "@/lib/prisma";
import { serverError } from "@/lib/http";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: { type: "HERO", isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }] },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ banners });
  } catch (error) {
    return serverError("Fetch storefront hero banners error", error, "Could not load hero banners");
  }
}
