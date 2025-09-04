/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.appspot.com" },
    ],
  },
  eslint: { ignoreDuringBuilds: true }, // Vercel 本番でLintエラーで落とさない
};
export default nextConfig;
