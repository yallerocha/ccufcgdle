import type { NextConfig } from "next";

// In production on Vercel, set API_URL to the public URL of the Express backend
// (e.g. https://ccdle-api.railway.app). The browser calls /api/... on the same
// origin; Next.js rewrites those requests to the backend (no CORS, no
// NEXT_PUBLIC_API_URL needed). Locally with Docker, keep using NEXT_PUBLIC_API_URL.
const apiUrl = process.env.API_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!apiUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
