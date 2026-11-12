import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BDI Calc Pro',
    short_name: 'BDI Calc',
    description: 'Calculadora Profissional de BDI para Obras Públicas',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9FAFB',
    theme_color: '#176EB5',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
