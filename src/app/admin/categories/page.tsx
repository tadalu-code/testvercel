"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import Pagination from "@/components/Pagination";

interface Category { id: string; name: string; slug: string; _count?: { products: number }; createdAt: string; }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchCats = async () => {
    const res = await fetch("/api/categories");
    const d = await res.json();
    const cats = Array.isArray(d) ? d : (d.data?.categories || d.data || []);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { fetchCats(); }, []);

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    setForm({ ...form, name, slug });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", slug: "", description: "" });
      setShowForm(false);
      fetchCats();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xoá danh mục "${name}"? Các sản phẩm sẽ không bị xoá.`)) return;
    setDeleting(id);
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setCategories(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  };

  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const paginatedCategories = categories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Danh mục</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} danh mục</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-orange-100 p-5 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-800">Tạo danh mục mới</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tên danh mục *</label>
              <input
                type="text" value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                required placeholder="Thuốc trừ sâu"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Slug</label>
              <input
                type="text" value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-60">
              {saving ? "Đang lưu..." : "Tạo danh mục"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
              Huỷ
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Danh mục</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Slug</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Sản phẩm</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}><td className="px-5 py-4" colSpan={4}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : categories.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                  <Tag size={32} className="mx-auto mb-2 text-gray-200" />
                  <p>Chưa có danh mục nào</p>
                </td></tr>
              ) : (
                paginatedCategories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{cat.name}</td>
                    <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{cat.slug}</td>
                    <td className="px-5 py-3.5 text-gray-500">{cat._count?.products ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          disabled={deleting === cat.id}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="border-t border-gray-100 px-5">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
