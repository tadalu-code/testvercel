"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Upload } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({
    email: "",
    username: "",
    hasInitialUsername: false,
    name: "",
    phone: "",
    gender: "Nam",
    dob_day: "",
    dob_month: "",
    dob_year: "",
    avatar_url: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadUser = async () => {
      if (status === "loading") return;
      if (!session?.user) {
        router.push("/auth/login");
        return;
      }

      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const { data: user } = await res.json();
        
        const dob = user.dob ? new Date(user.dob) : null;
        
        const displayEmail = user.email || "";
        const initialUsername = user.username || "";
        
        setForm({
          email: displayEmail,
          username: initialUsername,
          name: user.name || "",
          phone: user.phone || "",
          gender: user.gender || "Nam",
          dob_day: dob ? String(dob.getDate()).padStart(2, '0') : "",
          dob_month: dob ? String(dob.getMonth() + 1).padStart(2, '0') : "",
          dob_year: dob ? String(dob.getFullYear()) : "",
          avatar_url: user.avatarUrl || "",
          hasInitialUsername: !!initialUsername,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [router, session, status]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (1MB)
    if (file.size > 1024 * 1024) {
      setMessage({ type: "error", text: "Dung lượng file tối đa 1 MB." });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      // Uploading logic requires an API route or keeping Supabase storage for images.
      // Assuming we keep Supabase storage just for uploading images as it's separate from auth.
      // But we shouldn't use createClient without auth. Let's see if we can do an unauthenticated upload or create an API route.
      // For now, let's keep the storage upload but we need to create a new client since we removed it from imports.
      // Let's import it locally just for storage.
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, avatar_url: publicUrl }));
      
      // Auto save avatar
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: publicUrl })
      });
      await update({ image: publicUrl });
      
      setMessage({ type: "success", text: "Cập nhật ảnh đại diện thành công!" });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Không thể tải ảnh lên. Hãy chắc chắn bạn đã tạo bucket 'avatars'." });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      let dob = null;
      if (form.dob_year && form.dob_month && form.dob_day) {
        dob = `${form.dob_year}-${form.dob_month}-${form.dob_day}`;
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          name: form.name,
          phone: form.phone,
          gender: form.gender,
          dob: dob,
          avatarUrl: form.avatar_url,
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      
      await update({ name: form.name, image: form.avatar_url });
      
      setMessage({ type: "success", text: "Hồ sơ đã được lưu thành công." });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Lỗi khi lưu hồ sơ." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[#00a651]" size={32} /></div>;
  }

  // Generate days, months, years for select
  const days = Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0'));
  const months = Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 100}, (_, i) => String(currentYear - i));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h1 className="text-xl font-medium text-gray-800">Hồ Sơ Của Tôi</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
      </div>

      <div className="p-6">
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col-reverse lg:flex-row gap-10">
          <div className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="w-32 text-sm text-gray-600 sm:text-right shrink-0">Tên đăng nhập</label>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={form.username} 
                  onChange={e => setForm({...form, username: e.target.value})}
                  disabled={form.hasInitialUsername}
                  className={`w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#00a651] focus:ring-1 focus:ring-[#00a651] ${form.hasInitialUsername ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`} 
                />
                {form.hasInitialUsername && (
                  <p className="text-xs text-gray-400 mt-1">Tên đăng nhập không thể thay đổi.</p>
                )}
                {!form.hasInitialUsername && (
                  <p className="text-xs text-gray-500 mt-1">Bạn chỉ có thể thiết lập tên đăng nhập 1 lần duy nhất.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="w-32 text-sm text-gray-600 sm:text-right shrink-0">Email</label>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-white px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#00a651] focus:ring-1 focus:ring-[#00a651]" 
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="w-32 text-sm text-gray-600 sm:text-right shrink-0">Tên</label>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  className="w-full bg-white px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#00a651] focus:ring-1 focus:ring-[#00a651]" 
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="w-32 text-sm text-gray-600 sm:text-right shrink-0">Số điện thoại</label>
              <div className="flex-1">
                <input 
                  type="tel" 
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})} 
                  className="w-full bg-white px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#00a651] focus:ring-1 focus:ring-[#00a651]" 
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="w-32 text-sm text-gray-600 sm:text-right shrink-0">Giới tính</label>
              <div className="flex-1 flex gap-6">
                {['Nam', 'Nữ', 'Khác'].map(gender => (
                  <label key={gender} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="gender" 
                      value={gender} 
                      checked={form.gender === gender}
                      onChange={e => setForm({...form, gender: e.target.value})}
                      className="accent-[#00a651]"
                    />
                    {gender}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="w-32 text-sm text-gray-600 sm:text-right shrink-0">Ngày sinh</label>
              <div className="flex-1 flex gap-3">
                <select 
                  value={form.dob_day} 
                  onChange={e => setForm({...form, dob_day: e.target.value})}
                  className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#00a651]"
                >
                  <option value="">Ngày</option>
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select 
                  value={form.dob_month} 
                  onChange={e => setForm({...form, dob_month: e.target.value})}
                  className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#00a651]"
                >
                  <option value="">Tháng</option>
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select 
                  value={form.dob_year} 
                  onChange={e => setForm({...form, dob_year: e.target.value})}
                  className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#00a651]"
                >
                  <option value="">Năm</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="flex sm:pl-[152px]">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-[#00a651] text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-[#008f45] transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Lưu
              </button>
            </div>
          </div>

          <div className="lg:w-[300px] flex flex-col items-center justify-start border-b lg:border-b-0 lg:border-l border-gray-100 pb-8 lg:pb-0 pt-4">
            <div className="w-28 h-28 bg-gray-100 rounded-full border-4 border-white shadow-md overflow-hidden mb-5">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              )}
            </div>
            
            <label className="border border-gray-300 px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors relative overflow-hidden">
              <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              {uploading ? (
                <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Đang tải...</span>
              ) : (
                "Chọn Ảnh"
              )}
            </label>
            <div className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
              Dụng lượng file tối đa 1 MB<br/>Định dạng: .JPEG, .PNG
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
