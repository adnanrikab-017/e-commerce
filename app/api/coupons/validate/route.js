import { requireAuth } from "@/lib/auth";
import { calculateDiscount, couponUnavailableReason } from "@/lib/commerce";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  if (!(await requireAuth())) return apiError("Please sign in to apply a coupon", 401);
  const body = await request.json().catch(() => null);
  const code = body?.code?.trim().toUpperCase();
  const subtotal = Number(body?.subtotal);
  if (!code || !Number.isFinite(subtotal) || subtotal < 0) return apiError("Coupon code and subtotal are required");
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  const reason = couponUnavailableReason(coupon);
  if (reason) return apiError(reason, 422);
  return NextResponse.json({ coupon: { id: coupon.id, code: coupon.code, description: coupon.description, type: coupon.type, amount: Number(coupon.amount) }, discountAmount: calculateDiscount(coupon, subtotal) });
}
