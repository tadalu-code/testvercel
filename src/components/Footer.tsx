'use client';

import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { COMPANY_NAME } from "@/constants/site";

export default function Footer({ navData }: { navData: any[] }) {
    return (
        <footer
            className="relative text-white py-[40px] md:py-[65px] font-sans overflow-hidden"
            style={{
                backgroundImage: `linear-gradient(to bottom, rgb(99, 216, 89), rgb(2, 128, 70))`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* DẢI LỤA VÀNG */}
            <div
                className="absolute inset-0 z-0 opacity-100 pointer-events-none"
                style={{
                    backgroundImage: `url('https://nongduocmiennam.vn/images/wavy-curve.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            ></div>

            <div className="max-w-[1340px] mx-auto px-6 relative z-10">

                {/* 1. LOGO CHÍNH: Nằm hẳn vào góc trái trên cùng của thẻ */}
                <div className="mb-6">
                    <Link href="/" className="inline-block">
                        <img
                            src="https://nongduocmiennam.vn/logo512.png"
                            alt={`Logo ${COMPANY_NAME}`}
                            className="h-[80px] sm:h-[110px] md:h-[80px] sm:h-[110px] md:h-[150px] w-auto object-contain"
                        />
                    </Link>
                </div>

                {/* Đã thêm lg:grid-cols-12 và md:grid-cols-2 cho Tablet Mini */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 items-start">

                    {/* CỘT 1: THÔNG TIN LIÊN HỆ */}
                    <div className="lg:col-span-5 md:col-span-2">
                        <h3 className="text-[20px] font-[500] uppercase font-oswald-force leading-[24px] mb-[30px] tracking-widest text-start">
                            Thông tin liên hệ
                        </h3>
                        <ul className="space-y-3 text-[16px] leading-relaxed">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-[18px] h-[18px] mt-[4px] shrink-0" strokeWidth={1.5} />
                                <p>46 Đường B12 KDC 91B, Phường Tân An,TP. Cần Thơ</p>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
                                <p>02926.537.595</p>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-[18px] h-[18px] shrink-0" strokeWidth={1.5} />
                                <p>nongduocmn@gmail.com</p>
                            </li>
                        </ul>
                    </div>

                    {/* CỘT 2: CHÍNH SÁCH */}
                    <div className="lg:col-span-3 md:col-span-1">
                        <h3 className="text-[20px] font-[500] uppercase font-oswald-force leading-[24px] mb-[30px] tracking-normal text-start">
                            Chính sách
                        </h3>
                        <ul className="space-y-3 text-[16px]">
                            <li>
                                <Link href="/" className="hover:translate-x-2 transition-transform inline-block">Trang chủ</Link>
                            </li>
                            <li>
                                <Link href="/san-pham" className="hover:translate-x-2 transition-transform inline-block">Sản phẩm</Link>
                            </li>
                            <li>
                                <Link href="/lien-he" className="hover:translate-x-2 transition-transform inline-block">Liên hệ</Link>
                            </li>
                        </ul>
                    </div>

                    {/* CỘT 3: BẢN ĐỒ VỆ TINH */}
                    <div className="lg:col-span-4 md:col-span-1 w-full">
                        <div className="rounded-[18px] overflow-hidden border-[5px] border-white/20 shadow-2xl">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3928.84715873994!2d105.7441581!3d10.0294119!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a08901f4637683%3A0xc48c772c2122822a!2zNDYgxJDGsOG7nW5nIEIxMiBLREMgOTFC!5e1!3m2!1svi!2s!4v1715000000000!5m2!1svi!2s&maptype=satellite"
                                width="100%"
                                height="220"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </div>
                    
                    {/* KHỐI BOTTOM: Đã sửa md:col-span-20 thành col-span-full để nó dài hết hàng ngang */}
                    <div className="col-span-full">
                        {/* Dùng flex và justify-between để đẩy 2 phần tử ra 2 đầu */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-white/20 mt-4 md:mt-0 md:border-t-0">

                            {/* Phần bên trái: Các icons */}
                            <div className="flex gap-3">
                                {['zalo', 'facebook', 'tiktok', 'youtube'].map((s) => (
                                    <a
                                        key={s}
                                        href="#"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:scale-110 transition-transform flex items-center justify-center"
                                    >
                                        <img
                                            src={`https://nongduocmiennam.vn/images/icons/${s}.png`}
                                            alt={s}
                                            className="w-[30px] h-[30px] object-contain"
                                        />
                                    </a>
                                ))}
                            </div>

                            {/* Phần bên phải: Text Design by */}
                            <p className="text-[13px] opacity-75 font-normal">
                                Design by <a href="https://katec.vn/" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline cursor-pointer">Katec.vn</a>
                            </p>

                        </div>
                    </div>

                </div>
            </div>
        </footer>
    );
}