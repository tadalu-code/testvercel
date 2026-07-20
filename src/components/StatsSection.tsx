'use client';

import { useEffect, useState } from 'react';

interface StatItem { number: string; label: string; }

export default function StatsSection() {
  const defaultStats = [
    { number: "15 năm+", label: "Lĩnh vực thuốc bảo vệ thực vật" },
    { number: "63/63", label: "Tỉnh thành có mặt trong hệ thống phân phối" },
    { number: "2.000+", label: "Đại lý và điểm bán trên toàn quốc" },
    { number: "500.000+", label: "Nông hộ đã và đang sử dụng sản phẩm" },
    { number: "100+", label: "Sản phẩm đạt tiêu chuẩn chất lượng cao, an toàn với môi trường" },
  ];
  const [statsData, setStatsData] = useState<StatItem[]>(defaultStats);
  const [title, setTitle] = useState("Những con số đáng tự hào");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) return;
        if (data.stats_title) setTitle(data.stats_title);
        const loaded: StatItem[] = [1, 2, 3, 4, 5].map((i) => ({
          number: data[`stat_${i}_number`] || defaultStats[i - 1].number,
          label: data[`stat_${i}_label`] || defaultStats[i - 1].label,
        }));
        setStatsData(loaded);
      })
      .catch(() => {});
  }, []);

  // Chuyển "15 năm+" → { target: "15", suffix: " năm+" } để giữ nguyên animation cũ
  const parsed = statsData.map((s) => {
    const match = s.number.match(/^([\d.,]+)(.*)/);
    return match
      ? { target: match[1], suffix: match[2], text: s.label }
      : { target: s.number, suffix: "", text: s.label };
  });

  return (
    // Đã giảm padding (py) và min-height trên mobile để không chiếm quá nhiều diện tích
    <section className="relative w-full overflow-hidden py-[50px] sm:py-[80px] lg:py-[130px] flex items-center min-h-[400px] sm:min-h-[500px] lg:min-h-[520px]">
      
      {/* CSS HIỆU ỨNG VÀ XỬ LÝ RESPONSIVE IPHONE SE */}
      <style jsx>{`
        @keyframes text-shadow-glow {
          0%, 100% {
            text-shadow: 2px 2px 0px #0c2ffb, 4px 4px 0px #2cfcfd;
            transform: scale(1);
          }
          50% {
            text-shadow: -2px 2px 0px #2cfcfd, 2px 4px 0px #0c2ffb;
            transform: scale(1.03);
          }
        }
        .animate-text-shadow {
          animation: text-shadow-glow 2.5s infinite ease-in-out;
          display: inline-block;
        }

        /* Style mặc định cho Desktop & Tablet */
        .custom-title-spacing {
          word-spacing: -6px;
          letter-spacing: -0.04em;
          line-height: 1.1;
        }

        /* 💡 BÍ QUYẾT CHO IPHONE SE (Màn hình <= 375px) */
        @media (max-width: 375px) {
          .custom-title-spacing {
            word-spacing: -1px; /* Nới lỏng chữ để không bị đè lên nhau */
            letter-spacing: normal;
            font-size: 26px !important; /* Thu nhỏ tiêu đề một chút */
          }
        }
      `}</style>
      
      {/* LỚP 1: Nền ảnh */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://nongduocmiennam.vn/images/banner-nhung-con-so-dang-tu-hao.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* LỚP 2: Lớp phủ Gradient */}
      <div 
        className="absolute inset-0 z-10"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(2, 128, 70, 0.9), rgba(99, 216, 89, 0.75))' 
        }}
      ></div>

      <div className="relative z-20 max-w-[1340px] mx-auto px-4 sm:px-6 w-full text-center">
        
        {/* TIÊU ĐỀ ĐÃ DÙNG CLASS TÙY CHỈNH */}
        <h2 className="text-white text-[32px] md:text-[44px] font-[600] uppercase mb-10 md:mb-16 font-oswald-force drop-shadow-lg custom-title-spacing">
          {title}
        </h2>

        {/* GRID: Giảm gap-x và gap-y trên mobile để vừa vặn 2 cột */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-2 sm:gap-x-4 lg:gap-x-6 gap-y-8 sm:gap-y-10 items-start">
          {parsed.map((item, index) => (
            <div key={index} className={`flex flex-col items-center px-1 sm:px-2 ${
              // Item cuối (index 4) trên grid 2 cột sẽ bị lẻ — ận nó vào giữa
              index === 4 ? 'col-span-2 sm:col-span-1' : ''
            }`}>
              
              {/* CON SỐ: Thu nhỏ từ 28px -> 24px trên điện thoại SE */}
              <div className="text-[24px] sm:text-[28px] md:text-[38px] font-[900] text-white mb-2 sm:mb-4 tracking-tighter leading-none animate-text-shadow font-inter relative z-10">
                {item.target}{item.suffix}
              </div>
              
              {/* MÔ TẢ: Thu nhỏ font chữ từ 13px -> 11px trên màn hình nhỏ gọn */}
              <p className="text-white font-bold text-[11px] sm:text-[13px] md:text-[14px] uppercase leading-tight max-w-[220px]">
                {item.text}
              </p>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}