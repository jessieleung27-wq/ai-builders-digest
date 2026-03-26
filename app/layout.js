export const metadata = {
  title: 'AI Builders Digest',
  description: '跟踪顶尖 AI builders 的最新观点和动态 - 每日自动更新 - 完整原文',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
