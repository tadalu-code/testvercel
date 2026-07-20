// "use client"; 

// import { useState, useEffect } from "react";
// import Image from "next/image";

// export default function HeroSlider({ sectionsData }: { sectionsData: any[] }) {
  
//   const bannerSections = sectionsData?.filter((s: any) => s.sectionType === 'banner') || [];
  
//   const slides = bannerSections
//     .map((section: any) => section.content?.[0])
//     .filter((item: any) => item && item.imageUrl); 

//   const [currentIndex, setCurrentIndex] = useState(0);

//   // 1. Tự động chuyển ảnh sau 
//   useEffect(() => {
//     if (!slides || slides.length === 0) return;
//     const timer = setInterval(() => {
//       setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
//     }, 5000); 
//     return () => clearInterval(timer);
//   }, [slides]);

//   const prevSlide = () => {
//     setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
//   };

//   const nextSlide = () => {
//     setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
//   };

//   if (!slides || slides.length === 0) {
//     return (
//       <div suppressHydrationWarning className="w-full h-[400px] md:h-[600px] bg-gray-100 animate-pulse flex items-center justify-center text-gray-500">
//         Đang tải Banner...
//       </div>
//     );
//   }

//   return (
//     <div className="relative w-full h-[200px] md:h-[350px] lg:h-[450px] xl:h-[500px] overflow-hidden group">
      
//       {/* 2. Đổi duration-700 thành duration-[1500ms] để hiệu ứng trượt chậm và mượt hơn */}
//       <div 
//         className="flex w-full h-full transition-transform duration-[2500ms] ease-in-out" 
//         style={{ transform: `translateX(-${currentIndex * 100}%)` }}
//       >
//         {slides.map((slide: any, index: number) => (
//           <div key={index} className="w-full h-full flex-shrink-0 relative">
//             <Image
//               src={slide.imageUrl}
//               alt={slide.title || `Banner ${index + 1}`}
//               fill
//               className="object-cover"
//               priority={index === 0} 
//             />
//           </div>
//         ))}
//       </div>

//       <button 
//         onClick={prevSlide}
//         className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-white text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/20"
//       >
//         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
//       </button>

//       <button 
//         onClick={nextSlide}
//         className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-white text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/20"
//       >
//         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
//       </button>

//       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
//         {slides.map((_: any, index: number) => (
//           <button
//             key={index}
//             onClick={() => setCurrentIndex(index)}
//             className={`w-10 h-1.5 rounded-full transition-colors ${currentIndex === index ? 'bg-[#00a651]' : 'bg-white/50 hover:bg-white'}`}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }
"use client"; 

import { useState, useEffect } from "react";
import Image from "next/image";

interface Slide { imageUrl: string; title?: string; }

export default function HeroSlider({ sectionsData }: { sectionsData: any[] }) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Ưu tiên đọc banner từ site_settings (Admin quản lý)
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then(({ data }) => {
        if (data?.banner_images) {
          try {
            const imgs = JSON.parse(data.banner_images);
            if (Array.isArray(imgs) && imgs.length > 0) {
              setSlides(imgs.map((img: any) => ({ imageUrl: img.url, title: img.title || "" })));
              return;
            }
          } catch {}
        }
        // Fallback: dùng dữ liệu từ API cũ (sectionsData prop)
        const bannerSections = sectionsData?.filter((s: any) => s.sectionType === 'banner') || [];
        const fallback = bannerSections
          .map((section: any) => section.content?.[0])
          .filter((item: any) => item && item.imageUrl);
        setSlides(fallback);
      })
      .catch(() => {
        // Nếu lỗi mạng, dùng fallback
        const bannerSections = sectionsData?.filter((s: any) => s.sectionType === 'banner') || [];
        const fallback = bannerSections
          .map((section: any) => section.content?.[0])
          .filter((item: any) => item && item.imageUrl);
        setSlides(fallback);
      });
  }, [sectionsData]);

  // Auto-play
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000); 
    return () => clearInterval(timer);
  }, [slides]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  if (!slides || slides.length === 0) {
    return (
      <div suppressHydrationWarning className="w-full h-[400px] md:h-[600px] bg-gray-100 animate-pulse flex items-center justify-center text-gray-500">
        Đang tải Banner...
      </div>
    );
  }

  return (
    // Bọc toàn bộ vào một thẻ div flex-col để các nút nằm dưới ảnh
    <div className="w-full flex flex-col items-center">
      
      {/* KHỐI SLIDER CHÍNH */}
      <div className="relative w-full h-[190px] sm:h-[260px] md:h-[340px] lg:h-[450px] xl:h-[500px] overflow-hidden group rounded-lg">
        
        <div 
          className="flex w-full h-full transition-transform duration-[2500ms] ease-in-out" 
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide: any, index: number) => (
            <div key={index} className="w-full h-full flex-shrink-0 relative">
              <Image
                src={slide.imageUrl}
                alt={slide.title || `Banner ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0} 
              />
            </div>
          ))}
        </div>

        {/* Mũi tên trái/phải vẫn giữ nguyên bên trong ảnh để dễ bấm */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-white text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/20 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>

        <button 
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-white text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/20 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

      {/* CÁC NÚT ĐIỀU HƯỚNG RA NGOÀI BÊN DƯỚI */}
      <div className="mt-4 flex space-x-2">
        {slides.map((_: any, index: number) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-8 h-2 rounded-full transition-all duration-300 ${
              currentIndex === index 
                ? 'bg-[#00a651] w-8' // Khi active thì dài ra một chút cho đẹp
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
      
    </div>
  );
}