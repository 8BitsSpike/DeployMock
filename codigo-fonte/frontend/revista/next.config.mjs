/** @type {import('next').NextConfig} */
const nextConfig = {
  // OBRIGATÓRIO para o Render (Static Site):
  output: "export",

  // IGNORAR ERROS NO BUILD (Permite o deploy mesmo com erros de lint/types)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    // OBRIGATÓRIO para Static Site:
    unoptimized: true,

    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
  },
};

export default nextConfig;