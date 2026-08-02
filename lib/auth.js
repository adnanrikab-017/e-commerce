import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "token";
const JWT_ALGORITHM = "HS256";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 bytes");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(user) {
  if (!user?.id) throw new TypeError("A user ID is required to sign a token");
  return new SignJWT({
    role: user.role,
    name: user.name || "",
    email: user.email || "",
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const { payload, protectedHeader } = await jwtVerify(token, getSecretKey(), {
      algorithms: [JWT_ALGORITHM],
    });
    if (protectedHeader.alg !== JWT_ALGORITHM || !payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

function bearerToken(request) {
  const authorization = request?.headers?.get?.("authorization");
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] || null;
}

export async function getAuthUser(request) {
  const token = request?.cookies?.get?.(AUTH_COOKIE_NAME)?.value || bearerToken(request);
  return verifyToken(token);
}

export async function createSession(user) {
  const token = await signToken(user);
  (await cookies()).set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return token;
}

export async function getSession() {
  return verifyToken((await cookies()).get(AUTH_COOKIE_NAME)?.value);
}

export async function deleteSession() {
  (await cookies()).set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAuth(request) {
  return request ? getAuthUser(request) : getSession();
}

export async function requireAdmin(request) {
  const session = await requireAuth(request);
  return session?.role === "ADMIN" ? session : null;
}

export async function authorizeAdmin(request) {
  const session = await requireAuth(request);
  if (!session) return { error: "Authentication required", status: 401 };
  if (session.role !== "ADMIN") return { error: "Administrator access required", status: 403 };
  return { session };
}
