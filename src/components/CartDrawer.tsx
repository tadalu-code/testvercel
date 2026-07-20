"use client";
import { useCart } from "@/context/CartContext";
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, totalItems, totalAmount } = useCart();

  // Ngăn scroll body khi drawer mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Overlay tối */}
      <div
        className={`fixed inset-0 bg-black/40 z-[998] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[400px] bg-white z-[999] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#028046]" />
            <h2 className="font-bold text-gray-800 text-[16px]">Giỏ hàng</h2>
            {totalItems > 0 && (
              <span className="bg-[#028046] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
              <ShoppingBag size={56} className="text-gray-200" />
              <p className="text-[14px]">Giỏ hàng trống</p>
              <button
                onClick={closeCart}
                className="text-[#028046] text-[13px] font-medium hover:underline"
              >
                Tiếp tục mua sắm →
              </button>
            </div>
          ) : (
            items.map((item) => {
              const price = item.salePrice ?? item.price;
              return (
                <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0">
                  {/* Ảnh */}
                  <div className="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                  </div>

                  {/* Thông tin */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-tight">
                      {item.name}
                    </p>
                    {item.unit && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.unit}</p>
                    )}
                    <p className="text-[14px] font-bold text-[#028046] mt-1">
                      {formatPrice(price)}
                    </p>

                    {/* Điều chỉnh số lượng + xóa */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-[13px] font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer — Tổng tiền + Thanh toán */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-600">Tạm tính:</span>
              <span className="text-[16px] font-bold text-gray-900">{formatPrice(totalAmount)}</span>
            </div>
            <p className="text-[11px] text-gray-400">Phí vận chuyển tính khi thanh toán</p>
            <Link
              href="/thanh-toan"
              onClick={closeCart}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#028046] hover:bg-[#016a38] text-white font-bold text-[14px] rounded-xl transition-colors"
            >
              Tiến hành thanh toán <ArrowRight size={16} />
            </Link>
            <button
              onClick={closeCart}
              className="w-full py-2.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>
    </>
  );
}
