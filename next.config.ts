import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Los videos suben directo a Blob con URL firmada; al servidor solo llegan
    // formularios y metadatos, asi que el limite por defecto basta.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
