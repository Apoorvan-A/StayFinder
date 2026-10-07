/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Remote demo imagery (Unsplash/pravatar) is served unoptimized for reliability — the
    // on-demand optimizer can hiccup under concurrent remote fetches. A production build
    // would front images with object storage + a CDN instead (see README).
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
