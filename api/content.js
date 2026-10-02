// GET /api/content → contenido de la web guardado en R2 (o null si aún no hay)
import { handle, send, storage, CONTENT_KEY } from "./_lib.js";

export default handle(["GET"], async (req, res) => {
  const fresh = new URL(req.url, "http://x").searchParams.has("fresh");
  const buf = await storage.get(CONTENT_KEY);
  send(res, 200, { content: buf ? JSON.parse(buf.toString("utf8")) : null }, {
    "Cache-Control": fresh ? "no-store" : "public, max-age=0, s-maxage=5, stale-while-revalidate=60",
  });
});
