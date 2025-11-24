import withPWA from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Backend'den (localhost:3000) gelen resimlere izin ver
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3000',
                pathname: '/uploads/**',
            },
        ],
    },
    // React Strict Mode geliştirme sırasında hataları yakalar
    reactStrictMode: true,
};

// PWA Ayarları
const pwaConfig = withPWA({
    dest: "public", // Service Worker'ı public klasörüne atar
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    // Geliştirme modunda (npm run dev) PWA'yı kapat ki sürekli cache ile uğraşma
    // Production'da (npm run build) otomatik açılır.
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
        disableDevLogs: true,
    },
});

export default pwaConfig(nextConfig);