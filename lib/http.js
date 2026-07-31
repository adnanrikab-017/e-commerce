import { NextResponse } from "next/server";

export function apiError(message, status = 400, details) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
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
