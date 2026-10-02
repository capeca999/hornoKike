// GET  /api/history            → lista de copias de seguridad
// POST /api/history { key }    → restaura una copia
import { handle, send, readJson, requireAuth, storage, saveContent, HISTORY_PREFIX, HttpError } from "./_lib.js";

export default handle(["GET", "POST"], async (req, res) => {
  requireAuth(req);
  if (req.method === "GET") {
    const items = (await storage.list(HISTORY_PREFIX)).sort((a, b) => b.key.localeCompare(a.key));
    return send(res, 200, { items }, { "Cache-Control": "no-store" });
  }
  const { key } = await readJson(req, 10_000);
  if (!key || !key.startsWith(HISTORY_PREFIX) || key.includes("..")) throw new HttpError(400, "Copia no válida.");
  const buf = await storage.get(key);
  if (!buf) throw new HttpError(404, "No se ha encontrado esa copia.");
  const content = JSON.parse(buf.toString("utf8"));
  await saveContent(content);
  send(res, 200, { ok: true, content }, { "Cache-Control": "no-store" });
});
