/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        formats: ["image/avif", "image/webp"],
        remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }]
    },
    poweredByHeader: false,
    compress: true,
};

export default nextConfig;
