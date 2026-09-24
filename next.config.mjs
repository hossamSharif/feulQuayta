/** @type {import('next').NextConfig} */
import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  sw: "service-worker.js",
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

export default pwaConfig(nextConfig);