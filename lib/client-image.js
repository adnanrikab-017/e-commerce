export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function loadBrowserImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function cropAndCompressImage(file, options = {}) {
  const { width = 1200, height = 1200, zoom = 1, offsetX = 0, offsetY = 0, quality = 0.82 } = options;
  const image = await loadBrowserImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Your browser cannot process this image");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  const baseScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const scale = baseScale * zoom;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const availableX = Math.max(0, (drawWidth - width) / 2);
  const availableY = Math.max(0, (drawHeight - height) / 2);
  const x = (width - drawWidth) / 2 + (offsetX / 100) * availableX;
  const y = (height - drawHeight) / 2 + (offsetY / 100) * availableY;
  context.drawImage(image, x, y, drawWidth, drawHeight);
  const type = file.type === "image/png" && file.size < 700_000 ? "image/png" : "image/webp";
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  if (!blob) throw new Error("Image processing failed");
  const extension = type === "image/png" ? "png" : "webp";
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${extension}`, { type, lastModified: Date.now() });
}
