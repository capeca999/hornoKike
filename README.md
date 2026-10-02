# Forn Almenar · Web + panel de administración

- **Web pública**: `/`
- **Blog / novedades**: `/blog` y cada noticia en `/blog/nombre-de-la-noticia`
- **Panel para editar** textos, fotos, precios, horarios y noticias: `/admin`

Todo el contenido vive en Cloudflare R2. La web lo lee al cargar y el panel lo guarda.

```
R2 (bucket)
├── content/site.json          ← todo el contenido de la web
├── content/history/*.json     ← copias de seguridad automáticas (últimas 30)
└── uploads/AAAA/MM/*.webp     ← fotos subidas desde el panel
```
No hay que crear estas carpetas: se crean solas la primera vez que se guarda.

---

## 1 · Preparar R2 (Cloudflare)

1. **Crear el bucket**: Cloudflare → R2 → *Create bucket* (p. ej. `forn-almenar`).
2. **Hacerlo público para las fotos**: en el bucket → *Settings* → *Public access*.
   - Lo ideal: *Custom Domains* → conecta un subdominio, p. ej. `media.fornalmenar.com`.
   - Para probar: activa el *R2.dev subdomain* (Cloudflare lo limita, no es para producción).
   - Copia esa URL: será `R2_PUBLIC_URL`.
3. **Crear las claves**: R2 → *Manage API tokens* → *Create API token*
   - Permisos: **Object Read & Write**, solo para ese bucket.
   - Copia *Access Key ID* y *Secret Access Key* (el secret solo se ve una vez).
   - El *Account ID* aparece en la página principal de R2.

## 2 · Variables de entorno en Vercel

Vercel → tu proyecto → *Settings* → *Environment Variables* (ver `.env.example`):

| Variable | Qué es |
|---|---|
| `ADMIN_PASSWORD` | Contraseña para entrar en `/admin` |
| `ADMIN_SECRET` | Texto aleatorio largo (firma las sesiones) |
| `R2_ACCOUNT_ID` | Account ID de Cloudflare |
| `R2_ACCESS_KEY_ID` | Access Key ID del token de R2 |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key del token de R2 |
| `R2_BUCKET` | Nombre del bucket |
| `R2_PUBLIC_URL` | URL pública del bucket (sin `/` final) |

Después: *Deployments* → *Redeploy*. Las claves nunca llegan al navegador; solo las usan las funciones de `/api`.

## 3 · Desplegar

Sube la carpeta a GitHub e impórtala en Vercel (preset **Other**, sin build command).
Vercel detecta solo `package.json` y las funciones de `/api`.

## Probar en tu ordenador (sin R2)

```bash
npm install
ADMIN_PASSWORD=1234 LOCAL_STORAGE_DIR=./.local-storage npm run dev
# web:   http://localhost:3000
# panel: http://localhost:3000/admin
```

## Cómo está hecho

| Archivo | Para qué |
|---|---|
| `index.html`, `css/styles.css`, `js/site.js` | Web pública; se dibuja a partir del contenido |
| `blog/index.html`, `blog/post.html` | Página `/blog` y página de cada noticia (`vercel.json` redirige `/blog/:slug`) |
| `admin/vendor/` | Editor de texto enriquecido (Quill 2, licencia BSD) |
| `content/default.json` | Contenido inicial (se usa hasta el primer guardado) |
| `admin/` | Panel: formularios, subida de fotos, vista previa en directo, copias |
| `api/content.js` | `GET` contenido (caché de 5 s en Vercel) |
| `api/login.js` | Comprueba la contraseña y da una sesión de 12 h |
| `api/save.js` | Guarda el contenido y crea copia de seguridad |
| `api/upload.js` | Sube fotos a R2 (se comprimen antes en el navegador) |
| `api/history.js` | Lista y restaura copias |

Las noticias se guardan dentro del mismo `content/site.json`, así que también entran en las copias de seguridad.
Una noticia nueva empieza como **borrador** y no se ve en la web hasta que se pulsa «Publicar» y se guarda.

Para añadir un campo editable nuevo: añádelo a `content/default.json`, al esquema `SECTIONS`
de `admin/admin.js` y úsalo en `js/site.js`.
