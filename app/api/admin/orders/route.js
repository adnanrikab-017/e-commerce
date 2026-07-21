import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        items: { select: { id: true, productName: true, quantity: true, unitPrice: true } },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Fetch admin orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Order ID and status required" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        history: {
          create: {
            status,
            note: `Status updated to ${status} by admin`,
          },
        },
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
