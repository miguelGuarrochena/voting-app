import type { MetadataRoute } from 'next';

// Next.js 16 App Router resolves this file to /sitemap.xml at build time.
//
// We list only public, static, evergreen routes — the listing/landing
// pages of each vertical, plus the create flows and legal pages. The
// dynamic poll pages (/votes/<token>, /ranking/<token>, /ratings/<token>,
// /versus/<token>) are intentionally excluded: their tokens are random
// and per-poll, so listing them in the sitemap would (a) leak privacy
// for what is shared via direct link, and (b) flood Google's index with
// short-lived pages that aren't useful as standalone search results.
//
// `lastModified` uses the deploy time so search engines pick up changes
// when we re-deploy. Priority is loose — Google mostly ignores it now
// but it doesn't hurt to provide.

const BASE_URL = 'https://letspickly.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/create`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/votes`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/ranking`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/ratings`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/spin`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/versus`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/versus/create`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/ratings/create`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/trending`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
