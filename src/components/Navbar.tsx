'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronDown, Search, ShoppingCart, LogOut, User, ShoppingBag, Shield, Bell, Heart } from 'lucide-react';
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import MobileMenu from "./MobileMenu";
import RegisterModal from "./RegisterModal";
import { useSession, signOut } from "next-auth/react";
import { useCart } from '@/context/CartContext';
import NotificationDropdown from "./NotificationDropdown";

const PRODUCT_MAP: Record<string, string> = {
  "phân bón": "phan-bon",
  "thuốc trừ sâu": "thuoc-tru-sau",
  "thuốc trừ bệnh hại cây trồng": "thuoc-tru-benh-hai-cay-trong",
  "thuốc trừ cỏ dại": "thuoc-tru-co-dai"
};

const AVATAR_COLORS = [
  '#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c',
  '#3498db','#9b59b6','#e91e63','#00bcd4','#ff5722'
];

function getDisplayName(email: string): string {
  if (!email) return 'Khách';
  const local = email.split('@')[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function getAvatarColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash += email.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function Navbar({ navData }: { navData: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const { totalItems, openCart } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isAuthOrAdmin = pathname?.startsWith('/auth') || pathname?.startsWith('/admin');

  const [hotline, setHotline] = useState('02926.537.595');
  const [workingHours, setWorkingHours] = useState('Sáng: 7h30 - 11h30 Chiều: 13h30 - 17h00');

  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(({ data }) => {
        if (data?.hotline) setHotline(data.hotline);
        if (data?.working_hours) setWorkingHours(data.working_hours);
      })
      .catch(() => {});
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Nếu click bên ngoài dropdown VÀ không phải là click vào nút avatar (cả mobile/desktop)
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        !target.closest('.avatar-btn')
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    setShowDropdown(prev => !prev);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setShowDropdown(false);
    router.push('/');
    router.refresh();
  };

  const HARDCODED_MENU = [
    {
      id: 2,
      title: "Giới thiệu",
      url: "/bai-viet/gioi-thieu",
      children: []
    },
    {
      id: 3,
      title: "Sản phẩm",
      url: "/san-pham",
      children: [] // Bỏ dropdown theo yêu cầu
    },
    {
      id: 15,
      title: "Bệnh hại cây trồng",
      url: "/bai-viet/benh-hai-cay-trong",
      children: [
        { id: 21, title: "Bệnh hại trên cây công nghiệp", url: "/bai-viet/benh-tren-cay-cong-nghiep" },
        { id: 22, title: "Bệnh hại trên cây ăn quả", url: "/bai-viet/benh-hai-tren-cay-an-qua" },
        { id: 23, title: "Bệnh hại cây lương thực", url: "/bai-viet/benh-hai-cay-luong-thuc" },
        { id: 24, title: "Bệnh hại rau màu", url: "/bai-viet/benh-hai-rau-mau" },
        { id: 25, title: "Bệnh hại hoa cây cảnh", url: "/bai-viet/benh-hai-hoa-cay-canh" }
      ]
    },
    {
      id: 16,
      title: "Sâu hại cây trồng",
      url: "/bai-viet/sau-hai-cay-trong",
      children: [
        { id: 26, title: "Sâu hại cây công nghiệp", url: "/bai-viet/sau-hai-cay-cong-nghiep" },
        { id: 27, title: "Sâu hại cây ăn quả", url: "/bai-viet/sau-hai-tren-cay-an-qua" },
        { id: 28, title: "Sâu hại cây lương thực", url: "/bai-viet/sau-hai-cay-luong-thuc" },
        { id: 29, title: "Sâu hại rau màu", url: "/bai-viet/sau-hai-rau-mau" },
        { id: 30, title: "Sâu hại hoa cây cảnh", url: "/bai-viet/sau-hai-hoa-cay-canh" }
      ]
    },
    {
      id: 18,
      title: "Cỏ dại",
      url: "/bai-viet/co-dai",
      children: [
        { id: 31, title: "Cỏ dại cây trông cạn", url: "/bai-viet/co-dai-cay-trong-can" },
        { id: 32, title: "Cỏ dại cây trồng dưới nước", url: "/bai-viet/co-dai-cay-trong-duoi-nuoc" }
      ]
    },
    {
      id: 20,
      title: "Chuột, sóc hại cây trồng",
      url: "/bai-viet/chuot-soc-hai-cay-trong",
      children: []
    },
    {
      id: 37,
      title: "Chia sẻ kiến thức",
      url: "/bai-viet/chia-se-kien-thuc",
      children: []
    }
  ];

  const mainMenu = HARDCODED_MENU;

  const email = user?.email || '';
  const username = user?.username || '';
  const phone = user?.phone || '';
  
  // Ưu tiên: Tên đầy đủ > Tên đăng nhập > SĐT > Fallback email
  const displayName = user?.name || username || phone || getDisplayName(email);
  
  const avatarUrl = user?.image;
  const bgColor = getAvatarColor(email || username || phone || 'default');
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  // Phần nút auth — render trực tiếp, không dùng nested component
  const renderAuthButtons = (isMobile = false) => {
    const wrapClass = isMobile
      ? 'flex items-center gap-2 text-[12px] font-bold'
      : 'flex items-center gap-3 border-l border-white/20 pl-4';

    if (!user) {
      return (
        <div className={wrapClass}>
          <Link href="/auth/register" className="hover:text-yellow-300 transition-colors">Đăng ký</Link>
          <span className="text-white/50">/</span>
          <Link href="/auth/login" className="hover:text-yellow-300 transition-colors">Đăng nhập</Link>
        </div>
      );
    }

    return (
      <div className={wrapClass}>
        {/* Thông báo */}
        <NotificationDropdown isMobile={isMobile} />

        {/* Giỏ hàng */}
        <button onClick={openCart} className="relative hover:text-yellow-300 transition-colors">
          <ShoppingCart size={isMobile ? 17 : 20} />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>

        {/* Avatar + Tên */}
        <button
          onClick={handleAvatarClick}
          className="avatar-btn flex items-center gap-2 hover:text-yellow-300 transition-colors"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover border-2 border-white/50" />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-bold border-2 border-white/50 shrink-0"
              style={{ backgroundColor: bgColor }}
            >
              {initials}
            </div>
          )}
          <span className="text-[13px] font-medium max-w-[100px] truncate">{displayName}</span>
          <ChevronDown size={12} />
        </button>
      </div>
    );
  };

  return (
    <>
      {/* === DROPDOWN FIXED — ngoài mọi stacking context === */}
      {showDropdown && user && (
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
          className="bg-white rounded-lg shadow-2xl border border-gray-100 min-w-[200px] py-2 text-gray-700"
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-[13px] font-semibold text-gray-800 truncate">{displayName}</p>
            <p className="text-[11px] text-gray-400 truncate">{email}</p>
          </div>
          <Link
            href="/user/account/profile"
            onClick={() => setShowDropdown(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] hover:bg-gray-50 hover:text-[#028046] transition-colors"
          >
            <User size={14} /> Trang cá nhân
          </Link>
          <Link
            href="/user/account/purchase"
            onClick={() => setShowDropdown(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] hover:bg-gray-50 hover:text-[#028046] transition-colors"
          >
            <ShoppingBag size={14} /> Đơn hàng
          </Link>
          <Link
            href="/user/account/wishlist"
            onClick={() => setShowDropdown(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] hover:bg-gray-50 hover:text-[#028046] transition-colors"
          >
            <Heart size={14} /> Yêu thích
          </Link>
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <Link
              href="/admin"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] hover:bg-gray-50 hover:text-[#028046] transition-colors"
            >
              <Shield size={14} /> Quản trị Admin
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      )}

      {/* --- TOPBAR DESKTOP --- */}
      <div
        className="w-full text-white py-3.5 lg:min-h-[50px] hidden lg:flex items-center relative z-[60]"
        style={{ backgroundImage: 'linear-gradient(rgb(99, 216, 89), rgb(2, 128, 70))' }}
      >
        <div className="max-w-[1340px] w-full mx-auto px-4 lg:px-6">
          <div className="hidden lg:flex justify-between items-center">
            <div className="flex space-x-8 font-inter font-bold text-[13px] uppercase tracking-tight">
              <span className="flex items-center gap-2">
                <img src="https://nongduocmiennam.vn/images/icons/phone.png" className="w-5 h-5 invert brightness-0" alt="" />
                Hotline: {hotline}
              </span>
              <span className="flex items-center gap-2">
                <img src="https://nongduocmiennam.vn/images/icons/clock.png" className="w-5 h-5 invert brightness-0" alt="" />
                Thời gian làm việc: {workingHours}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Tìm kiếm"
                  className="bg-white text-black outline-none text-[14px] font-inter rounded-full border border-[#028046] py-1 pl-4 pr-12 w-[220px] shadow-sm"
                />
                <button className="absolute right-3 text-[#028046]"><Search size={14} /></button>
              </div>
              {renderAuthButtons(false)}
            </div>
          </div>
        </div>
      </div>

      {/* --- TOPBAR MOBILE --- */}
      <div
        className="lg:hidden w-full text-white px-4 py-2.5 flex flex-col gap-2 relative z-[60]"
        style={{ backgroundImage: 'linear-gradient(rgb(99, 216, 89), rgb(2, 128, 70))' }}
      >
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 font-bold text-[12px] uppercase tracking-tight">
            <img src="https://nongduocmiennam.vn/images/icons/phone.png" className="w-4 h-4 invert brightness-0" alt="" />
            Hotline: {hotline}
          </span>
          <span className="flex items-center gap-2 font-bold text-[12px] uppercase tracking-tight">
            <img src="https://nongduocmiennam.vn/images/icons/clock.png" className="w-4 h-4 invert brightness-0" alt="" />
            Giờ làm việc: {workingHours}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full shrink-0">
            <Search size={16} className="text-white" />
          </button>
          <div className="flex-1">{renderAuthButtons(true)}</div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="ml-auto shrink-0 text-white text-[11px] font-black uppercase px-3 py-1.5 rounded-[4px] shadow tracking-wide"
            style={{ background: 'linear-gradient(90deg, rgb(216, 0, 0) 0%, rgb(245, 2, 0) 50%, rgb(187, 1, 0) 100%)' }}
          >
            Liên hệ tư vấn
          </button>
        </div>
      </div>

      {!isAuthOrAdmin && (
        <>
          <header className="sticky top-0 z-50 w-full bg-white h-[75px] lg:h-[96px]">
            <nav className="max-w-[1340px] mx-auto px-6 h-full flex items-center justify-between font-inter">
              <Link href="/" className="flex items-center shrink-0">
                <img src="https://nongduocmiennam.vn/logo512.png" alt="Logo" className="h-[55px] lg:h-[75px] w-auto object-contain" />
              </Link>
              <ul className="hidden lg:flex items-center gap-x-10 h-full ml-auto">
                {mainMenu.map((item: any) => {
                  const isProd = item.title.toLowerCase() === 'sản phẩm';
                  return (
                    <li key={item.id} className="relative group h-full flex items-center">
                      <Link
                        href={isProd ? "/san-pham" : (item.url || "#")}
                        className="flex items-center gap-1 text-[#028046] font-bold uppercase text-[14px] tracking-tighter hover:text-[#f19f1a] transition-colors whitespace-nowrap leading-tight"
                      >
                        {item.title}
                        {item.children?.length > 0 && <ChevronDown size={12} className="ml-0.5 text-[#00a651] group-hover:text-[#f19f1a]" />}
                      </Link>
                      {item.children?.length > 0 && (
                        <ul className="absolute top-[80px] right-0 bg-white shadow-xl border-t-4 border-[#00a651] min-w-[260px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 translate-y-2 group-hover:translate-y-0">
                          {item.children.map((child: any) => {
                            const titleClean = child.title.toLowerCase().trim();
                            const slugFromMap = PRODUCT_MAP[titleClean];
                            const finalHref = isProd ? (slugFromMap ? `/san-pham/${slugFromMap}` : child.url) : child.url;
                            return (
                              <li key={child.id}>
                                <Link href={finalHref} className="block px-5 py-3 text-gray-700 hover:text-[#00a651] hover:bg-gray-50 text-[14px] font-medium transition-colors">
                                  {child.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="lg:hidden flex items-center">
                <MobileMenu navItems={mainMenu} />
              </div>
            </nav>
          </header>

          <div className="w-full bg-white hidden lg:block">
            <div className="max-w-[1340px] mx-auto px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-inter font-bold text-[14px] text-[#004424] uppercase leading-tight">Bạn cần tư vấn nhanh?</h3>
                <p className="text-[#004424]/75 font-inter text-[16px] mt-1 font-medium">Để lại thông tin, đội ngũ hỗ trợ sẽ liên hệ sớm nhất.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-white px-4 py-2.5 rounded-[6px] font-inter font-semibold text-[16px] shadow-lg transition-all hover:brightness-110 active:scale-95"
                style={{ background: "linear-gradient(90deg, rgb(216, 0, 0) 0%, rgb(245, 2, 0) 50%, rgb(187, 1, 0) 100%)" }}
              >
                Liên hệ tư vấn
              </button>
            </div>
          </div>
        </>
      )}

      <RegisterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}