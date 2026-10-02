// POST /api/login { password } → { token }
import { handle, send, readJson, checkPassword, createToken, HttpError } from "./_lib.js";

export default handle(["POST"], async (req, res) => {
  const { password } = await readJson(req, 10_000);
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800)); // frena intentos a lo bruto
    throw new HttpError(401, "Contraseña incorrecta.");
  }
  send(res, 200, { token: createToken() }, { "Cache-Control": "no-store" });
});
