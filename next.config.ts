import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "web-push"],
  // Hide the floating Next.js "N" dev indicator so it is not mistaken for app UI.
  devIndicators: false,
};

export default nextConfig;
