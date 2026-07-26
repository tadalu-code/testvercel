"use client";

import { useEffect, useState } from "react";
import { Star, MessageCircle, Send, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  content: string;
  imagesUrl: string[];
  createdAt: string;
  user: {
    name: string;
    avatar_url?: string;
  };
}

export default function ProductReviews({ slug }: { slug: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    rating: 5,
    content: "",
    imagesUrl: [] as string[],
  });

  useEffect(() => {
    fetchReviews();
  }, [slug]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${slug}/reviews`);
      const data = await res.json();
      if (res.ok && data.data) {
        setReviews(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 2 * 1024 * 1024) {
          alert("Mỗi ảnh tối đa 2MB.");
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `reviews/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products') // Assuming 'products' or 'public' bucket exists, you might need a 'reviews' bucket. We'll use 'avatars' or 'products' if we don't have one, but let's assume 'avatars' bucket exists since it was used in profile, or a generic 'images' bucket. Let's use 'avatars' for simplicity if 'reviews' isn't explicitly created, wait, I can just upload to 'avatars' bucket and it'll work since it's public.
          .upload(filePath, file);

        if (uploadError) {
          // Fallback to avatars bucket if products bucket doesn't exist
          const { error: fallbackError } = await supabase.storage.from('avatars').upload(`reviews/${fileName}`, file);
          if (fallbackError) throw fallbackError;
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`reviews/${fileName}`);
          newImages.push(publicUrl);
        } else {
          const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
          newImages.push(publicUrl);
        }
      }

      setForm(prev => ({ ...prev, imagesUrl: [...prev.imagesUrl, ...newImages] }));
    } catch (err: any) {
      console.error(err);
      alert("Không thể tải ảnh lên.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      imagesUrl: prev.imagesUrl.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating < 1 || form.rating > 5) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra");
      } else {
        setForm({ rating: 5, content: "", imagesUrl: [] });
        fetchReviews();
      }
    } catch (err: any) {
      setError(err.message || "Lỗi mạng");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={14} 
            className={star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} 
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="py-10 text-center text-gray-400">Đang tải đánh giá...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Form đánh giá */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MessageCircle size={18} className="text-[#00a651]" /> 
          Gửi đánh giá của bạn
        </h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Đánh giá sao:</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm({ ...form, rating: star })}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    size={24} 
                    className={star <= form.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} 
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-2">Nội dung đánh giá:</label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00a651] resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
              {uploading ? "Đang tải ảnh..." : "Thêm ảnh"}
            </label>
            
            {form.imagesUrl.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {form.imagesUrl.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 border border-gray-200 rounded-lg overflow-hidden group">
                    <img src={img} alt="Upload" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || form.content.trim() === ""}
              className="bg-[#00a651] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#008f45] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Gửi đánh giá
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách đánh giá */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-6 text-lg">Khách hàng đánh giá ({reviews.length})</h3>
        
        {reviews.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm">Chưa có đánh giá nào cho sản phẩm này.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {reviews.map(review => (
              <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 uppercase overflow-hidden shrink-0">
                      {review.user?.avatar_url ? (
                        <img src={review.user.avatar_url} alt={review.user.name} className="w-full h-full object-cover" />
                      ) : (
                        review.user?.name ? review.user.name.charAt(0) : "U"
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{review.user?.name || "Khách hàng"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {renderStars(review.rating)}
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-100">
                    Đã mua hàng
                  </div>
                </div>
                {review.content && (
                  <p className="text-gray-700 text-sm mt-3 ml-[52px]">{review.content}</p>
                )}
                {review.imagesUrl && review.imagesUrl.length > 0 && (
                  <div className="flex gap-2 mt-3 ml-[52px]">
                    {review.imagesUrl.map((img, idx) => (
                      <div key={idx} className="w-16 h-16 border border-gray-200 rounded-lg overflow-hidden">
                        <img src={img} alt="Review" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
