// GET /api/config → datos públicos que necesita el panel (p. ej. la clave pública del captcha)
import { handle, send } from "./_lib.js";

export default handle(["GET"], async (req, res) => {
  send(res, 200, { turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || null }, { "Cache-Control": "no-store" });
});
