import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        images: { select: { url: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      where: { isActive: true },
    });

    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, sku, price, salePrice, stock, categoryId, status, description, imageUrl } = body;

    if (!name || !sku || !price || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Date.now();

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        stock: parseInt(stock) || 0,
        categoryId,
        status: status || "PUBLISHED",
        description: description || "",
        images: imageUrl ? { create: [{ url: imageUrl, position: 0 }] } : undefined,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, stock, price } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (price !== undefined) updateData.price = parseFloat(price);

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
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
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
