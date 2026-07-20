"use client";
import { useEffect, useState } from "react";
import { Shield, User, Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Bạn có chắc muốn đổi quyền thành ${newRole}?`)) return;
    setUpdating(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        alert("Có lỗi xảy ra khi cập nhật quyền");
      }
    } catch (err) {
      alert("Lỗi kết nối");
    }
    setUpdating(null);
  };

  const exportCustomers = () => {
    const customers = users.filter(u => u.role === "user");
    const worksheet = XLSX.utils.json_to_sheet(customers.map(c => ({
      "ID": c.id,
      "Tên Khách Hàng": c.name,
      "Email": c.email,
      "Phân Loại": "Khách Hàng",
      "Ngày Đăng Ký": new Date(c.createdAt).toLocaleDateString("vi-VN")
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KhachHang");
    XLSX.writeFile(workbook, `Danh_Sach_Khach_Hang.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Tài Khoản & Phân Quyền</h1>
          <p className="text-gray-500 text-sm mt-1">Gán quyền nhân viên hoặc quản trị viên</p>
        </div>
        <button
          onClick={exportCustomers}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
        >
          <Download size={16} /> Xuất KH (Excel)
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Khách hàng / Nhân viên</th>
                <th className="px-6 py-4">Ngày tham gia</th>
                <th className="px-6 py-4">Vai trò (Role)</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Đang tải dữ liệu...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Chưa có tài khoản nào</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${user.role === 'admin' ? 'bg-red-500' : user.role === 'staff' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        user.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' :
                        user.role === 'staff' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Nhân viên' : 'Khách hàng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {updating === user.id ? (
                        <Loader2 size={16} className="animate-spin text-gray-400 inline-block ml-auto" />
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="user">Khách hàng</option>
                          <option value="staff">Nhân viên</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
