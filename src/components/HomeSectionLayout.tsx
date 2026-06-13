import Link from "next/link";
import { Menu } from "lucide-react";

interface Props {
  title: string;
  subTitle: string;
  viewAllLink: string;
  children: React.ReactNode;
}

export default function HomeSectionLayout({ title, subTitle, viewAllLink, children }: Props) {
  return (
    <section className="max-w-[1340px] mx-auto px-4 md:px-6 mt-10 md:mt-14 mb-20 w-full font-sans">
      <h2 className="text-center text-[#007d3d] text-[26px] sm:text-[34px] md:text-[44px] font-bold uppercase mb-4 sm:mb-6 md:mb-8 font-oswald-force">
        {title}
      </h2>
      <h3 className="text-[#007d3d] text-[16px] md:text-[28px] font-bold uppercase mb-4 ml-4 md:ml-8 tracking-tighter">
        {subTitle}
      </h3>
      
      {/* 
        SỬA Ở ĐÂY: 
        Dùng -mx-4 md:-mx-6 để thẻ div xanh kéo dãn ra tận mép màn hình (mobile/ipad).
        Đến màn hình siêu lớn (xl:mx-0) thì nó sẽ thu lại lọt lòng và bo góc.
      */}
      <div className="relative mt-2 -mx-4 md:-mx-6 xl:mx-0">
      
        <div 
          className="absolute bottom-0 left-0 w-full h-[88%] xl:rounded-[8px] z-0 shadow-sm"
          style={{
            background: "linear-gradient(rgba(2, 128, 70, 0.85), rgba(99, 216, 89, 0.8))"
          }}
        ></div>
        
        {/* Bù lại padding px-4 px-8 bên trong để các thẻ bài viết không bị dính sát lề */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 px-4 sm:px-8 md:px-10 xl:px-8 pt-4 pb-8">
          {children}
        </div>
        
        <div className="relative z-10 pb-8 flex justify-center">
          <Link href={viewAllLink} className="bg-[#005c26] hover:bg-[#007d3d] text-white px-6 py-2 flex items-center gap-2 text-[14px] font-bold rounded-[4px] shadow-md transition-colors uppercase cursor-pointer">
            <Menu size={18} strokeWidth={2.5} /> Xem tất cả
          </Link>
        </div>
      </div>
    </section>
  );
}