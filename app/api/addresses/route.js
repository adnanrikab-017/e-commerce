import { requireAuth } from "@/lib/auth";
import { apiError, parseJson, serverError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { addressInputSchema } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Unauthorized", 401);
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: session.sub },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ addresses });
  } catch (error) {
    return serverError("Fetch addresses", error, "Could not load addresses");
  }
}

export async function POST(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Unauthorized", 401);
  const parsed = addressInputSchema.safeParse(await parseJson(request));
  if (!parsed.success) return apiError("Enter a valid address", 422, parsed.error.flatten());
  try {
    const address = await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId: session.sub } });
      const makeDefault = parsed.data.isDefault || count === 0;
      if (makeDefault) await tx.address.updateMany({ where: { userId: session.sub }, data: { isDefault: false } });
      return tx.address.create({ data: { ...parsed.data, isDefault: makeDefault, userId: session.sub } });
    }, { maxWait: 5_000, timeout: 10_000 });
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    return serverError("Create address", error, "Address could not be saved. Please try again.");
  }
}

export async function PATCH(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Unauthorized", 401);
  const body = await parseJson(request);
  const parsed = addressInputSchema.safeParse(body);
  if (!body?.id || !parsed.success) return apiError("Enter a valid address", 422, parsed.error?.flatten());
  try {
    const address = await prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({ where: { id: body.id, userId: session.sub } });
      if (!existing) return null;
      if (parsed.data.isDefault) await tx.address.updateMany({ where: { userId: session.sub }, data: { isDefault: false } });
      await tx.address.updateMany({ where: { id: body.id, userId: session.sub }, data: parsed.data });
      return tx.address.findFirst({ where: { id: body.id, userId: session.sub } });
    }, { maxWait: 5_000, timeout: 10_000 });
    if (!address) return apiError("Address not found", 404);
    return NextResponse.json({ address });
  } catch (error) {
    return serverError("Update address", error, "Address could not be updated. Please try again.");
  }
}

export async function DELETE(request) {
  const session = await requireAuth(request);
  if (!session) return apiError("Unauthorized", 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return apiError("Address not found", 404);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({ where: { id, userId: session.sub } });
      if (!existing) return "NOT_FOUND";
      if (await tx.order.count({ where: { addressId: id, customerId: session.sub } })) return "IN_USE";
      await tx.address.deleteMany({ where: { id, userId: session.sub } });
      if (existing.isDefault) {
        const replacement = await tx.address.findFirst({ where: { userId: session.sub }, orderBy: { createdAt: "desc" } });
        if (replacement) await tx.address.updateMany({ where: { id: replacement.id, userId: session.sub }, data: { isDefault: true } });
      }
      return "DELETED";
    }, { maxWait: 5_000, timeout: 10_000 });
    if (result === "NOT_FOUND") return apiError("Address not found", 404);
    if (result === "IN_USE") return apiError("This address is attached to an order and cannot be deleted", 409);
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Delete address", error, "Address could not be deleted. Please try again.");
  }
}
