import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // serverExternalPackages는 지정한 패키지를 
  // 서버 번들에서 제외하고 Node의 모듈 해석을 사용하게 하는 설정
   serverExternalPackages: [
    'yjs',
    'y-protocols',
  ],
};

export default nextConfig;
