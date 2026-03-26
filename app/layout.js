export const metadata = {
  title: 'AI Builders Digest',
  description: '跟踪顶尖 AI builders 的最新观点和动态',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
