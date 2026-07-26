"use client";
import { useEffect, useState } from "react";
import { Save, Loader2, Upload, Trash2, GripVertical, Image as ImageIcon, Info, BarChart2, CheckCircle, Handshake } from "lucide-react";
import { supabaseClient } from "@/lib/supabase-client";

type Tab = "banner" | "company" | "stats" | "partners";

export default function HomepageEditorPage() {
  const [activeTab, setActiveTab] = useState<Tab>("banner");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Banner images state: array of { url, title }
  const [bannerImages, setBannerImages] = useState<{ url: string; title: string }[]>([]);
  // Partner logos state: array of { url, name }
  const [partnerLogos, setPartnerLogos] = useState<{ url: string; name: string }[]>([]);
  const [uploadingPartner, setUploadingPartner] = useState(false);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setSettings(data);
          try {
            const imgs = JSON.parse(data.banner_images || "[]");
            setBannerImages(Array.isArray(imgs) ? imgs : []);
          } catch { setBannerImages([]); }
          try {
            const logos = JSON.parse(data.partner_logos || "[]");
            setPartnerLogos(Array.isArray(logos) ? logos : []);
          } catch { setPartnerLogos([]); }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const payload = {
      ...settings,
      banner_images: JSON.stringify(bannerImages),
      partner_logos: JSON.stringify(partnerLogos),
    };
    await fetch("/api/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banners/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabaseClient.storage.from("products").upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabaseClient.storage.from("products").getPublicUrl(path);
      setBannerImages((prev) => [...prev, { url: publicUrl, title: "" }]);
    }
    setUploading(false);
    // reset input
    e.target.value = "";
  };

  const removeBanner = (idx: number) =>
    setBannerImages((prev) => prev.filter((_, i) => i !== idx));

  const updateBannerTitle = (idx: number, title: string) =>
    setBannerImages((prev) => prev.map((img, i) => (i === idx ? { ...img, title } : img)));

  const moveBanner = (idx: number, dir: -1 | 1) => {
    const arr = [...bannerImages];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    setBannerImages(arr);
  };

  const handleUploadPartner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPartner(true);
    const ext = file.name.split(".").pop();
    const path = `partners/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabaseClient.storage.from("products").upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabaseClient.storage.from("products").getPublicUrl(path);
      setPartnerLogos((prev) => [...prev, { url: publicUrl, name: "" }]);
    }
    setUploadingPartner(false);
    e.target.value = "";
  };

  const removePartner = (idx: number) =>
    setPartnerLogos((prev) => prev.filter((_, i) => i !== idx));

  const updatePartnerName = (idx: number, name: string) =>
    setPartnerLogos((prev) => prev.map((p, i) => (i === idx ? { ...p, name } : p)));

  const movePartner = (idx: number, dir: -1 | 1) => {
    const arr = [...partnerLogos];
    const to = idx + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[idx], arr[to]] = [arr[to], arr[idx]];
    setPartnerLogos(arr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Đang tải...
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "banner", label: "Banner Slider", icon: <ImageIcon size={16} /> },
    { key: "company", label: "Thông tin công ty", icon: <Info size={16} /> },
    { key: "stats", label: "Con số thống kê", icon: <BarChart2 size={16} /> },
    { key: "partners", label: "Đối tác", icon: <Handshake size={16} /> },
  ];

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Giao diện Trang chủ</h1>
          <p className="text-sm text-gray-500 mt-0.5">Chỉnh sửa nội dung hiển thị trên trang chủ</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saving ? "Đang lưu..." : saved ? "Đã lưu!" : "Lưu thay đổi"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto w-full sm:w-fit hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* === TAB: BANNER === */}
      {activeTab === "banner" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Ảnh Banner Slider</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ảnh sẽ tự động chuyển theo thứ tự bên dưới. Kích thước khuyến nghị: 1920×500px</p>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium cursor-pointer hover:bg-blue-100 transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadBanner} disabled={uploading} />
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? "Đang tải..." : "Thêm ảnh"}
            </label>
          </div>

          {bannerImages.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
              <ImageIcon size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có ảnh banner. Bấm "Thêm ảnh" để tải lên.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bannerImages.map((img, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveBanner(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20">▲</button>
                    <GripVertical size={16} className="text-gray-300 mx-auto" />
                    <button onClick={() => moveBanner(idx, 1)} disabled={idx === bannerImages.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20">▼</button>
                  </div>
                  <img src={img.url} alt={`banner-${idx}`} className="w-32 h-20 object-cover rounded-lg flex-shrink-0 border border-gray-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">Tiêu đề (tuỳ chọn)</p>
                    <input
                      type="text"
                      value={img.title}
                      onChange={(e) => updateBannerTitle(idx, e.target.value)}
                      placeholder="Ví dụ: Thuốc trừ sâu chất lượng cao..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1 truncate font-mono">{img.url}</p>
                  </div>
                  <button onClick={() => removeBanner(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === TAB: COMPANY === */}
      {activeTab === "company" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <h2 className="font-semibold text-gray-800">Thông tin công ty</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên công ty</label>
            <input
              type="text"
              value={settings.company_name || ""}
              onChange={(e) => set("company_name", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả công ty</label>
            <textarea
              value={settings.company_description || ""}
              onChange={(e) => set("company_description", e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hotline</label>
              <input
                type="text"
                value={settings.hotline || ""}
                onChange={(e) => set("hotline", e.target.value)}
                placeholder="02926.537.595"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giờ làm việc</label>
              <input
                type="text"
                value={settings.working_hours || ""}
                onChange={(e) => set("working_hours", e.target.value)}
                placeholder="Sáng: 7h30 - 11h30  Chiều: 13h30 - 17h00"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* === TAB: STATS === */}
      {activeTab === "stats" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold text-gray-800">Con số thống kê</h2>
            <p className="text-xs text-gray-400 mt-0.5">Hiển thị trong phần "Những con số đáng tự hào" trên trang chủ</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiêu đề mục</label>
            <input
              type="text"
              value={settings.stats_title || ""}
              onChange={(e) => set("stats_title", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Con số #{i}</label>
                  <input
                    type="text"
                    value={settings[`stat_${i}_number`] || ""}
                    onChange={(e) => set(`stat_${i}_number`, e.target.value)}
                    placeholder="Ví dụ: 15 năm+"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Mô tả</label>
                  <input
                    type="text"
                    value={settings[`stat_${i}_label`] || ""}
                    onChange={(e) => set(`stat_${i}_label`, e.target.value)}
                    placeholder="Mô tả con số này..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === TAB: ĐỐI TÁC === */}
      {activeTab === "partners" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800">Logo Đối tác</h2>
              <p className="text-xs text-gray-400 mt-0.5">Logo hiển thị bên dưới lời giới thiệu trong mục "Đối tác của chúng tôi"</p>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium cursor-pointer hover:bg-blue-100 transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadPartner} disabled={uploadingPartner} />
              {uploadingPartner ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploadingPartner ? "Đang tải..." : "Thêm logo"}
            </label>
          </div>

          {/* Tiêu đề & mô tả mục đối tác */}
          <div className="grid grid-cols-1 gap-4 border-b border-gray-100 pb-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tiêu đề mục</label>
              <input
                type="text"
                value={settings.partners_title || ""}
                onChange={(e) => set("partners_title", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lời giới thiệu</label>
              <textarea
                value={settings.partners_description || ""}
                onChange={(e) => set("partners_description", e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
          </div>

          {/* Danh sách logo */}
          {partnerLogos.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
              <Handshake size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có logo nào. Bấm "Thêm logo" để tải lên.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {partnerLogos.map((logo, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => movePartner(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20">▲</button>
                    <GripVertical size={16} className="text-gray-300 mx-auto" />
                    <button onClick={() => movePartner(idx, 1)} disabled={idx === partnerLogos.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20">▼</button>
                  </div>
                  <div className="w-24 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 p-2">
                    <img src={logo.url} alt={logo.name || `Logo ${idx + 1}`} className="max-h-12 max-w-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">Tên đối tác</p>
                    <input
                      type="text"
                      value={logo.name}
                      onChange={(e) => updatePartnerName(idx, e.target.value)}
                      placeholder="Ví dụ: Công ty TNHH ABC..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button onClick={() => removePartner(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          {partnerLogos.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Xem trước</p>
              <div className="flex flex-wrap gap-3">
                {partnerLogos.map((logo, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-100 px-4 py-2 flex items-center justify-center shadow-sm" style={{ height: 56, minWidth: 90 }}>
                    <img src={logo.url} alt={logo.name} className="max-h-9 max-w-[100px] object-contain" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lưu ý */}
      <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-4 border border-gray-100">
        💡 Sau khi lưu, tải lại trang chủ (F5) để thấy thay đổi.
      </div>
    </div>
  );
}
