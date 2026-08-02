import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { apiError, parseJson, serverError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { authRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request) {
  const rate = authRateLimit(request, "login");
  if (!rate.allowed) {
    return apiError("Too many login attempts. Please try again in a minute.", 429, undefined, {
      "Retry-After": String(rate.retryAfter),
    });
  }

  try {
    const body = await parseJson(request);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!email || !password) return apiError("Email and password are required", 400);

    const user = await prisma.user.findUnique({ where: { email } });
    const validPassword = user?.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false;
    if (!user || !validPassword) return apiError("Invalid email or password", 401);
    if (!user.isActive) return apiError("Account is disabled. Please contact support.", 403);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(user);
    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return serverError("Login error", error, "An unexpected error occurred during login");
  }
}
