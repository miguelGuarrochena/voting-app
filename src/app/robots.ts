import type { MetadataRoute } from 'next';

// Next.js 16 App Router resolves this file to /robots.txt at build time.
//
// Strategy: allow general crawling, only block auth flows and the API.
// We don't try to block /votes/<token>, /ranking/<token>, etc. — their
// tokens are random nanoids that crawlers can't enumerate, AND blocking
// /votes/ would also mess with /votes (the listing page we DO want
// indexed). The sitemap (sitemap.ts) is the canonical list of what we
// actually want indexed; anything not in there is just orphan to the
// crawler.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/auth/', '/api/'],
      },
    ],
    sitemap: 'https://letspickly.com/sitemap.xml',
    host: 'https://letspickly.com',
  };
}
