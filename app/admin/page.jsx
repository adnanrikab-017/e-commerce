'use client';

import { CircleDollarSign, Clock3, PackageCheck, PackageX, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "৳";
const cards = [
  ["Today's sales", "todaySales", CircleDollarSign], ["Today's orders", "todayOrders", ShoppingBag],
  ["Monthly revenue", "monthlyRevenue", TrendingUp], ["Pending orders", "pendingOrders", Clock3],
  ["Delivered orders", "deliveredOrders", PackageCheck], ["Cancelled orders", "cancelledOrders", PackageX],
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch("/api/admin/dashboard", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then(setData).catch(() => setData({ error: true })); }, []);
  if (!data) return <p className="text-slate-500">Loading dashboard…</p>;
  if (data.error) return <p className="text-red-600">Dashboard data could not be loaded.</p>;
  return <div className="max-w-7xl text-slate-700"><div className="mb-8"><p className="text-sm font-medium text-green-700">Operations overview</p><h1 className="text-3xl font-semibold">Dashboard</h1></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, key, Icon]) => <div key={key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><Icon className="text-green-700" size={20}/></div><p className="mt-3 text-2xl font-semibold">{key.includes("Sales") || key.includes("Revenue") ? currency : ""}{Number(data[key]).toLocaleString()}</p></div>)}</div>
    <div className="mt-8 grid gap-6 lg:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Top-selling products</h2><div className="mt-4 divide-y">{data.topSellingProducts.length ? data.topSellingProducts.map((product) => <div key={product.name} className="flex justify-between py-3 text-sm"><span>{product.name}</span><span className="font-medium">{product.quantity} sold</span></div>) : <p className="py-4 text-sm text-slate-500">No sales yet.</p>}</div></section><section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Low stock</h2><div className="mt-4 divide-y">{data.lowStockProducts.length ? data.lowStockProducts.map((product) => <div key={product.id} className="flex justify-between py-3 text-sm"><span>{product.name}</span><span className="font-medium text-amber-700">{product.stock} left</span></div>) : <p className="py-4 text-sm text-slate-500">Stock levels look healthy.</p>}</div></section></div>
  </div>;
}
