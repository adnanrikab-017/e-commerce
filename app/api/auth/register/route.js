import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { apiError, parseJson, serverError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { authRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request) {
  const rate = authRateLimit(request, "register");
  if (!rate.allowed) {
    return apiError("Too many registration attempts. Please try again in a minute.", 429, undefined, {
      "Retry-After": String(rate.retryAfter),
    });
  }

  try {
    const body = await parseJson(request);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!name) return apiError("Name is required", 400);
    if (!email || !email.includes("@")) return apiError("Valid email is required", 400);
    if (password.length < 8) return apiError("Password must be at least 8 characters long", 400);

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) return apiError("An account with this email already exists", 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "CUSTOMER" },
    });
    await createSession(user);
    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") return apiError("An account with this email already exists", 409);
    return serverError("Registration error", error, "An unexpected error occurred during registration");
  }
}
