import { serverError } from "@/lib/http";
import { getPaymentSettings } from "@/lib/payment-settings";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(
      { settings: await getPaymentSettings() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return serverError("Fetch payment settings", error, "Could not load payment methods");
  }
}
