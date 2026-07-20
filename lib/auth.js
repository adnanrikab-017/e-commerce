import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "gocart_session";
function getSecret() { if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters."); return new TextEncoder().encode(process.env.AUTH_SECRET); }

export async function createSession(user) {
  const token = await new SignJWT({ role: user.role }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("7d").sign(getSecret());
  (await cookies()).set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800 });
}
export async function getSession() { const token = (await cookies()).get(COOKIE_NAME)?.value; if (!token) return null; try { return (await jwtVerify(token, getSecret())).payload; } catch { return null; } }
export async function requireAdmin() { const session = await getSession(); return session?.role === "ADMIN" ? session : null; }
