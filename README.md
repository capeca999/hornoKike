# Forn Almenar · Web

Web estática (HTML + CSS + JS, sin build ni dependencias).

## Estructura
- `index.html` – todas las secciones
- `css/styles.css` – estilos (colores del logo en `:root`)
- `js/products.js` – catálogo de productos (editar aquí)
- `js/main.js` – slider, filtros, animaciones, formulario, cookies
- `img/` – logo, logo claro y favicon

## Desplegar en Vercel
1. Sube esta carpeta a un repo de GitHub.
2. En Vercel: *Add New → Project* → importa el repo.
3. Framework preset: **Other**. Sin build command. Output: raíz.

O desde terminal: `npx vercel --prod` dentro de la carpeta.

## Pendiente de personalizar
- Fotos: ahora son de Unsplash. Sustituid las URLs por fotos propias (en `/img` o en R2 con URL pública).
- Teléfonos, WhatsApp (`34600000000`), direcciones, horarios y email.
- Enlaces de Instagram/Facebook y páginas legales.

## Productos desde R2 (opcional)
Sube el array de `products.js` como `products.json` a un bucket R2 con acceso público
(y CORS permitido para tu dominio) y pon su URL en `PRODUCTS_URL` dentro de `js/main.js`.
