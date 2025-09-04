/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.appspot.com" }
    ]
  },
  eslint: { ignoreDuringBuilds: true }
};
export default nextConfig;
