import UserSidebar from "@/components/user/UserSidebar";

export const metadata = {
  title: "Quản lý tài khoản | Nông Dược Miền Nam",
  description: "Trang quản lý hồ sơ và lịch sử mua hàng",
};

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 flex flex-col">
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <UserSidebar />
          
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
