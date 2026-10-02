// POST /api/login { password, captcha } → { token }
import { handle, send, readJson, checkPassword, createToken, verifyCaptcha, HttpError } from "./_lib.js";

export default handle(["POST"], async (req, res) => {
  const { password, captcha } = await readJson(req, 10_000);
  // 1. Captcha (solo si TURNSTILE_SECRET_KEY está configurada en Vercel)
  await verifyCaptcha(captcha, req);
  // 2. Contraseña
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800)); // frena intentos a lo bruto
    throw new HttpError(401, "Contraseña incorrecta.");
  }
  send(res, 200, { token: createToken() }, { "Cache-Control": "no-store" });
});
