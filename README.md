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
| `TURNSTILE_SITE_KEY` | (Opcional) Clave pública del captcha del login |
| `TURNSTILE_SECRET_KEY` | (Opcional) Clave secreta del captcha del login |

Después: *Deployments* → *Redeploy*. Las claves nunca llegan al navegador; solo las usan las funciones de `/api`.

### Captcha del login (opcional)

Cloudflare → *Turnstile* → *Add widget* → nombre `Forn Almenar admin`, añade tus dominios
(p. ej. `fornalmenar.com` y `tu-proyecto.vercel.app`), modo *Managed* → copia **Site Key** y **Secret Key**
en `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`, y haz *Redeploy*. Sin estas dos variables, el login funciona sin captcha.

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
| `legal/page.html` | Páginas legales (`/legal/aviso-legal`, `/legal/politica-de-privacidad`, `/legal/politica-de-cookies`, `/legal/alergenos`), editables en el panel → «Textos legales» |
| `blog/index.html`, `blog/post.html` | Página `/blog` y página de cada noticia (`vercel.json` redirige `/blog/:slug`) |
| `admin/vendor/` | Editor de texto enriquecido (Quill 2, licencia BSD) |
| `img/fotos/visita/` | Fotos del recorrido virtual «Visita el horno» (escenas y miniaturas) |
| `img/fotos/` | Fotos reales del horno, ya recortadas y optimizadas (WebP). Se sirven desde Vercel |
| `content/default.json` | Contenido inicial (se usa hasta el primer guardado) |
| `admin/` | Panel: formularios, subida de fotos, vista previa en directo, copias |
| `api/content.js` | `GET` contenido (caché de 5 s en Vercel) |
| `api/login.js` | Comprueba la contraseña y da una sesión de 12 h |
| `api/save.js` | Guarda el contenido y crea copia de seguridad |
| `api/upload.js` | Sube fotos a R2 (se comprimen antes en el navegador) |
| `api/history.js` | Lista y restaura copias |
| `api/sitemap.js`, `api/robots.js` | `/sitemap.xml` (con los 3 idiomas y las noticias publicadas) y `/robots.txt`, generados solos |

**Idiomas (castellano, valenciano e inglés):** cada texto traducible se guarda junto al original con
sufijo: `title`, `title_va`, `title_en`. Si falta la traducción, se muestra el castellano. La web elige
el idioma por `?lang=va|en`, la última elección del visitante o el idioma del navegador; los buscadores
ven siempre la versión principal en castellano y las alternativas por `hreflang`. En el panel, el
selector «Editando en ES · VA · EN» de la barra superior cambia todos los campos y la vista previa.

**Alérgenos:** cada producto puede tener `allergens` y `traces` (ids de los 14 alérgenos del
Reglamento UE 1169/2011). Si `allergens` no existe, el producto está «sin revisar»: no muestra nada y
nunca aparece en los filtros «Sin gluten / leche / huevo / frutos secos».

**Temporada:** `season: { on, from: "MM-DD", to: "MM-DD" }` (puede cruzar el año, p. ej. 20/12 → 06/01).
**Aviso superior:** `notice.items[]` con `active`, `text`, `link`, `from`, `to` (fechas opcionales, hora de Madrid).
**Google:** la web añade los datos estructurados `Bakery` (dirección, coordenadas, horario, teléfono, fotos)
y `BlogPosting` en cada noticia.

**Diseño:** en el panel → «Diseño y colores» se cambian colores (6 paletas o a medida), tipo de letra, esquinas,
botones, oscuridad de las fotos de portada, orden y fondo de cada sección y textos del menú. Todo se guarda en
`content.design`; si no existe, la web usa el diseño original de `css/styles.css`.

Las noticias se guardan dentro del mismo `content/site.json`, así que también entran en las copias de seguridad.
Una noticia nueva empieza como **borrador** y no se ve en la web hasta que se pulsa «Publicar» y se guarda.

Para añadir un campo editable nuevo: añádelo a `content/default.json`, al esquema `SECTIONS`
de `admin/admin.js` y úsalo en `js/site.js`.
