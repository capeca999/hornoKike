// Utilidades compartidas por las funciones de /api (los archivos con "_" no son rutas en Vercel)
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const CONTENT_KEY = "content/site.json";
export const HISTORY_PREFIX = "content/history/";
export const UPLOADS_PREFIX = "uploads/";
const HISTORY_KEEP = 30;

/* ------------------------------------------------------------------
   Almacenamiento: R2 (producción) o carpeta local (para probar)
------------------------------------------------------------------ */
const env = process.env;
const useLocal = !env.R2_BUCKET && env.LOCAL_STORAGE_DIR;

let s3 = null;
async function r2() {
  if (s3) return s3;
  const missing = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"].filter((k) => !env[k]);
  if (missing.length) throw new HttpError(500, `Faltan variables de entorno en Vercel: ${missing.join(", ")}`);
  const sdk = await import("@aws-sdk/client-s3");
  s3 = {
    sdk,
    client: new sdk.S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
    }),
  };
  return s3;
}

export const storage = {
  async get(key) {
    if (useLocal) {
      try { return await fs.readFile(path.join(env.LOCAL_STORAGE_DIR, key)); } catch { return null; }
    }
    const { sdk, client } = await r2();
    try {
      const out = await client.send(new sdk.GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
      return Buffer.from(await out.Body.transformToByteArray());
    } catch (e) {
      if (e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404) return null;
      throw e;
    }
  },
  async put(key, body, contentType) {
    if (useLocal) {
      const file = path.join(env.LOCAL_STORAGE_DIR, key);
      await fs.mkdir(path.dirname(file), { recursive: true });
      return fs.writeFile(file, body);
    }
    const { sdk, client } = await r2();
    await client.send(new sdk.PutObjectCommand({
      Bucket: env.R2_BUCKET, Key: key, Body: body, ContentType: contentType,
      CacheControl: key.startsWith(UPLOADS_PREFIX) ? "public, max-age=31536000, immutable" : "no-cache",
    }));
  },
  async list(prefix) {
    if (useLocal) {
      const dir = path.join(env.LOCAL_STORAGE_DIR, prefix);
      try {
        const names = await fs.readdir(dir);
        return Promise.all(names.map(async (n) => {
          const st = await fs.stat(path.join(dir, n));
          return { key: prefix + n, lastModified: st.mtime.toISOString(), size: st.size };
        }));
      } catch { return []; }
    }
    const { sdk, client } = await r2();
    const out = [];
    let token;
    do {
      const r = await client.send(new sdk.ListObjectsV2Command({ Bucket: env.R2_BUCKET, Prefix: prefix, ContinuationToken: token }));
      (r.Contents || []).forEach((o) => out.push({ key: o.Key, lastModified: o.LastModified?.toISOString?.() || "", size: o.Size }));
      token = r.IsTruncated ? r.NextContinuationToken : undefined;
    } while (token);
    return out;
  },
  async remove(keys) {
    if (!keys.length) return;
    if (useLocal) {
      await Promise.all(keys.map((k) => fs.rm(path.join(env.LOCAL_STORAGE_DIR, k), { force: true })));
      return;
    }
    const { sdk, client } = await r2();
    await client.send(new sdk.DeleteObjectsCommand({ Bucket: env.R2_BUCKET, Delete: { Objects: keys.map((Key) => ({ Key })) } }));
  },
  publicUrl(key) {
    if (useLocal) return `/__local/${key}`;
    if (!env.R2_PUBLIC_URL) throw new HttpError(500, "Falta la variable R2_PUBLIC_URL en Vercel (la URL pública del bucket).");
    return `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  },
};

/* ------------------------------------------------------------------
   Guardar contenido + copia de seguridad
------------------------------------------------------------------ */
export async function saveContent(content) {
  const body = Buffer.from(JSON.stringify(content));
  await storage.put(CONTENT_KEY, body, "application/json; charset=utf-8");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await storage.put(`${HISTORY_PREFIX}${stamp}.json`, body, "application/json; charset=utf-8");
  // Mantener solo las últimas copias
  const all = (await storage.list(HISTORY_PREFIX)).sort((a, b) => b.key.localeCompare(a.key));
  await storage.remove(all.slice(HISTORY_KEEP).map((o) => o.key));
}

/* ------------------------------------------------------------------
   Autenticación sencilla con contraseña + token firmado (12 h)
------------------------------------------------------------------ */
const secret = () => {
  if (!env.ADMIN_PASSWORD) throw new HttpError(500, "Falta la variable ADMIN_PASSWORD en Vercel.");
  return env.ADMIN_SECRET || crypto.createHash("sha256").update("fa:" + env.ADMIN_PASSWORD).digest("hex");
};
const sign = (data) => crypto.createHmac("sha256", secret()).update(data).digest("hex");
const safeEqual = (a, b) => {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export function checkPassword(pw) {
  secret();
  return safeEqual(pw || "", env.ADMIN_PASSWORD);
}
export function createToken() {
  const exp = String(Date.now() + 12 * 3600 * 1000);
  return `${exp}.${sign(exp)}`;
}
export function requireAuth(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !safeEqual(sig, sign(exp)) || Number(exp) < Date.now()) {
    throw new HttpError(401, "La sesión ha caducado. Vuelve a entrar.");
  }
}

/* ------------------------------------------------------------------
   HTTP helpers
------------------------------------------------------------------ */
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function readRaw(req, limit) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new HttpError(413, "El archivo es demasiado grande.");
    chunks.push(c);
  }
  const buf = Buffer.concat(chunks);
  if (buf.length) return buf;
  // Por si el entorno ya ha leído el cuerpo antes (helpers de Vercel)
  const b = req.body;
  if (Buffer.isBuffer(b)) return b;
  if (typeof b === "string") return Buffer.from(b);
  if (b && typeof b === "object") return Buffer.from(JSON.stringify(b));
  return buf;
}
export async function readJson(req, limit = 2_000_000) {
  const raw = await readRaw(req, limit);
  try { return JSON.parse(raw.toString("utf8") || "{}"); }
  catch { throw new HttpError(400, "Datos no válidos."); }
}

export function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}

export const handle = (methods, fn) => async (req, res) => {
  try {
    if (!methods.includes(req.method)) throw new HttpError(405, "Método no permitido");
    await fn(req, res);
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error(e);
    send(res, status, { error: e.status ? e.message : "Error del servidor. Inténtalo de nuevo en un momento." }, { "Cache-Control": "no-store" });
  }
};
