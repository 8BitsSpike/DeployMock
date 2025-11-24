/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "export",  <-- REMOVA OU COMENTE ESSA LINHA
  
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true }, // Opcional no Web Service, mas economiza CPU
};
export default nextConfig;
