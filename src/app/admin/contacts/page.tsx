"use client";
import { useEffect, useState } from "react";
import { Mail, Phone, Package, Check, Inbox } from "lucide-react";
import Pagination from "@/components/Pagination";

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  content?: string;
  productName?: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "reset_password">("all");

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    let q = "";
    if (filter === "unread") q = "?isRead=false";
    else if (filter === "reset_password") q = "?search=CẤP LẠI MẬT KHẨU"; // Will search name, email, phone (wait, API search doesn't search productName or content!)
    
    // Actually, we can fetch all and filter locally for reset_password if backend doesn't support searching by productName.
    // Let's filter locally for this specific tab.
    
    setLoading(true);
    fetch(`/api/contacts${filter === "unread" ? "?isRead=false" : ""}`)
      .then(r => r.json())
      .then(d => { 
        let data = d.data?.contacts || [];
        if (filter === "reset_password") {
           data = data.filter((c: Contact) => c.productName === "YÊU CẦU CẤP LẠI MẬT KHẨU");
        }
        setContacts(data); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [filter]);

  const markRead = async (id: string) => {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    setContacts(prev => prev.map(c => c.id === id ? { ...c, isRead: true } : c));
  };

  const totalPages = Math.ceil(contacts.length / ITEMS_PER_PAGE);
  const paginatedContacts = contacts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tin nhắn liên hệ</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contacts.length} tin nhắn</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "unread", "reset_password"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab
                ? "bg-green-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab === "all" ? "Tất cả" : tab === "unread" ? "Chưa đọc" : "Khôi phục mật khẩu"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
            <Inbox size={48} className="mx-auto mb-3 text-gray-200" />
            <p>Chưa có tin nhắn nào</p>
          </div>
        ) : (
          paginatedContacts.map(c => (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-sm ${
                c.isRead ? "border-gray-100" : "border-green-200 bg-green-50/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    {!c.isRead && (
                      <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">MỚI</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                    {c.phone && (
                      <span className="flex items-center gap-1.5"><Phone size={13} /> {c.phone}</span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1.5"><Mail size={13} /> {c.email}</span>
                    )}
                    {c.productName && (
                      <span className="flex items-center gap-1.5 text-blue-600"><Package size={13} /> {c.productName}</span>
                    )}
                  </div>
                  {c.content && (
                    <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                      {c.content}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleString("vi-VN")}
                  </span>
                  {!c.isRead && (
                    <button
                      onClick={() => markRead(c.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      <Check size={12} /> Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
