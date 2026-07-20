"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ClipboardList, Lock, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function UserSidebar() {
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAvatarUrl(data.user.user_metadata?.avatar_url || "");
        setName(data.user.user_metadata?.name || "Tài khoản");
      }
    });
  }, []);

  const navItems = [
    {
      title: "Tài Khoản Của Tôi",
      icon: <User size={20} />,
      href: "/user/account/profile",
      match: "/user/account",
      subItems: [
        { title: "Hồ sơ", href: "/user/account/profile" },
        { title: "Sổ địa chỉ", href: "/user/account/address" },
        { title: "Đổi mật khẩu", href: "/user/account/password" },
      ],
    },
    {
      title: "Đơn Mua",
      icon: <ClipboardList size={20} />,
      href: "/user/account/purchase",
      match: "/user/account/purchase",
      subItems: [
        { title: "Thông tin đơn hàng", href: "/user/account/purchase" },
      ],
    },
  ];

  return (
    <div className="w-full lg:w-[250px] shrink-0">
      {/* Chỉ hiện Avatar trên Desktop */}
      <div className="hidden lg:flex items-center gap-3 mb-6 p-2">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shrink-0 border">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <UserCircle size={32} className="text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">Tài khoản</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00a651]"></span> Đang hoạt động
          </p>
        </div>
      </div>

      {/* Menu cho Desktop (Dọc) */}
      <nav className="hidden lg:block space-y-4">
        {navItems.map((item, index) => {
          const isActive = pathname.startsWith(item.match);
          return (
            <div key={index}>
              <div 
                className={`flex items-center gap-2 font-medium text-sm transition-colors ${
                  isActive ? "text-[#00a651]" : "text-gray-700"
                }`}
              >
                <span className={isActive ? "text-[#00a651]" : "text-gray-500"}>
                  {item.icon}
                </span>
                {item.title}
              </div>
              
              {item.subItems.length > 0 && (
                <div className="ml-7 mt-2 space-y-2">
                  {item.subItems.map((sub, i) => {
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={i}
                        href={sub.href}
                        className={`block text-sm transition-colors ${
                          isSubActive ? "text-[#00a651] font-medium" : "text-gray-500 hover:text-[#00a651]"
                        }`}
                      >
                        {sub.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Menu cho Mobile (Ngang, Cuộn) */}
      <nav className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-hide border-b border-gray-200 mb-2">
        {navItems.map((item) => {
          if (item.subItems.length > 0) {
            return item.subItems.map((sub, i) => {
              const isSubActive = pathname === sub.href;
              return (
                <Link
                  key={`${item.title}-${i}`}
                  href={sub.href}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    isSubActive ? "bg-[#00a651] text-white border-[#00a651]" : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {sub.title}
                </Link>
              );
            });
          } else {
            const isActive = pathname.startsWith(item.match);
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  isActive ? "bg-[#00a651] text-white border-[#00a651]" : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {item.title}
              </Link>
            );
          }
        })}
      </nav>
    </div>
  );
}
