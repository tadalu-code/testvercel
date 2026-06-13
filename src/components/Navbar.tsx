'use client';

import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import Link from "next/link";
import MobileMenu from "./MobileMenu";
import RegisterModal from "./RegisterModal";

const PRODUCT_MAP: Record<string, string> = {
  "phân bón": "phan-bon",
  "thuốc trừ sâu": "thuoc-tru-sau",
  "thuốc trừ bệnh hại cây trồng": "thuoc-tru-benh-hai-cay-trong",
  "thuốc trừ cỏ dại": "thuoc-tru-co-dai"
};

export default function Navbar({ navData }: { navData: any[] }) {
  // Trạng thái đóng mở Modal đăng ký
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Logic xử lý dữ liệu Menu từ Server truyền xuống
  const rawNavItems = navData || [];
  const childIds = new Set(rawNavItems.flatMap((item: any) => item.children?.map((c: any) => c.id) || []));
  const finalNavItems = rawNavItems.filter((item: any) => !childIds.has(item.id));

  // Lọc lấy Menu chính (Bỏ trang chủ và tuyển dụng vì đã có vị trí riêng)
  const mainMenu = finalNavItems.filter((item: any) =>
    !['tuyển dụng', 'trang chủ'].includes(item.title.toLowerCase())
  );

  return (
    <>
      {/* --- TẦNG 1: TOP BAR (Hotline, Tìm kiếm, MXH) --- */}
      <div
        className="w-full text-white py-3.5 lg:min-h-[50px] hidden lg:flex items-center relative z-40"
        style={{ backgroundImage: 'linear-gradient(rgb(99, 216, 89), rgb(2, 128, 70))' }}
      >
        <div className="max-w-[1340px] w-full mx-auto px-4 lg:px-6">
          <div className="hidden lg:flex justify-between items-center">
            {/* Thông tin liên hệ bên trái */}
            <div className="flex space-x-8 font-inter font-bold text-[13px] uppercase tracking-tight">
              <span className="flex items-center gap-2">
                <img src="https://nongduocmiennam.vn/images/icons/phone.png" className="w-5 h-5 invert brightness-0" alt="" />
                Hotline: 02926.537.595
              </span>
              <span className="flex items-center gap-2">
                <img src="https://nongduocmiennam.vn/images/icons/clock.png" className="w-5 h-5 invert brightness-0" alt="" />
                Thời gian làm việc: Sáng: 7h30 - 11h30 Chiều: 13h30 - 17h00
              </span>
            </div>

            {/* Tìm kiếm và Icon mạng xã hội bên phải */}
            <div className="flex items-center gap-6">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Tìm kiếm"
                  className="bg-white text-black outline-none text-[14px] font-inter rounded-full border border-[#028046] py-1 pl-4 pr-12 w-[220px] shadow-sm"
                />
                <button className="absolute right-3 text-[#028046]"><Search size={14} /></button>
              </div>
              <div className="flex items-center gap-2">
                {['zalo', 'facebook', 'tiktok', 'youtube'].map(s => (
                  <img key={s} src={`https://nongduocmiennam.vn/images/icons/${s}.png`} className="w-8 h-8 object-contain" alt="" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- DẢI TOPBAR MOBILE (Chỉ hiển thị dưới lg, ẩn trên desktop) --- */}
      <div
        className="lg:hidden w-full text-white px-4 py-2.5 flex flex-col gap-2"
        style={{ backgroundImage: 'linear-gradient(rgb(99, 216, 89), rgb(2, 128, 70))' }}
      >
        {/* HÀNG 1: Hotline + Giờ làm việc */}
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 font-bold text-[12px] uppercase tracking-tight">
            <img src="https://nongduocmiennam.vn/images/icons/phone.png" className="w-4 h-4 invert brightness-0" alt="" />
            Hotline: 02926.537.595
          </span>
          <span className="flex items-center gap-2 font-bold text-[12px] uppercase tracking-tight">
            <img src="https://nongduocmiennam.vn/images/icons/clock.png" className="w-4 h-4 invert brightness-0" alt="" />
            Thời gian làm việc: Sáng: 7H30 - 11H30 Chiều: 13H30 - 17H00
          </span>
        </div>

        {/* HÀNG 2: Icon tìm kiếm + MXH + nút Tuyển dụng */}
        <div className="flex items-center gap-2">
          {/* Icon kính lúp */}
          <button className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full shrink-0">
            <Search size={16} className="text-white" />
          </button>

          {/* Icon mạng xã hội */}
          {['zalo', 'facebook', 'tiktok', 'youtube'].map(s => (
            <img key={s} src={`https://nongduocmiennam.vn/images/icons/${s}.png`} className="w-8 h-8 object-contain shrink-0" alt={s} />
          ))}

          {/* Nút Liên hệ tư vấn */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="ml-auto shrink-0 text-white text-[11px] font-black uppercase px-3 py-1.5 rounded-[4px] shadow tracking-wide"
            style={{ background: 'linear-gradient(90deg, rgb(216, 0, 0) 0%, rgb(245, 2, 0) 50%, rgb(187, 1, 0) 100%)' }}
          >
            Liên hệ tư vấn
          </button>
        </div>
      </div>

      {/* --- TẦNG 2: MAIN HEADER (Logo và Menu điều hướng) --- */}
      <header className="sticky top-0 z-50 w-full bg-white h-[75px] lg:h-[96px]">
        <nav className="max-w-[1340px] mx-auto px-6 h-full flex items-center justify-between font-inter">

          {/* Logo bên trái */}
          <Link href="/" className="flex items-center shrink-0">
            <img src="https://nongduocmiennam.vn/logo512.png" alt="Logo" className="h-[55px] lg:h-[75px] w-auto object-contain" />
          </Link>

          {/* Danh sách Menu chính dạt về bên phải */}
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

                  {/* Dropdown Menu cho Sản phẩm hoặc các mục có con */}
                  {item.children?.length > 0 && (
                    <ul className="absolute top-[80px] right-0 bg-white shadow-xl border-t-4 border-[#00a651] min-w-[260px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 translate-y-2 group-hover:translate-y-0">
                      {item.children.map((child: any) => {
                        const titleClean = child.title.toLowerCase().trim();
                        const slugFromMap = PRODUCT_MAP[titleClean];
                        const finalHref = isProd ? (slugFromMap ? `/san-pham/${slugFromMap}` : child.url) : child.url;
                        return (
                          <li key={child.id}>
                            <Link
                              href={finalHref}
                              className="block px-5 py-3 text-gray-700 hover:text-[#00a651] hover:bg-gray-50 text-[14px] font-medium transition-colors"
                            >
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

          {/* Menu cho thiết bị di động */}
          <div className="lg:hidden flex items-center">
            <MobileMenu navItems={mainMenu} />
          </div>
        </nav>
      </header>

      {/* --- TẦNG 3: TƯ VẤN (Khối thông tin nhanh và nút mở Modal) --- */}
      <div className="w-full bg-white hidden lg:block">
        <div className="max-w-[1340px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-inter font-bold text-[14px] text-[#004424] uppercase leading-tight">
              Bạn cần tư vấn nhanh?
            </h3>
            <p className="text-[#004424]/75 font-inter text-[16px] mt-1 font-medium ">
              Để lại thông tin, đội ngũ hỗ trợ sẽ liên hệ sớm nhất.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="text-white px-4 py-2.5 rounded-[6px] font-inter font-semibold text-[16px] shadow-lg transition-all hover:brightness-110 active:scale-95"
            style={{
              background: "linear-gradient(90deg, rgb(216, 0, 0) 0%, rgb(245, 2, 0) 50%, rgb(187, 1, 0) 100%)"
            }}
          >
            Liên hệ tư vấn
          </button>
        </div>
      </div>

      {/* Modal đăng ký nhận tư vấn */}
      <RegisterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}