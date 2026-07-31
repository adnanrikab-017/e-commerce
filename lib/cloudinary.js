import crypto from "node:crypto";

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary is not configured");
  return { cloudName, apiKey, apiSecret };
}

function sign(params, secret) {
  const input = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(input + secret).digest("hex");
}

export async function uploadImage(file) {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "gocart";
  const signature = sign({ folder, timestamp }, apiSecret);
  const form = new FormData();
  form.set("file", file);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("folder", folder);
  form.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Cloudinary upload failed");
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId) {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp }, apiSecret);
  const form = new FormData();
  form.set("public_id", publicId);
  form.set("api_key", apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: "POST", body: form });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Cloudinary delete failed");
  return result;
}

export function publicIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return null;
    const marker = "/upload/";
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    let path = decodeURIComponent(parsed.pathname.slice(index + marker.length));
    path = path.replace(/^v\d+\//, "").replace(/\.[a-z0-9]+$/i, "");
    return path || null;
  } catch {
    return null;
  }
}
