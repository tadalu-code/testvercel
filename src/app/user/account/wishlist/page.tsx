"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Heart, Trash2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

function parseFirstImage(urlStr: any): string | null {
  try {
    if (!urlStr) return null;
    if (Array.isArray(urlStr)) return urlStr[0] ?? null;
    const arr = JSON.parse(urlStr.trim().replace(/^['\"]|['\"]$/g, ""));
    return Array.isArray(arr) ? arr[0] ?? null : null;
  } catch {
    const match = urlStr?.match(/https?:\/\/[^\s"\\]+/);
    return match ? match[0] : null;
  }
}

export default function WishlistPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [wishlists, setWishlists] = useState<any[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    fetchWishlists();
  }, [session, status, router]);

  const fetchWishlists = async () => {
    try {
      const res = await fetch("/api/wishlist");
      const data = await res.json();
      if (res.ok) {
        setWishlists(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      if (res.ok) {
        setWishlists(prev => prev.filter(w => w.productId !== productId));
        toast.success("Đã bỏ yêu thích");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleAddToCart = (product: any) => {
    const displayPrice = product.salePrice ?? product.price ?? 0;
    const img = parseFirstImage(product.imagesUrl) || "/placeholder.jpg";
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price ?? 0,
      salePrice: product.salePrice,
      image: img,
      slug: product.slug,
      categorySlug: "tat-ca",
      unit: product.unit,
    }, 1);
    toast.success("Đã thêm vào giỏ hàng");
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[#00a651]" size={32} /></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Sản Phẩm Yêu Thích</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý những sản phẩm bạn đã lưu để mua sau
          </p>
        </div>
        <div className="bg-red-50 text-red-500 p-3 rounded-full">
          <Heart size={24} className="fill-red-500" />
        </div>
      </div>

      <div className="p-6">
        {wishlists.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <Heart size={64} className="text-gray-200 mb-4" />
            <p className="text-gray-500 mb-6 text-lg">Bạn chưa có sản phẩm yêu thích nào.</p>
            <Link 
              href="/san-pham"
              className="bg-[#00a651] text-white px-8 py-3 rounded-[4px] font-medium hover:bg-[#008f45] transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishlists.map((item) => {
              const product = item.product;
              const img = parseFirstImage(product.imagesUrl) || "/placeholder.jpg";
              const hasPrice = product.price > 0;
              const isOut = product.stock === 0;

              return (
                <div key={item.id} className="border border-gray-100 rounded-lg p-4 flex gap-4 hover:border-[#00a651] transition-colors group relative bg-gray-50/50">
                  <Link href={`/san-pham/tat-ca/${product.slug}`} className="w-24 h-24 shrink-0 bg-white rounded-md border border-gray-100 overflow-hidden">
                    <img src={img} alt={product.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <Link href={`/san-pham/tat-ca/${product.slug}`} className="font-medium text-gray-800 hover:text-[#00a651] line-clamp-2 text-[15px] leading-snug">
                        {product.name}
                      </Link>
                      
                      <div className="mt-2">
                        {hasPrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-red-500 font-bold text-[15px]">{formatPrice(product.salePrice ?? product.price)}</span>
                            {product.salePrice && (
                              <span className="text-gray-400 line-through text-[12px]">{formatPrice(product.price)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#00a651] text-[14px] font-medium">Liên hệ tư vấn</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      {hasPrice && !isOut ? (
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 bg-[#00a651] text-white py-1.5 rounded-[4px] text-[13px] font-medium hover:bg-[#008f45] transition-colors flex items-center justify-center gap-1"
                        >
                          <ShoppingCart size={14} /> Thêm vào giỏ
                        </button>
                      ) : (
                        <span className="flex-1 text-center py-1.5 bg-gray-200 text-gray-500 rounded-[4px] text-[13px] font-medium">
                          {isOut ? "Hết hàng" : "Liên hệ"}
                        </span>
                      )}
                      
                      <button 
                        onClick={() => handleRemove(product.id)}
                        className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded transition-colors"
                        title="Bỏ yêu thích"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
