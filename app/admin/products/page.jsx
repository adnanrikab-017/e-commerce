'use client';

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { DeleteIcon, Plus, RefreshCw, Tag, Box, DollarSign } from "lucide-react";

const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "৳";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    price: "",
    salePrice: "",
    stock: "10",
    categoryId: "",
    status: "PUBLISHED",
    imageUrl: "",
    description: "",
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setCategories(data.categories || []);
        if (data.categories?.length > 0 && !newProduct.categoryId) {
          setNewProduct((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      } else {
        toast.error(data.error || "Failed to load products");
      }
    } catch {
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");

      toast.success("Product added successfully");
      setShowAddForm(false);
      setNewProduct({
        name: "",
        sku: "",
        price: "",
        salePrice: "",
        stock: "10",
        categoryId: categories[0]?.id || "",
        status: "PUBLISHED",
        imageUrl: "",
        description: "",
      });
      fetchProducts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const nextStatus = currentStatus === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Product set to ${nextStatus}`);
        fetchProducts();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        toast.error("Failed to delete product");
      }
    } catch {
      toast.error("Error deleting product");
    }
  };

  return (
    <div className="text-slate-700 max-w-7xl mb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-green-700">Catalog Management</p>
          <h1 className="text-3xl font-semibold">Products</h1>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-sm transition cursor-pointer"
        >
          <Plus size={18} /> {showAddForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 space-y-4 max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Add New Product</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="e.g. Wireless Headphones"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">SKU</label>
              <input
                type="text"
                required
                value={newProduct.sku}
                onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                placeholder="e.g. PROD-001"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Price ({currency})</label>
              <input
                type="number"
                step="0.01"
                required
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="99.99"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Stock Quantity</label>
              <input
                type="number"
                required
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                placeholder="10"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select
                value={newProduct.categoryId}
                onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-green-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Image URL</label>
              <input
                type="url"
                value={newProduct.imageUrl}
                onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-green-500"
              />
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition cursor-pointer">
            Save Product
          </button>
        </form>
      )}

      {/* Product List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">No products found.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-800">{product.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{product.sku}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{currency}{Number(product.price).toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${product.stock > 5 ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800'}`}>
                        {product.stock} left
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{product.category?.name || "Uncategorized"}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${product.status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStatusToggle(product.id, product.status)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded transition"
                          title="Toggle Status"
                        >
                          Toggle Status
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition"
                          title="Delete Product"
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
  );
}
