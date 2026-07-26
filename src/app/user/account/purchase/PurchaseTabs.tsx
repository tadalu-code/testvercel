"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Truck, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, MapPin, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

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

  // Detail modal state
  const [detailOrder, setDetailOrder] = useState<any | null>(null);

  // Edit Address states
  const [editAddressOrderId, setEditAddressOrderId] = useState<string | null>(null);
  const [editAddressLoading, setEditAddressLoading] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<{code: string, name: string} | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<{code: string, name: string} | null>(null);
  const [addressForm, setAddressForm] = useState({ fullName: "", phone: "", addressDetail: "", note: "" });

  const router = useRouter();

  useEffect(() => {
    fetch("https://production.cas.so/address-kit/latest/provinces")
      .then(res => res.json())
      .then(data => setProvinces(data.provinces || []))
      .catch(console.error);

    fetch("/api/cancel-reasons")
      .then(res => res.json())
      .then(data => {
        if (data.data) setCancelReasons(data.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      fetch(`https://production.cas.so/address-kit/latest/provinces/${selectedProvince.code}/communes`)
        .then(res => res.json())
        .then(data => {
          setCommunes(data.communes || []);
          // if province changed, reset commune
          setSelectedCommune(null);
        })
        .catch(console.error);
    } else {
      setCommunes([]);
      setSelectedCommune(null);
    }
  }, [selectedProvince]);

  const openEditAddress = (order: any) => {
    setEditAddressOrderId(order.id);
    setAddressForm({
      fullName: order.fullName || "",
      phone: order.phone || "",
      addressDetail: order.address || "", // Will just pre-fill the whole string into detail for simplicity, or they can re-enter
      note: order.note || "",
    });
    // We don't try to parse province/commune from string perfectly, just let them re-select if they want to change it.
    setSelectedProvince(null);
    setSelectedCommune(null);
  };

  const submitAddressChange = async () => {
    if (!addressForm.fullName || !addressForm.phone || !addressForm.addressDetail) {
      toast.error("Vui lòng điền đầy đủ họ tên, SĐT và địa chỉ chi tiết!");
      return;
    }
    
    // Nếu họ có chọn tỉnh/xã mới thì nối vào, không thì dùng y nguyên cái addressDetail (giữ nguyên địa chỉ cũ)
    let finalAddress = addressForm.addressDetail;
    if (selectedProvince && selectedCommune) {
       finalAddress = `${addressForm.addressDetail}, ${selectedCommune.name}, ${selectedProvince.name}`;
    }

    setEditAddressLoading(true);
    try {
      const res = await fetch(`/api/orders/${editAddressOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: addressForm.fullName,
          phone: addressForm.phone,
          address: finalAddress,
          note: addressForm.note
        })
      });
      if (!res.ok) throw new Error("Không thể cập nhật địa chỉ");
      toast.success("Cập nhật địa chỉ nhận hàng thành công!");
      setEditAddressOrderId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật địa chỉ");
    } finally {
      setEditAddressLoading(false);
    }
  };

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
      toast.success("Cảm ơn bạn đã xác nhận nhận hàng!");
      router.refresh();
    } catch (err) {
      toast.error("Lỗi: Không thể cập nhật trạng thái");
    } finally {
      setUpdating(null);
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelModalOrderId || !selectedReason) {
      toast.error("Vui lòng chọn lý do hủy đơn");
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
      toast.success("Đã gửi yêu cầu hủy đơn hàng!");
      setCancelModalOrderId(null);
      setSelectedReason("");
      setCancelDetail("");
      router.refresh();
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleRetryPayment = async (orderId: string) => {
    try {
      const toastId = toast.loading("Đang tạo link thanh toán...");
      const res = await fetch("/api/vnpay/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      toast.dismiss(toastId);

      if (!res.ok) {
        toast.error(data.error || "Không thể tạo link thanh toán");
        return;
      }

      if (data.vnpUrl) {
        window.location.href = data.vnpUrl;
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Đã xảy ra lỗi, vui lòng thử lại");
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
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${order.paymentMethod === 'VNPAY' && order.paymentStatus === 'UNPAID' && order.status === 'PENDING' ? 'text-red-600 bg-red-50' : STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                    {order.paymentMethod === 'VNPAY' && order.paymentStatus === 'UNPAID' && order.status === 'PENDING' ? 'CHỜ THANH TOÁN' : (STATUS_LABELS[order.status] || order.status)}
                  </span>
                  {order.paymentMethod !== 'COD' && order.paymentStatus === 'PAID' && (
                    <span className="text-[#028046] text-[10px] font-bold bg-[#028046]/10 px-2 py-0.5 rounded border border-[#028046]/20">
                      ĐÃ THANH TOÁN
                    </span>
                  )}
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
                        <Link href={item.product?.slug ? `/san-pham/${item.product?.category?.slug || 'danh-muc'}/${item.product.slug}` : "#"} className="text-sm lg:text-base font-medium text-gray-800 hover:text-[#00a651] line-clamp-2 transition-colors">
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
              <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center flex-wrap gap-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDetailOrder(order)}
                    className="px-4 py-2 border border-[#00a651] text-[#00a651] bg-white text-sm font-semibold rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Xem chi tiết
                  </button>
                  {order.status === "DELIVERED" && (
                    <button
                      onClick={() => setConfirmModalOrderId(order.id)}
                      disabled={updating === order.id}
                      className="px-4 py-2 bg-[#00a651] text-white text-sm font-semibold rounded-lg hover:bg-[#009040] transition-colors disabled:opacity-60"
                    >
                      Đã nhận hàng
                    </button>
                  )}
                  
                  {/* Nút Đổi Địa Chỉ */}
                  {order.status === "PENDING" && !order.isCancelRequested && order.paymentStatus !== "UNPAID" && (
                    <button
                      onClick={() => openEditAddress(order)}
                      className="px-4 py-2 border border-[#00a651] text-[#00a651] bg-white text-sm font-semibold rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1.5"
                    >
                      <Edit3 size={16} /> Đổi địa chỉ
                    </button>
                  )}

                  {/* Nút Thanh toán lại */}
                  {order.paymentMethod === 'VNPAY' && order.paymentStatus === 'UNPAID' && order.status === 'PENDING' && (
                    <button
                      onClick={() => handleRetryPayment(order.id)}
                      className="px-4 py-2 bg-[#00a651] text-white text-sm font-semibold rounded-lg hover:bg-[#009040] transition-colors shadow-sm"
                    >
                      Thanh toán lại
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
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Yêu cầu hủy đơn hàng</h3>
              <p className="text-sm text-gray-500">Mã đơn: <span className="font-bold text-black">#{cancelModalOrderId.slice(-8).toUpperCase()}</span></p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do hủy đơn <span className="text-red-500">*</span></label>
                <select 
                  value={selectedReason} 
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a651]/20 focus:border-[#00a651] transition-all bg-gray-50 hover:bg-white"
                >
                  <option value="" disabled>-- Chọn lý do --</option>
                  {cancelReasons.map(r => (
                    <option key={r.id} value={r.id}>{r.content}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả chi tiết (Tùy chọn)</label>
                <textarea
                  value={cancelDetail}
                  onChange={(e) => setCancelDetail(e.target.value)}
                  placeholder="Nhập thêm thông tin nếu có..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a651]/20 focus:border-[#00a651] transition-all min-h-[100px] resize-none bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCancelModalOrderId(null)}
                disabled={cancelSubmitting}
                className="flex-1 py-3 px-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors disabled:opacity-60"
              >
                Đóng
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={cancelSubmitting}
                className="flex-[1.5] flex items-center justify-center gap-2 py-3 px-4 text-white bg-red-600 hover:bg-red-700 rounded-xl font-bold shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cancelSubmitting ? <Loader2 size={18} className="animate-spin" /> : <AlertTriangle size={18} />}
                Xác nhận gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200" onClick={() => setDetailOrder(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 lg:p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Chi tiết đơn hàng #{detailOrder.id.slice(-8).toUpperCase()}</h3>
              <button onClick={() => setDetailOrder(null)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-4 lg:p-6 overflow-y-auto space-y-6">
              {/* Trạng thái đơn hàng */}
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="font-semibold text-gray-700">Trạng thái:</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-lg ${
                  detailOrder.status === 'PENDING' ? 'bg-orange-100 text-orange-600' :
                  detailOrder.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-600' :
                  detailOrder.status === 'SHIPPING' ? 'bg-indigo-100 text-indigo-600' :
                  detailOrder.status === 'DELIVERED' ? 'bg-teal-100 text-teal-600' :
                  detailOrder.status === 'COMPLETED' ? 'bg-green-100 text-[#00a651]' :
                  detailOrder.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {detailOrder.status === 'PENDING' ? 'Chờ xác nhận' :
                   detailOrder.status === 'CONFIRMED' ? 'Đã xác nhận' :
                   detailOrder.status === 'SHIPPING' ? 'Đang giao hàng' :
                   detailOrder.status === 'DELIVERED' ? 'Đã giao hàng' :
                   detailOrder.status === 'COMPLETED' ? 'Hoàn thành' :
                   detailOrder.status === 'CANCELLED' ? 'Đã hủy' : detailOrder.status}
                </span>
                {detailOrder.paymentMethod !== 'COD' && detailOrder.paymentStatus === 'PAID' && (
                  <span className="px-3 py-1 text-sm font-bold rounded-lg bg-[#028046]/10 text-[#028046] ml-2 border border-[#028046]/20">
                    ĐÃ THANH TOÁN
                  </span>
                )}
              </div>
              
              {/* Lý do hủy (nếu có) */}
              {detailOrder.status === 'CANCELLED' && detailOrder.cancelReason && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-sm">
                  <div className="font-semibold text-red-700 mb-1 flex items-center gap-2">
                    <AlertTriangle size={16} /> Lý do hủy đơn
                  </div>
                  <p className="text-red-600/90 whitespace-pre-wrap">{detailOrder.cancelReason}</p>
                </div>
              )}

              {/* Thông tin giao hàng */}
              <div className="bg-gray-50 p-4 lg:p-5 rounded-xl space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Truck size={18} className="text-[#00a651]" /> Thông tin nhận hàng
                </h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p className="flex"><span className="text-gray-500 font-medium w-24 shrink-0">Họ tên:</span> <span className="font-semibold text-black">{detailOrder.fullName}</span></p>
                  <p className="flex"><span className="text-gray-500 font-medium w-24 shrink-0">SĐT:</span> <span className="font-semibold text-black">{detailOrder.phone}</span></p>
                  <p className="flex"><span className="text-gray-500 font-medium w-24 shrink-0">Địa chỉ:</span> <span className="font-semibold text-black">{detailOrder.address}</span></p>
                  {detailOrder.note && <p className="flex"><span className="text-gray-500 font-medium w-24 shrink-0">Ghi chú:</span> <span className="text-black italic">{detailOrder.note}</span></p>}
                </div>
              </div>

              {/* Sản phẩm */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Package size={18} className="text-[#00a651]" /> Sản phẩm đã đặt
                </h4>
                <div className="space-y-3 border border-gray-100 rounded-xl p-3 lg:p-4">
                  {detailOrder.items.map((item: any) => (
                    <div key={item.id} className="flex gap-4 py-3 border-b border-gray-50 last:border-0 last:pb-0 first:pt-0">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-100 rounded-lg border border-gray-100 overflow-hidden shrink-0">
                        {item.product?.imagesUrl?.[0] ? (
                          <img src={item.product.imagesUrl[0]} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-sm flex flex-col justify-between">
                        <Link href={item.product?.slug ? `/san-pham/${item.product?.category?.slug || 'danh-muc'}/${item.product.slug}` : "#"} className="font-medium text-[15px] text-gray-800 hover:text-[#00a651] line-clamp-2 transition-colors">
                          {item.name}
                        </Link>
                        <div className="flex justify-between items-end mt-2">
                          <span className="text-gray-500 font-medium">x{item.quantity}</span>
                          <span className="font-bold text-[#00a651] text-base">{item.price.toLocaleString("vi-VN")}đ</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng tiền */}
              <div className="bg-red-50/50 p-4 rounded-xl flex justify-between items-center border border-red-50">
                <span className="font-semibold text-gray-700">Tổng thanh toán:</span>
                <span className="text-xl font-bold text-red-600">{detailOrder.totalAmount.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>
            
            <div className="p-4 lg:p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setDetailOrder(null)}
                className="w-full py-3 bg-gray-800 hover:bg-black text-white rounded-xl font-bold shadow-sm transition-colors uppercase tracking-wider text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Address Modal */}
      {editAddressOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={() => !editAddressLoading && setEditAddressOrderId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MapPin size={22} className="text-[#00a651]" /> Thay đổi địa chỉ
              </h3>
              <button onClick={() => !editAddressLoading && setEditAddressOrderId(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên *</label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#00a651] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại *</label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#00a651] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Khu vực (Chọn mới để đổi)</label>
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={selectedProvince?.code || ""}
                    onChange={(e) => {
                      const p = provinces.find(x => x.code === e.target.value);
                      setSelectedProvince(p || null);
                    }}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#00a651] outline-none"
                  >
                    <option value="">Tỉnh/Thành phố</option>
                    {provinces.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                  <select 
                    value={selectedCommune?.code || ""}
                    onChange={(e) => {
                      const w = communes.find(x => x.code === e.target.value);
                      setSelectedCommune(w || null);
                    }}
                    disabled={!selectedProvince}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#00a651] outline-none disabled:bg-gray-100"
                  >
                    <option value="">Phường/Xã</option>
                    {communes.map(w => (
                      <option key={w.code} value={w.code}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ chi tiết *</label>
                <input
                  type="text"
                  value={addressForm.addressDetail}
                  onChange={(e) => setAddressForm({ ...addressForm, addressDetail: e.target.value })}
                  placeholder="Số nhà, tên đường..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#00a651] outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
                <input
                  type="text"
                  value={addressForm.note}
                  onChange={(e) => setAddressForm({ ...addressForm, note: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#00a651] outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditAddressOrderId(null)}
                disabled={editAddressLoading}
                className="flex-1 py-3 px-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                onClick={submitAddressChange}
                disabled={editAddressLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-white bg-[#00a651] hover:bg-[#009040] rounded-xl font-bold shadow-sm transition-colors disabled:opacity-60"
              >
                {editAddressLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
