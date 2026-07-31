import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 최신 Next.js 버전에서는 root 레벨에 선언합니다.
  allowedDevOrigins: ["192.168.1.103", "192.168.1.103:3000"],
};

export default nextConfig;
