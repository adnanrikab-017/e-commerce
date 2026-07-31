import { requireAdmin } from "@/lib/auth";
import { apiError, parseJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { couponInputSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const coupons = await prisma.coupon.findMany({ orderBy: { startsAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const parsed = couponInputSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError("Invalid coupon", 422, parsed.error.flatten());
  try {
    const coupon = await prisma.coupon.create({ data: parsed.data });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") return apiError("Coupon code already exists", 409);
    console.error("Create coupon error:", error);
    return apiError("Failed to create coupon", 500);
  }
}

export async function PATCH(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const body = await parseJson(request);
  if (!body?.id || typeof body.isActive !== "boolean") return apiError("Coupon ID and active status are required");
  const coupon = await prisma.coupon.update({ where: { id: body.id }, data: { isActive: body.isActive } });
  return NextResponse.json({ coupon });
}

export async function DELETE(request) {
  if (!(await requireAdmin())) return apiError("Unauthorized", 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return apiError("Coupon ID is required");
  if (await prisma.order.count({ where: { couponId: id } })) return apiError("Used coupons must be disabled instead of deleted", 409);
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
