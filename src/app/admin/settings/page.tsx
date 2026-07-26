"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Settings, User, Monitor, Moon, Sun, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("appearance");
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Cancel reasons state
  const [cancelReasons, setCancelReasons] = useState<any[]>([]);
  const [newReason, setNewReason] = useState("");
  const [loadingReasons, setLoadingReasons] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchReasons = async () => {
    try {
      setLoadingReasons(true);
      const res = await fetch("/api/cancel-reasons");
      const data = await res.json();
      if (data.data) {
        setCancelReasons(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReasons(false);
    }
  };

  useEffect(() => {
    fetchReasons();
  }, []);

  const handleAddReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) return;
    try {
      const res = await fetch("/api/cancel-reasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newReason })
      });
      if (res.ok) {
        setNewReason("");
        fetchReasons();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReason = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lý do này?")) return;
    try {
      const res = await fetch(`/api/cancel-reasons/${id}`, { method: "DELETE" });
      if (res.ok) fetchReasons();
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: "appearance", label: "Giao diện", icon: Monitor },
    { id: "account", label: "Tài khoản", icon: User },
    { id: "system", label: "Hệ thống", icon: Settings },
    { id: "cancel-reasons", label: "Lý do hủy đơn", icon: Settings },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toast Notification */}
      <div
        className={`fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all duration-300 transform ${
          showToast ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
        } z-50`}
      >
        <CheckCircle2 size={20} />
        <span className="font-medium text-sm">Lưu cài đặt thành công!</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cài đặt</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Quản lý giao diện, tài khoản và thông tin hệ thống
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Tabs Header */}
        <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? "border-green-500 text-green-600 dark:text-green-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {/* TAB: GIAO DIỆN */}
          {activeTab === "appearance" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Giao diện hiển thị
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                  Tùy chỉnh cách Admin Dashboard hiển thị trên thiết bị của bạn.
                </p>
                
                {mounted && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Light Mode */}
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        theme === "light"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                        <Sun size={24} />
                      </div>
                      <span className={`font-medium ${theme === "light" ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>
                        Sáng (Light)
                      </span>
                    </button>

                    {/* Dark Mode */}
                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        theme === "dark"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                        <Moon size={24} />
                      </div>
                      <span className={`font-medium ${theme === "dark" ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>
                        Tối (Dark)
                      </span>
                    </button>

                    {/* System Mode */}
                    <button
                      onClick={() => setTheme("system")}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        theme === "system"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 flex items-center justify-center">
                        <Monitor size={24} />
                      </div>
                      <span className={`font-medium ${theme === "system" ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>
                        Theo hệ thống
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TÀI KHOẢN */}
          {activeTab === "account" && (
            <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Thông tin cá nhân
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                  Cập nhật tên hiển thị và email đăng nhập của bạn.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    defaultValue="Admin Miền Nam"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="admin@nongduocmiennam.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Đổi mật khẩu
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-green-200 dark:shadow-none"
                >
                  <Save size={18} />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}

          {/* TAB: HỆ THỐNG */}
          {activeTab === "system" && (
            <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Cấu hình Website
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                  Thông tin chung dùng để hiển thị và tối ưu hóa SEO.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên trang web
                  </label>
                  <input
                    type="text"
                    defaultValue="Nông Dược Miền Nam"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mô tả ngắn (SEO Description)
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="Chuyên cung cấp các loại phân bón, thuốc bảo vệ thực vật chất lượng cao cho bà con nông dân."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hotline hỗ trợ khách hàng
                  </label>
                  <input
                    type="text"
                    defaultValue="0987 654 321"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-green-200 dark:shadow-none"
                >
                  <Save size={18} />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}

          {/* TAB: LÝ DO HỦY ĐƠN */}
          {activeTab === "cancel-reasons" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Quản lý Lý do hủy đơn
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                  Danh sách các lý do khách hàng có thể chọn khi yêu cầu hủy đơn hàng.
                </p>
              </div>

              <form onSubmit={handleAddReason} className="flex gap-2">
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Nhập lý do mới..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors whitespace-nowrap"
                >
                  Thêm mới
                </button>
              </form>

              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden mt-4">
                {loadingReasons ? (
                  <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
                ) : cancelReasons.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">Chưa có lý do nào.</div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {cancelReasons.map(reason => (
                      <li key={reason.id} className="p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {reason.content}
                        </span>
                        <button
                          onClick={() => handleDeleteReason(reason.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1"
                        >
                          Xóa
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
