"use client";

import { useState, useEffect } from "react";
import { User, MessageCircle, Loader2, Send } from "lucide-react";
import { toast } from "react-hot-toast";

interface Comment {
  id: string;
  author: string;
  avatarUrl?: string;
  content: string;
  likes: number;
  createdAt: string;
}

interface PostCommentsProps {
  postId: string;
  user?: any;
}

type SortType = "newest" | "oldest" | "most_likes";

export default function PostComments({ postId, user }: PostCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<SortType>("newest");
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const take = 5;

  const [newAuthor, setNewAuthor] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load liked comments from localStorage on mount
    const savedLikes = localStorage.getItem("liked_comments");
    if (savedLikes) {
      try {
        setLikedComments(JSON.parse(savedLikes));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    setSkip(0);
    fetchComments(0, true, sort);
  }, [postId, sort]);

  const fetchComments = async (currentSkip: number, isInitial: boolean = false, currentSort: SortType = sort) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const res = await fetch(`/api/posts/${postId}/comments?skip=${currentSkip}&take=${take}&sort=${currentSort}`);
      const data = await res.json();

      if (res.ok) {
        if (isInitial) {
          setComments(data.data || []);
        } else {
          setComments((prev) => [...prev, ...(data.data || [])]);
        }
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Lỗi fetch comments:", error);
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextSkip = skip + take;
    setSkip(nextSkip);
    fetchComments(nextSkip);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newContent.trim()) {
      toast.error("Vui lòng nhập tên và nội dung bình luận.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          author: newAuthor, 
          content: newContent,
          avatarUrl: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");

      toast.success("Đã gửi bình luận!");
      setNewContent("");
      
      // Reload from start to show new comment at top
      setSkip(0);
      fetchComments(0, true);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (likedComments[commentId]) return;

    // Optimistic update
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c));
    const newLiked = { ...likedComments, [commentId]: true };
    setLikedComments(newLiked);
    localStorage.setItem("liked_comments", JSON.stringify(newLiked));

    try {
      await fetch(`/api/posts/${postId}/comments/${commentId}/like`, { method: "PATCH" });
    } catch (error) {
      console.error("Lỗi khi like:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-gray-100 pb-4 gap-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MessageCircle size={22} className="text-[#00a651]" /> 
          Bình luận ({total})
        </h3>
        
        {total > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 hidden sm:inline">Sắp xếp:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a651]/30 text-[14px]"
            >
              <option value="newest">Mới nhất</option>
              <option value="most_likes">Nhiều tim nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
          </div>
        )}
      </div>

      {/* Form thêm bình luận hoặc yêu cầu đăng nhập */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <User size={20} className="text-[#00a651]" />
            </div>
            <div>
              <div className="font-bold text-gray-800 text-sm">Bình luận dưới tên:</div>
              <div className="text-[#00a651] font-medium">{newAuthor}</div>
            </div>
          </div>
          <div>
            <textarea
              placeholder="Viết bình luận của bạn..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00a651]/30 focus:border-[#00a651] text-[14px] resize-none"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-[#00a651] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#009040] transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Gửi bình luận
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center gap-3">
          <div className="text-gray-500 font-medium">Vui lòng đăng nhập để bình luận về bài viết này.</div>
          <a
            href={`/auth/login?redirect=/bai-viet`}
            className="bg-[#00a651] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#009040] transition-colors text-sm"
          >
            Đăng nhập ngay
          </a>
        </div>
      )}

      {/* Danh sách bình luận */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={32} className="animate-spin text-[#00a651]" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                {comment.avatarUrl ? (
                  <img src={comment.avatarUrl} alt={comment.author} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-[#00a651]" />
                )}
              </div>
              <div className="flex-1">
                <div className="bg-gray-50/50 rounded-xl rounded-tl-none p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800">{comment.author}</span>
                    <span className="text-[12px] text-gray-500">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-[15px] text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
                
                {/* Nút Thích */}
                <div className="mt-2 ml-2 flex items-center gap-4">
                  <button
                    onClick={() => handleLike(comment.id)}
                    className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
                      likedComments[comment.id] ? "text-red-500" : "text-gray-500 hover:text-red-500"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={likedComments[comment.id] ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                    <span>{comment.likes || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {comments.length < total && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {loadingMore && <Loader2 size={16} className="animate-spin" />}
                Tải thêm bình luận cũ
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 italic">
          Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
        </div>
      )}
    </div>
  );
}
