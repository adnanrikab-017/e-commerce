import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "gocart_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET || "default_fallback_secret_32_characters_minimum_gocart!";
  return new TextEncoder().encode(secret);
}

export async function createSession(user) {
  const token = await new SignJWT({
    role: user.role,
    name: user.name || "",
    email: user.email || "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  });
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return (await jwtVerify(token, getSecret())).payload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAuth() {
  const session = await getSession();
  return session || null;
}

export async function requireAdmin() {
  const session = await getSession();
  return session?.role === "ADMIN" ? session : null;
}

