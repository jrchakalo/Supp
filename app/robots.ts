import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/host', '/join', '/professor', '/tela', '/api'],
      },
    ],
    sitemap: 'https://www.supp.lol/sitemap.xml',
  };
}
