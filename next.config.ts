import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.googleusercontent.com" }, { protocol: "https", hostname: "**.appspot.com" }],
  },
};
