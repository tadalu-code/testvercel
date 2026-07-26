"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

interface Topic { id: string; name: string; }

export default function EditPostPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
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

    if (id) {
      fetch(`/api/posts/${id}`)
        .then(res => res.json())
        .then(res => {
          if (res.data) {
            const p = res.data;
            setForm({
              title: p.title || "",
              slug: p.slug || "",
              shortDescription: p.shortDescription || "",
              content: p.content || "",
              thumbnail: p.thumbnail || "",
              topicId: p.topicId || "",
              isPublished: p.isPublished ?? true,
              metaTitle: p.metaTitle || "",
              metaDescription: p.metaDescription || "",
              metaKeywords: p.metaKeywords || "",
            });
          }
        })
        .catch(err => {
          console.error("Failed to load post:", err);
          setError("Không tải được dữ liệu bài viết.");
        })
        .finally(() => setFetching(false));
    }
  }, [id]);

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    setForm({ ...form, title, slug });
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

    const res = await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Lỗi cập nhật bài viết");
      setLoading(false);
      return;
    }

    router.push("/admin/posts");
    router.refresh();
  };

  if (fetching) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;
  }

  const editorConfig = {
    readonly: false,
    placeholder: "Viết nội dung bài viết...",
    height: 600,
    language: "vi",
  };

  return (
    <div className="max-w-6xl space-y-5 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/posts" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cập nhật bài viết</h1>
          <p className="text-sm text-gray-500">Chỉnh sửa nội dung</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
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



        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            <Save size={16} />
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <Link href="/admin/posts" className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            Huỷ
          </Link>
        </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Ảnh đại diện (Thumbnail)</h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-4">
                {form.thumbnail && (
                  <img src={form.thumbnail} alt="Thumbnail" className="w-full aspect-video object-cover rounded-xl border border-gray-200 bg-gray-50" />
                )}
                <label className="relative inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer self-start">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <Upload size={16} className="text-gray-500" />}
                  {uploading ? "Đang tải..." : "Chọn ảnh tải lên"}
                </label>
              </div>
              
              <input
                type="text"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="Hoặc dán link trực tiếp vào đây..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full">SEO</span>
              <p className="text-xs text-gray-400">Tối ưu hoá trên Google</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Tiêu đề (Meta Title)</label>
                <span className={`text-xs font-mono ${
                  form.metaTitle.length > 60 ? "text-red-500" :
                  form.metaTitle.length >= 40 ? "text-green-600" : "text-gray-400"
                }`}>{form.metaTitle.length}/60</span>
              </div>
              <input
                type="text"
                value={form.metaTitle}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                placeholder="Ví dụ: 5 lưu ý khi sử dụng..."
                maxLength={80}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Mô tả (Meta Description)</label>
                <span className={`text-xs font-mono ${
                  form.metaDescription.length > 160 ? "text-red-500" :
                  form.metaDescription.length >= 100 ? "text-green-600" : "text-gray-400"
                }`}>{form.metaDescription.length}/160</span>
              </div>
              <textarea
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                rows={4}
                placeholder="Mô tả ngắn gọn nội dung bài viết..."
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Từ khoá (Keywords)</label>
              <input
                type="text"
                value={form.metaKeywords}
                onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
                placeholder="nông nghiệp, kỹ thuật..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
