import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // OBRIGATÓRIO para o Render (Static Site):
  // Gera arquivos estáticos (HTML/CSS/JS) na pasta "out"
  output: "export",

  images: {
    // OBRIGATÓRIO para Static Site:
    // Como não há servidor rodando para otimizar imagens em tempo real,
    // precisamos desativar a otimização automática do componente <Image>.
    unoptimized: true,

    // Mantendo suas configurações originais (caso mude de hospedagem no futuro)
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