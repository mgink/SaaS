/** @type {import('next').NextConfig} */
const nextConfig = {
    // Build'i Turbopack yerine Webpack ile yapmaya zorlar
    experimental: {
        webpackBuildWorker: false,
    },
    webpack: (config) => {
        return config;
    },
    turbopack: {}, // boş config → hatayı susturur
};

module.exports = nextConfig;
