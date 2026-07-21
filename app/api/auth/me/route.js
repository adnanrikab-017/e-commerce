import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: session.sub,
        role: session.role,
        name: session.name || "",
        email: session.email || "",
      },
    });
  } catch (error) {
    console.error("Auth me check error:", error);
    return NextResponse.json({ user: null });
  }
}
