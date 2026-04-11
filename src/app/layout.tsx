import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "SantaChains Blog",
  description: "在川端康成的雪国里，每一粒雪晶都是未完成的诗篇",
  authors: [{ name: "SantaChains" }],
  metadataBase: new URL('https://santachains.github.io'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* Content Security Policy */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={buildCSP()}
        />
        {/* Preconnect to Google Fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Google Fonts - Caveat (标题) 和 Quicksand (正文) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Quicksand:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* 预加载关键字体文件 */}
        <link rel="preload" href="/fonts/Arima-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/LXGWWenKaiMono.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <ThemeProvider defaultTheme="system" storageKey="santachains-theme">
          <ErrorBoundary>
            <Header />
            <main className="flex-1 pt-16">
              {children}
            </main>
            <Footer />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}

/**
 * 构建 Content Security Policy 策略
 *
 * 策略说明：
 * - default-src 'self': 仅允许同源资源
 * - script-src 'self' 'unsafe-inline' 'unsafe-eval': 允许同源脚本 + 内联脚本（Next.js需要）
 * - style-src 'self' 'unsafe-inline' https://fonts.googleapis.com: 允许内联样式 + Google字体
 * - font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net: 允许 Google 字体 + KaTeX 字体
 * - img-src 'self' data: blob: https://img.shields.io https://img.yoqi.me: 允许图片（本地 + SVG badge + data URLs）
 * - connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.jsdelivr.net: 允许字体API连接
 * - frame-ancestors 'none': 禁止被嵌入iframe
 * - base-uri 'self': 限制 base 标签源
 * - form-action 'self': 限制表单提交流向
 */
function buildCSP(): string {
  const directives = [
    // 默认仅允许同源
    "default-src 'self'",

    // 脚本：同源 + 内联（Next.js需要）+ unsafe-eval（Shiki代码高亮需要）
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",

    // 样式：同源 + 内联 + Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",

    // 字体：同源 + Google Fonts + KaTeX CDN
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",

    // 图片：同源 + data URLs + badge图标
    "img-src 'self' data: blob: https://img.shields.io https://img.yoqi.me",

    // 连接：同源 + 字体API + KaTeX CDN
    "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://cdn.jsdelivr.net",

    // 禁止被嵌入
    "frame-ancestors 'none'",

    // 限制 base 标签
    "base-uri 'self'",

    // 限制表单提交
    "form-action 'self'",
  ];

  return directives.join('; ');
}
