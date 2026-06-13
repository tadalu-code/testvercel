import { getPostDetail, getRelatedPosts, getPostComments } from "@/services/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import LoginButton from "@/components/LoginButton";
import { Home, Calendar } from "lucide-react";
import { getBreadcrumbInfo, BreadcrumbData } from "@/utils/breadcrumb";
import type { Metadata } from "next";

// ─── SEO: generateMetadata ────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ topicSlug: string; postSlug: string }> }
): Promise<Metadata> {
  const { topicSlug, postSlug } = await params;
  const post = await getPostDetail(postSlug);

  if (!post) {
    return { title: "Bài viết không tồn tại | Nông Dược Miền Nam" };
  }

  const breadcrumb = getBreadcrumbInfo(topicSlug);
  const title = `${post.title || post.name || "Bài viết"} | Nông Dược Miền Nam`;
  const description =
    post.short_description ||
    post.description ||
    post.summary ||
    `Bài viết về ${breadcrumb.currentName.toLowerCase()} từ Nông Dược Miền Nam.`;
  const canonicalUrl = `https://nongduocmiennam.vn/bai-viet/${topicSlug}/${postSlug}`;

  // Lấy ảnh thumbnail của bài viết (nếu có)
  let ogImage = "https://nongduocmiennam.vn/logo512.png";
  try {
    const raw = post.thumbnail || post.imagesUrl || post.avatar || post.image;
    if (raw) {
      const arr = Array.isArray(raw) ? raw : JSON.parse(raw);
      if (arr[0]) ogImage = arr[0];
    }
  } catch {
    // giữ ảnh mặc định
  }

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Nông Dược Miền Nam",
      locale: "vi_VN",
      type: "article",
      images: [{ url: ogImage, width: 800, height: 450, alt: post.title || post.name }],
    },
  };
}
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{
    topicSlug: string;
    postSlug: string;
  }>;
}

const formatVietnameseDate = (dateString: string | Date) => {
  if (!dateString) return "Đang cập nhật";
  const d = new Date(dateString);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day} tháng ${month}, ${year}`;
};

export default async function PostDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const { topicSlug, postSlug } = resolvedParams;

  const post = await getPostDetail(postSlug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(topicSlug);
  const comments = post.id ? await getPostComments(post.id) : [];

  const title = post.title || post.name || "Đang cập nhật tiêu đề";
  const content = post.content || post.description || post.body || "";
  const date = post.created_at || post.createdAt || post.published_at || new Date();

  const breadcrumb: BreadcrumbData = getBreadcrumbInfo(topicSlug);

  // LỌC BỎ bài viết đang xem khỏi danh sách liên quan
  const filteredRelatedPosts = relatedPosts
    ? relatedPosts.filter((item: any) => item.slug !== postSlug)
    : [];

  return (
    <div className="bg-white min-h-screen pb-20 font-sans text-[#333]">
      <div className="max-w-[1340px] mx-auto px-4 lg:px-6 mt-4">

        {/* BREADCRUMB */}
        <nav className="flex items-center gap-1 md:gap-2 text-[12px] md:text-[16px] text-[#00a651] font-medium mb-6 overflow-hidden">
          <Link href="/" className="flex items-center gap-1 hover:underline shrink-0">
            <Home size={15} className="mb-[2px]" /> Trang chủ
          </Link>
          <span className="text-gray-400 shrink-0">/</span>
          {breadcrumb.parentName && (
            <>
              <Link href={breadcrumb.parentLink!} className="hover:underline shrink-0 hidden sm:block">
                {breadcrumb.parentName}
              </Link>
              <span className="text-gray-400 shrink-0 hidden sm:block">/</span>
            </>
          )}
          <Link href={`/bai-viet/${topicSlug}`} className="hover:underline truncate min-w-0">
            {breadcrumb.currentName}
          </Link>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* CỘT TRÁI */}
          {/* CỘT TRÁI */}
          <div className="lg:w-[75%]">

            {/* Đã thêm dấu ! (important) để ép xóa viền, xóa bóng, xóa bo góc */}
            <div className="bg-white !border-none lg:!border-solid lg:!border lg:!border-[#e1e1e1] !shadow-none lg:!shadow-sm !rounded-none lg:!rounded-[4px] overflow-hidden mb-8 -mx-4 lg:mx-0">

              <div className="!pt-0 lg:!pt-5 lg:px-8 pb-8">

                <div className="bg-[#007d3d] !rounded-none lg:!rounded-[4px] px-4 md:px-5 py-4 mb-5">
                  <h1 className="text-white text-[18px] md:text-[20px] font-bold uppercase leading-snug">
                    {title}
                  </h1>
                </div>

                <div className="px-4 lg:px-0">
                  <div className="flex items-center gap-2 text-[#666] text-[13px] font-bold mb-4">
                    <Calendar size={16} className="text-[#007d3d]" />
                    <span>{formatVietnameseDate(date)}</span>
                  </div>

                  <hr className="border-t border-[#e1e1e1] mb-6" />

                  <article
                    className="w-full text-[#333] text-[15px] leading-[1.8] text-justify
                      [&>p]:mb-[15px] 
                      [&>strong]:font-bold 
                      [&>h2]:text-[18px] [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5 [&>h2]:text-[#007d3d]
                      [&>h3]:text-[16px] [&>h3]:font-bold [&>h3]:mb-2 [&>h3]:mt-4
                      [&>img]:max-w-full [&>img]:h-auto [&>img]:mx-auto [&>img]:my-4 [&>img]:rounded-[4px]
                      [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4
                      [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </div>
            </div>
            
            {/* BÌNH LUẬN */}
            <div className="mb-10">
              <h2 className="text-[#007d3d] text-[22px] font-bold mb-3">Bình luận</h2>
              <p className="text-[15px] text-[#333]">
                Nếu muốn bình luận cho bài viết này, bạn cần{' '}
                <LoginButton /> !
              </p>
              {comments && comments.length > 0 && (
                <div className="mt-6 flex flex-col gap-4">
                  {comments.map((cmt: any) => (
                    <div key={cmt.id} className="bg-gray-50 p-4 rounded-md border border-gray-100">
                      <p className="font-bold text-sm text-[#007d3d]">{cmt.user_name || cmt.userName || "Khách"}</p>
                      <p className="text-sm mt-1 text-gray-700">{cmt.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: BÀI VIẾT LIÊN QUAN */}
          <aside className="lg:w-[25%]">
            <div className="bg-white border-0 lg:border lg:border-solid lg:border-[#e1e1e1] rounded-none lg:rounded-[4px] shadow-none lg:shadow-sm sticky top-24 -mx-4 lg:mx-0">
              <div className="bg-white px-4 py-3 border-b border-[#e1e1e1]">
                <h3 className="text-[#007d3d] font-bold text-[15px]">Bài viết liên quan</h3>
              </div>
              <div className="p-4 lg:p-3">
                {filteredRelatedPosts.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {filteredRelatedPosts.slice(0, 5).map((item: any) => {
                      const imageUrl = item.avatar || item.thumbnail || item.image || item.image_url || "https://nongduocmiennam.vn/images/default-thumbnail.jpg";
                      return (
                        <Link
                          key={item.id}
                          href={`/bai-viet/${item.topic?.slug || item.category_slug || topicSlug}/${item.slug}`}
                          className="group flex flex-col gap-1.5"
                        >
                          <div className="w-full aspect-[16/9] rounded-[4px] overflow-hidden bg-gray-100">
                            <img
                              src={imageUrl}
                              alt={item.title || item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <h4 className="text-[14px] text-[#333] leading-snug font-medium group-hover:text-[#00a651] transition-colors line-clamp-2">
                            {item.title || item.name}
                          </h4>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400 italic text-[13px]">Chưa có bài viết liên quan...</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}