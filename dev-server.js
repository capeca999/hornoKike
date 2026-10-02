// Servidor para probar en local:  ADMIN_PASSWORD=1234 LOCAL_STORAGE_DIR=./.local-storage npm run dev
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PORT = process.env.PORT || 3000;
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/api/")) {
      const name = url.pathname.slice(5).replace(/[^a-z]/g, "");
      const mod = await import(`./api/${name}.js`);
      return mod.default(req, res);
    }
    let file;
    if (url.pathname.startsWith("/__local/")) file = path.join(process.env.LOCAL_STORAGE_DIR || ".local-storage", url.pathname.slice(9));
    else {
      file = path.join(ROOT, decodeURIComponent(url.pathname));
      if (!file.startsWith(ROOT)) throw new Error("bad path");
      const st = await fs.stat(file).catch(() => null);
      if (st?.isDirectory()) file = path.join(file, "index.html");
      else if (!st) file += ".html";
    }
    const data = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
}).listen(PORT, () => console.log(`Forn Almenar en http://localhost:${PORT}  ·  panel: http://localhost:${PORT}/admin`));
