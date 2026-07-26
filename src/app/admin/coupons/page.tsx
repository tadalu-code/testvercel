"use client";

import { useState, useEffect } from "react";
import { Ticket, Search, Plus, Edit2, Trash2, X, Save, AlertCircle, Percent, DollarSign } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderValue: "",
    maxDiscountAmount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/coupons?search=${searchQuery}`);
      const data = await res.json();
      if (res.ok) {
        setCoupons(data.data);
      } else {
        toast.error(data.error || "Lỗi tải mã giảm giá");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      toast.error("Vui lòng điền mã và giá trị giảm");
      return;
    }

    const payload = {
      ...formData,
      discountValue: Number(formData.discountValue),
      minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
      maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    };

    try {
      const url = editingId ? `/api/coupons/${editingId}` : "/api/coupons";
      const method = editingId ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(editingId ? "Cập nhật thành công!" : "Thêm mới thành công!");
        setShowForm(false);
        setEditingId(null);
        setFormData({
          code: "",
          discountType: "PERCENTAGE",
          discountValue: "",
          minOrderValue: "",
          maxDiscountAmount: "",
          usageLimit: "",
          startDate: "",
          endDate: "",
          isActive: true,
        });
        fetchCoupons();
      } else {
        toast.error(data.error || "Lỗi xử lý");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi");
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderValue: coupon.minOrderValue ? coupon.minOrderValue.toString() : "",
      maxDiscountAmount: coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : "",
      usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : "",
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0,16) : "",
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0,16) : "",
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa mã này?")) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Xóa thành công!");
        fetchCoupons();
      } else {
        const data = await res.json();
        toast.error(data.error || "Lỗi xóa dữ liệu");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi");
    }
  };

  const toggleStatus = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (res.ok) {
        toast.success("Cập nhật trạng thái thành công");
        fetchCoupons();
      } else {
        toast.error("Lỗi cập nhật");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Ticket className="text-blue-500" />
            Mã Giảm Giá
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý các chương trình khuyến mãi và mã giảm giá</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ code: "", discountType: "PERCENTAGE", discountValue: "", minOrderValue: "", maxDiscountAmount: "", usageLimit: "", startDate: "", endDate: "", isActive: true });
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Đóng form" : "Thêm mã mới"}
        </button>
      </div>

      {/* FORM CREATE/EDIT */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            {editingId ? <Edit2 size={18} className="text-blue-500" /> : <Plus size={18} className="text-blue-500" />}
            {editingId ? "Cập nhật mã giảm giá" : "Tạo mã giảm giá mới"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mã (Code) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SUMMER20"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại giảm</label>
                  <select
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  >
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED">Tiền cố định (đ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mức giảm *</label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 10 hoặc 50000"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn hàng tối thiểu (đ)</label>
                <input
                  type="number"
                  placeholder="Không bắt buộc"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.minOrderValue}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giảm tối đa (đ) - Dành cho loại %</label>
                <input
                  type="number"
                  placeholder="Không bắt buộc"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới hạn số lượt dùng</label>
                <input
                  type="number"
                  placeholder="Để trống = vô hạn"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Từ ngày</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đến ngày</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">Kích hoạt mã ngay</label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                <Save size={18} />
                {editingId ? "Lưu thay đổi" : "Tạo mã"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm mã giảm giá..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Mã / Thông tin</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Loại giảm</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Thời hạn</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Lượt dùng</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Không tìm thấy mã giảm giá nào</p>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const now = new Date();
                  const isExpired = coupon.endDate ? new Date(coupon.endDate) < now : false;
                  
                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${coupon.discountType === 'PERCENTAGE' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {coupon.discountType === 'PERCENTAGE' ? <Percent size={18} /> : <DollarSign size={18} />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-100">{coupon.code}</p>
                            {coupon.minOrderValue && <p className="text-xs text-gray-500">ĐH tối thiểu: {coupon.minOrderValue.toLocaleString("vi-VN")}đ</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {coupon.discountType === "PERCENTAGE" 
                            ? `Giảm ${coupon.discountValue}%` 
                            : `Giảm ${coupon.discountValue.toLocaleString("vi-VN")}đ`}
                        </p>
                        {coupon.maxDiscountAmount && <p className="text-xs text-gray-500">Tối đa: {coupon.maxDiscountAmount.toLocaleString("vi-VN")}đ</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-600 dark:text-gray-400">Từ: {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString("vi-VN") : "Luôn mở"}</p>
                          <p className={`font-medium ${isExpired ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                            Đến: {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString("vi-VN") : "Không giới hạn"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: coupon.usageLimit ? `${(coupon.usageCount / coupon.usageLimit) * 100}%` : '0%' }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(coupon)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            coupon.isActive ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              coupon.isActive ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
