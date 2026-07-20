"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Truck, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Tương ứng với OrderStatus trong Prisma
const TABS = [
  { id: "ALL", label: "Tất cả" },
  { id: "PENDING", label: "Chờ xác nhận" },
  { id: "CONFIRMED", label: "Đã xác nhận" },
  { id: "SHIPPING", label: "Đang giao" },
  { id: "DELIVERED", label: "Đã giao" },
  { id: "COMPLETED", label: "Hoàn thành" },
  { id: "CANCELLED", label: "Đã hủy" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-600 bg-amber-50",
  CONFIRMED: "text-blue-600 bg-blue-50",
  SHIPPING: "text-purple-600 bg-purple-50",
  DELIVERED: "text-teal-600 bg-teal-50",
  COMPLETED: "text-[#00a651] bg-green-50",
  CANCELLED: "text-red-600 bg-red-50",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "CHỜ XÁC NHẬN",
  CONFIRMED: "ĐÃ XÁC NHẬN",
  SHIPPING: "ĐANG GIAO",
  DELIVERED: "ĐÃ GIAO",
  COMPLETED: "HOÀN THÀNH",
  CANCELLED: "ĐÃ HỦY",
};

export default function PurchaseTabs({ orders }: { orders: any[] }) {
  const [activeTab, setActiveTab] = useState("ALL");
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmModalOrderId, setConfirmModalOrderId] = useState<string | null>(null);
  
  // Cancel states
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelReasons, setCancelReasons] = useState<any[]>([]);
  const [selectedReason, setSelectedReason] = useState("");
  const [cancelDetail, setCancelDetail] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetch("/api/cancel-reasons")
      .then(res => res.json())
      .then(data => {
        if (data.data) setCancelReasons(data.data);
      })
      .catch(console.error);
  }, []);

  const filteredOrders = activeTab === "ALL" 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  const handleReceive = async (orderId: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      alert("Cảm ơn bạn đã xác nhận nhận hàng!");
      router.refresh();
    } catch (err) {
      alert("Lỗi: Không thể cập nhật trạng thái");
    } finally {
      setUpdating(null);
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelModalOrderId || !selectedReason) {
      alert("Vui lòng chọn lý do hủy đơn");
      return;
    }
    
    setCancelSubmitting(true);
    const reasonText = cancelReasons.find(r => r.id === selectedReason)?.content || "";
    const fullReason = cancelDetail.trim() ? `${reasonText} - Chi tiết: ${cancelDetail}` : reasonText;

    try {
      const res = await fetch(`/api/orders/${cancelModalOrderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: fullReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gửi yêu cầu thất bại");
      alert("Đã gửi yêu cầu hủy đơn hàng!");
      setCancelModalOrderId(null);
      setSelectedReason("");
      setCancelDetail("");
      router.refresh();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setCancelSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] py-4 text-sm font-medium text-center transition-colors whitespace-nowrap px-4 border-b-2 ${
              activeTab === tab.id
                ? "border-[#00a651] text-[#00a651]"
                : "border-transparent text-gray-600 hover:text-[#00a651]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="p-4 lg:p-6 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package size={64} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-600">Chưa có đơn hàng</p>
            <p className="text-sm">Không tìm thấy đơn hàng nào ở trạng thái này</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="flex justify-between items-start lg:items-center px-5 py-3 border-b border-gray-50 bg-gray-50/50 flex-col lg:flex-row gap-2">
                <div className="text-xs lg:text-sm font-medium text-gray-600">
                  Mã đơn: <span className="text-black">#{order.id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex flex-col lg:items-end items-start gap-1">
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  {order.isCancelRequested && order.status !== "CANCELLED" && (
                    <span className="text-orange-500 text-xs font-medium">Đang chờ duyệt hủy đơn</span>
                  )}
                  {order.status === "CANCELLED" && order.cancelReason && (
                    <span className="text-red-500 text-xs italic line-clamp-1 max-w-[200px]">Lý do: {order.cancelReason}</span>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="px-5 py-4 divide-y divide-gray-50">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-100 overflow-hidden shrink-0">
                      {item.product?.imagesUrl?.[0] ? (
                        <img src={item.product.imagesUrl[0]} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <Link href={item.product?.slug ? `/san-pham/${item.product.slug}` : "#"} className="text-sm lg:text-base font-medium text-gray-800 hover:text-[#00a651] line-clamp-2 transition-colors">
                          {item.name}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1">x{item.quantity}</div>
                      </div>
                      <div className="text-[#00a651] font-semibold text-sm lg:text-base text-right mt-2 lg:mt-0">
                        {item.price.toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center">
                <div className="flex gap-2">
                  {order.status === "DELIVERED" && (
                    <button
                      onClick={() => setConfirmModalOrderId(order.id)}
                      disabled={updating === order.id}
                      className="px-4 py-2 bg-[#00a651] text-white text-sm font-semibold rounded-lg hover:bg-[#009040] transition-colors disabled:opacity-60"
                    >
                      Đã nhận hàng
                    </button>
                  )}
                  
                  {/* Nút Hủy Đơn */}
                  {(order.status === "PENDING" || order.status === "CONFIRMED") && 
                   !order.isCancelRequested &&
                   (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60) <= 24 && (
                    <button
                      onClick={() => setCancelModalOrderId(order.id)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 bg-white text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Thành tiền:</span>
                  <span className="text-lg lg:text-xl font-bold text-red-500">
                    {order.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModalOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={() => setConfirmModalOrderId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 text-[#00a651] rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Xác nhận nhận hàng</h3>
              <p className="text-sm text-gray-600 mb-6">Bạn xác nhận đã nhận được đơn hàng <span className="font-bold text-black">#{confirmModalOrderId.slice(-8).toUpperCase()}</span> nguyên vẹn và đầy đủ sản phẩm?</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModalOrderId(null)}
                className="flex-1 py-2.5 px-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
              >
                Trở lại
              </button>
              <button
                onClick={() => {
                  handleReceive(confirmModalOrderId);
                  setConfirmModalOrderId(null);
                }}
                className="flex-1 py-2.5 px-4 text-white bg-[#00a651] hover:bg-[#009040] rounded-xl font-bold shadow-sm transition-colors"
              >
                Đã nhận hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={() => !cancelSubmitting && setCancelModalOrderId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Yêu cầu hủy đơn hàng</h3>
              <p className="text-sm text-gray-500">Mã đơn: <span className="font-bold text-black">#{cancelModalOrderId.slice(-8).toUpperCase()}</span></p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do hủy đơn *</label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00a651] focus:border-transparent outline-none bg-white"
                  disabled={cancelSubmitting}
                >
                  <option value="">-- Chọn lý do --</option>
                  {cancelReasons.map(r => (
                    <option key={r.id} value={r.id}>{r.content}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết (Tùy chọn)</label>
                <textarea
                  value={cancelDetail}
                  onChange={(e) => setCancelDetail(e.target.value)}
                  placeholder="Ghi chú thêm cho chúng tôi..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00a651] focus:border-transparent outline-none resize-none"
                  disabled={cancelSubmitting}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModalOrderId(null)}
                disabled={cancelSubmitting}
                className="flex-1 py-2.5 px-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={!selectedReason || cancelSubmitting}
                className="flex-1 py-2.5 px-4 text-white bg-red-500 hover:bg-red-600 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {cancelSubmitting && <Loader2 size={16} className="animate-spin" />}
                Xác nhận gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
