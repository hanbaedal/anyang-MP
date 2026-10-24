import type { NextConfig } from "next";

function cdnPatterns() {
  const raw = process.env.NEXT_PUBLIC_IMAGE_CDN_BASE || process.env.IMAGE_CDN_BASE;
  if (!raw) return [];
  try {
    const u = new URL(raw);
    return [
      {
        protocol: (u.protocol.replace(":", "") || "https") as "http" | "https",
        hostname: u.hostname,
        pathname: "/**" as const,
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  experimental: {
    // 홈 히어로 영상(50MB) 등 관리 업로드 — 여유 포함
    serverActions: { bodySizeLimit: "60mb" },
    proxyClientMaxBodySize: "60mb",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: cdnPatterns(),
  },
  async headers() {
    // 정적 히어로 MP4 — 캐시버스트(?v=)와 함께 장기 캐시 안전
    return [
      {
        source: "/static/:path*.mp4",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }];
  },
  async redirects() {
    return [
      { source: "/support/contact", destination: "/support/inquiry", permanent: false },
      { source: "/guide/weeding", destination: "/guide/services", permanent: false },
      { source: "/pay", destination: "/guide/procedure", permanent: false },
      { source: "/support/kakao", destination: "/support/inquiry", permanent: false },
      { source: "/account/register", destination: "/", permanent: false },
      { source: "/account/complete", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
