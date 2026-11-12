import type { APIRoute } from 'astro';
import { siteConfig } from '../config';
import { languagesList, htmlLang, type Lang } from '../i18n/ui';
import { expandedGuides } from '../data/expandedGuides';

const home = languagesList.map((l) => ({
  loc: `${siteConfig.domain}/${l}/`,
  alternates: [
    ...languagesList.map((x) => ({ hreflang: htmlLang[x], href: `${siteConfig.domain}/${x}/` })),
    { hreflang: 'x-default', href: `${siteConfig.domain}/th/` },
  ],
}));

const topics: { lang: Lang; slug: string }[] = [
  { lang: 'th', slug: 'opening-hours' },
  { lang: 'th', slug: 'dress-code' },
  { lang: 'en', slug: 'tickets-opening-hours' },
  { lang: 'en', slug: 'how-to-get-there' },
  { lang: 'en', slug: 'architecture' },
];
const topicUrls = topics.map((t) => {
  const loc = `${siteConfig.domain}/${t.lang}/${t.slug}/`;
  return { loc, alternates: [{ hreflang: htmlLang[t.lang], href: loc }, { hreflang: 'x-default', href: loc }] };
});

const expandedUrls = expandedGuides.map(([slug]) => ({ loc: `${siteConfig.domain}/en/guides/${slug}/`, alternates: [{ hreflang: 'en', href: `${siteConfig.domain}/en/guides/${slug}/` }] }));
const urls = [...home, ...topicUrls, ...expandedUrls];

export const GET: APIRoute = () => {
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls
      .map((u) => {
        const links = u.alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`).join('\n');
        return `  <url>\n    <loc>${u.loc}</loc>\n${links}\n  </url>`;
      })
      .join('\n') +
    `\n</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
