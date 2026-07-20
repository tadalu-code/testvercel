"use client";
import { useEffect, useState } from "react";
import { getProductDetail, getProducts } from "@/services/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import { X, ChevronLeft, ChevronRight, ZoomIn, Star } from "lucide-react";
import RegisterModal from "@/components/RegisterModal";
import ProductReviews from "@/components/ProductReviews";

const parseImages = (urlStr: any) => {
  try {
    if (!urlStr) return [];
    if (Array.isArray(urlStr)) return urlStr;
    let cleanStr = urlStr.trim().replace(/^['\"]|['\"]$/g, "");
    try {
      const parsed = JSON.parse(cleanStr);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      const regex = /https?:\/\/[^"\\s/]+[^"\\s]+/g;
      return cleanStr.match(regex) || [];
    }
  } catch {
    return [];
  }
  return [];
};

interface Props {
  category: string;
  slug: string;
  /** Dữ liệu sản phẩm pre-fetched từ Server Component (tránh double-fetch) */
  initialProduct?: any;
}

export default function ProductDetailClient({ category, slug, initialProduct }: Props) {
  const [product, setProduct] = useState<any>(initialProduct || null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(!initialProduct);

  const [activeImg, setActiveImg] = useState(
    initialProduct ? (parseImages(initialProduct.imagesUrl)?.[0] ?? "") : ""
  );
  const [activeTab, setActiveTab] = useState("mota");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pData, pList] = await Promise.all([
          initialProduct ? Promise.resolve(initialProduct) : getProductDetail(slug),
          getProducts("tat-ca"),
        ]);
        if (pData) {
          setProduct(pData);
          const imgs = parseImages(pData.imagesUrl);
          setActiveImg(imgs[0] || "/placeholder.jpg");
        }
        setAllProducts(pList || []);
      } catch (error) {
        console.error("Lỗi tải chi tiết sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading)
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-[1280px] mx-auto px-6 py-6">
          {/* Nút quay lại */}
          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded mb-8" />

          {/* Layout 2 cột */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            {/* Cột trái: ảnh */}
            <div className="flex flex-col gap-4">
              <div className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
              <div className="flex gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-[75px] h-[75px] bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            </div>

            {/* Cột phải: thông tin */}
            <div className="flex flex-col gap-4 pt-2">
              <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4" />
              <div className="h-6 bg-gray-200 animate-pulse rounded w-1/2" />
              <div className="h-12 bg-gray-200 animate-pulse rounded w-36 mt-4" />
              {/* Tags sản phẩm liên quan */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-9 w-24 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="h-12 bg-gray-200 animate-pulse rounded w-64 mb-6" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-4 bg-gray-200 animate-pulse rounded"
                style={{ width: `${90 - i * 8}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );

  if (!product) return notFound();

  const images = parseImages(product.imagesUrl);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = galleryIndex === images.length - 1 ? 0 : galleryIndex + 1;
    setGalleryIndex(nextIdx);
    setActiveImg(images[nextIdx]);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIdx = galleryIndex === 0 ? images.length - 1 : galleryIndex - 1;
    setGalleryIndex(prevIdx);
    setActiveImg(images[prevIdx]);
  };

  return (
    <div className="bg-white min-h-screen text-black font-sans relative">
      <main className="max-w-[1280px] mx-auto px-6 py-6 w-full flex flex-col min-h-[80vh]">

        {/* NÚT QUAY LẠI */}
        <div className="mb-8">
          <Link href={`/san-pham/${category}`} className="text-[#007bff] text-[15px] flex items-center gap-2 hover:underline w-fit">
            <span>←</span> Quay lại
          </Link>
        </div>

        {/* KHỐI NỘI DUNG CHÍNH */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-12 flex-grow">

          {/* CỘT BÊN TRÁI: GALLERY ẢNH */}
          <div className="flex flex-col gap-4">
            <div
              className="bg-white flex items-center justify-center min-h-[400px] cursor-pointer relative group border border-gray-100 rounded-[8px] overflow-hidden"
              onClick={() => {
                setGalleryIndex(images.indexOf(activeImg) !== -1 ? images.indexOf(activeImg) : 0);
                setIsGalleryOpen(true);
              }}
            >
              <img
                src={activeImg}
                alt={product.name}
                className="max-w-full max-h-[450px] object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-800 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg transition-all transform translate-y-2 group-hover:translate-y-0">
                  <ZoomIn size={16} /> Phóng to
                </span>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImg(img)}
                    className={`w-[75px] h-[75px] rounded border p-1 shrink-0 cursor-pointer transition-all ${
                      activeImg === img
                        ? "border-[#007bff] ring-1 ring-[#007bff]"
                        : "border-gray-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CỘT BÊN PHẢI */}
          <div className="flex flex-col pt-2">
            <h1 className="text-[30px] font-medium text-[#222] mb-6">{product.name}</h1>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-fit px-16 py-3 bg-[#007bff] text-white font-medium rounded-[4px] text-[16px] mb-10 hover:bg-blue-700 transition-colors"
            >
              Liên hệ
            </button>

            <div className="flex flex-wrap gap-2.5">
              {allProducts?.slice(0, 24).map((p: any) => (
                <Link
                  key={p.id}
                  href={`/san-pham/${p.category_slug || category}/${p.slug}`}
                  className={`px-4 py-2 border rounded-[4px] text-[13px] text-center transition-all flex items-center justify-center ${
                    p.slug === slug
                      ? "bg-[#007bff] text-white border-[#007bff]"
                      : "bg-[#fafafa] text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {p.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* TABS KỸ THUẬT */}
        <div className="mt-auto">
          <div className="flex border border-gray-200 rounded-[4px] overflow-hidden w-full max-w-[1000px]">
            <button
              onClick={() => setActiveTab("mota")}
              className={`flex-1 sm:flex-none px-10 py-3.5 font-medium text-[15px] text-center transition-all border-b-2 ${
                activeTab === "mota"
                  ? "text-[#007bff] border-[#007bff] bg-white"
                  : "text-gray-500 border-transparent bg-gray-50 hover:bg-gray-100"
              }`}
            >
              Mô tả
            </button>
            <button
              onClick={() => setActiveTab("thongso")}
              className={`flex-1 sm:flex-none px-10 py-3.5 font-medium text-[15px] text-center transition-all border-b-2 ${
                activeTab === "thongso"
                  ? "text-[#007bff] border-[#007bff] bg-white"
                  : "text-gray-500 border-transparent bg-gray-50 hover:bg-gray-100"
              }`}
            >
              Thông số kỹ thuật
            </button>
            <button
              onClick={() => setActiveTab("danhgia")}
              className={`flex-1 sm:flex-none px-10 py-3.5 font-medium text-[15px] text-center transition-all border-b-2 ${
                activeTab === "danhgia"
                  ? "text-[#007bff] border-[#007bff] bg-white"
                  : "text-gray-500 border-transparent bg-gray-50 hover:bg-gray-100"
              }`}
            >
              Đánh giá
            </button>
          </div>

            <div className="py-8 text-[15px] text-gray-700 leading-relaxed min-h-[250px]">
              {activeTab === "mota" ? (
                <article
                  className="prose prose-slate max-w-none prose-img:rounded-md prose-img:mx-auto whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: product.description || "Đang cập nhật nội dung..." }}
                />
              ) : activeTab === "thongso" ? (
                <div className="space-y-3 whitespace-pre-wrap">
                  {product.specifications ? (
                    <div dangerouslySetInnerHTML={{ __html: product.specifications }} />
                  ) : (
                    <p>Đang cập nhật thông số kỹ thuật...</p>
                  )}
                </div>
              ) : (
                <ProductReviews slug={slug} />
              )}
            </div>
        </div>
      </main>

     <RegisterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Liên hệ tư vấn" productName={product.name} />

      {/* LIGHTBOX */}
      {isGalleryOpen && (
        <div
          className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setIsGalleryOpen(false)}
        >
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
            onClick={() => setIsGalleryOpen(false)}
          >
            <X size={32} />
          </button>

          <div className="relative flex items-center justify-center w-full h-full max-h-screen p-4 md:p-12">
            <img
              src={images[galleryIndex] || activeImg}
              alt={product.name}
              className="max-w-full max-h-full object-contain cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 p-3 rounded-full transition-all"
                onClick={prevImage}
              >
                <ChevronLeft size={40} />
              </button>
              <button
                className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 p-3 rounded-full transition-all"
                onClick={nextImage}
              >
                <ChevronRight size={40} />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-[14px] font-medium tracking-widest bg-black/50 px-4 py-1.5 rounded-full">
                {galleryIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
