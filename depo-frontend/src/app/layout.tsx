import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import IOSInstallPrompt from "@/components/IOSInstallPrompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaaS Depo",
  description: "Modern Stok ve Depo Yönetim Sistemi",
  manifest: "/manifest.json", // PWA Manifest
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className={inter.className}>
        {children}
        <IOSInstallPrompt />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}