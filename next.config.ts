import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 기본 설정 (웹뷰 최적화)
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,

  // 웹뷰에 특화된 성능 최적화
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-toast",
      "react-hook-form",
      "date-fns",
      "lodash-es",
    ],
    optimizeCss: true,
    scrollRestoration: true,
    webVitalsAttribution: ["CLS", "LCP", "FCP", "FID", "TTFB"],
  },

  // 빌드 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
    reactRemoveProperties: process.env.NODE_ENV === "production",
  },

  // 이미지 최적화 (웹뷰 특화)
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 3, // 3일 캐시
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: "default",
    unoptimized: true,

    // 외부 이미지 도메인
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.chalpu.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // 웹뷰 특화 헤더
  async headers() {
    return [
      // 정적 파일은 인증 없이 접근 가능하도록 설정
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      // 폰트 파일
      {
        source: "/_next/static/media/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      // 이미지 파일
      {
        source: "/_next/image/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      // API 응답 캐싱
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=300",
          },
        ],
      },
      // 페이지 경로에만 보안 헤더 적용
      {
        source:
          "/((?!_next/static|_next/image|_next/webpack-hmr|api|favicon.ico).*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-UA-Compatible",
            value: "IE=edge",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400",
          },
        ],
      },
    ];
  },

  // 웹뷰 리다이렉트 최적화
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // 웹뷰 최적화를 위한 웹팩 설정
  webpack: (config, { dev }) => {
    if (dev) {
      return config;
    }

    // 웹뷰 최적화를 위한 번들 설정
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
      splitChunks: {
        chunks: "all",
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/].*\.js$/,
            name: "vendors",
            chunks: "all",
            priority: 10,
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 5,
            reuseExistingChunk: true,
          },
          styles: {
            test: /\.css$/,
            name: "styles",
            chunks: "all",
            enforce: true,
          },
          // 웹뷰에서 자주 사용하는 라이브러리 분리
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            name: "ui",
            chunks: "all",
            priority: 20,
          },
          // 상태 관리 라이브러리 분리
          state: {
            test: /[\\/]node_modules[\\/](zustand|@tanstack)[\\/]/,
            name: "state",
            chunks: "all",
            priority: 15,
          },
        },
      },
    };

    // 웹뷰에서 불필요한 모듈 제거
    config.resolve.alias = {
      ...config.resolve.alias,
      "react/jsx-dev-runtime": "react/jsx-runtime",
    };

    // 웹뷰 성능 최적화를 위한 추가 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

export default nextConfig;
