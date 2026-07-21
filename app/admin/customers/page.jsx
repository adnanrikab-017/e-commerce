'use client';

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Users, UserCheck, UserX, ShoppingBag } from "lucide-react";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
      } else {
        toast.error(data.error || "Failed to load customers");
      }
    } catch {
      toast.error("Error loading customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleActive = async (id, currentIsActive) => {
    const nextState = !currentIsActive;
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: nextState }),
      });
      if (res.ok) {
        toast.success(`Customer ${nextState ? "activated" : "disabled"}`);
        fetchCustomers();
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
        <p className="text-sm font-medium text-green-700">Customer Management</p>
        <h1 className="text-3xl font-semibold">Customers</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Email / Phone</th>
                <th className="py-3.5 px-4">Orders</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">No registered customers found.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-800">{c.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{c.email || "—"}</div>
                      {c.phone && <div className="text-xs text-slate-400">{c.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-full text-xs">
                        <ShoppingBag size={12} /> {c._count?.orders || 0} orders
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {format(new Date(c.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {c.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(c.id, c.isActive)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                          c.isActive
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      >
                        {c.isActive ? "Disable Account" : "Enable Account"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
