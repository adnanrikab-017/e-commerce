import { requireAdmin } from "@/lib/auth";
import { apiError, serverError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  try {
    const orders = await prisma.order.findMany({ include: { customer: { select: { id: true, name: true, email: true, phone: true } }, items: true, address: true }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ orders });
  } catch (error) { return serverError("Fetch admin orders", error, "Failed to fetch orders"); }
}

export async function PATCH(request) {
  const admin = await requireAdmin();
  if (!admin) return apiError("Unauthorized", 401);
  try {
    const { id, status } = await request.json();
    const allowed = new Set(["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]);
    if (!id || !allowed.has(status)) return apiError("Order ID and status required", 400);
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!current) throw new Error("NOT_FOUND");
      const cancelling = status === "CANCELLED" && current.status !== "CANCELLED" && !current.stockRestoredAt;
      if (current.status === "CANCELLED" && status !== "CANCELLED") throw new Error("CANCELLED_FINAL");
      if (cancelling) {
        for (const item of current.items) {
          if (item.productId) await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          if (item.variantId) await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
        if (current.couponId) await tx.coupon.updateMany({ where: { id: current.couponId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
      }
      return tx.order.update({ where: { id }, data: { status, ...(cancelling ? { stockRestoredAt: new Date() } : {}), history: { create: { status, note: `Status updated to ${status} by admin` } } } });
    });
    return NextResponse.json({ success: true, order });
  } catch (error) {
    if (error.message === "NOT_FOUND") return apiError("Order not found", 404);
    if (error.message === "CANCELLED_FINAL") return apiError("A cancelled order cannot be reopened after stock restoration", 409);
    return serverError("Update order status", error, "Failed to update order status");
  }
}
