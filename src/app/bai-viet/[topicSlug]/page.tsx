import { getPostsByTopic, getAllPosts } from "@/services/api";
import Link from "next/link";
import { Home } from "lucide-react";
import { getBreadcrumbInfo, BreadcrumbData } from "@/utils/breadcrumb";
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: Promise<{ topicSlug: string }> }
): Promise<Metadata> {
  const { topicSlug } = await params;
  const breadcrumb = getBreadcrumbInfo(topicSlug);
  const title = `${breadcrumb.currentName} | Nông Dược Miền Nam`;
  
  return {
    title,
    description: `Danh sách bài viết chuyên mục ${breadcrumb.currentName} từ Nông Dược Miền Nam.`,
  };
}

const parseImages = (urlStr: any) => {
  try {
    if (!urlStr) return [];
    if (Array.isArray(urlStr)) return urlStr;
    const cleanJson = urlStr.trim().replace(/^['"]|['"]$/g, '').replace(/\\"/g, '"');
    const parsed = JSON.parse(cleanJson);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    const regex = /https?:\/\/[^"\\\s/]+[^"\\\s]+/g;
    return urlStr?.match(regex) || [];
  }
};

interface Props {
  params: Promise<{
    topicSlug: string;
  }>;
}

export default async function TopicPostsPage({ params }: Props) {
  const { topicSlug } = await params;
  const breadcrumb: BreadcrumbData = getBreadcrumbInfo(topicSlug);

  const postsData = await getPostsByTopic(topicSlug, 1, 10);
  const topicPosts = postsData.posts || postsData || [];
  
  const allPosts = await getAllPosts(1, 10);
  const sidebarPosts = allPosts ? allPosts.slice(0, 5) : [];

  return (
    <div className="bg-[#f4f4f4] min-h-screen text-gray-800 font-sans">
      {/* BREADCRUMB */}
      <div className="max-w-[1340px] mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-[12px] md:text-[14px]">
          <Link href="/" className="flex items-center gap-1 hover:underline text-[#028046]">
            <Home size={16} /> Trang chủ
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/bai-viet" className="hover:underline text-[#028046]">
            Bài viết
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-bold text-[#028046]">{breadcrumb.currentName}</span>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-[1340px] mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* DANH SÁCH BÀI VIẾT THEO TOPIC */}
          <div className="md:col-span-9 min-w-0">
            {topicPosts && topicPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topicPosts.map((item: any) => {
                  const imgs = parseImages(item.thumbnail || item.imagesUrl || item.avatar || item.image);

                  return (
                    <Link
                      key={item.id}
                      href={`/bai-viet/${topicSlug}/${item.slug}`}
                      className="group block bg-white rounded-[4px] shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                        <img
                          src={imgs[0] || "https://placehold.co/600x400"}
                          alt={item.title || item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-[#007d3d] font-bold text-[17px] leading-snug mb-1.5 line-clamp-2 group-hover:underline">
                          {item.title || item.name}
                        </h3>
                        <p className="text-[#333] text-[14px] leading-relaxed line-clamp-3">
                          {item.short_description || item.description || item.shortDescription || item.summary || "Nhấn để xem chi tiết bài viết..."}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded shadow-sm border border-gray-200">
                <p className="text-gray-500 text-[16px] font-medium">Chưa có bài viết nào thuộc chuyên mục này...</p>
                <Link href="/bai-viet" className="inline-block mt-4 text-[#007d3d] hover:underline">
                  &larr; Xem tất cả bài viết
                </Link>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="md:col-span-3 sticky min-w-0 top-24">
            <div className="bg-white rounded-[4px] shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-white px-4 py-3 border-b border-gray-200">
                <h4 className="text-[#007d3d] font-bold text-[15px]">Bài viết mới nhất</h4>
              </div>
              <div className="p-2 space-y-1">
                {sidebarPosts.map((related: any) => {
                  const rImgs = parseImages(related.thumbnail || related.imagesUrl || related.avatar || related.image);
                  const rTopicSlug = related.topic?.slug || related.category_slug || "tin-tuc";

                  return (
                    <Link key={related.id} href={`/bai-viet/${rTopicSlug}/${related.slug}`} className="flex flex-col gap-1.5 p-1.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all group">
                      <div className="w-full aspect-video rounded overflow-hidden shadow-sm">
                        <img src={rImgs[0] || "https://placehold.co/600x400"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={related.title || related.name} />
                      </div>
                      <h5 className="text-[14px] font-medium text-[#333] leading-snug group-hover:text-[#007d3d] transition-colors line-clamp-2">{related.title || related.name}</h5>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}