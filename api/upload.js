// POST /api/upload  (cuerpo = imagen, cabecera X-File-Type) → { url }
import crypto from "node:crypto";
import { handle, send, readRaw, requireAuth, storage, UPLOADS_PREFIX, HttpError } from "./_lib.js";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export default handle(["POST"], async (req, res) => {
  requireAuth(req);
  const type = String(req.headers["x-file-type"] || "").toLowerCase();
  const ext = TYPES[type];
  if (!ext) throw new HttpError(400, "Solo se pueden subir imágenes JPG, PNG, WEBP o GIF.");
  const body = await readRaw(req, 4_200_000);
  if (!body.length) throw new HttpError(400, "La imagen está vacía.");
  const d = new Date();
  const key = `${UPLOADS_PREFIX}${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
  await storage.put(key, body, type);
  send(res, 200, { url: storage.publicUrl(key) }, { "Cache-Control": "no-store" });
});
