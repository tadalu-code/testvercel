"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Search, FileText, Filter } from "lucide-react";
import Pagination from "@/components/Pagination";

interface Topic { id: string; name: string; }

interface Post {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  thumbnail?: string;
  topic?: { name: string; id: string } | null;
  topicId?: string;
  createdAt: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterTopic, filterDate]);

  useEffect(() => {
    // Fetch topics for filter dropdown
    fetch("/api/topics")
      .then(r => r.json())
      .then(d => {
        const tps = Array.isArray(d) ? d : (d.data?.topics || d.data || []);
        setTopics(tps);
      })
      .catch(console.error);

    // Fetch posts
    fetch("/api/posts?limit=100")
      .then(r => r.json())
      .then(d => { setPosts(d.data?.posts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Xoá bài viết "${title}"?`)) return;
    setDeleting(id);
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setPosts(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  };

  const filtered = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchTopic = filterTopic ? (p.topicId === filterTopic || p.topic?.id === filterTopic) : true;
    
    // YYYY-MM-DD
    const matchDate = filterDate ? p.createdAt.startsWith(filterDate) : true;

    return matchSearch && matchTopic && matchDate;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bài viết</h1>
          <p className="text-sm text-gray-500 mt-0.5">{posts.length} bài viết</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Thêm bài viết
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm tiêu đề..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <select
          value={filterTopic}
          onChange={e => setFilterTopic(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Tất cả chuyên mục</option>
          {topics.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Bài viết</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden md:table-cell">Chuyên mục</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Trạng thái</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 hidden lg:table-cell">Ngày đăng</th>
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
                    <FileText size={40} className="mx-auto mb-3 text-gray-200" />
                    <p>Không tìm thấy bài viết phù hợp</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {post.thumbnail ? (
                            <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <FileText size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-1">{post.title}</p>
                          <p className="text-xs text-gray-400">{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 hidden md:table-cell">
                      {post.topic?.name || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        post.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {post.isPublished ? "Đã đăng" : "Ẩn"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs hidden lg:table-cell">
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/posts/${post.id}/edit`} className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          disabled={deleting === post.id}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={15} />
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
