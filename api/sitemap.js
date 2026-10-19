// GET /sitemap.xml → mapa del sitio para Google (se genera solo con las noticias y páginas legales publicadas)
import { storage, CONTENT_KEY } from "./_lib.js";

const LANGS = [["es", ""], ["va", "?lang=va"], ["en", "?lang=en"]];
const xml = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

export const originOf = (req) => {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "localhost").split(",")[0].trim();
  const proto = String(req.headers["x-forwarded-proto"] || (host.startsWith("localhost") ? "http" : "https")).split(",")[0].trim();
  return `${proto}://${host}`;
};

export default async function handler(req, res) {
  const origin = originOf(req);
  let content = null;
  try { const buf = await storage.get(CONTENT_KEY); if (buf) content = JSON.parse(buf.toString("utf8")); } catch {}
  if (!content) {
    try { content = await (await fetch(origin + "/content/default.json")).json(); } catch { content = {}; }
  }
  const pages = [{ path: "/", priority: "1.0", freq: "weekly" }];
  const posts = (content.blog?.posts || []).filter((p) => p.published !== false && p.title);
  pages.push({ path: "/blog", priority: "0.8", freq: "weekly", lastmod: posts.map((p) => p.date).sort().pop() });
  posts.forEach((p) => pages.push({ path: `/blog/${encodeURIComponent(p.slug || p.id)}`, priority: "0.6", freq: "monthly", lastmod: p.date }));
  (content.legal?.pages || []).filter((p) => p.title).forEach((p) => pages.push({ path: `/legal/${encodeURIComponent(p.slug || p.id)}`, priority: "0.2", freq: "yearly" }));

  const urls = pages.flatMap((p) => LANGS.map(([, q]) => `  <url>
    <loc>${xml(origin + p.path + q)}</loc>
${LANGS.map(([l, q2]) => `    <xhtml:link rel="alternate" hreflang="${l === "va" ? "ca" : l}" href="${xml(origin + p.path + q2)}"/>`).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(origin + p.path)}"/>${p.lastmod && /^\d{4}-\d{2}-\d{2}$/.test(p.lastmod) ? `\n    <lastmod>${p.lastmod}</lastmod>` : ""}
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`));
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.end(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`);
}
