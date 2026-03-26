/** @type {import('next').NextConfig} */
const nextConfig = {
  // 不设置 output，使用 Vercel 默认的 SSR
  images: {
    unoptimized: true
  }
}

export default nextConfig
