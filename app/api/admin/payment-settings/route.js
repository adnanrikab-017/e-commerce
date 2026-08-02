import { requireAdmin } from "@/lib/auth";
import { apiError, parseJson, serverError } from "@/lib/http";
import { normalizePaymentSettings, PAYMENT_SETTINGS_KEY } from "@/lib/payment-settings";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("Unauthorized", 401);
  try {
    const body = await parseJson(request);
    const settings = normalizePaymentSettings(body);
    for (const method of ["BKASH", "NAGAD"]) {
      if (body?.[method]?.enabled && !settings[method].number) return apiError(`${method} number is required when enabled`, 422);
      if (settings[method].number && !/^[+0-9 -]{8,20}$/.test(settings[method].number)) return apiError(`Enter a valid ${method} number`, 422);
    }
    await prisma.$transaction([
      prisma.websiteSetting.upsert({
        where: { key: PAYMENT_SETTINGS_KEY },
        update: { value: settings },
        create: { key: PAYMENT_SETTINGS_KEY, value: settings },
      }),
      prisma.activityLog.create({
        data: { actorId: admin.sub, action: "PAYMENT_SETTINGS_UPDATED", entity: "WebsiteSetting", entityId: PAYMENT_SETTINGS_KEY },
      }),
    ]);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return serverError("Update payment settings", error, "Could not update payment settings");
  }
}
