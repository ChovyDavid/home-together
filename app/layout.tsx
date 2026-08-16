import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "./service-worker-register";

export const metadata: Metadata = {
  title: { default: "Home Together", template: "%s · Home Together" },
  description: "轻量、温馨、清晰的家庭任务协作工具。",
  applicationName: "Home Together",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Home Together", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    title: "Home Together · 把家里的事，温柔地放在一起",
    description: "一起安排、完成和回顾家里的大小事。",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Home Together 家庭家事管理" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Home Together",
    description: "把家里的事，温柔地放在一起。",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#b07a95",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
