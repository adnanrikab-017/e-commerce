import crypto from "node:crypto";
import { requireAuth } from "@/lib/auth";
import { calculateDiscount, couponUnavailableReason } from "@/lib/commerce";
import { apiError, parseJson, serverError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getPaymentSettings } from "@/lib/payment-settings";
import { orderInputSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

class CheckoutError extends Error {
  constructor(code, message, status = 409) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function GET(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Authentication required", 401);
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: session.sub },
      include: {
        address: true,
        items: { include: { review: true } },
        coupon: { select: { code: true } },
        history: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  } catch (error) {
    return serverError("Fetch customer orders error", error, "Could not load orders");
  }
}

export async function POST(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Please sign in before checkout", 401);
  const parsed = orderInputSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError("Invalid order", 422, parsed.error.flatten());
  const input = parsed.data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: { id: input.addressId, userId: session.sub },
        select: { id: true },
      });
      if (!address) throw new CheckoutError("ADDRESS", "Select a valid delivery address", 422);

      let paymentAccount = null;
      let paymentTransactionId = null;
      if (input.paymentMethod !== "COD") {
        const paymentSettings = await getPaymentSettings(tx);
        const paymentOption = paymentSettings[input.paymentMethod];
        if (!paymentOption?.enabled || !paymentOption.number) {
          throw new CheckoutError("PAYMENT", `${input.paymentMethod} payment is currently unavailable`, 422);
        }
        paymentAccount = paymentOption.number;
        paymentTransactionId = input.paymentTransactionId.trim();
      }

      const productIds = [...new Set(input.items.map((item) => item.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, status: "PUBLISHED" },
        include: { variants: true },
      });
      if (products.length !== productIds.length) {
        throw new CheckoutError("PRODUCT", "One or more products are unavailable");
      }
      const productMap = new Map(products.map((product) => [product.id, product]));

      let subtotal = 0;
      for (const item of input.items) {
        const product = productMap.get(item.productId);
        const variant = item.variantId
          ? product.variants.find((entry) => entry.id === item.variantId)
          : null;
        if (product.variants.length && !item.variantId) {
          throw new CheckoutError("VARIANT", `Select a size for ${product.name}`, 422);
        }
        if (item.variantId && (!variant || variant.isSoldOut)) {
          throw new CheckoutError("STOCK", `${product.name} size is unavailable`);
        }

        if (variant) {
          const variantUpdate = await tx.productVariant.updateMany({
            where: {
              id: variant.id,
              productId: product.id,
              isSoldOut: false,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });
          if (variantUpdate.count !== 1) {
            throw new CheckoutError("STOCK", `${product.name} size does not have enough stock`);
          }
        }

        const productUpdate = await tx.product.updateMany({
          where: { id: product.id, status: "PUBLISHED", stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (productUpdate.count !== 1) {
          throw new CheckoutError("STOCK", `${product.name} does not have enough stock`);
        }
        subtotal += Number(product.salePrice ?? product.price) * item.quantity;
      }

      let coupon = null;
      if (input.couponCode) {
        coupon = await tx.coupon.findUnique({
          where: { code: input.couponCode.toUpperCase() },
        });
        const reason = couponUnavailableReason(coupon);
        if (reason) throw new CheckoutError("COUPON", reason, 422);
        const couponUpdate = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            isActive: true,
            ...(coupon.usageLimit == null ? {} : { usedCount: { lt: coupon.usageLimit } }),
          },
          data: { usedCount: { increment: 1 } },
        });
        if (couponUpdate.count !== 1) {
          throw new CheckoutError("COUPON", "Coupon usage limit has been reached");
        }
      }

      const charge = await tx.deliveryCharge.findUnique({ where: { zone: input.deliveryZone } });
      if (!charge?.isEnabled) {
        throw new CheckoutError("DELIVERY", "Selected delivery option is unavailable", 422);
      }
      const now = new Date();
      const deliveryCharge = Number(
        charge.scheduledAt && charge.scheduledAt <= now && charge.scheduledAmount != null
          ? charge.scheduledAmount
          : charge.amount,
      );
      const discountAmount = calculateDiscount(coupon, subtotal);

      return tx.order.create({
        data: {
          orderNumber: `GC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
          customerId: session.sub,
          addressId: address.id,
          paymentMethod: input.paymentMethod,
          paymentAccount,
          paymentTransactionId,
          deliveryZone: input.deliveryZone,
          subtotal,
          discountAmount,
          deliveryCharge,
          total: Math.max(0, subtotal - discountAmount + deliveryCharge),
          notes: input.notes || null,
          couponId: coupon?.id || null,
          items: {
            create: input.items.map((item) => {
              const product = productMap.get(item.productId);
              const variant = product.variants.find((entry) => entry.id === item.variantId);
              return {
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: Number(product.salePrice ?? product.price),
                variantId: variant?.id || null,
                variantName: variant?.name || null,
              };
            }),
          },
          history: { create: { status: "PENDING", note: "Order placed" } },
        },
        include: { items: true, address: true },
      });
    }, { maxWait: 5_000, timeout: 15_000 });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutError) return apiError(error.message, error.status);
    if (error?.code === "P2002" && error?.meta?.target?.includes?.("paymentTransactionId")) {
      return apiError("This transaction ID has already been used", 409);
    }
    return serverError("Place order error", error, "Order could not be placed");
  }
}
