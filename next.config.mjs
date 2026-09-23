/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  output: 'standalone',
  allowedDevOrigins: ["192.168.100.147"],
};

export default nextConfig;
