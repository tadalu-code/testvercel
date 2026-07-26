import type { Metadata } from "next";
import { Inter, Oswald, Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";
import FloatingContact from "@/components/FloatingContact";
import AutoShowModal from '@/components/AutoShowModal';
import ConditionalUI from '@/components/ConditionalUI';
import { CartProvider } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';
import { Toaster } from 'react-hot-toast';
import NextAuthSessionProvider from "@/components/NextAuthSessionProvider";
import ReCaptchaProvider from "@/components/ReCaptchaProvider";

// 1. Khởi tạo các Font
const inter = Inter({ 
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter", 
});

const oswald = Oswald({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-oswald",
});

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

// 2. Metadata của trang web (Đã thêm Favicon/Logo cho tab)
export const metadata: Metadata = {
  title: {
    default: "Nông Dược Miền Nam - Thuốc Bảo Vệ Thực Vật",
    template: "%s | Nông Dược Miền Nam",
  },
  description: "Công ty TNHH Nông Dược Miền Nam chuyên kinh doanh thuốc bảo vệ thực vật, phân bón, mạng lưới phân phối trên toàn quốc.",
  keywords: ["thuốc bảo vệ thực vật", "nông dược miền nam", "phân bón", "thuốc trừ sâu", "thuốc trừ bệnh", "nông nghiệp"],
  authors: [{ name: "Nông Dược Miền Nam" }],
  icons: {
    icon: "https://nongduocmiennam.vn/logo512.png",
  },
  metadataBase: new URL("https://nongduocmiennam.vn"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Nông Dược Miền Nam - Thuốc Bảo Vệ Thực Vật",
    description: "Công ty TNHH Nông Dược Miền Nam chuyên kinh doanh thuốc bảo vệ thực vật, phân bón, mạng lưới phân phối trên toàn quốc.",
    url: "https://nongduocmiennam.vn",
    siteName: "Nông Dược Miền Nam",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "https://nongduocmiennam.vn/logo512.png",
        width: 512,
        height: 512,
        alt: "Nông Dược Miền Nam",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const dynamic = 'force-dynamic';

// 3. Hàm Layout duy nhất
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  
  // Lấy dữ liệu navigation ở Server Side (Removed as we use hardcoded menu)
  const navData: any[] = [];

  return (
    <html 
      lang="vi" 
      className={`${inter.variable} ${oswald.variable} ${montserrat.variable} h-full`}
      suppressHydrationWarning
    >
      <body 
        suppressHydrationWarning
        className={`${montserrat.className} min-h-screen flex flex-col bg-white antialiased`}
      >
        {/* THANH ĐIỀU HƯỚNG: 
      
          Truyền dữ liệu navData vào đây để Navbar (Client Component) 
          hiển thị được menu mà không bị lỗi trắng trang.
        */}
        <NextAuthSessionProvider>
          <ReCaptchaProvider>
            <CartProvider>
              <Navbar navData={navData} />
              <CartDrawer />

              {/* NỘI DUNG CHÍNH */}
              <main className="flex-grow">
                {children}
              </main>

              {/* CÁC PHẦN CUỐI TRANG */}
              <ConditionalUI>
                <ContactSection />
                <FloatingContact />
                <AutoShowModal />
                <Footer navData={navData} />
              </ConditionalUI>
            </CartProvider>
          </ReCaptchaProvider>
        </NextAuthSessionProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
  }