import type { NextConfig } from "next";

// O proxy de /api/* para a API Express vive em src/proxy.ts (precisa ser lá, e
// não aqui, para conseguir ajustar os headers enviados ao destino externo).
// Defina API_URL com a URL pública do backend. Localmente com Docker, continue
// usando NEXT_PUBLIC_API_URL.
const nextConfig: NextConfig = {};

export default nextConfig;
