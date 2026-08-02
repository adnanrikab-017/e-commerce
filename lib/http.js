export function apiError(message, status = 400, details, headers) {
  return Response.json(
    { success: false, message, ...(details ? { details } : {}) },
    { status, headers },
  );
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

  return apiError(message, status);
}

export class ApiRequestError extends Error {
  constructor(message, { status = 0, details, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

function firstValidationError(details) {
  const fieldErrors = details?.fieldErrors;
  return fieldErrors ? Object.values(fieldErrors).flat().find(Boolean) || null : null;
}

export async function fetchJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, { credentials: "same-origin", ...options });
  } catch (error) {
    throw new ApiRequestError("Could not reach the application server. Please try again.", { cause: error });
  }
  const text = await response.text();
  let data = {};
  if (text) {
    try { data = JSON.parse(text); }
    catch { throw new ApiRequestError("The server returned an invalid response.", { status: response.status }); }
  }
  if (!response.ok) {
    throw new ApiRequestError(
      firstValidationError(data.details) || data.message || data.error || `Request failed with HTTP ${response.status}`,
      { status: response.status, details: data.details },
    );
  }
  return data;
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
    variants: (product.variants || []).map((variant) => ({ ...variant, stock: Number(variant.stock) })),
    rating: (product.reviews || []).map((review) => ({
      rating: review.rating,
      review: review.comment || "",
      createdAt: review.createdAt,
      verifiedPurchase: Boolean(review.orderItemId),
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
