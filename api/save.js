// POST /api/save { content } → guarda en R2 y crea copia de seguridad
import { handle, send, readJson, requireAuth, saveContent, HttpError } from "./_lib.js";

export default handle(["POST"], async (req, res) => {
  requireAuth(req);
  const { content } = await readJson(req);
  if (!content || typeof content !== "object" || !content.general) throw new HttpError(400, "El contenido no es válido.");
  await saveContent(content);
  send(res, 200, { ok: true, savedAt: new Date().toISOString() }, { "Cache-Control": "no-store" });
});
