"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationDropdown({ isMobile = false }: { isMobile?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/user/notifications");
      const { data } = await res.json();
      if (data) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Auto refresh every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, linkUrl: string | null) => {
    if (linkUrl) {
      router.push(linkUrl);
    }
    setIsOpen(false);

    try {
      await fetch(`/api/user/notifications/${id}/read`, { method: "PATCH" });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/user/notifications/read-all", { method: "POST" });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:text-yellow-300 transition-colors flex items-center justify-center"
      >
        <Bell size={isMobile ? 17 : 20} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center z-10 shadow-sm border border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-3 right-[-50px] sm:right-0 w-[320px] sm:w-[350px] bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-semibold text-gray-800 text-sm">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors"
              >
                <CheckCheck size={14} /> Đánh dấu đã đọc
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="py-10 flex justify-center text-gray-400">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center">
                <Bell size={32} className="text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">Bạn chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id, notif.linkUrl)}
                    className={`text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-2 font-medium">
                          {formatTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
