import { prisma } from "@/lib/prisma";

export const PAYMENT_SETTINGS_KEY = "payment_accounts";
export const DEFAULT_PAYMENT_SETTINGS = {
  BKASH: { number: "", enabled: false },
  NAGAD: { number: "", enabled: false },
};

function normalizeEntry(entry) {
  const number = typeof entry?.number === "string" ? entry.number.trim() : "";
  return { number, enabled: Boolean(entry?.enabled && number) };
}

export function normalizePaymentSettings(value) {
  return { BKASH: normalizeEntry(value?.BKASH), NAGAD: normalizeEntry(value?.NAGAD) };
}

export async function getPaymentSettings(client = prisma) {
  const setting = await client.websiteSetting.findUnique({
    where: { key: PAYMENT_SETTINGS_KEY },
    select: { value: true },
  });
  return normalizePaymentSettings(setting?.value || DEFAULT_PAYMENT_SETTINGS);
}
