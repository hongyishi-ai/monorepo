import { HOME_OG_IMAGE_URL } from "@/lib/constants";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC } from "next/font/google";
import cn from "classnames";
import { ThemeSwitcher } from "./_components/theme-switcher";

import "./globals.css";

// 思源黑体作为全局字体
const notoSansSC = Noto_Sans_SC({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
  variable: '--font-noto-sans-sc',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif']
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hongyishi.cn"),
  title: "红医师",
  description:
    "红医师一线医疗工具：热射病防治、训练伤防治与战场救护。",
  appleWebApp: {
    capable: true,
    title: "红医师",
    statusBarStyle: "default",
  },
  applicationName: "红医师",
  manifest: "/favicon/site.webmanifest",
  openGraph: {
    title: "红医师",
    description:
      "红医师一线医疗工具。",
    images: [HOME_OG_IMAGE_URL],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4ECDC" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      data-mode="system"
      data-hys-theme="system"
      data-hys-theme-resolved="light"
    >
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          color="#000000"
        />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={cn(notoSansSC.className, notoSansSC.variable, "dark:bg-black dark:text-slate-400")}
      >
        <ThemeSwitcher />
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
