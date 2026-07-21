'use client';

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { DeleteIcon, Plus, LayoutPanelTop } from "lucide-react";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({
    name: "",
    imageUrl: "",
    isFeatured: false,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
      } else {
        toast.error(data.error || "Failed to load categories");
      }
    } catch {
      toast.error("Error loading categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add category");

      toast.success("Category added successfully");
      setNewCategory({ name: "", imageUrl: "", isFeatured: false });
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category deleted");
        fetchCategories();
      } else {
        toast.error("Failed to delete category");
      }
    } catch {
      toast.error("Error deleting category");
    }
  };

  return (
    <div className="text-slate-700 max-w-5xl mb-20">
      <div className="mb-6">
        <p className="text-sm font-medium text-green-700">Catalog Organization</p>
        <h1 className="text-3xl font-semibold">Categories</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Add Category Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAddCategory} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Add Category</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category Name</label>
              <input
                type="text"
                required
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g. Electronics"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Image URL (Optional)</label>
              <input
                type="url"
                value={newCategory.imageUrl}
                onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
                placeholder="https://example.com/category.jpg"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-green-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={newCategory.isFeatured}
                onChange={(e) => setNewCategory({ ...newCategory, isFeatured: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <label htmlFor="isFeatured" className="text-sm text-slate-700">Mark as Featured Category</label>
            </div>
            <button type="submit" className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition cursor-pointer">
              Add Category
            </button>
          </form>
        </div>

        {/* Category List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Products</th>
                  <th className="py-3.5 px-4">Featured</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">Loading categories...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">No categories found.</td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-800">{c.name}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{c.slug}</td>
                      <td className="py-3.5 px-4 text-slate-700">{c._count?.products || 0}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.isFeatured ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                          {c.isFeatured ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition"
                          title="Delete Category"
                        >
                          <DeleteIcon size={18} />
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
    </div>
  );
}
