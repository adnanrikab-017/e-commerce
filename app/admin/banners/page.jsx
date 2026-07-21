'use client';

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { DeleteIcon, Images } from "lucide-react";

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newBanner, setNewBanner] = useState({
    title: "",
    type: "HERO",
    imageUrl: "",
    linkUrl: "",
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/banners", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setBanners(data.banners || []);
      } else {
        toast.error(data.error || "Failed to load banners");
      }
    } catch {
      toast.error("Error loading banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleAddBanner = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBanner),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add banner");

      toast.success("Banner created successfully");
      setNewBanner({ title: "", type: "HERO", imageUrl: "", linkUrl: "" });
      fetchBanners();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleActive = async (id, currentIsActive) => {
    const nextState = !currentIsActive;
    try {
      const res = await fetch("/api/admin/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: nextState }),
      });
      if (res.ok) {
        toast.success(`Banner set to ${nextState ? "Active" : "Inactive"}`);
        fetchBanners();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Banner deleted");
        fetchBanners();
      } else {
        toast.error("Failed to delete banner");
      }
    } catch {
      toast.error("Error deleting banner");
    }
  };

  return (
    <div className="text-slate-700 max-w-6xl mb-20">
      <div className="mb-6">
        <p className="text-sm font-medium text-green-700">Marketing & Banners</p>
        <h1 className="text-3xl font-semibold">Banners</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Add Banner Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAddBanner} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Add Banner</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Banner Title (Optional)</label>
              <input
                type="text"
                value={newBanner.title}
                onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                placeholder="e.g. Summer Sale 50% Off"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select
                value={newBanner.type}
                onChange={(e) => setNewBanner({ ...newBanner, type: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-green-500"
              >
                <option value="HERO">HERO</option>
                <option value="PROMOTIONAL">PROMOTIONAL</option>
                <option value="POPUP">POPUP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Image URL</label>
              <input
                type="url"
                required
                value={newBanner.imageUrl}
                onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                placeholder="https://example.com/banner.jpg"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Link URL (Optional)</label>
              <input
                type="text"
                value={newBanner.linkUrl}
                onChange={(e) => setNewBanner({ ...newBanner, linkUrl: e.target.value })}
                placeholder="/shop"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-green-500"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition cursor-pointer">
              Create Banner
            </button>
          </form>
        </div>

        {/* Banners List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Preview</th>
                  <th className="py-3.5 px-4">Title / Link</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">Loading banners...</td>
                  </tr>
                ) : banners.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">No banners found.</td>
                  </tr>
                ) : (
                  banners.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        {b.imageUrl ? (
                          <img src={b.imageUrl} alt={b.title || "Banner"} className="w-20 h-12 object-cover rounded border border-slate-200" />
                        ) : (
                          <div className="w-20 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-400">No image</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <div>{b.title || "Untitled Banner"}</div>
                        {b.linkUrl && <div className="text-xs text-slate-400 font-mono">{b.linkUrl}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {b.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${b.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                          {b.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(b.id, b.isActive)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded transition"
                          >
                            Toggle Status
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-1 text-red-500 hover:text-red-700 transition"
                            title="Delete Banner"
                          >
                            <DeleteIcon size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
