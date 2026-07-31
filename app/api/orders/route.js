import crypto from "node:crypto";
import { requireAuth } from "@/lib/auth";
import { calculateDiscount, couponUnavailableReason } from "@/lib/commerce";
import { apiError, parseJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { orderInputSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireAuth();
  if (!session) return apiError("Unauthorized", 401);
  const orders = await prisma.order.findMany({
    where: { customerId: session.sub },
    include: { address: true, items: true, coupon: { select: { code: true } }, history: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}

export async function POST(request) {
  const session = await requireAuth();
  if (!session) return apiError("Please sign in before checkout", 401);
  const parsed = orderInputSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError("Invalid order", 422, parsed.error.flatten());
  const input = parsed.data;
  const address = await prisma.address.findFirst({ where: { id: input.addressId, userId: session.sub } });
  if (!address) return apiError("Select a valid delivery address", 422);

  const quantities = new Map();
  for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  const productIds = [...quantities.keys()];
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, status: "PUBLISHED" } });
  if (products.length !== productIds.length) return apiError("One or more products are unavailable", 409);
  for (const product of products) if (product.stock < quantities.get(product.id)) return apiError(`${product.name} does not have enough stock`, 409);

  const subtotal = products.reduce((sum, product) => sum + Number(product.salePrice ?? product.price) * quantities.get(product.id), 0);
  let coupon = null;
  if (input.couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
    const reason = couponUnavailableReason(coupon);
    if (reason) return apiError(reason, 422);
  }
  const discountAmount = calculateDiscount(coupon, subtotal);
  const deliveryCharge = 0;
  const total = Math.max(0, subtotal - discountAmount + deliveryCharge);

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const product of products) {
        const quantity = quantities.get(product.id);
        const updated = await tx.product.updateMany({ where: { id: product.id, stock: { gte: quantity }, status: "PUBLISHED" }, data: { stock: { decrement: quantity } } });
        if (updated.count !== 1) throw new Error(`STOCK:${product.name}`);
      }
      if (coupon) {
        const updated = await tx.coupon.updateMany({
          where: { id: coupon.id, isActive: true, ...(coupon.usageLimit == null ? {} : { usedCount: { lt: coupon.usageLimit } }) },
          data: { usedCount: { increment: 1 } },
        });
        if (updated.count !== 1) throw new Error("COUPON_LIMIT");
      }
      return tx.order.create({
        data: {
          orderNumber: `GC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
          customerId: session.sub,
          addressId: address.id,
          paymentMethod: input.paymentMethod,
          subtotal,
          discountAmount,
          deliveryCharge,
          total,
          notes: input.notes || null,
          couponId: coupon?.id || null,
          items: { create: products.map((product) => ({ productId: product.id, productName: product.name, quantity: quantities.get(product.id), unitPrice: Number(product.salePrice ?? product.price) })) },
          history: { create: { status: "PENDING", note: "Order placed" } },
        },
        include: { items: true, address: true },
      });
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error.message?.startsWith("STOCK:")) return apiError(`${error.message.slice(6)} does not have enough stock`, 409);
    if (error.message === "COUPON_LIMIT") return apiError("Coupon usage limit has been reached", 409);
    console.error("Place order error:", error);
    return apiError("Order could not be placed", 500);
  }
}
