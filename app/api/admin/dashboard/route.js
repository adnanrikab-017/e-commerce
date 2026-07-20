import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const number = (value) => Number(value || 0);

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayOrders, monthRevenue, pendingOrders, deliveredOrders, cancelledOrders, lowStockProducts, recentCustomers, topSellingProducts] = await Promise.all([
    prisma.order.aggregate({ where: { createdAt: { gte: today } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { createdAt: { gte: monthStart }, status: "DELIVERED" }, _sum: { total: true } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PACKED"] } } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.product.findMany({ where: { stock: { lte: 5 }, status: { not: "HIDDEN" } }, select: { id: true, name: true, stock: true }, take: 5, orderBy: { stock: "asc" } }),
    prisma.user.findMany({ where: { role: "CUSTOMER" }, select: { id: true, name: true, phone: true, createdAt: true }, take: 5, orderBy: { createdAt: "desc" } }),
    prisma.orderItem.groupBy({ by: ["productId"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
  ]);
  const products = topSellingProducts.length ? await prisma.product.findMany({ where: { id: { in: topSellingProducts.map((item) => item.productId) } }, select: { id: true, name: true } }) : [];
  const productNames = new Map(products.map((product) => [product.id, product.name]));
  return NextResponse.json({
    todaySales: number(todayOrders._sum.total), todayOrders: todayOrders._count, monthlyRevenue: number(monthRevenue._sum.total), pendingOrders, deliveredOrders, cancelledOrders,
    lowStockProducts, recentCustomers,
    topSellingProducts: topSellingProducts.map((item) => ({ name: productNames.get(item.productId) || "Deleted product", quantity: item._sum.quantity || 0 })),
  });
}
