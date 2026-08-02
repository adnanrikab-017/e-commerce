import { requireAdmin } from "@/lib/auth";
import { apiError, serverError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await requireAdmin())) {
    return apiError("Unauthorized", 401);
  }

  try {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    return serverError("Fetch customers error", error, "Failed to fetch customers");
  }
}

export async function PATCH(request) {
  if (!(await requireAdmin())) {
    return apiError("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== "boolean") {
      return apiError("Customer ID and active status required", 400);
    }

    const user = await prisma.user.update({
      where: { id, role: "CUSTOMER" },
      data: { isActive },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    if (error?.code === "P2025") return apiError("Customer not found", 404);
    return serverError("Update customer status error", error, "Failed to update customer status");
  }
}
