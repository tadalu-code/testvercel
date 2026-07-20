"use client";
import { usePathname } from "next/navigation";

export default function ConditionalUI({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Nếu đang ở các trang auth, admin, hoặc user thì ẩn các thành phần con
  if (pathname?.startsWith("/auth") || pathname?.startsWith("/admin") || pathname?.startsWith("/user")) {
    return null;
  }

  return <>{children}</>;
}
