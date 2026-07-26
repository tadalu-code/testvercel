"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, CheckCircle, Truck, Phone, MapPin, User, Loader2, BookMarked } from "lucide-react";
import { useSession } from "next-auth/react";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressDetail: "",
    note: "",
  });
  
  const [provinces, setProvinces] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<{code: string, name: string} | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<{code: string, name: string} | null>(null);

  const [paymentMethod, setPaymentMethod] = useState("COD");


  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: session } = useSession();

  useEffect(() => {
    fetch("https://production.cas.so/address-kit/latest/provinces")
      .then(res => res.json())
      .then(data => setProvinces(data.provinces || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      const user = session?.user as any;
      if (user) {
        try {
          // Fallback to user metadata if no address book
          setForm(prev => ({
            ...prev,
            fullName: user.name || prev.fullName,
            phone: user.phone || prev.phone,
          }));

          const res = await fetch("/api/user/addresses");
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            const addresses = data.data.map((item: any) => ({
              ...item,
              province: JSON.parse(item.province),
              commune: JSON.parse(item.commune)
            }));
            setUserAddresses(addresses);
            
            // Auto select default or first
            const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setForm(prev => ({
              ...prev,
              fullName: defaultAddr.fullName,
              phone: defaultAddr.phone,
              addressDetail: defaultAddr.detail,
            }));
            setSelectedProvince(defaultAddr.province);
            // Will trigger the communes fetch, need to set commune after fetch
            // But actually we can set it now, and the useEffect will overwrite communes list
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    if (session?.user) {
      fetchAddresses();
    }
  }, [session]);

  useEffect(() => {
    if (selectedProvince) {
      fetch(`https://production.cas.so/address-kit/latest/provinces/${selectedProvince.code}/communes`)
        .then(res => res.json())
        .then(data => {
          setCommunes(data.communes || []);
          // If we auto-selected an address and its commune is in the new list, keep it
          // Otherwise clear it
          if (selectedAddressId && userAddresses.length > 0) {
            const addr = userAddresses.find(a => a.id === selectedAddressId);
            if (addr && addr.province.code === selectedProvince.code) {
              setSelectedCommune(addr.commune);
              return;
            }
          }
          setSelectedCommune(null);
        })
        .catch(console.error);
    } else {
      setCommunes([]);
      setSelectedCommune(null);
    }
  }, [selectedProvince]);

  // Recalculate discount if cart changes
  useEffect(() => {
    if (discountInfo) {
      applyCoupon(discountInfo.code);
    }
  }, [totalAmount]);

  const applyCoupon = async (codeToApply = couponCode) => {
    if (!codeToApply.trim()) {
      setCouponError("Vui lòng nhập mã giảm giá");
      return;
    }
    
    setIsApplyingCoupon(true);
    setCouponError("");
    
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToApply, cartTotal: totalAmount }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setDiscountInfo(data.data);
      } else {
        setCouponError(data.error || "Mã không hợp lệ");
        setDiscountInfo(null);
      }
    } catch (err) {
      setCouponError("Lỗi kết nối");
      setDiscountInfo(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setDiscountInfo(null);
    setCouponError("");
  };

  const handleSelectAddress = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    if (id === "") {
      setForm({ ...form, fullName: "", phone: "", addressDetail: "" });
      setSelectedProvince(null);
      setSelectedCommune(null);
      return;
    }
    const addr = userAddresses.find(a => a.id === id);
    if (addr) {
      setForm({ ...form, fullName: addr.fullName, phone: addr.phone, addressDetail: addr.detail });
      setSelectedProvince(addr.province);
      setSelectedCommune(addr.commune);
    }
  };

  const isCanTho = selectedProvince?.name.toLowerCase().includes("cần thơ") || selectedProvince?.name.toLowerCase().includes("can tho");
  const shippingFee = selectedProvince ? (isCanTho ? 0 : 30000) : 0;
  
  let finalTotal = totalAmount + shippingFee;
  if (discountInfo) {
    finalTotal -= discountInfo.discountAmount;
  }
  if (finalTotal < 0) finalTotal = 0;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
    if (!form.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
    else if (!/^[0-9]{9,11}$/.test(form.phone.replace(/\s/g, ""))) newErrors.phone = "Số điện thoại không hợp lệ";
    
    if (!selectedProvince) newErrors.province = "Vui lòng chọn Tỉnh/Thành phố";
    if (!selectedCommune) newErrors.commune = "Vui lòng chọn Phường/Xã";
    if (!form.addressDetail.trim()) newErrors.addressDetail = "Vui lòng nhập số nhà, tên đường";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) return;

    setLoading(true);
    try {
      const fullAddress = `${form.addressDetail}, ${selectedCommune?.name}, ${selectedProvince?.name}`;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          address: fullAddress,
          note: form.note,
          items: items.map((i: any) => ({ productId: i.id || i.productId || i._id, quantity: i.quantity })),
          couponCode: discountInfo ? discountInfo.code : null,
          discountAmount: discountInfo ? discountInfo.discountAmount : 0,
          paymentMethod
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi đặt hàng");
      
      clearCart();

      // Nếu là VNPay thì redirect
      if (paymentMethod === "VNPAY" && data.vnpUrl) {
        window.location.href = data.vnpUrl;
        return;
      }

      setOrderId(data.data.id);
      setSuccess(true);
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Màn hình thành công
  if (success) {
    return (
      <div className="min-h-screen bg-[#f6f8f5] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Đặt hàng thành công!</h1>
          <p className="text-gray-500 text-[14px] mb-1">Mã đơn hàng của bạn:</p>
          <p className="font-mono text-[13px] bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 mb-6 text-gray-700">
            #{orderId.slice(-8).toUpperCase()}
          </p>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-left mb-6">
            <div className="flex items-start gap-2 text-[13px] text-green-800">
              <Truck size={16} className="mt-0.5 shrink-0" />
              <p>Chúng tôi sẽ liên hệ xác nhận đơn hàng trong vòng <strong>15–30 phút</strong>. Thanh toán khi nhận hàng.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/san-pham"
              className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold text-[14px] rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              Tiếp tục mua sắm
            </Link>
            <Link
              href="/"
              className="flex-1 py-3 bg-[#028046] text-white font-semibold text-[14px] rounded-xl hover:bg-[#016a38] transition-colors text-center"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Giỏ hàng trống
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f6f8f5] flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag size={60} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-600 mb-2">Giỏ hàng trống</h2>
          <Link href="/san-pham" className="text-[#028046] hover:underline text-[14px]">
            → Quay lại mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f5] py-10">
      <div className="max-w-[1100px] mx-auto px-4 lg:px-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/san-pham" className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Thanh toán</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">{items.length} sản phẩm</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

          {/* === FORM THÔNG TIN GIAO HÀNG === */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 text-[16px] mb-5 flex items-center gap-2">
                <User size={18} className="text-[#028046]" /> Thông tin người nhận
              </h2>

              {userAddresses.length > 0 && (
                <div className="mb-6 p-4 border border-[#028046]/30 bg-[#028046]/5 rounded-xl">
                  <label className="block text-[13px] font-semibold text-[#028046] mb-2 flex items-center gap-1.5">
                    <BookMarked size={14} /> Chọn từ Sổ địa chỉ
                  </label>
                  <select 
                    value={selectedAddressId} 
                    onChange={handleSelectAddress}
                    className="w-full px-4 py-2.5 border border-[#028046]/40 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#028046] bg-white text-gray-800"
                  >
                    <option value="">-- Nhập địa chỉ mới --</option>
                    {userAddresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.fullName} - {addr.phone} ({addr.detail}, {addr.commune.name}, {addr.province.name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-4">
                {/* Họ tên */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className={`w-full px-4 py-3 border rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#028046] ${
                      errors.fullName ? "border-red-400" : "border-gray-200"
                    }`}
                  />
                  {errors.fullName && <p className="text-red-500 text-[12px] mt-1">{errors.fullName}</p>}
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Số điện thoại *
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="0901 234 567"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#028046] ${
                        errors.phone ? "border-red-400" : "border-gray-200"
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-[12px] mt-1">{errors.phone}</p>}
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Địa chỉ giao hàng *
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <select 
                        value={selectedProvince?.code || ""}
                        onChange={(e) => {
                          const p = provinces.find(x => x.code === e.target.value);
                          setSelectedProvince(p || null);
                        }}
                        className={`w-full px-4 py-3 border rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#028046] bg-white ${errors.province ? 'border-red-400' : 'border-gray-200'}`}
                      >
                        <option value="">Tỉnh/Thành phố</option>
                        {provinces.map(p => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                      {errors.province && <p className="text-red-500 text-[12px] mt-1">{errors.province}</p>}
                    </div>

                    <div>
                      <select 
                        value={selectedCommune?.code || ""}
                        onChange={(e) => {
                          const w = communes.find(x => x.code === e.target.value);
                          setSelectedCommune(w || null);
                        }}
                        disabled={!selectedProvince}
                        className={`w-full px-4 py-3 border rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#028046] bg-white disabled:bg-gray-50 disabled:text-gray-400 ${errors.commune ? 'border-red-400' : 'border-gray-200'}`}
                      >
                        <option value="">Phường/Xã</option>
                        {communes.map(w => (
                          <option key={w.code} value={w.code}>{w.name}</option>
                        ))}
                      </select>
                      {errors.commune && <p className="text-red-500 text-[12px] mt-1">{errors.commune}</p>}
                    </div>
                  </div>

                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                    <textarea
                      value={form.addressDetail}
                      onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
                      placeholder="Số nhà, đường, xóm..."
                      rows={2}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#028046] resize-none ${
                        errors.addressDetail ? "border-red-400" : "border-gray-200"
                      }`}
                    />
                  </div>
                  {errors.addressDetail && <p className="text-red-500 text-[12px] mt-1">{errors.addressDetail}</p>}
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Ghi chú <span className="text-gray-400 font-normal">(không bắt buộc)</span>
                  </label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Giao giờ hành chính, gọi trước khi giao..."
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#028046] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 text-[16px] mb-4 flex items-center gap-2">
                <Truck size={18} className="text-[#028046]" /> Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'COD' ? 'border-[#028046] bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="accent-[#028046] w-4 h-4" 
                  />
                  <div>
                    <p className="font-semibold text-[14px] text-gray-800">Thanh toán khi nhận hàng (COD)</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">Trả tiền mặt khi nhận được hàng</p>
                  </div>
                </label>
                
                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'VNPAY' ? 'border-[#028046] bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input 
                    type="radio" 
                    name="payment" 
                    checked={paymentMethod === 'VNPAY'}
                    onChange={() => setPaymentMethod('VNPAY')}
                    className="accent-[#028046] w-4 h-4" 
                  />
                  <div>
                    <p className="font-semibold text-[14px] text-gray-800">Thanh toán VNPay</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">Thanh toán online an toàn qua ví VNPay hoặc thẻ ngân hàng</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Nút đặt hàng (mobile) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full lg:hidden flex items-center justify-center gap-2 py-4 bg-[#028046] hover:bg-[#016a38] text-white font-bold text-[15px] rounded-xl transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Đang xử lý..." : `Đặt hàng • ${formatPrice(finalTotal)}`}
            </button>
          </form>

          {/* === TÓM TẮT ĐƠN HÀNG === */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-4">
              <h2 className="font-bold text-gray-800 text-[15px] mb-4">
                Đơn hàng ({items.length} sản phẩm)
              </h2>

              <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                {items.map((item) => {
                  const price = item.salePrice ?? item.price;
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={16} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-700 line-clamp-2">{item.name}</p>
                        <p className="text-[11px] text-gray-400">x{item.quantity}</p>
                      </div>
                      <p className="text-[13px] font-bold text-gray-800 shrink-0">
                        {formatPrice(price * item.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-[13px] text-gray-500">
                  <span>Tạm tính</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                
                {/* Coupon UI */}
                <div className="py-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Mã giảm giá" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!discountInfo || isApplyingCoupon}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] uppercase focus:outline-none focus:border-[#028046]"
                    />
                    {!discountInfo ? (
                      <button 
                        type="button"
                        onClick={() => applyCoupon()}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg text-[13px] font-medium disabled:opacity-50"
                      >
                        {isApplyingCoupon ? "..." : "Áp dụng"}
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={removeCoupon}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-[13px] font-medium"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-red-500 text-[12px] mt-1">{couponError}</p>}
                  {discountInfo && (
                    <p className="text-[#028046] text-[12px] mt-1 flex items-center gap-1">
                      <CheckCircle size={12} /> Áp dụng thành công
                    </p>
                  )}
                </div>

                <div className="flex justify-between text-[13px] text-gray-500">
                  <span>Phí vận chuyển</span>
                  <span className={shippingFee === 0 ? "text-green-600 font-medium" : "text-gray-800"}>
                    {selectedProvince ? (shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)) : "Chọn địa chỉ"}
                  </span>
                </div>
                
                {discountInfo && (
                  <div className="flex justify-between text-[13px] text-[#028046]">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(discountInfo.discountAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-[16px] text-gray-800 pt-2 border-t border-gray-100">
                  <span>Tổng cộng</span>
                  <span className="text-[#e74c3c]">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit as any}
                disabled={loading}
                className="w-full mt-5 flex items-center justify-center gap-2 py-4 bg-[#028046] hover:bg-[#016a38] text-white font-bold text-[15px] rounded-xl transition-colors disabled:opacity-60 hidden lg:flex"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Đang xử lý..." : "Đặt hàng ngay"}
              </button>

              <p className="text-center text-[11px] text-gray-400 mt-3">
                🔒 Thông tin của bạn được bảo mật an toàn
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
