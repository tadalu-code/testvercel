"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

export default function PasswordPage() {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    password: "",
    new_password: "",
    confirm_password: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    if (form.new_password.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      setSaving(false);
      return;
    }

    if (form.new_password !== form.confirm_password) {
      setMessage({ type: "error", text: "Xác nhận mật khẩu không khớp." });
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: form.new_password
      });

      if (error) throw error;
      
      setMessage({ type: "success", text: "Đổi mật khẩu thành công." });
      setForm({ password: "", new_password: "", confirm_password: "" });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Lỗi khi đổi mật khẩu." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 border-b border-gray-100">
        <h1 className="text-xl font-medium text-gray-800">Đổi Mật Khẩu</h1>
        <p className="text-sm text-gray-500 mt-1">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
      </div>

      <div className="p-6">
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg text-sm max-w-2xl ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-40 text-sm text-gray-600 sm:text-right shrink-0">Mật khẩu mới</label>
            <div className="flex-1">
              <input 
                type="password" 
                value={form.new_password} 
                onChange={e => setForm({...form, new_password: e.target.value})} 
                required
                className="w-full bg-white px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#00a651] focus:ring-1 focus:ring-[#00a651]" 
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-40 text-sm text-gray-600 sm:text-right shrink-0">Xác nhận mật khẩu</label>
            <div className="flex-1">
              <input 
                type="password" 
                value={form.confirm_password} 
                onChange={e => setForm({...form, confirm_password: e.target.value})} 
                required
                className="w-full bg-white px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#00a651] focus:ring-1 focus:ring-[#00a651]" 
              />
            </div>
          </div>

          <div className="flex sm:pl-[184px]">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-[#00a651] text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-[#008f45] transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Xác Nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
