import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/host', '/join'],
      },
    ],
    sitemap: 'https://www.supp.lol/sitemap.xml',
  };
}
