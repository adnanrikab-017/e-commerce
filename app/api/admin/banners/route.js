import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Fetch banners error:", error);
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, type, imageUrl, linkUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const banner = await prisma.banner.create({
      data: {
        title: title || null,
        type: type || "HERO",
        imageUrl,
        linkUrl: linkUrl || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error("Create banner error:", error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Banner ID and active status required" }, { status: 400 });
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error("Update banner status error:", error);
    return NextResponse.json({ error: "Failed to update banner status" }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Banner ID required" }, { status: 400 });
    }

    await prisma.banner.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete banner error:", error);
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}
