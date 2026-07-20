"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";

interface Category { id: string; name: string; }

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "Tên thương mại: \nHoạt chất: \nKhối lượng tịnh: \nQui cách: ",
    technicalSpecs: "",
    imagesUrl: "",
    categoryId: "",
    isPublished: true,
    price: "",
    salePrice: "",
    stock: "0",
    unit: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((d) => {
        const cats = Array.isArray(d) ? d : (d.data?.categories || d.data || []);
        setCategories(cats);
      })
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  // Auto-generate slug từ tên, và tự điền gợi ý SEO
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    setForm(prev => ({
      ...prev,
      name,
      slug,
      metaTitle: prev.metaTitle || name,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    try {
      const { error: uploadError } = await supabaseClient.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseClient.storage
        .from('products')
        .getPublicUrl(filePath);

      setForm(prev => ({
        ...prev,
        imagesUrl: prev.imagesUrl ? prev.imagesUrl + "\n" + publicUrl : publicUrl
      }));
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Lỗi tải ảnh lên: " + (err.message || "Kiểm tra lại quyền (Policy) của bucket."));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const imagesUrl = form.imagesUrl
      ? form.imagesUrl.split("\n").map(u => u.trim()).filter(Boolean)
      : [];

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        imagesUrl,
        price: form.price ? parseFloat(form.price) : null,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        stock: parseInt(form.stock) || 0,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Lỗi tạo sản phẩm");
      setLoading(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  };

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thêm sản phẩm</h1>
          <p className="text-sm text-gray-500">Tạo sản phẩm mới</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 shadow-sm">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        {/* Tên sản phẩm */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên sản phẩm *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="Ví dụ: Thuốc trừ sâu XYZ 100ml"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slug (URL)</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        {/* Danh mục */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Danh mục</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Thông số kỹ thuật */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thông số kỹ thuật</label>
          <textarea
            value={form.technicalSpecs}
            onChange={(e) => setForm({ ...form, technicalSpecs: e.target.value })}
            rows={3}
            placeholder="Ví dụ: Thành phần ABC, Nồng độ 50%..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={5}
            placeholder="Mô tả chi tiết sản phẩm..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* URL ảnh */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Hình ảnh
          </label>
          <div className="flex flex-col gap-3">
            <label className="relative inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors self-start">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading ? (
                <Loader2 size={16} className="animate-spin text-blue-600" />
              ) : (
                <Upload size={16} className="text-gray-500" />
              )}
              {uploading ? "Đang tải ảnh lên..." : "Chọn ảnh từ máy tính"}
            </label>

            <textarea
              value={form.imagesUrl}
              onChange={(e) => setForm({ ...form, imagesUrl: e.target.value })}
              rows={3}
              placeholder="Hoặc dán link trực tiếp vào đây..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
          </div>
        </div>

        {/* Giá + Tồn kho */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá gốc (VND)</label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Ví dụ: 150000"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá khuyến mãi (VND)</label>
            <input
              type="number"
              min="0"
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              placeholder="Để trống nếu không giảm"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tồn kho</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Đơn vị</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="lít, kg, gói, chai..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Trạng thái */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublished"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            className="w-4 h-4 accent-blue-600"
          />
          <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
            Hiển thị trên website
          </label>
        </div>

        {/* === KHỐI SEO === */}
        <div className="border-t border-gray-100 pt-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full">SEO</span>
            <p className="text-xs text-gray-400">Tối ưu hoá hiển thị trên Google & mạng xã hội</p>
          </div>

          {/* SEO Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">Tiêu đề SEO (Meta Title)</label>
              <span className={`text-xs font-mono ${
                form.metaTitle.length > 60 ? "text-red-500" :
                form.metaTitle.length >= 40 ? "text-green-600" : "text-gray-400"
              }`}>{form.metaTitle.length}/60</span>
            </div>
            <input
              type="text"
              value={form.metaTitle}
              onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
              placeholder="Ví dụ: Thuốc trừ sâu XYZ - Hiệu quả cao, an toàn"
              maxLength={80}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Nên từ 40–60 ký tự. Để trống thì dùng tên sản phẩm.</p>
          </div>

          {/* SEO Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">Mô tả SEO (Meta Description)</label>
              <span className={`text-xs font-mono ${
                form.metaDescription.length > 160 ? "text-red-500" :
                form.metaDescription.length >= 100 ? "text-green-600" : "text-gray-400"
              }`}>{form.metaDescription.length}/160</span>
            </div>
            <textarea
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              rows={3}
              placeholder="Mô tả ngắn gọn về sản phẩm, hiển thị dưới tiêu đề trên Google..."
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Nên từ 100–160 ký tự. Để trống thì dùng mô tả sản phẩm.</p>
          </div>

          {/* SEO Keywords */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Từ khoá (Keywords)</label>
            <input
              type="text"
              value={form.metaKeywords}
              onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
              placeholder="thuốc trừ sâu, nông dược, bảo vệ thực vật..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Các từ khoá cách nhau bằng dấu phẩy.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <Save size={16} />
            {loading ? "Đang lưu..." : "Lưu sản phẩm"}
          </button>
          <Link href="/admin/products" className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Huỷ
          </Link>
        </div>
      </form>
    </div>
  );
}
