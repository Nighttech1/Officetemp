import type { NextConfig } from "next";

/** Backend for Next rewrites (browser talks same-origin /api/v1 → here). */
const API_PROXY_TARGET = (
  process.env.API_PROXY_TARGET || "http://127.0.0.1:8005"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // C-156: не показывать Next.js Dev Tools badge на витрине при приёмке
  devIndicators: false,
  // Чертежи ИУЛ часто >10 МБ; иначе proxy обрезает тело → пустой штамп.
  experimental: {
    middlewareClientMaxBodySize: "100mb",
    // Google Sheets export+parse может >30с; иначе UI видит Internal Server Error
    proxyTimeout: 180_000,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_PROXY_TARGET}/api/v1/:path*`,
      },
      {
        source: "/health",
        destination: `${API_PROXY_TARGET}/health`,
      },
    ];
  },
};

export default nextConfig;
