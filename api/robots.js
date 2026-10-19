// GET /robots.txt → indica a los buscadores qué pueden mirar y dónde está el mapa del sitio
import { originOf } from "./sitemap.js";

export default function handler(req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400");
  res.end(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${originOf(req)}/sitemap.xml
`);
}
