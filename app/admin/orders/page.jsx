'use client';

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { ShoppingBag, Eye, CheckCircle, Clock, Truck, PackageCheck, XCircle } from "lucide-react";

const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "৳";

const statusOptions = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

const statusColor = (status) => {
  switch (status) {
    case "DELIVERED": return "bg-green-100 text-green-800 border-green-200";
    case "SHIPPED": return "bg-blue-100 text-blue-800 border-blue-200";
    case "CONFIRMED": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "PACKED": return "bg-purple-100 text-purple-800 border-purple-200";
    case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-amber-100 text-amber-800 border-amber-200";
  }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      } else {
        toast.error(data.error || "Failed to load orders");
      }
    } catch {
      toast.error("Error loading orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Error updating status");
    }
  };

  return (
    <div className="text-slate-700 max-w-7xl mb-20">
      <div className="mb-6">
        <p className="text-sm font-medium text-green-700">Fulfillment & Operations</p>
        <h1 className="text-3xl font-semibold">Orders</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">No orders found.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{order.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{order.customer?.name || "Guest Customer"}</div>
                      <div className="text-xs text-slate-500">{order.customer?.email || order.customer?.phone || ""}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {format(new Date(order.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {currency}{Number(order.total).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(order.status)} outline-none cursor-pointer`}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-slate-600 hover:text-green-700 transition rounded hover:bg-slate-100"
                        title="View Order Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-semibold text-lg">Order #{selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <p><strong>Customer:</strong> {selectedOrder.customer?.name} ({selectedOrder.customer?.email || selectedOrder.customer?.phone})</p>
              {selectedOrder.address && (
                <p><strong>Shipping Address:</strong> {selectedOrder.address.address}, {selectedOrder.address.area}</p>
              )}
              <div className="border-t pt-3">
                <p className="font-semibold mb-2">Order Items:</p>
                <div className="divide-y max-h-48 overflow-y-auto">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="py-2 flex justify-between">
                      <span>{item.productName} × {item.quantity}</span>
                      <span className="font-medium">{currency}{(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>Total Amount:</span>
                <span className="text-green-700">{currency}{Number(selectedOrder.total).toFixed(2)}</span>
              </div>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="mt-5 w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-medium">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
