import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressInputSchema } from "@/lib/validation";
import { apiError, parseJson } from "@/lib/http";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Unauthorized", 401);
  const addresses = await prisma.address.findMany({ where: { userId: session.sub }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  return NextResponse.json({ addresses });
}

export async function POST(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Unauthorized", 401);
  const parsed = addressInputSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError("Invalid address", 422, parsed.error.flatten());
  const address = await prisma.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId: session.sub } });
    const makeDefault = parsed.data.isDefault || count === 0;
    if (makeDefault) await tx.address.updateMany({ where: { userId: session.sub }, data: { isDefault: false } });
    return tx.address.create({ data: { ...parsed.data, isDefault: makeDefault, userId: session.sub } });
  });
  return NextResponse.json({ address }, { status: 201 });
}

export async function PATCH(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Unauthorized", 401);
  const body = await parseJson(request);
  const parsed = addressInputSchema.safeParse(body);
  if (!body?.id || !parsed.success) return apiError("Invalid address", 422, parsed.error?.flatten());
  const existing = await prisma.address.findFirst({ where: { id: body.id, userId: session.sub } });
  if (!existing) return apiError("Address not found", 404);
  const address = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) await tx.address.updateMany({ where: { userId: session.sub }, data: { isDefault: false } });
    const updated = await tx.address.updateMany({
      where: { id: body.id, userId: session.sub },
      data: parsed.data,
    });
    if (updated.count !== 1) throw new Error("ADDRESS_NOT_FOUND");
    return tx.address.findFirst({ where: { id: body.id, userId: session.sub } });
  });
  return NextResponse.json({ address });
}

export async function DELETE(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Unauthorized", 401);
  const id = new URL(request.url).searchParams.get("id");
  const existing = id && await prisma.address.findFirst({ where: { id, userId: session.sub } });
  if (!existing) return apiError("Address not found", 404);
  if (await prisma.order.count({ where: { addressId: id, customerId: session.sub } })) return apiError("This address is attached to an order and cannot be deleted", 409);
  await prisma.$transaction(async (tx) => {
    const deleted = await tx.address.deleteMany({ where: { id, userId: session.sub } });
    if (deleted.count !== 1) throw new Error("ADDRESS_NOT_FOUND");
    if (existing.isDefault) {
      const replacement = await tx.address.findFirst({ where: { userId: session.sub }, orderBy: { createdAt: "desc" } });
      if (replacement) await tx.address.updateMany({ where: { id: replacement.id, userId: session.sub }, data: { isDefault: true } });
    }
  });
  return NextResponse.json({ success: true });
}
