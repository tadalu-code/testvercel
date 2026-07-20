"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

interface Topic { id: string; name: string; }

export default function CreatePostPage() {
  const router = useRouter();
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({
    title: "",
    slug: "",
    shortDescription: "",
    content: "",
    thumbnail: "",
    topicId: "",
    isPublished: true,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((d) => {
        const tps = Array.isArray(d) ? d : (d.data?.topics || d.data || []);
        setTopics(tps);
      })
      .catch((err) => console.error("Failed to load topics:", err));
  }, []);

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    setForm(prev => ({
      ...prev,
      title,
      slug,
      metaTitle: prev.metaTitle || title,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const fileExt = file.name.split('.').pop();
    const fileName = Math.random().toString(36).substring(2) + "_" + Date.now() + "." + fileExt;
    const filePath = "posts/" + fileName;

    try {
      const { error: uploadError } = await supabaseClient.storage
        .from('posts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseClient.storage
        .from('posts')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, thumbnail: publicUrl }));
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Lỗi tải ảnh lên: " + (err.message || "Kiểm tra lại quyền (Policy)."));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Lỗi tạo bài viết");
      setLoading(false);
      return;
    }

    router.push("/admin/posts");
    router.refresh();
  };

  const editorConfig = {
    readonly: false,
    placeholder: "Viết nội dung bài viết...",
    height: 600,
    language: "vi",
  };

  return (
    <div className="max-w-4xl space-y-5 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/posts" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tạo bài viết mới</h1>
          <p className="text-sm text-gray-500">Soạn thảo nội dung bài viết</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 shadow-sm">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiêu đề bài viết *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slug (URL)</label>
            <input
              type="text"
              value={form.slug}
              readOnly
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Chuyên mục</label>
          <select
            value={form.topicId}
            onChange={(e) => setForm({ ...form, topicId: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">-- Chọn chuyên mục --</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả ngắn</label>
          <textarea
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nội dung bài viết</label>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden [&_.jodit-container]:border-none">
            <JoditEditor
              value={form.content}
              config={editorConfig}
              onBlur={(newContent) => setForm({ ...form, content: newContent })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ảnh đại diện (Thumbnail)</label>
          <div className="flex flex-col gap-3">
            <div className="flex gap-4 items-center">
              {form.thumbnail && (
                <img src={form.thumbnail} alt="Thumbnail" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
              )}
              <label className="relative inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading ? <Loader2 size={16} className="animate-spin text-purple-600" /> : <Upload size={16} className="text-gray-500" />}
                {uploading ? "Đang tải..." : "Chọn ảnh tải lên"}
              </label>
            </div>
            
            <input
              type="text"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              placeholder="Hoặc dán link trực tiếp vào đây..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono mt-2"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublished"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            className="w-4 h-4 accent-purple-600"
          />
          <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
            Hiển thị trên website
          </label>
        </div>

        {/* === KHỐI SEO === */}
        <div className="border-t border-gray-100 pt-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">SEO</span>
            <p className="text-xs text-gray-400">Tối ưu hoá hiển thị trên Google & mạng xã hội</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">Tiêu đề SEO (Meta Title)</label>
              <span className={`text-xs font-mono ${
                form.metaTitle.length > 60 ? "text-red-500" :
                form.metaTitle.length >= 40 ? "text-purple-600" : "text-gray-400"
              }`}>{form.metaTitle.length}/60</span>
            </div>
            <input
              type="text"
              value={form.metaTitle}
              onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
              placeholder="Ví dụ: 5 lưu ý khi sử dụng thuốc trừ sâu an toàn"
              maxLength={80}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-400 mt-1">Nên từ 40–60 ký tự. Để trống thì dùng tiêu đề bài viết.</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">Mô tả SEO (Meta Description)</label>
              <span className={`text-xs font-mono ${
                form.metaDescription.length > 160 ? "text-red-500" :
                form.metaDescription.length >= 100 ? "text-purple-600" : "text-gray-400"
              }`}>{form.metaDescription.length}/160</span>
            </div>
            <textarea
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              rows={3}
              placeholder="Mô tả ngắn gọn nội dung bài viết, hiển thị dưới tiêu đề trên Google..."
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Nên từ 100–160 ký tự. Để trống thì dùng mô tả ngắn.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Từ khoá (Keywords)</label>
            <input
              type="text"
              value={form.metaKeywords}
              onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
              placeholder="nông nghiệp, thuốc bảo vệ thực vật, kỹ thuật trồng trật..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-400 mt-1">Các từ khoá cách nhau bằng dấu phẩy.</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-60"
          >
            <Save size={16} />
            {loading ? "Đang tạo..." : "Tạo bài viết"}
          </button>
          <Link href="/admin/posts" className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Huỷ
          </Link>
        </div>
      </form>
    </div>
  );
}
