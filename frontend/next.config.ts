import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API calls go through app/api/[...path]/route.ts (explicit proxy).
  // That avoids flaky first-load rewrite races against a booting Rails app.
};

export default nextConfig;
