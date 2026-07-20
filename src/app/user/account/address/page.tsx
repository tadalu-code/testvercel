"use client";

import { useEffect, useState } from "react";
import { Plus, MapPin, Loader2, Edit2, Trash2 } from "lucide-react";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  commune: string;
  detail: string;
  isDefault: boolean;
}

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    province: null as any,
    commune: null as any,
    detail: "",
    isDefault: false,
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAddresses();
    fetchProvinces();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/addresses");
      const data = await res.json();
      if (data.data) {
        setAddresses(data.data.map((item: any) => ({
          ...item,
          province: JSON.parse(item.province),
          commune: JSON.parse(item.commune)
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const res = await fetch("https://production.cas.so/address-kit/latest/provinces");
      const data = await res.json();
      setProvinces(data.provinces || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCommunes = async (provinceCode: string) => {
    if (!provinceCode) {
      setCommunes([]);
      return;
    }
    try {
      const res = await fetch(`https://production.cas.so/address-kit/latest/provinces/${provinceCode}/communes`);
      const data = await res.json();
      setCommunes(data.communes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (form.province?.code) {
      fetchCommunes(form.province.code);
    } else {
      setCommunes([]);
    }
  }, [form.province]);

  const openModal = (addr?: Address) => {
    if (addr) {
      setEditingId(addr.id);
      setForm({
        fullName: addr.fullName,
        phone: addr.phone,
        province: addr.province,
        commune: addr.commune,
        detail: addr.detail,
        isDefault: addr.isDefault,
      });
    } else {
      setEditingId(null);
      setForm({
        fullName: "",
        phone: "",
        province: null,
        commune: null,
        detail: "",
        isDefault: false,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.province || !form.commune || !form.detail) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/user/addresses/${editingId}` : "/api/user/addresses";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        closeModal();
        fetchAddresses();
      } else {
        const error = await res.json();
        alert(error.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi lưu địa chỉ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
    try {
      const res = await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true })
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[#00a651]" size={32} /></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Địa Chỉ Của Tôi</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý thông tin giao hàng của bạn</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-[#00a651] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#008f45] transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Thêm địa chỉ mới
        </button>
      </div>

      <div className="p-6">
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <MapPin size={28} />
            </div>
            <h3 className="text-gray-600 font-medium mb-1">Bạn chưa có địa chỉ nào</h3>
            <p className="text-sm text-gray-500 mb-6">Thêm địa chỉ giao hàng để thanh toán nhanh chóng hơn</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map(addr => (
              <div key={addr.id} className="border border-gray-200 rounded-xl p-5 hover:border-[#00a651] transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-800 text-base">{addr.fullName}</h3>
                      <div className="w-px h-4 bg-gray-300"></div>
                      <span className="text-gray-600 text-sm">{addr.phone}</span>
                      {addr.isDefault && (
                        <span className="text-[11px] font-medium text-[#00a651] border border-[#00a651] px-2 py-0.5 rounded-full">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-1">{addr.detail}</p>
                    <p className="text-gray-600 text-sm">{addr.commune.name}, {addr.province.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-3 text-sm">
                      <button onClick={() => openModal(addr)} className="text-blue-600 hover:underline">Cập nhật</button>
                      {!addr.isDefault && (
                        <button onClick={() => handleDelete(addr.id)} className="text-red-500 hover:underline">Xóa</button>
                      )}
                    </div>
                    {!addr.isDefault && (
                      <button 
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 mt-1"
                      >
                        Thiết lập mặc định
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">
                {editingId ? "Cập nhật địa chỉ" : "Địa chỉ mới"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Họ và tên</label>
                  <input 
                    type="text" 
                    value={form.fullName}
                    onChange={e => setForm({...form, fullName: e.target.value})}
                    placeholder="Họ và tên"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00a651] focus:ring-1 focus:ring-[#00a651]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Số điện thoại</label>
                  <input 
                    type="tel" 
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="Số điện thoại"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00a651] focus:ring-1 focus:ring-[#00a651]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Tỉnh/Thành phố</label>
                  <select 
                    value={form.province?.code || ""}
                    onChange={e => {
                      const p = provinces.find(x => x.code === e.target.value);
                      setForm({...form, province: p || null, commune: null});
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00a651] bg-white"
                  >
                    <option value="">Tỉnh/Thành phố</option>
                    {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Phường/Xã</label>
                  <select 
                    value={form.commune?.code || ""}
                    onChange={e => {
                      const w = communes.find(x => x.code === e.target.value);
                      setForm({...form, commune: w || null});
                    }}
                    disabled={!form.province}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00a651] bg-white disabled:bg-gray-100"
                  >
                    <option value="">Phường/Xã</option>
                    {communes.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm text-gray-700 mb-1.5">Địa chỉ cụ thể</label>
                <textarea 
                  value={form.detail}
                  onChange={e => setForm({...form, detail: e.target.value})}
                  placeholder="Số nhà, Tên đường, Xóm, Thôn..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#00a651] focus:ring-1 focus:ring-[#00a651] resize-none"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.isDefault}
                    onChange={e => setForm({...form, isDefault: e.target.checked})}
                    className="w-4 h-4 text-[#00a651] accent-[#00a651] border-gray-300 rounded focus:ring-[#00a651]"
                  />
                  <span className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Trở lại
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#00a651] text-white rounded-lg text-sm font-medium hover:bg-[#008f45] transition-colors flex items-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Hoàn thành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
