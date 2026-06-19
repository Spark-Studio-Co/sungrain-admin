import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "react-router-dom": "./src/lib/router-compat.tsx",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-router-dom": path.resolve(__dirname, "src/lib/router-compat.tsx"),
    };

    return config;
  },
};

export default nextConfig;
