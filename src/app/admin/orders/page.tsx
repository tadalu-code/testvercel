"use client";
import { useEffect, useState, useMemo } from "react";
import { ShoppingBag, Clock, CheckCircle, Truck, Package, XCircle, Eye, RefreshCw, Search, Download } from "lucide-react";
import Pagination from "@/components/Pagination";
import * as XLSX from "xlsx";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any; cardBg: string }> = {
  PENDING:   { label: "Chờ xác nhận", color: "bg-yellow-50 text-yellow-700 border-yellow-200",  icon: Clock,       cardBg: "bg-yellow-50/40 hover:bg-yellow-50/70" },
  CONFIRMED: { label: "Đã xác nhận",  color: "bg-blue-50 text-blue-700 border-blue-200",        icon: CheckCircle, cardBg: "bg-blue-50/40 hover:bg-blue-50/70" },
  SHIPPING:  { label: "Đang giao",    color: "bg-purple-50 text-purple-700 border-purple-200",   icon: Truck,       cardBg: "bg-purple-50/40 hover:bg-purple-50/70" },
  DELIVERED: { label: "Đã giao",      color: "bg-teal-50 text-teal-700 border-teal-200",      icon: Package,     cardBg: "bg-teal-50/40 hover:bg-teal-50/70" },
  COMPLETED: { label: "Hoàn thành",   color: "bg-green-50 text-green-700 border-green-300",      icon: CheckCircle, cardBg: "bg-green-50/40 hover:bg-green-50/70" },
  CANCELLED: { label: "Đã hủy",       color: "bg-red-50 text-red-600 border-red-300",            icon: XCircle,     cardBg: "bg-red-50/40 hover:bg-red-50/70" },
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

function formatDate(str: string) {
  return new Date(str).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("ALL");
  const [selected, setSelected] = useState<any | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmModalOrder, setConfirmModalOrder] = useState<any | null>(null);

  // Lọc & sắp xếp
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortPrice, setSortPrice] = useState("");

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch(`/api/orders`);
    const data = await res.json();
    setOrders(data.data?.orders || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, dateFilter, sortPrice]);

  const handleStatusChange = async (order: any, newStatus: string, cancelReason?: string) => {
    if (order.status === newStatus) return;
    setUpdating(order.id);
    try {
      const body: any = { status: newStatus };
      if (cancelReason) body.cancelReason = cancelReason;

      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      
      const newOrder = { ...order, status: newStatus, cancelReason: cancelReason || order.cancelReason };
      setOrders((prev) => prev.map((o) => o.id === order.id ? newOrder : o));
      if (selected?.id === order.id) setSelected(newOrder);
      // alert("Cập nhật trạng thái thành công!");
    } catch (err) {
      alert("Lỗi: Không thể cập nhật trạng thái");
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = async (order: any) => {
    const reason = prompt("Vui lòng nhập lý do hủy đơn hàng này:");
    if (reason === null) return; // User cancelled prompt
    await handleStatusChange(order, "CANCELLED", reason || "Hủy bởi Admin");
  };

  const handleCancelResponse = async (order: any, action: "APPROVE" | "REJECT") => {
    setUpdating(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/cancel-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      
      const newOrder = { 
        ...order, 
        isCancelRequested: false, 
        status: action === "APPROVE" ? "CANCELLED" : order.status
      };
      setOrders((prev) => prev.map((o) => o.id === order.id ? newOrder : o));
      if (selected?.id === order.id) setSelected(newOrder);
    } catch (err) {
      alert("Lỗi: Không thể cập nhật yêu cầu hủy");
    } finally {
      setUpdating(null);
    }
  };

  const counts = orders.reduce((acc: any, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const processedOrders = useMemo(() => {
    let result = [...orders];

    if (filter !== "ALL") {
      result = result.filter(o => o.status === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(q) ||
        (o.fullName && o.fullName.toLowerCase().includes(q)) ||
        (o.phone && o.phone.includes(q))
      );
    }

    if (dateFilter) {
      result = result.filter(o => {
        const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
        return orderDate === dateFilter;
      });
    }

    if (sortPrice === "asc") {
      result.sort((a, b) => a.totalAmount - b.totalAmount);
    } else if (sortPrice === "desc") {
      result.sort((a, b) => b.totalAmount - a.totalAmount);
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [orders, filter, searchQuery, dateFilter, sortPrice]);

  const totalPages = Math.ceil(processedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = processedOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const exportOrders = () => {
    const worksheet = XLSX.utils.json_to_sheet(processedOrders.map(o => ({
      "Mã Đơn": o.id,
      "Tên Khách Hàng": o.fullName,
      "SĐT": o.phone,
      "Địa Chỉ": o.address,
      "Ngày Đặt": formatDate(o.createdAt),
      "Tổng Tiền": o.totalAmount,
      "Trạng Thái": STATUS_MAP[o.status]?.label || o.status,
      "Lý Do Hủy": o.cancelReason || ""
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DonHang");
    XLSX.writeFile(workbook, `Danh_Sach_Don_Hang.xlsx`);
  };

  const renderActionButtons = (order: any) => {
    if (order.isCancelRequested && order.status !== "CANCELLED") {
      return (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handleCancelResponse(order, "APPROVE"); }}
            disabled={updating === order.id}
            className="px-3 py-1.5 bg-red-600 text-white border border-red-600 text-[12px] font-semibold rounded-md hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            Đồng ý hủy
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleCancelResponse(order, "REJECT"); }}
            disabled={updating === order.id}
            className="px-3 py-1.5 text-gray-700 border border-gray-300 text-[12px] font-semibold rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60 bg-white"
          >
            Từ chối
          </button>
        </>
      );
    }

    if (order.status === "PENDING") {
      return (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModalOrder(order); }}
            disabled={updating === order.id}
            className="px-6 py-1.5 bg-blue-600 text-white border border-blue-600 text-[12px] font-semibold rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-sm"
          >
            Xác nhận
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleCancel(order); }}
            disabled={updating === order.id}
            className="px-4 py-1.5 text-red-600 border border-red-200 text-[12px] font-semibold rounded-md hover:bg-red-50 transition-colors disabled:opacity-60 bg-white"
          >
            Hủy
          </button>
        </>
      );
    }
    if (order.status === "CONFIRMED") {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); handleStatusChange(order, "SHIPPING"); }}
          disabled={updating === order.id}
          className="px-6 py-1.5 bg-purple-600 text-white border border-purple-600 text-[12px] font-semibold rounded-md hover:bg-purple-700 transition-colors disabled:opacity-60 shadow-sm"
        >
          Xác nhận giao
        </button>
      );
    }
    if (order.status === "SHIPPING") {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); handleStatusChange(order, "DELIVERED"); }}
          disabled={updating === order.id}
          className="px-6 py-1.5 bg-[#00a651] text-white border border-[#00a651] text-[12px] font-semibold rounded-md hover:bg-[#009040] transition-colors disabled:opacity-60 shadow-sm"
        >
          Đã giao
        </button>
      );
    }
    if (order.status === "DELIVERED") {
      return <div className="text-[12px] text-gray-500 font-medium italic">Chờ khách nhận hàng...</div>;
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Đơn hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">{processedOrders.length} đơn hàng</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportOrders}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
          >
            <Download size={15} /> Xuất Excel
          </button>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors bg-white cursor-pointer"
          >
            <RefreshCw size={15} /> Làm mới
          </button>
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Tìm mã đơn, tên khách hàng, SĐT..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
        <div className="w-full sm:w-[150px]">
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 transition-shadow"
          />
        </div>
        <div className="w-full sm:w-[160px]">
          <select 
            value={sortPrice}
            onChange={(e) => setSortPrice(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 transition-shadow appearance-none"
          >
            <option value="">Mặc định (Mới nhất)</option>
            <option value="desc">Giá: Cao đến thấp</option>
            <option value="asc">Giá: Thấp đến cao</option>
          </select>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["ALL", "PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "COMPLETED", "CANCELLED"].map((s) => {
          const info = s === "ALL" ? { label: "Tất cả" } : STATUS_MAP[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                filter === s
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {info.label}
              {s !== "ALL" && counts[s] ? (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] ${
                  filter === s ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}>{counts[s]}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        {/* Danh sách đơn hàng */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> Đang tải...
            </div>
          ) : processedOrders.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-300">
              <ShoppingBag size={48} className="mb-3" />
              <p className="text-gray-400">Không tìm thấy đơn hàng nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {paginatedOrders.map((order) => {
                const st = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-50 text-gray-700", icon: Package, cardBg: "bg-white hover:bg-gray-50" };
                const Icon = st.icon;
                const isActive = selected?.id === order.id;

                return (
                  <div
                    key={order.id}
                    className={`p-4 lg:p-5 cursor-pointer transition-colors ${st.cardBg} ${isActive ? "border-l-4 border-l-blue-500 shadow-inner" : ""}`}
                    onClick={() => setSelected(isActive ? null : order)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800 text-[14px]">
                            #{order.id.slice(-8).toUpperCase()}
                          </span>
                          <div className="flex flex-col gap-1 items-end">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border ${st.color}`}>
                              <Icon size={14} />
                              {st.label}
                            </span>
                            {order.paymentMethod !== 'COD' && order.paymentStatus === 'PAID' && (
                              <span className="text-[#028046] text-[11px] font-bold bg-[#028046]/10 border border-[#028046]/20 px-2 py-0.5 rounded">
                                ĐÃ THANH TOÁN
                              </span>
                            )}
                            {order.isCancelRequested && order.status !== "CANCELLED" && (
                              <span className="text-red-600 text-[11px] font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded animate-pulse">
                                ⚠️ Yêu cầu hủy
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[13px] text-gray-600 mt-1 font-medium">
                          {order.fullName}
                          {order.account && (
                            <span className="ml-2 text-[11px] bg-[#028046]/10 text-[#028046] px-1.5 py-0.5 rounded-full inline-block">
                              👤 {order.account.name || 'Thành viên'}: {order.account.email}
                            </span>
                          )}
                        </p>
                        <p className="text-[12px] text-gray-400">{order.phone}</p>
                        <p className="text-[12px] text-gray-400 truncate max-w-[280px]">{order.address}</p>
                        {order.status === "CANCELLED" && order.cancelReason && (
                          <p className="text-[12px] text-red-500 mt-1 italic">Lý do hủy: {order.cancelReason}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-800 text-[14px]">{formatPrice(order.totalAmount)}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                        <p className="text-[11px] text-gray-400">{order.items?.length || 0} sản phẩm</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 items-center justify-end">
                      {renderActionButtons(order)}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(isActive ? null : order); }}
                        className="px-2.5 py-1.5 text-gray-600 border border-gray-300 text-[12px] rounded-md hover:bg-gray-50 transition-colors h-[30px] flex items-center justify-center shrink-0 bg-white shadow-sm"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
          {totalPages > 1 && (
            <div className="border-t border-gray-100 px-5 bg-white mt-auto">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {/* Chi tiết đơn hàng */}
        {selected ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 sticky top-4 h-fit">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Chi tiết đơn #{selected.id.slice(-8).toUpperCase()}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
            </div>

            {/* Thông tin khách */}
            <div className="space-y-1.5 text-[13px]">
              <div className="flex gap-2">
                <span className="text-gray-400 w-24 shrink-0">Người nhận:</span>
                <span className="font-medium text-gray-800">{selected.fullName}</span>
              </div>
              {selected.account && (
                <div className="flex gap-2">
                  <span className="text-gray-400 w-24 shrink-0">Tài khoản đặt:</span>
                  <span className="font-medium text-[#028046]">
                    {selected.account.name || 'Thành viên'} - {selected.account.email}
                  </span>
                </div>
              )}
              <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Điện thoại:</span><span className="text-gray-700">{selected.phone}</span></div>
              <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Địa chỉ:</span><span className="text-gray-700">{selected.address}</span></div>
              {selected.note && <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Ghi chú:</span><span className="text-gray-700 italic">{selected.note}</span></div>}
              <div className="flex gap-2"><span className="text-gray-400 w-24 shrink-0">Ngày đặt:</span><span className="text-gray-700">{formatDate(selected.createdAt)}</span></div>
            </div>

            {/* Trạng thái hiện tại */}
            <div className="py-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[13px] w-24 shrink-0">Trạng thái:</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_MAP[selected.status]?.color}`}>
                  {STATUS_MAP[selected.status]?.label}
                </span>
                {selected.paymentMethod !== 'COD' && selected.paymentStatus === 'PAID' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-[#028046] bg-[#028046]/10 border border-[#028046]/20">
                    ĐÃ THANH TOÁN
                  </span>
                )}
              </div>
              {selected.status === "CANCELLED" && selected.cancelReason && (
                 <div className="flex gap-2 mt-2"><span className="text-red-400 text-[13px] w-24 shrink-0">Lý do hủy:</span><span className="text-red-600 text-[13px]">{selected.cancelReason}</span></div>
              )}
            </div>

            {/* Sản phẩm */}
            <div>
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Sản phẩm</p>
              <div className="space-y-2">
                {selected.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-[13px]">
                    <div>
                      <p className="font-medium text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-gray-400">x{item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                    <p className="font-bold text-gray-800 shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tổng */}
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex justify-between text-[13px] text-gray-600">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(30000)}</span>
              </div>
              {selected.couponCode && (
                <div className="flex justify-between text-[13px] text-green-600">
                  <span>Mã giảm giá ({selected.couponCode})</span>
                  <span>-{formatPrice(selected.discountAmount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[15px] pt-2 border-t border-dashed border-gray-100">
                <span>Tổng cộng</span>
                <span className="text-[#028046]">{formatPrice(selected.totalAmount)}</span>
              </div>
            </div>

            {/* Đổi trạng thái (Action Buttons in Detail pane) */}
            <div className="pt-2 border-t border-gray-100 flex justify-end">
               {selected.status === "PENDING" && (
                 <div className="flex gap-2 w-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCancel(selected); }}
                      disabled={updating === selected.id}
                      className="flex-1 py-3 text-red-600 border border-red-200 text-[13px] font-semibold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60 bg-white"
                    >
                      Hủy đơn hàng
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmModalOrder(selected); }}
                      disabled={updating === selected.id}
                      className="flex-1 py-3 bg-blue-600 text-white border border-blue-600 text-[13px] font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
                    >
                      Xác nhận
                    </button>
                 </div>
               )}
               {selected.status === "CONFIRMED" && (
                 <button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(selected, "SHIPPING"); }}
                    disabled={updating === selected.id}
                    className="w-full py-3 bg-purple-600 text-white border border-purple-600 text-[13px] font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-60"
                  >
                    Xác nhận giao hàng
                  </button>
               )}
               {selected.status === "SHIPPING" && (
                 <button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(selected, "DELIVERED"); }}
                    disabled={updating === selected.id}
                    className="w-full py-3 bg-[#00a651] text-white border border-[#00a651] text-[13px] font-semibold rounded-xl hover:bg-[#009040] transition-colors disabled:opacity-60"
                  >
                    Đã giao thành công
                  </button>
               )}
            </div>
          </div>
        ) : (
          <div className="hidden xl:flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-gray-300 sticky top-4 h-fit min-h-[300px]">
            <Eye size={40} className="mb-3" />
            <p className="text-[13px]">Chọn một đơn hàng để xem chi tiết</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={() => setConfirmModalOrder(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Xác nhận đơn hàng</h3>
            <p className="text-[13px] text-gray-500 mb-4">Mã đơn: <span className="font-bold text-black">#{confirmModalOrder.id.slice(-8).toUpperCase()}</span></p>
            
            <div className="space-y-2 text-[13px] text-gray-600 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
              <div className="flex justify-between"><span className="text-gray-500 w-20">Khách hàng:</span> <span className="font-semibold text-gray-800 text-right">{confirmModalOrder.fullName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 w-20">SĐT:</span> <span className="font-medium text-gray-800 text-right">{confirmModalOrder.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 w-20">Địa chỉ:</span> <span className="font-medium text-gray-800 text-right max-w-[200px] truncate">{confirmModalOrder.address}</span></div>
              <div className="border-t border-blue-200 my-2 pt-2 flex justify-between"><span className="text-gray-500">Tổng tiền:</span> <span className="font-bold text-blue-700 text-[15px]">{formatPrice(confirmModalOrder.totalAmount)}</span></div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModalOrder(null)}
                className="flex-1 py-2.5 px-4 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors text-[13px]"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  handleStatusChange(confirmModalOrder, "CONFIRMED");
                  setConfirmModalOrder(null);
                }}
                className="flex-1 py-2.5 px-4 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-sm transition-colors text-[13px]"
              >
                Xác nhận đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
