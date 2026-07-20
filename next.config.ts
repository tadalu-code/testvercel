/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.nongduocmiennam.vn',
      },
      {
        protocol: 'https',
        hostname: 'zpjzrrlcwiugaufszjmq.supabase.co',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'index, follow' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;



//   // HTTP Headers cho SEO + Bảo mật
//   async headers() {
//     return [
//       {
//         source: '/(.*)', // Áp dụng cho TẤT CẢ các trang
//         headers: [
//           // === SEO ===
//           {
//             key: 'X-Robots-Tag',
//             value: 'index, follow', // Cho phép Google index và follow links
//           },

//           // === BẢO MẬT ===
//           {
//             key: 'X-Frame-Options',
//             value: 'SAMEORIGIN', // Chặn trang bị nhúng iframe từ site khác
//           },
//           {
//             key: 'X-Content-Type-Options',
//             value: 'nosniff', // Chặn trình duyệt đoán sai MIME type
//           },
//           {
//             key: 'Referrer-Policy',
//             value: 'strict-origin-when-cross-origin', // Kiểm soát thông tin referrer
//           },
//           {
//             key: 'Permissions-Policy',
//             value: 'camera=(), microphone=(), geolocation=()', // Chặn quyền không cần thiết
//           },
//         ],
//       },
//     ];
//   },
// };

// export default nextConfig;