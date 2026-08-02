import crypto from "node:crypto";
import { requireAuth } from "@/lib/auth";
import { calculateDiscount, couponUnavailableReason } from "@/lib/commerce";
import { apiError, parseJson, serverError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { orderInputSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireAuth();
  if (!session) return apiError("Unauthorized", 401);
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: session.sub },
      include: { address: true, items: { include: { review: true } }, coupon: { select: { code: true } }, history: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  } catch (error) { return serverError("Fetch customer orders error", error, "Could not load orders"); }
}

export async function POST(request) {
  const session = await requireAuth();
  if (!session) return apiError("Please sign in before checkout", 401);
  const parsed = orderInputSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError("Invalid order", 422, parsed.error.flatten());
  const input = parsed.data;
  try {
    const address = await prisma.address.findFirst({ where: { id: input.addressId, userId: session.sub } });
    if (!address) return apiError("Select a valid delivery address", 422);
    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, status: "PUBLISHED" }, include: { variants: true } });
    if (products.length !== productIds.length) return apiError("One or more products are unavailable", 409);
    const productMap = new Map(products.map((product) => [product.id, product]));
    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (product.variants.length && !item.variantId) return apiError(`Select a size for ${product.name}`, 422);
      const variant = item.variantId ? product.variants.find((entry) => entry.id === item.variantId) : null;
      if (item.variantId && (!variant || variant.isSoldOut || variant.stock < item.quantity)) return apiError(`${product.name} size is sold out or has insufficient stock`, 409);
      if (!product.variants.length && product.stock < item.quantity) return apiError(`${product.name} does not have enough stock`, 409);
    }
    const subtotal = input.items.reduce((sum, item) => { const product = productMap.get(item.productId); return sum + Number(product.salePrice ?? product.price) * item.quantity; }, 0);
    let coupon = null;
    if (input.couponCode) { coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } }); const reason = couponUnavailableReason(coupon); if (reason) return apiError(reason, 422); }
    const charge = await prisma.deliveryCharge.findUnique({ where: { zone: input.deliveryZone } });
    if (!charge?.isEnabled) return apiError("Selected delivery option is unavailable", 422);
    const now = new Date();
    const deliveryCharge = Number(charge.scheduledAt && charge.scheduledAt <= now && charge.scheduledAmount != null ? charge.scheduledAmount : charge.amount);
    const discountAmount = calculateDiscount(coupon, subtotal);
    const order = await prisma.$transaction(async (tx) => {
      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (item.variantId) {
          const locked = await tx.productVariant.updateMany({ where: { id: item.variantId, productId: item.productId, isSoldOut: false, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
          if (locked.count !== 1) throw new Error(`STOCK:${product.name}`);
        }
        const locked = await tx.product.updateMany({ where: { id: item.productId, stock: { gte: item.quantity }, status: "PUBLISHED" }, data: { stock: { decrement: item.quantity } } });
        if (locked.count !== 1) throw new Error(`STOCK:${product.name}`);
      }
      if (coupon) { const locked = await tx.coupon.updateMany({ where: { id: coupon.id, isActive: true, ...(coupon.usageLimit == null ? {} : { usedCount: { lt: coupon.usageLimit } }) }, data: { usedCount: { increment: 1 } } }); if (locked.count !== 1) throw new Error("COUPON_LIMIT"); }
      return tx.order.create({ data: {
        orderNumber: `GC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
        customerId: session.sub, addressId: address.id, paymentMethod: input.paymentMethod, deliveryZone: input.deliveryZone,
        subtotal, discountAmount, deliveryCharge, total: Math.max(0, subtotal - discountAmount + deliveryCharge), notes: input.notes || null, couponId: coupon?.id || null,
        items: { create: input.items.map((item) => { const product = productMap.get(item.productId); const variant = product.variants.find((entry) => entry.id === item.variantId); return { productId: product.id, productName: product.name, quantity: item.quantity, unitPrice: Number(product.salePrice ?? product.price), variantId: variant?.id || null, variantName: variant?.name || null }; }) },
        history: { create: { status: "PENDING", note: "Order placed" } },
      }, include: { items: true, address: true } });
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error.message?.startsWith("STOCK:")) return apiError(`${error.message.slice(6)} does not have enough stock`, 409);
    if (error.message === "COUPON_LIMIT") return apiError("Coupon usage limit has been reached", 409);
    return serverError("Place order error", error, "Order could not be placed");
  }
}
