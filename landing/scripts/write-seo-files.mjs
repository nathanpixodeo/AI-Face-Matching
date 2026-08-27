import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const fallbackSiteUrl = 'https://facematch.example.com';
const fallbackAppUrl = 'https://app.example.com';
const dist = resolve(import.meta.dirname, '..', 'dist');
const productionEnv = await readFile(
  resolve(import.meta.dirname, '..', '.env.production'),
  'utf8',
).catch(() => '');
const configuredSiteUrl = productionEnv.match(/^VITE_SITE_URL=(.+)$/m)?.[1]?.trim();
const configuredAppUrl = productionEnv.match(/^VITE_APP_URL=(.+)$/m)?.[1]?.trim();
const siteUrl = new URL(process.env.VITE_SITE_URL ?? configuredSiteUrl ?? fallbackSiteUrl).origin;
new URL(process.env.VITE_APP_URL ?? configuredAppUrl ?? fallbackAppUrl).origin;

await mkdir(dist, { recursive: true });
await Promise.all([
  writeFile(
    resolve(dist, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
    'utf8',
  ),
  writeFile(
    resolve(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
    'utf8',
  ),
]);
