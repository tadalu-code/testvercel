// Server Component — KHÔNG dùng "use client" để có thể export generateMetadata
import { getProductDetail } from "@/services/api";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

// Hàm parse ảnh dùng phía server (giống client)
function parseFirstImage(urlStr: any): string | null {
  try {
    if (!urlStr) return null;
    if (Array.isArray(urlStr)) return urlStr[0] ?? null;
    const arr = JSON.parse(urlStr.trim().replace(/^['\"]|['\"]$/g, ""));
    return Array.isArray(arr) ? arr[0] ?? null : null;
  } catch {
    const match = urlStr?.match(/https?:\/\/[^\s"\\]+/);
    return match ? match[0] : null;
  }
}

// ─── SEO: generateMetadata ────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const product = await getProductDetail(slug);

  if (!product) {
    return { title: "Sản phẩm không tồn tại | Nông Dược Miền Nam" };
  }

  const name = product.name || "Sản phẩm";
  const finalTitle = product.metaTitle ? { absolute: product.metaTitle } : name;
  const description =
    product.metaDescription ||
    product.description ||
    `Mua ${name.toLowerCase()} chính hãng tại Nông Dược Miền Nam — chuyên cung cấp thuốc bảo vệ thực vật trên toàn quốc.`;
  const keywords = product.metaKeywords ? product.metaKeywords.split(',').map((k: string) => k.trim()) : undefined;
  
  const canonicalUrl = `https://nongduocmiennam.vn/san-pham/${category}/${slug}`;
  const ogImage = parseFirstImage(product.imagesUrl) ?? "https://nongduocmiennam.vn/logo512.png";

  return {
    title: finalTitle,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: typeof finalTitle === 'string' ? finalTitle : finalTitle.absolute,
      description,
      url: canonicalUrl,
      siteName: "Nông Dược Miền Nam",
      locale: "vi_VN",
      type: "website",
      images: [{ url: ogImage, width: 800, height: 800, alt: name }],
    },
  };
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Page (Server Component) ─────────────────────────────────────────────────
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  // Pre-fetch sản phẩm ở server để tránh double-fetch (client cũng nhận qua props)
  const product = await getProductDetail(slug);
  if (!product) notFound();

  return (
    <ProductDetailClient
      category={category}
      slug={slug}
      initialProduct={product}
    />
  );
}