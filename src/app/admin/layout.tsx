"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  Package,
  FileText,
  Tag,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Leaf,
  ChevronRight,
  ShoppingBag,
  Users,
  Monitor,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag },
  { href: "/admin/posts", label: "Bài viết", icon: FileText },
  { href: "/admin/categories", label: "Danh mục sản phẩm", icon: Tag },
  { href: "/admin/contacts", label: "Liên hệ", icon: MessageSquare },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/homepage", label: "Giao diện Trang chủ", icon: Monitor },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<string>("admin");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserRole(data.user.user_metadata?.role || "admin");
      }
    });
  }, []);

  const visibleNavItems = navItems.filter((item) => {
    if (userRole === "staff") {
      return [
        "/admin/products", 
        "/admin/orders", 
        "/admin/posts", 
        "/admin/contacts", 
        "/admin/settings"
      ].includes(item.href);
    }
    return true;
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const currentPage = navItems.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
  );

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-hidden bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-sm z-30 flex flex-col transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:static lg:shadow-none`}
        >
          {/* Logo */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-none">
              <Leaf className="text-white" size={18} />
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-gray-100 text-[13px] leading-tight transition-colors">Nông Dược Miền Nam </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">Admin Dashboard</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group ${
                  isActive
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"}
                />
                {item.label}
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-green-500 dark:text-green-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            {loggingOut ? "Đang thoát..." : "Đăng xuất"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 lg:px-6 h-14 flex items-center gap-4 shadow-sm transition-colors">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-gray-300"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-gray-400">
            <span>Admin</span>
            {currentPage && (
              <>
                <ChevronRight size={14} />
                <span className="text-gray-800 dark:text-gray-200 font-medium">{currentPage.label}</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-[12px] text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:border-green-300"
            >
              Xem trang chủ 
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
      </div>
    </>
  );
}
