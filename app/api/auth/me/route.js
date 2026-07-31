import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findFirst({
      where: { id: session.sub, isActive: true },
      select: { id: true, role: true, name: true, email: true },
    });
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: {
        ...user,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Auth me check error:", error);
    return NextResponse.json({ user: null });
  }
}
