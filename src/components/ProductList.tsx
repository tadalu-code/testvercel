"use client";
import { useEffect, useState } from "react";
import { getProducts, getCategories } from "@/services/api";
import Link from "next/link";
import { Search, X } from "lucide-react";
import RegisterModal from "./RegisterModal";

export default function ProductList({ activeCat: initialActiveCat }: { activeCat: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCat, setCurrentCat] = useState(initialActiveCat);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cData = await getCategories();
        setCategories(cData || []);
      } catch (error) {
        console.error("Lỗi lấy danh mục", error);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const pData = await getProducts(currentCat);
        setProducts(pData || []);
      } catch (error) {
        console.error("Lỗi lấy sản phẩm", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [currentCat]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryClick = (catSlug: string) => {
    setCurrentCat(catSlug);
    setSearchTerm("");
    const newUrl = catSlug === "tat-ca" ? "/san-pham" : `/san-pham/${catSlug}`;
    window.history.pushState(null, "", newUrl);
  };

  return (
    <main className="max-w-[1340px] mx-auto px-4 lg:px-12 py-8 min-h-[70vh] w-full font-sans text-black">

      {/* THANH TÌM KIẾM */}
      <div className="max-w-xl mx-auto mb-10 relative">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-200 rounded-full py-3 pl-6 pr-14 outline-none focus:border-[#007bff] shadow-sm bg-white text-[15px]"
        />

        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
          >
            <X size={18} />
          </button>
        )}

        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      </div>

      {/* KHUNG GỘP CHUNG BỘ LỌC VÀ SẢN PHẨM */}
      <div className="max-w-[1200px] mx-auto w-full">
        
        {/* BỘ LỌC DANH MỤC */}
        
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-4 scrollbar-hide lg:flex-wrap mb-10 lg:-ml-2">
          <button
            onClick={() => handleCategoryClick("tat-ca")}
            className={`px-7 py-2.5 rounded-full text-[13px] font-bold border transition-all ${
              currentCat === "tat-ca" 
                ? "bg-[#007bff] text-white border-[#007bff]" 
                : "bg-[#f1f1f1] text-gray-500 border-transparent hover:bg-gray-200"
            }`}
          >
            Tất cả
          </button>

          {categories.map((cat: any) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`px-7 py-2.5 rounded-full text-[13px] font-bold border transition-all ${
                currentCat === cat.slug 
                  ? "bg-[#007bff] text-white border-[#007bff]" 
                  : "bg-[#f1f1f1] text-gray-500 border-transparent hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* HIỂN THỊ LOADING HOẶC KẾT QUẢ */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-[#00a651] rounded-full animate-spin"></div>
            <p className="font-bold text-gray-400 uppercase text-[12px]">Đang tải...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center w-full py-10 text-gray-500 text-[15px]">
            Không có sản phẩm nào
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {filteredProducts.map((product: any) => (
              <Link
                key={product.id}
                href={`/san-pham/${product.category_slug || currentCat}/${product.slug}`}
                className="group bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col overflow-hidden"
              >
                
                {/* Tỷ lệ aspect-[4/3] và object-cover giúp ảnh lùn lại và tràn viền */}
                <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img
                    src={product.imagesUrl?.[0] || "/placeholder.jpg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* KHỐI CHỨA CHỮ VÀ NÚT LIÊN HỆ */}
                <div className="p-3 lg:p-4 flex flex-col flex-grow border-t border-gray-50">
                  <h3 className="text-[14px] font-medium text-gray-800 line-clamp-2 min-h-[40px] group-hover:text-[#007bff] transition-colors">
                    {product.name}
                  </h3>

                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedProduct(product.name);
                      setIsModalOpen(true);
                    }}
                    className="mt-3 w-full py-2 bg-[#007bff] text-white text-[13px] font-medium text-center rounded-[4px] hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Liên hệ
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* MODAL LIÊN HỆ */}
      <RegisterModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Liên hệ tư vấn" 
        productName={selectedProduct} 
      />
    </main>
  );
}