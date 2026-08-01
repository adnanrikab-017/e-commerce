import { NextResponse } from "next/server";

export function apiError(message, status = 400, details) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export function serverError(context, error, fallbackMessage) {
  console.error(`${context}:`, error);

  let message = fallbackMessage;
  let status = 500;
  if (error?.name === "PrismaClientInitializationError" || error?.code === "P1001") {
    message = "Database is currently unavailable";
    status = 503;
  } else if (error?.code === "P2021" || error?.code === "P2022") {
    message = "Database schema is out of date. Apply the latest Prisma migrations";
    status = 503;
  }

  const details = process.env.NODE_ENV === "development"
    ? { debug: error?.message || String(error), code: error?.code || undefined }
    : undefined;
  return apiError(message, status, details);
}

export function parseJson(request) {
  return request.json().catch(() => null);
}

export function decimalToNumber(value) {
  return value == null ? null : Number(value);
}

export function serializeProduct(product) {
  return {
    ...product,
    price: decimalToNumber(product.price),
    salePrice: decimalToNumber(product.salePrice),
    images: (product.images || []).map((image) =>
      typeof image === "string" ? image : image.url
    ),
    rating: (product.reviews || []).map((review) => ({
      rating: review.rating,
      review: review.comment || "",
      createdAt: review.createdAt,
      user: review.user || { name: "Customer", image: null },
    })),
  };
}

export function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
