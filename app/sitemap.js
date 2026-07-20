import { prisma } from "@/lib/prisma";

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const products = await prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } });
  return [{ url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 }, { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 }, ...products.map((product) => ({ url: `${baseUrl}/product/${product.slug}`, lastModified: product.updatedAt, changeFrequency: "weekly", priority: 0.8 }))];
}
