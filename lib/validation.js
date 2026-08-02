import { z } from "zod";

const optionalText = (max) => z.string().trim().max(max).optional().nullable();
const money = z.coerce.number().finite().nonnegative();

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  imageUrl: z.string().url(),
  imagePublicId: z.string().trim().min(1).max(500),
  isFeatured: z.boolean().optional().default(false),
});

export const heroBannerInputSchema = z.object({
  title: optionalText(160),
  imageUrl: z.string().url(),
  imagePublicId: z.string().trim().min(1).max(500),
  mobileImageUrl: z.string().url().optional().nullable(),
  mobileImagePublicId: z.string().trim().max(500).optional().nullable(),
  mainHeading: z.string().trim().min(2).max(160),
  subHeading: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(1000),
  offerText: z.string().trim().min(1).max(120),
  secondaryText: z.string().trim().min(1).max(120),
  buttonText: z.string().trim().min(1).max(80),
  linkUrl: z.string().trim().min(1).max(500),
  position: z.coerce.number().int().nonnegative().max(9999).default(0),
  isActive: z.boolean().default(true),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  sku: z.string().trim().min(1).max(80),
  shortDescription: optionalText(500),
  description: optionalText(50000),
  specifications: z.record(z.string(), z.string().trim().max(1000)).optional().default({}),
  price: money,
  salePrice: money.optional().nullable(),
  stock: z.coerce.number().int().nonnegative(),
  variants: z.array(z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1).max(80),
    stock: z.coerce.number().int().nonnegative(),
    isSoldOut: z.boolean().optional().default(false),
  })).max(100).default([]),
  categoryId: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN", "OUT_OF_STOCK"]).default("PUBLISHED"),
  isFeatured: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(false),
  images: z.array(z.object({ url: z.string().url(), publicId: z.string().trim().min(1).max(500).optional().nullable() })).max(12).default([]),
}).superRefine((value, context) => {
  if (value.salePrice != null && value.salePrice > value.price) {
    context.addIssue({ code: "custom", path: ["salePrice"], message: "Sale price cannot exceed regular price" });
  }
  if (value.status === "PUBLISHED" && value.images.length === 0) {
    context.addIssue({ code: "custom", path: ["images"], message: "A published product needs at least one image" });
  }
});

export const addressInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(2000),
  area: z.string().trim().min(2).max(160),
  isDefault: z.boolean().optional().default(false),
});

export const couponInputSchema = z.object({
  code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()),
  description: optionalText(1000),
  type: z.enum(["FIXED", "PERCENTAGE"]),
  amount: z.coerce.number().positive(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional().default(true),
}).superRefine((value, context) => {
  if (value.type === "PERCENTAGE" && value.amount > 100) {
    context.addIssue({ code: "custom", path: ["amount"], message: "Percentage cannot exceed 100" });
  }
  if (value.expiresAt && value.startsAt && value.expiresAt <= value.startsAt) {
    context.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry must be after the start date" });
  }
});

export const orderInputSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(["COD", "BKASH", "NAGAD"]),
  couponCode: z.string().trim().optional().nullable(),
  deliveryZone: z.enum(["INSIDE_DHAKA", "OUTSIDE_DHAKA", "SPECIAL"]),
  notes: optionalText(2000),
  paymentTransactionId: z.string().trim().min(6).max(100).optional().nullable(),
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1).optional().nullable(),
    quantity: z.coerce.number().int().positive().max(99),
  })).min(1).max(100),
}).superRefine((value, context) => {
  if (value.paymentMethod !== "COD" && !value.paymentTransactionId) {
    context.addIssue({ code: "custom", path: ["paymentTransactionId"], message: "Transaction ID is required for mobile payment" });
  }
});
