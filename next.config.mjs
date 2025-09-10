/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.appspot.com" },
      // Firebase Storageからの画像表示を許可する設定
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;