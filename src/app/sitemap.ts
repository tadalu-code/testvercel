import { MetadataRoute } from 'next'
import { getTopics, getPostsByTopic, getProducts } from '@/services/api'

function toDateOnly(date?: string | Date): string {
  const d = new Date(date || new Date())
  d.setHours(d.getHours() + 7)
  return d.toISOString().split('T')[0]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nongduocmiennam.vn'

  // 1. TRANG TĨNH
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: toDateOnly(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/gioi-thieu`, lastModified: toDateOnly(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/san-pham`, lastModified: toDateOnly(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/bai-viet`, lastModified: toDateOnly(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/lien-he`, lastModified: toDateOnly(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  // 2. DANH MỤC BÀI VIẾT
  let topicPages: MetadataRoute.Sitemap = []
  let topicSlugs: string[] = []

  try {
    const topics = await getTopics()
    topicSlugs = topics.filter((t: any) => t.slug).map((t: any) => t.slug)

    topicPages = topicSlugs.map((slug) => ({
      url: `${baseUrl}/bai-viet/${slug}`,
      lastModified: toDateOnly(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (err) {
    console.error('Sitemap: Lỗi lấy topics:', err)
  }

  // 3. BÀI VIẾT ĐỘNG
  let postPages: MetadataRoute.Sitemap = []

  try {
    const allResults = await Promise.all(
      topicSlugs.map((slug) => getPostsByTopic(slug, 1, 200))
    )

    allResults.forEach((data, index) => {
      const topicSlug = topicSlugs[index]
      const posts = data?.posts || []

      const pages: MetadataRoute.Sitemap = posts
        .filter((post: any) => post.slug)
        .map((post: any) => ({
          url: `${baseUrl}/bai-viet/${topicSlug}/${post.slug}`,
          lastModified: toDateOnly(post.updated_at || post.created_at),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))

      postPages = [...postPages, ...pages]
    })
  } catch (err) {
    console.error('Sitemap: Lỗi lấy bài viết:', err)
  }

  // 4. SẢN PHẨM ĐỘNG
  let productPages: MetadataRoute.Sitemap = []

  try {
    const products = await getProducts()
    productPages = products
      .filter((p: any) => p.slug)
      .map((p: any) => ({
        url: `${baseUrl}/san-pham/${p.category?.slug || 'danh-muc'}/${p.slug}`,
        lastModified: toDateOnly(p.updated_at || p.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
  } catch (err) {
    console.error('Sitemap: Lỗi lấy sản phẩm:', err)
  }

  return [...staticPages, ...topicPages, ...postPages, ...productPages]
}