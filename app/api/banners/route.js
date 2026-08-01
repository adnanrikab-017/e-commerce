import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const banners = await prisma.banner.findMany({
    where: { type: "HERO", isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }] },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ banners });
}
