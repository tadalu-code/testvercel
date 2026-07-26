"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, X, ShoppingCart, Star } from "lucide-react";
import RegisterModal from "./RegisterModal";
import { useCart } from "@/context/CartContext";
import WishlistButton from "./WishlistButton";

interface Product {
  id: string;
  name: string;
  slug: string;
  imagesUrl: string[];
  price?: number | null;
  salePrice?: number | null;
  stock?: number;
  unit?: string | null;
  category?: { name: string; slug: string } | null;
  category_slug?: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

function ProductCard({ product, onContactClick }: { product: Product; onContactClick: () => void }) {
  const { addItem, openCart } = useCart();
  const hasPrice = (product.price != null && product.price > 0) || (product.salePrice != null && product.salePrice > 0);
  const displayPrice = product.salePrice ?? product.price;
  const isOnSale = product.salePrice != null && product.price != null && product.salePrice < product.price;
  const outOfStock = (product.stock ?? 1) === 0;
  const catSlug = product.category?.slug || product.category_slug || "tat-ca";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price ?? 0,
      salePrice: product.salePrice,
      image: product.imagesUrl?.[0],
      slug: product.slug,
      categorySlug: catSlug,
      unit: product.unit,
    });
  };

  return (
    <Link
      href={`/san-pham/${catSlug}/${product.slug}`}
      className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Ảnh */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
        <img
          src={product.imagesUrl?.[0] || "/placeholder.jpg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Nút Yêu thích */}
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton productId={product.id} iconSize={16} className="!p-1.5" />
        </div>
        {/* Badge */}
        {isOnSale && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{Math.round(((product.price! - product.salePrice!) / product.price!) * 100)}%
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-gray-700 text-[12px] font-bold px-3 py-1 rounded-full">
              Hết hàng
            </span>
          </div>
        )}

        {/* Nút thêm giỏ hàng (hover) */}
        {!outOfStock && hasPrice && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 bg-[#028046] text-white p-2 rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-lg hover:bg-[#016a38]"
            title="Thêm vào giỏ"
          >
            <ShoppingCart size={15} />
          </button>
        )}
      </div>

      {/* Thông tin */}
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-[13px] font-medium text-gray-800 line-clamp-2 min-h-[36px] group-hover:text-[#028046] transition-colors leading-tight">
          {product.name}
        </h3>

        {/* Giá */}
        <div className="mt-2 mb-3">
          {hasPrice ? (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[15px] font-bold text-[#e74c3c]">
                {formatPrice(displayPrice!)}
              </span>
              {isOnSale && (
                <span className="text-[11px] text-gray-400 line-through">
                  {formatPrice(product.price!)}
                </span>
              )}
              {product.unit && (
                <span className="text-[11px] text-gray-400">/{product.unit}</span>
              )}
            </div>
          ) : (
            <span className="text-[13px] text-[#028046] font-medium">Liên hệ để có giá</span>
          )}
        </div>

        {/* Nút */}
        <div className="mt-auto">
          {hasPrice && !outOfStock ? (
            <button
              onClick={handleAddToCart}
              className="w-full py-2 bg-[#028046] hover:bg-[#016a38] text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <ShoppingCart size={13} /> Thêm vào giỏ
            </button>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onContactClick(); }}
              className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-semibold rounded-lg transition-colors"
            >
              Liên hệ
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProductList({ activeCat: initialActiveCat }: { activeCat: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCat, setCurrentCat] = useState(initialActiveCat);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        const cats = Array.isArray(d) ? d : (d.data?.categories || d.data || []);
        setCategories(cats);
      })
      .catch(err => console.error("Failed to fetch categories:", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const catParam = currentCat !== "tat-ca" ? `&categorySlugs=${currentCat}` : "";
    fetch(`/api/products?limit=48${catParam}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.data?.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentCat]);

  const handleCategoryClick = (catSlug: string) => {
    setCurrentCat(catSlug);
    setSearchTerm("");
    const newUrl = catSlug === "tat-ca" ? "/san-pham" : `/san-pham/${catSlug}`;
    window.history.pushState(null, "", newUrl);
  };

  // Lọc + sắp xếp
  let filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (sortBy === "price-asc") filtered = [...filtered].sort((a, b) => (a.salePrice ?? a.price ?? 0) - (b.salePrice ?? b.price ?? 0));
  if (sortBy === "price-desc") filtered = [...filtered].sort((a, b) => (b.salePrice ?? b.price ?? 0) - (a.salePrice ?? a.price ?? 0));

  return (
    <main className="max-w-[1340px] mx-auto px-4 lg:px-12 py-8 min-h-[70vh] w-full font-sans text-black">

      {/* THANH TÌM KIẾM + SẮP XẾP */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-200 rounded-full py-3 pl-6 pr-14 outline-none focus:border-[#028046] shadow-sm bg-white text-[15px]"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1">
              <X size={18} />
            </button>
          )}
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        {/* Sắp xếp */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-200 rounded-full py-3 px-5 text-[14px] bg-white outline-none focus:border-[#028046] min-w-[180px]"
        >
          <option value="newest">Mới nhất</option>
          <option value="price-asc">Giá: Thấp → Cao</option>
          <option value="price-desc">Giá: Cao → Thấp</option>
        </select>
      </div>

      <div className="max-w-[1200px] mx-auto w-full">

        {/* BỘ LỌC DANH MỤC */}
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-4 scrollbar-hide lg:flex-wrap mb-8 lg:-ml-2">
          <button
            onClick={() => handleCategoryClick("tat-ca")}
            className={`px-5 py-2 rounded-full text-[13px] font-semibold border transition-all ${
              currentCat === "tat-ca"
                ? "bg-[#028046] text-white border-[#028046] shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-[#028046] hover:text-[#028046]"
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`px-5 py-2 rounded-full text-[13px] font-semibold border transition-all ${
                currentCat === cat.slug
                  ? "bg-[#028046] text-white border-[#028046] shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#028046] hover:text-[#028046]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* KẾT QUẢ */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-8 bg-gray-100 rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center w-full py-20 text-gray-400">
            <Search size={40} className="mx-auto mb-3 text-gray-200" />
            <p>Không có sản phẩm nào</p>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-gray-400 mb-4">Hiển thị {filtered.length} sản phẩm</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onContactClick={() => { setSelectedProduct(product.name); setIsModalOpen(true); }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <RegisterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Liên hệ tư vấn"
        productName={selectedProduct}
      />
    </main>
  );
}