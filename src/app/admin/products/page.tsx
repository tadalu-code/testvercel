"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, PackageSearch } from "lucide-react";
import Pagination from "@/components/Pagination";
import { createClient } from "@/utils/supabase/client";

interface Category { id: string; name: string; }

interface Product {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  imagesUrl: string[] | string;
  price: number;
  salePrice: number;
  stock: number;
  category?: { name: string; id: string } | null;
  categoryId?: string;
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [userRole, setUserRole] = useState("admin");

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory, filterDate]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserRole(data.user.user_metadata?.role || "admin");
      }
    });

    // Fetch categories for filter dropdown
    fetch("/api/categories")
      .then(r => r.json())
      .then(d => {
        const cats = Array.isArray(d) ? d : (d.data?.categories || d.data || []);
        setCategories(cats);
      })
      .catch(console.error);

    // Fetch products
    fetch("/api/products?limit=100")
      .then(r => r.json())
      .then(d => { setProducts(d.data?.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xoá sản phẩm "${name}"?`)) return;
    setDeleting(id);
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory ? (p.categoryId === filterCategory || p.category?.id === filterCategory) : true;
    
    // YYYY-MM-DD
    const matchDate = filterDate ? p.createdAt.startsWith(filterDate) : true;

    return matchSearch && matchCategory && matchDate;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getThumbnail = (images: string[] | string) => {
    if (Array.isArray(images)) return images[0];
    if (typeof images === 'string' && images) return images.split('\n')[0];
    return null;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} sản phẩm</p>
        </div>
        {userRole !== "staff" && (
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Thêm sản phẩm
          </Link>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Sản phẩm</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Danh mục</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Giá / Tồn kho</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Trạng thái</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td className="px-5 py-4" colSpan={5}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-400">
                    <PackageSearch size={40} className="mx-auto mb-3 text-gray-200" />
                    <p>Không tìm thấy sản phẩm phù hợp</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map(product => {
                  const thumb = getThumbnail(product.imagesUrl);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {thumb ? (
                              <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <PackageSearch size={16} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 line-clamp-1">{product.name}</p>
                            <p className="text-xs text-gray-400">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 hidden md:table-cell">
                        {product.category?.name || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right hidden lg:table-cell">
                        <p className="font-medium text-gray-800">
                          {product.salePrice ? product.salePrice.toLocaleString("vi-VN") : (product.price ? product.price.toLocaleString("vi-VN") : "0")}đ
                        </p>
                        <p className="text-xs text-gray-400">Tồn: {product.stock}</p>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {product.isPublished ? "Hiện" : "Ẩn"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {userRole !== "staff" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/products/${product.id}/edit`} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                              <Pencil size={15} />
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              disabled={deleting === product.id}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-xs text-gray-400">Chỉ xem</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
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
