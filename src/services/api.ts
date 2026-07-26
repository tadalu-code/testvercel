// ======================= GIAO DIỆN CHUNG =======================
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL 
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 
     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"));

if (typeof window === 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// ======================= BÀI VIẾT =======================

export async function getPost() {
  try {
    const res = await fetch(`${BASE_URL}/api/posts?page=1&limit=3`, {
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });
    const result = await res.json();
    if (result?.data?.posts && Array.isArray(result.data.posts)) {
      return result.data.posts;
    }
    return [];
  } catch (error) {
    return [];
  }
}

export async function getArticlesList(page = 1, limit = 10) {
  try {
    const res = await fetch(`${BASE_URL}/api/posts?page=${page}&limit=${limit}`, {
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });
    const result = await res.json();
    return {
      items: result?.data?.posts || result?.data?.data || [],
      total: result?.data?.totalItems || 0
    };
  } catch (error) {
    return { items: [], total: 0 };
  }
}

export async function getAllPosts(page = 1, limit = 10) {
  try {
    const res = await fetch(`${BASE_URL}/api/posts?page=${page}&limit=${limit}`, { cache: "no-store" });
    const result = await res.json();
    return result?.data?.data || result?.data?.posts || result?.data || [];
  } catch (error) {
    return [];
  }
}

export async function getPostDetail(slug: string) {
  try {
    const res = await fetch(`${BASE_URL}/api/posts/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (res.ok) {
      const result = await res.json();
      return result.data || result;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function getRelatedPosts(topicSlug: string) {
  try {
    const res = await fetch(`${BASE_URL}/api/posts?topicSlug=${topicSlug}&page=1&limit=5`, { cache: "no-store" });
    const result = await res.json();
    return result?.data?.posts || result?.data?.data || result?.data || [];
  } catch (error) {
    return [];
  }
}

export async function getPostsByTopic(topicSlug: string, page: number = 1, limit: number = 10) {
  try {
    const res = await fetch(`${BASE_URL}/api/posts?topicSlug=${topicSlug}&page=${page}&limit=${limit}`, { cache: 'no-store' });
    const result = await res.json();
    return result.data || { posts: [] }; 
  } catch (error) {
    return { posts: [] };
  }
}

export async function getPostComments(postId: number | string) {
  try {
    const res = await fetch(`${BASE_URL}/api/comments?postId=${postId}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const result = await res.json();
    return result?.data || [];
  } catch (error) {
    return [];
  }
}

export async function getTopics() {
  try {
    const res = await fetch(`${BASE_URL}/api/topics`, { cache: "no-store" });
    const result = await res.json();
    if (result?.data?.topics && Array.isArray(result.data.topics)) return result.data.topics;
    return result?.data || [];
  } catch (error) {
    return [];
  }
}

// ======================= SẢN PHẨM =======================

export async function getProducts(categorySlug?: string) {
  try {
    let url = `${BASE_URL}/api/products?page=1&limit=32`;
    if (categorySlug && categorySlug !== 'tat-ca') {
      url += `&categorySlugs=${categorySlug}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: { "Accept": "application/json" },
      cache: 'no-store' 
    });

    const result = await res.json();
    return result.data?.products || [];
  } catch (error) {
    return [];
  }
}

export async function getProductsList(page = 1, limit = 32, categorySlug = "") {
  try {
    let url = `${BASE_URL}/api/products?page=${page}&limit=${limit}`;
    if (categorySlug && categorySlug !== "tat-ca") {
      url += `&categorySlugs=${categorySlug}`;
    }

    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });

    if (!res.ok) return [];

    const result = await res.json();
    return result.data?.products || [];
  } catch (error) {
    return [];
  }
}

export async function getCategories() {
  try {
    const res = await fetch(`${BASE_URL}/api/categories`, {
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });

    if (!res.ok) return [];
    const result = await res.json();

    if (result?.data?.categories && Array.isArray(result.data.categories)) return result.data.categories;
    if (result?.data && Array.isArray(result.data)) return result.data;
    if (Array.isArray(result)) return result;

    return [];
  } catch (error) {
    return [];
  }
}

export async function getAllProducts() {
  try {
    const res = await fetch(`${BASE_URL}/api/products`, { cache: 'no-store' });
    if (!res.ok) return [];
    const result = await res.json();
    return result.data?.products || [];
  } catch (error) {
    console.error("Lỗi fetch toàn bộ sản phẩm:", error);
    return [];
  }
}

export async function getProductsByCategory(categorySlug: string) {
  return getProductsList(1, 100, categorySlug);
}

export async function getProductDetail(slug: string) {
  try {
    const res = await fetch(`${BASE_URL}/api/products/${slug}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result.data || null;
  } catch (error) {
    console.error("Lỗi fetch chi tiết:", error);
    return null;
  }
}