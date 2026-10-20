/* =========================================================
   FORN ALMENAR · web pública
   Todo el contenido viene de /api/content (R2) y, si no hay
   nada guardado todavía, de /content/default.json.
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isPreview = new URLSearchParams(location.search).has("preview") && window.parent !== window;
  const PAGE = document.body.dataset.page || "home"; // home | blog | post | legal

  /* =========================================================
     IDIOMAS: castellano (es), valenciano (va) e inglés (en)
     Los textos del panel se guardan como "title", "title_va", "title_en".
     Si falta la traducción, se usa el castellano.
     ========================================================= */
  const LANGS = ["es", "va", "en"];
  const LANG_LABEL = { es: "ES", va: "VA", en: "EN" };
  const LANG_NAME = { es: "Castellano", va: "Valencià", en: "English" };
  const HTML_LANG = { es: "es", va: "ca-ES-valencia", en: "en" };
  const LOCALE = { es: "es-ES", va: "ca-ES", en: "en-GB" };
  const detectLang = () => {
    const q = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(q)) return q;
    // Buscadores (Google…): siempre la versión principal en castellano sin ?lang
    if (navigator.webdriver || /bot|crawl|spider|slurp|google|bing|yandex|duckduck|baidu|facebookexternal|whatsapp/i.test(navigator.userAgent)) return "es";
    try { const s = localStorage.getItem("fa-lang"); if (LANGS.includes(s)) return s; } catch {}
    const first = String((navigator.languages && navigator.languages[0]) || navigator.language || "es").toLowerCase();
    if (/^(ca|va)/.test(first)) return "va";
    if (/^(es|gl|eu)/.test(first)) return "es";
    return "en"; // visitantes de fuera: inglés
  };
  let LANG = detectLang();

  const I18N = {
    es: {
      more: "Más información", reject: "Rechazar", accept: "Aceptar", waAria: "Escríbenos por WhatsApp", pinned: "Destacado", readMore: "Leer más",
      closed: "Cerrado", prev: "Anterior", next: "Siguiente", down: "Bajar", filterProducts: "Filtrar productos", all: "Todo", allNews: "Ver todas las novedades",
      ourWorkshop: "Nuestro obrador", tourRole: "recorrido virtual", tourAria: "Recorrido virtual por el horno. Usa las flechas para cambiar de sala.", go: "Ir",
      prevRoom: "Sala anterior", nextRoom: "Sala siguiente", full: "Pantalla completa", tourHint: "Arrastra para mirar · pulsa los puntos para avanzar", rooms: "Salas del horno",
      team: "Equipo de Forn Almenar", mapMsg: "El mapa lo ofrece Google, que puede usar cookies.", showMap: "Ver el mapa", map: "Mapa",
      openNow: "Abierto ahora", closedNow: "Cerrado ahora", directions: "Cómo llegar", visit: "Visítanos", browse: "Navega", legal: "Aviso legal",
      backTop: "Volver arriba ↑", since: "Desde 1952", filterNews: "Filtrar novedades", noNews: "Todavía no hay novedades. ¡Vuelve pronto!",
      legalInfo: "Información legal", notFound: "Página no encontrada", moved: "Puede que se haya movido.", home: "Volver al inicio", otherLegal: "Otras páginas legales",
      missing: "falta", postNotFoundT: "Noticia no encontrada", postNotFound: "No encontramos esta noticia", postMoved: "Puede que se haya movido o ya no esté publicada.",
      backNews: "← Todas las novedades", minRead: "min de lectura", share: "Compartir", copy: "Copiar enlace", copied: "¡Enlace copiado!", copyPrompt: "Copia este enlace:",
      keepReading: "Sigue leyendo", moreNews: "Más <em>novedades</em>", slide: "Diapositiva", menu: "Abrir menú", language: "Idioma",
      contains: "Contiene", traces: "Puede contener trazas de", noAllergens: "Sin ninguno de los 14 alérgenos principales", freeFrom: "Sin",
      freeAria: "Filtrar por alérgenos", allergenNote: "Solo aparecen productos revisados que no llevan ese ingrediente. Al ser un obrador artesano puede haber trazas: si tienes una alergia, pregúntanos antes.",
      allergenLink: "Información sobre alérgenos", noMatch: "Todavía no hay productos revisados que cumplan este filtro. Pregúntanos en el horno.",
      seasonal: "De temporada", outOfSeason: "Fuera de temporada (solo se ve aquí)", closeNotice: "Cerrar aviso",
      nav: { hero: "Inicio", products: "Productos", blog: "Novedades", workshop: "Obrador", history: "Nuestra historia", stores: "Dónde estamos" },
      days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingos"],
      dayList: ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"],
      pair: (a, b) => `${a} y ${b}`, range: (a, b) => `${a} a ${b}`,
    },
    va: {
      more: "Més informació", reject: "Rebutjar", accept: "Acceptar", waAria: "Escriu-nos per WhatsApp", pinned: "Destacat", readMore: "Llegir més",
      closed: "Tancat", prev: "Anterior", next: "Següent", down: "Baixar", filterProducts: "Filtrar productes", all: "Tot", allNews: "Veure totes les novetats",
      ourWorkshop: "El nostre obrador", tourRole: "recorregut virtual", tourAria: "Recorregut virtual pel forn. Usa les fletxes per a canviar de sala.", go: "Anar",
      prevRoom: "Sala anterior", nextRoom: "Sala següent", full: "Pantalla completa", tourHint: "Arrossega per a mirar · prem els punts per a avançar", rooms: "Sales del forn",
      team: "Equip de Forn Almenar", mapMsg: "El mapa l'ofereix Google, que pot fer servir galetes.", showMap: "Veure el mapa", map: "Mapa",
      openNow: "Obert ara", closedNow: "Tancat ara", directions: "Com arribar", visit: "Visita'ns", browse: "Navega", legal: "Avís legal",
      backTop: "Tornar amunt ↑", since: "Des de 1952", filterNews: "Filtrar novetats", noNews: "Encara no hi ha novetats. Torna prompte!",
      legalInfo: "Informació legal", notFound: "Pàgina no trobada", moved: "Potser s'ha mogut.", home: "Tornar a l'inici", otherLegal: "Altres pàgines legals",
      missing: "falta", postNotFoundT: "Notícia no trobada", postNotFound: "No trobem aquesta notícia", postMoved: "Potser s'ha mogut o ja no està publicada.",
      backNews: "← Totes les novetats", minRead: "min de lectura", share: "Compartir", copy: "Copiar l'enllaç", copied: "Enllaç copiat!", copyPrompt: "Copia aquest enllaç:",
      keepReading: "Continua llegint", moreNews: "Més <em>novetats</em>", slide: "Diapositiva", menu: "Obrir el menú", language: "Idioma",
      contains: "Conté", traces: "Pot contindre traces de", noAllergens: "Sense cap dels 14 al·lèrgens principals", freeFrom: "Sense",
      freeAria: "Filtrar per al·lèrgens", allergenNote: "Només apareixen productes revisats que no porten aquest ingredient. En ser un obrador artesà hi pot haver traces: si tens una al·lèrgia, pregunta'ns abans.",
      allergenLink: "Informació sobre al·lèrgens", noMatch: "Encara no hi ha productes revisats que complisquen aquest filtre. Pregunta'ns al forn.",
      seasonal: "De temporada", outOfSeason: "Fora de temporada (només es veu ací)", closeNotice: "Tancar l'avís",
      nav: { hero: "Inici", products: "Productes", blog: "Novetats", workshop: "Obrador", history: "La nostra història", stores: "On som" },
      days: ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte", "Diumenges"],
      dayList: ["dilluns", "dimarts", "dimecres", "dijous", "divendres", "dissabte", "diumenge"],
      pair: (a, b) => `${a} i ${b}`, range: (a, b) => `${a} a ${b}`,
    },
    en: {
      more: "More info", reject: "Decline", accept: "Accept", waAria: "Message us on WhatsApp", pinned: "Featured", readMore: "Read more",
      closed: "Closed", prev: "Previous", next: "Next", down: "Scroll down", filterProducts: "Filter products", all: "All", allNews: "See all news",
      ourWorkshop: "Our bakehouse", tourRole: "virtual tour", tourAria: "Virtual tour of the bakery. Use the arrow keys to change room.", go: "Go",
      prevRoom: "Previous room", nextRoom: "Next room", full: "Full screen", tourHint: "Drag to look around · tap the dots to move on", rooms: "Rooms of the bakery",
      team: "The Forn Almenar team", mapMsg: "The map is provided by Google, which may use cookies.", showMap: "Show map", map: "Map",
      openNow: "Open now", closedNow: "Closed now", directions: "Get directions", visit: "Visit us", browse: "Explore", legal: "Legal",
      backTop: "Back to top ↑", since: "Since 1952", filterNews: "Filter news", noNews: "No news yet. Check back soon!",
      legalInfo: "Legal information", notFound: "Page not found", moved: "It may have moved.", home: "Back to home", otherLegal: "Other legal pages",
      missing: "missing", postNotFoundT: "Post not found", postNotFound: "We can't find this post", postMoved: "It may have moved or been unpublished.",
      backNews: "← All news", minRead: "min read", share: "Share", copy: "Copy link", copied: "Link copied!", copyPrompt: "Copy this link:",
      keepReading: "Keep reading", moreNews: "More <em>news</em>", slide: "Slide", menu: "Open menu", language: "Language",
      contains: "Contains", traces: "May contain traces of", noAllergens: "None of the 14 main allergens", freeFrom: "Free from",
      freeAria: "Filter by allergens", allergenNote: "Only reviewed products without that ingredient are shown. As an artisan bakehouse we can't rule out traces: if you have an allergy, please ask us first.",
      allergenLink: "Allergen information", noMatch: "No reviewed products match this filter yet. Please ask us at the bakery.",
      seasonal: "Seasonal", outOfSeason: "Out of season (only visible here)", closeNotice: "Close notice",
      nav: { hero: "Home", products: "Products", blog: "News", workshop: "Bakehouse", history: "Our story", stores: "Find us" },
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sundays"],
      dayList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      pair: (a, b) => `${a} & ${b}`, range: (a, b) => `${a} to ${b}`,
    },
  };
  const t = (k) => (I18N[LANG] && I18N[LANG][k]) ?? I18N.es[k];

  /* Los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011) */
  const ALLERGENS = {
    gluten: ["🌾", "Gluten", "Gluten", "Gluten"], crustaceos: ["🦐", "Crustáceos", "Crustacis", "Crustaceans"], huevo: ["🥚", "Huevo", "Ou", "Egg"],
    pescado: ["🐟", "Pescado", "Peix", "Fish"], cacahuetes: ["🥜", "Cacahuetes", "Cacauets", "Peanuts"], soja: ["🫘", "Soja", "Soja", "Soy"],
    leche: ["🥛", "Leche", "Llet", "Milk"], frutos: ["🌰", "Frutos de cáscara", "Fruits de closca", "Tree nuts"], apio: ["🥬", "Apio", "Api", "Celery"],
    mostaza: ["🟡", "Mostaza", "Mostassa", "Mustard"], sesamo: ["⚪", "Sésamo", "Sèsam", "Sesame"], sulfitos: ["🍷", "Sulfitos", "Sulfits", "Sulphites"],
    altramuces: ["🌼", "Altramuces", "Tramussos", "Lupin"], moluscos: ["🐚", "Moluscos", "Mol·luscs", "Molluscs"],
  };
  const allergenName = (id) => (ALLERGENS[id] || [])[1 + LANGS.indexOf(LANG)] || id;
  // Filtros "Sin…": cada uno excluye uno o varios alérgenos
  const FREE_FROM = [
    ["gluten", ["gluten"], { es: "Sin gluten", va: "Sense gluten", en: "Gluten-free" }],
    ["leche", ["leche"], { es: "Sin leche", va: "Sense llet", en: "Dairy-free" }],
    ["huevo", ["huevo"], { es: "Sin huevo", va: "Sense ou", en: "Egg-free" }],
    ["frutos", ["frutos", "cacahuetes"], { es: "Sin frutos secos", va: "Sense fruits secs", en: "Nut-free" }],
  ];

  /* Textos fijos de la página de mantenimiento */
  const MNT_T = {
    es: { stages: ["Amasando…", "Fermentando la masa…", "Horneando…", "Dorando la corteza…", "Casi lista…", "¡Saliendo del horno!"], where: "Dónde", call: "Llámanos", pill: "La web está <b>en mantenimiento</b>: solo la ves tú porque has entrado en el panel.", panel: "Ir al panel", progress: "Progreso" },
    va: { stages: ["Pastant…", "Fermentant la massa…", "Enfornant…", "Daurant la crosta…", "Quasi a punt…", "Eixint del forn!"], where: "On", call: "Telefona'ns", pill: "La web està <b>en manteniment</b>: només la veus tu perquè has entrat al panell.", panel: "Anar al panell", progress: "Progrés" },
    en: { stages: ["Kneading…", "Proving the dough…", "Baking…", "Browning the crust…", "Almost ready…", "Fresh out of the oven!"], where: "Where", call: "Call us", pill: "The website is <b>under maintenance</b>: only you can see it because you're logged into the panel.", panel: "Go to panel", progress: "Progress" },
  };
  const mt = (k) => (MNT_T[LANG] || MNT_T.es)[k];

  // Devuelve una copia del contenido con los textos en el idioma elegido
  function localize(obj, lang) {
    if (Array.isArray(obj)) return obj.map((x) => localize(x, lang));
    if (!obj || typeof obj !== "object") return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = localize(v, lang);
    if (lang !== "es") for (const k of Object.keys(obj)) {
      const m = k.match(/^(.+)_(va|en)$/);
      if (m && m[2] === lang && typeof obj[k] === "string" && obj[k].trim()) out[m[1]] = obj[k];
    }
    return out;
  }
  // Completa traducciones que falten con las del contenido de ejemplo (si el texto en castellano no ha cambiado)
  function fillTranslations(target, defaults) {
    const dict = new Map();
    const collect = (o) => {
      if (Array.isArray(o)) return o.forEach(collect);
      if (!o || typeof o !== "object") return;
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === "string" && (o[k + "_va"] || o[k + "_en"]) && !dict.has(v)) dict.set(v, { va: o[k + "_va"], en: o[k + "_en"] });
        else if (typeof v === "object") collect(v);
      }
    };
    collect(defaults);
    let n = 0;
    const fill = (o) => {
      if (Array.isArray(o)) return o.forEach(fill);
      if (!o || typeof o !== "object") return;
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === "string" && !/_(va|en)$/.test(k) && dict.has(v)) {
          const d = dict.get(v);
          for (const l of ["va", "en"]) if (d[l] && !(k + "_" + l in o)) { o[k + "_" + l] = d[l]; n++; }
        } else if (typeof v === "object") fill(v);
      }
    };
    fill(target);
    return n;
  }

  /* ---------- La cabecera y el menú están en el HTML. Aquí: marcar "Novedades" y añadir WhatsApp + cookies ---------- */
  if (PAGE === "blog" || PAGE === "post") $$('[data-sec="blog"]').forEach((a) => a.setAttribute("aria-current", "page"));
  document.body.insertAdjacentHTML("beforeend", `
    <a class="wa-float" href="#" target="_blank" rel="noopener" aria-label="" data-wa hidden>
      <svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.8L4 20Z"/><path d="M9 9.5c.3 2 2.3 4.2 4.8 4.8l1-1.1 1.6.8c-.2 1.1-1 1.7-2 1.7-3.3-.3-6.4-3.4-6.6-6.6 0-1 .6-1.8 1.7-2l.8 1.6-1.3.8Z" fill="currentColor" stroke="none"/></svg>
    </a>
    <div class="cookies" id="cookies" hidden>
      <p><span data-cookies-text></span> <a href="#" data-cookies-link data-t="more"></a></p>
      <div><button class="btn btn--small btn--ghost-dark" data-cookies="reject" data-t="reject"></button><button class="btn btn--small" data-cookies="accept" data-t="accept"></button></div>
    </div>`);
  // Selector de idioma (cabecera y menú del móvil)
  const langLink = (l) => `<a href="?lang=${l}" hreflang="${l === "va" ? "ca" : l}" data-lang="${l}" lang="${HTML_LANG[l]}" title="${LANG_NAME[l]}">${LANG_LABEL[l]}</a>`;
  const langSwitch = (cls) => `<div class="lang ${cls}" role="group" data-lang-switch>${LANGS.map(langLink).join("")}</div>`;
  // En el ordenador: el idioma actual y, al pasar el ratón, los otros dos
  const drawNavLang = () => $$(".lang--nav").forEach((box) => {
    box.innerHTML = `${langLink(LANG)}<span class="lang__more">${LANGS.filter((l) => l !== LANG).map(langLink).join("")}</span>`;
  });
  $(".nav--right")?.insertAdjacentHTML("afterbegin", langSwitch("lang--nav"));
  $(".header__inner")?.insertAdjacentHTML("beforeend", langSwitch("lang--bar"));
  // Aviso rápido arriba del todo
  document.body.insertAdjacentHTML("afterbegin", `<div class="notice" id="notice" role="status" hidden></div>`);

  /* ---------- Utilidades ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const lines = (s) => esc(s).replace(/\n/g, "<br/>");
  const paras = (s) => String(s ?? "").split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${lines(p.trim())}</p>`).join("");
  const digits = (s) => String(s ?? "").replace(/[^\d]/g, "");
  const waLink = (num, text) => `https://wa.me/${digits(num)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
  const telLink = (num) => `tel:${String(num ?? "").replace(/[^\d+]/g, "")}`;
  const title = (t, accent, br = true) =>
    `${lines(t)}${accent ? `${br ? "<br/>" : " "}<em>${esc(accent)}</em>` : ""}`;
  const head = (s, light = false) => `
    <header class="section__head ${light ? "section__head--light" : ""} reveal">
      ${s.eyebrow ? `<p class="eyebrow ${light ? "" : "eyebrow--dark"}">${esc(s.eyebrow)}</p>` : ""}
      <h2>${title(s.title, s.titleAccent)}</h2>
    </header>`;
  const img = (src, alt = "", extra = "") => src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" ${extra}/>` : "";
  const delay = (i, step = 0.1) => `style="--d:${(i * step).toFixed(2)}s"`;

  /* ---------- Blog ---------- */
  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d + "T12:00:00");
    return isNaN(dt) ? "" : dt.toLocaleDateString(LOCALE[LANG], { day: "numeric", month: "long", year: "numeric" });
  };
  const stripTags = (html) => { const d = document.createElement("div"); d.innerHTML = String(html || "").replace(/<\/(p|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, " $&"); return (d.textContent || "").replace(/\s+/g, " ").trim(); };
  const excerptOf = (p, n = 150) => p.excerpt || (() => { const t = stripTags(p.body); return t.length > n ? t.slice(0, n).replace(/\s\S*$/, "") + "…" : t; })();
  // Enlaces internos que conservan el idioma (?lang=va / ?lang=en)
  const langHref = (h) => {
    if (LANG === "es" || !h || !h.startsWith("/")) return h;
    const [path, hash] = h.split("#");
    return `${path}${path.includes("?") ? "&" : "?"}lang=${LANG}${hash !== undefined ? "#" + hash : ""}`;
  };
  const postUrl = (p) => langHref(`/blog/${encodeURIComponent(p.slug || p.id)}`);
  const publishedPosts = () => ((C.blog && C.blog.posts) || [])
    .filter((p) => p.published !== false && p.title)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.date).localeCompare(String(a.date)));
  const readingTime = (html) => Math.max(1, Math.round(stripTags(html).split(" ").length / 200));

  // Limpia el HTML del editor: solo deja etiquetas seguras
  const ALLOWED = { P: [], H2: [], H3: [], STRONG: [], B: [], EM: [], I: [], U: [], S: [], A: ["href"], UL: [], OL: [], LI: [], BLOCKQUOTE: [], IMG: ["src", "alt"], BR: [], SPAN: [] };
  const DROP = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT", "LINK", "META"]);
  function sanitize(html) {
    const doc = new DOMParser().parseFromString(`<div>${html || ""}</div>`, "text/html");
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) return;
        if (n.nodeType !== 1 || DROP.has(n.tagName)) return n.remove();
        walk(n);
        const allowed = ALLOWED[n.tagName];
        if (!allowed) { n.replaceWith(...n.childNodes); return; }
        const align = (n.getAttribute("class") || "").match(/ql-align-(center|right|justify)/);
        [...n.attributes].forEach((a) => { if (!allowed.includes(a.name)) n.removeAttribute(a.name); });
        if (align) n.className = `align-${align[1]}`;
        if (n.tagName === "A") {
          const href = n.getAttribute("href") || "";
          if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) n.removeAttribute("href");
          else if (/^https?:/i.test(href) && !href.startsWith(location.origin)) { n.target = "_blank"; n.rel = "noopener"; }
        }
        if (n.tagName === "IMG") {
          if (!/^(https?:|\/)/i.test(n.getAttribute("src") || "")) return n.remove();
          n.setAttribute("loading", "lazy");
        }
      });
    };
    const root = doc.body.firstChild;
    walk(root);
    return root.innerHTML;
  }
  const postCard = (p, i = 0, big = false) => `
    <a class="post-card ${big ? "post-card--big" : ""} reveal" href="${postUrl(p)}" ${delay(i)}>
      <div class="post-card__img">${img(p.cover, p.title)}${p.pinned ? `<span class="post-card__pin">${t("pinned")}</span>` : ""}</div>
      <div class="post-card__body">
        <div class="post-meta">${p.category ? `<span class="post-cat">${esc(p.category)}</span>` : ""}<time datetime="${esc(p.date)}">${fmtDate(p.date)}</time></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(excerptOf(p))}</p>
        <span class="post-card__more">${t("readMore")} <span aria-hidden="true">→</span></span>
      </div>
    </a>`;

  /* ---------- Mapas de Google (sin clave de API) ----------
     El campo "map" admite: coordenadas ("39.4857, -0.3689"), un enlace de Google Maps con @lat,lng,
     el código de "Insertar un mapa" de Google, o nada (entonces se usa la dirección). */
  const cleanAddr = (a) => String(a || "").replace(/\s*[·•|]\s*|\s*\n+\s*/g, ", ").replace(/,\s*,/g, ",").trim();
  const coordsOf = (v) => { const m = String(v || "").match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/); return m ? `${m[1]},${m[2]}` : ""; };
  const mapSrc = (st) => {
    let v = String(st.map || "").trim();
    const iframe = v.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframe) v = iframe[1].replace(/&amp;/g, "&");
    if (/^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(v) || /[?&]output=embed/.test(v)) return v;
    // Sin ubicación: se busca solo la dirección (sin "·" ni saltos de línea, que confunden a Google)
    const q = coordsOf(v) || (v && !/^https?:/i.test(v) ? v : cleanAddr(st.address));
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=17&hl=${LANG === "va" ? "ca" : LANG}&output=embed`;
  };
  const directionsUrl = (st) => {
    if (st.mapsUrl) return st.mapsUrl;
    const c = coordsOf(st.map);
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c || cleanAddr(st.address))}`;
  };

  // El formulario de encargos no existe en esta versión: los enlaces antiguos a él llevan a "Dónde estamos"
  const fixLink = (l) => (l === "#contacto" ? "#tiendas" : l);

  const groupSchedule = (sch = []) => {
    const out = [];
    sch.forEach((d, i) => {
      const val = d && d.open && d.close ? `${d.open} – ${d.close}` : t("closed");
      const last = out[out.length - 1];
      if (last && last.val === val && last.to === i - 1) last.to = i;
      else out.push({ from: i, to: i, val });
    });
    const D = t("days"), L = t("dayList"), cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
    return out.map((g) => ({
      label: g.from === g.to ? D[g.from]
        : g.to - g.from === 1 ? t("pair")(cap(L[g.from]), L[g.to])
        : t("range")(cap(L[g.from]), L[g.to]),
      val: g.val,
    }));
  };
  const madridNow = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday);
    return { day, min: (+p.hour % 24) * 60 + +p.minute };
  };
  // Fecha de hoy en Valencia: "2026-12-24"
  const madridDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  // Temporada de un producto: { on, from: "12-20", to: "01-06" } (puede cruzar el año)
  const inSeason = (se) => {
    if (!se || !se.on || !/^\d\d-\d\d$/.test(se.from || "") || !/^\d\d-\d\d$/.test(se.to || "")) return true;
    const d = madridDate().slice(5);
    return se.from <= se.to ? d >= se.from && d <= se.to : d >= se.from || d <= se.to;
  };
  const isSeasonal = (p) => !!(p.season && p.season.on);
  // En la vista previa del panel se ven también los de fuera de temporada (marcados)
  const productShown = (p) => p.visible !== false && (isPreview || inSeason(p.season));
  const toMin = (s) => { const [h, m] = String(s).split(":").map(Number); return h * 60 + (m || 0); };
  const isOpen = (sch = []) => {
    const { day, min } = madridNow();
    const d = sch[day];
    return !!(d && d.open && d.close && min >= toMin(d.open) && min < toMin(d.close));
  };

  /* =========================================================
     RENDER
     ========================================================= */
  const S = {
    hero: (s) => `
      <section class="hero" id="inicio" aria-roledescription="carrusel">
        <div class="hero__slides">
          ${(s.slides || []).map((sl, i) => `
            <article class="slide ${i === 0 ? "is-active" : ""}" style="--img:url('${esc(sl.image)}');--pos:${esc(sl.pos || "center")}">
              <div class="slide__content">
                ${sl.eyebrow ? `<p class="eyebrow">${esc(sl.eyebrow)}</p>` : ""}
                ${i === 0 ? `<h1>${lines(sl.title)}</h1>` : `<h2 class="h1">${lines(sl.title)}</h2>`}
                ${sl.text ? `<p class="slide__lead">${lines(sl.text)}</p>` : ""}
                ${sl.button ? `<a href="${esc(fixLink(sl.link || "#productos"))}" class="btn btn--light">${esc(sl.button)}</a>` : ""}
              </div>
            </article>`).join("")}
        </div>
        ${(s.slides || []).length > 1 ? `
        <div class="hero__controls">
          <button class="hero__arrow" data-dir="-1" aria-label="${t("prev")}">←</button>
          <div class="hero__dots" role="tablist"></div>
          <button class="hero__arrow" data-dir="1" aria-label="${t("next")}">→</button>
        </div>` : ""}
        <a href="#amor" class="hero__scroll" aria-label="${t("down")}"><span></span></a>
      </section>`,

    marquee: (s) => {
      const items = (s.items || []).map((x) => `<span>${esc(x.text)}</span><i></i>`).join("");
      return items ? `<div class="marquee" id="lemas" aria-hidden="true"><div class="marquee__track">${items}${items}${items}${items}</div></div>` : "";
    },

    intro: (s) => `
      <section class="intro section" id="amor">
        <div class="container intro__grid">
          <div class="intro__text reveal">
            ${s.eyebrow ? `<p class="eyebrow eyebrow--dark">${esc(s.eyebrow)}</p>` : ""}
            <h2>${title(s.title, s.titleAccent)}</h2>
            ${paras(s.text1)}${paras(s.text2)}
            ${(s.stats || []).length ? `<ul class="stats">${s.stats.map((st) => `
              <li><strong data-count="${Number(st.value) || 0}" data-suffix="${esc(st.suffix)}">${Number(st.value) || 0}${esc(st.suffix)}</strong><span>${esc(st.label)}</span></li>`).join("")}</ul>` : ""}
          </div>
          <div class="intro__images">
            <figure class="img-card img-card--tall reveal">${img(s.image1, s.title)}</figure>
            <figure class="img-card img-card--short reveal" style="--d:.15s">${img(s.image2, s.titleAccent)}</figure>
            <img class="intro__badge" src="/img/favicon.png" alt="" aria-hidden="true" />
          </div>
        </div>
      </section>`,

    featured: (s) => `
      <section class="featured section section--cream" id="destacados">
        <div class="container">
          ${head(s)}
          <div class="featured__grid">
            ${(s.items || []).map((f, i) => `
              <article class="feat reveal" ${delay(i)}>
                <div class="feat__img">${img(f.image, f.name)}</div>
                <h3>${esc(f.name)}</h3>
                <p>${lines(f.text)}</p>
              </article>`).join("")}
          </div>
        </div>
      </section>`,

    products: (s) => {
      const cats = (s.categories || []).filter((c) => (s.items || []).some((p) => productShown(p) && p.cat === c.id));
      const reviewed = (s.items || []).some((p) => productShown(p) && Array.isArray(p.allergens));
      return `
      <section class="catalog section" id="productos">
        <div class="container">
          ${head(s)}
          ${cats.length > 1 ? `
          <div class="filters reveal" role="tablist" aria-label="${t("filterProducts")}">
            <button class="filter is-active" data-filter="all" role="tab" aria-selected="true">${t("all")}</button>
            ${cats.map((c) => `<button class="filter" data-filter="${esc(c.id)}" role="tab" aria-selected="false">${esc(c.name)}</button>`).join("")}
          </div>` : ""}
          ${reviewed ? `
          <div class="free-from reveal" role="group" aria-label="${t("freeAria")}">
            ${FREE_FROM.map(([id, , l]) => `<button type="button" class="chip" data-free="${id}" aria-pressed="false"><span aria-hidden="true">${ALLERGENS[id][0]}</span> ${esc(l[LANG] || l.es)}</button>`).join("")}
          </div>
          <p class="free-from__note" data-free-note hidden>${esc(t("allergenNote"))}${allergenPage() ? ` <a href="${legalUrl(allergenPage())}">${esc(t("allergenLink"))}</a>` : ""}</p>` : ""}
          <div class="products" id="products-grid" aria-live="polite"></div>
        </div>
      </section>`;
    },

    blog: (s) => {
      const posts = publishedPosts().slice(0, Math.max(1, Number(s.homeCount) || 3));
      if (!posts.length) return "";
      return `
      <section class="news section" id="novedades">
        <div class="container">
          ${head(s)}
          <div class="news__grid">${posts.map((p, i) => postCard(p, i)).join("")}</div>
          <div class="news__more reveal"><a href="${langHref("/blog")}" class="btn">${t("allNews")}</a></div>
        </div>
      </section>`;
    },

    cta: (s) => `
      <section class="cta" id="banner" style="--img:url('${esc(s.image)}')">
        <div class="container cta__inner reveal">
          ${s.eyebrow ? `<p class="eyebrow">${esc(s.eyebrow)}</p>` : ""}
          <h2>${lines(s.title)}</h2>
          ${s.text ? `<p>${lines(s.text)}</p>` : ""}
          <div class="cta__actions">
            ${s.button ? `<a href="${esc(fixLink(s.link || "#tiendas"))}" class="btn btn--light">${esc(s.button)}</a>` : ""}
            ${C.general.whatsapp ? `<a href="${waLink(C.general.whatsapp)}" class="btn btn--ghost" target="_blank" rel="noopener">${t("waAria")}</a>` : ""}
          </div>
        </div>
      </section>`,

    workshop: (s) => `
      <section class="workshop section section--dark" id="obrador">
        <div class="container">
          ${head(s, true)}
          ${(s.steps || []).length ? `<ol class="steps" style="--n:${Math.min(s.steps.length, 4)}">${s.steps.map((st, i) => `
            <li class="step reveal" ${delay(i)}><span class="step__n">${String(i + 1).padStart(2, "0")}</span><h3>${esc(st.title)}</h3><p>${lines(st.text)}</p></li>`).join("")}</ol>` : ""}
          ${(s.gallery || []).filter((g) => g.image).length ? `<div class="gallery">${s.gallery.filter((g) => g.image).map((g, i) => `
            <figure class="reveal" ${delay(i)}>${img(g.image, t("ourWorkshop"))}</figure>`).join("")}</div>` : ""}
        </div>
      </section>`,

    tour: (s) => {
      const scenes = (s.scenes || []).filter((sc) => sc.image);
      if (!scenes.length) return "";
      return `
      <section class="visit section section--dark" id="visita">
        <div class="container">
          ${head(s, true)}
          ${s.text ? `<p class="visit__lead reveal">${lines(s.text)}</p>` : ""}
          <div class="tour reveal" data-tour>
            <div class="tour__stage" tabindex="0" aria-roledescription="${t("tourRole")}" aria-label="${t("tourAria")}">
              ${scenes.map((sc, i) => `
                <div class="tour__scene ${i === 0 ? "is-active" : ""}" data-id="${esc(sc.id)}" data-focus="${Number(sc.focus ?? 50)}" aria-hidden="${i !== 0}">
                  <div class="tour__pan">
                    <img ${i === 0 ? "src" : "data-src"}="${esc(sc.image)}" alt="${esc(sc.name)}" draggable="false" />
                    ${(sc.hotspots || []).filter((hs) => scenes.some((x) => x.id === hs.to)).map((hs) => `
                      <button type="button" class="hotspot ${Number(hs.x) > 58 ? "hotspot--left" : ""}" style="left:${Number(hs.x) || 50}%;top:${Number(hs.y) || 50}%" data-to="${esc(hs.to)}">
                        <span class="hotspot__dot"></span><span class="hotspot__label">${esc(hs.label || t("go"))}</span>
                      </button>`).join("")}
                  </div>
                </div>`).join("")}
              <div class="tour__hud">
                <span class="tour__count"><b data-tour-n>1</b> / ${scenes.length}</span>
                <strong data-tour-name>${esc(scenes[0].name)}</strong>
                <p data-tour-text>${esc(scenes[0].text || "")}</p>
              </div>
              <div class="tour__controls">
                <button type="button" class="tour__btn" data-tour-step="-1" aria-label="${t("prevRoom")}">←</button>
                <button type="button" class="tour__btn" data-tour-step="1" aria-label="${t("nextRoom")}">→</button>
                <button type="button" class="tour__btn" data-tour-full aria-label="${t("full")}">⤢</button>
              </div>
              <div class="tour__hint" data-tour-hint><span class="tour__hand" aria-hidden="true">👆</span> ${t("tourHint")}</div>
            </div>
            <div class="tour__thumbs" role="tablist" aria-label="${t("rooms")}">
              ${scenes.map((sc, i) => `
                <button type="button" class="tour__thumb ${i === 0 ? "is-active" : ""}" data-go="${esc(sc.id)}" role="tab" aria-selected="${i === 0}">
                  <img src="${esc(sc.image.replace(/\.webp$/, "-mini.webp"))}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${esc(sc.image)}'" />
                  <span>${esc(sc.name)}</span>
                </button>`).join("")}
            </div>
          </div>
        </div>
      </section>`;
    },

    team: (s) => {
      const items = (s.items || []).filter((m) => m.image);
      if (!items.length) return "";
      return `
      <section class="team section" id="equipo">
        <div class="container">
          ${head(s)}
          ${s.text ? `<p class="team__lead reveal">${lines(s.text)}</p>` : ""}
          <div class="team__grid">
            ${items.map((m, i) => `
              <figure class="member reveal" ${delay(i % 3)}>
                <div class="member__img">${img(m.image, m.name || t("team"))}</div>
                ${m.name || m.role ? `<figcaption>${m.name ? `<strong>${esc(m.name)}</strong>` : ""}${m.role ? `<span>${esc(m.role)}</span>` : ""}</figcaption>` : ""}
              </figure>`).join("")}
          </div>
        </div>
      </section>`;
    },

    history: (s) => `
      <section class="history section section--cream" id="historia">
        <div class="container">
          ${head(s)}
          <div class="timeline">
            ${(s.items || []).map((h) => `
              <div class="tl reveal"><span class="tl__year">${esc(h.year)}</span><div><h3>${esc(h.title)}</h3><p>${lines(h.text)}</p></div></div>`).join("")}
          </div>
        </div>
      </section>`,

    stores: (s) => {
      // Un solo horno: se usa la primera ficha
      const st = (s.items || [])[0];
      if (!st) return "";
      const open = isOpen(st.schedule), withMap = st.showMap !== false;
      return `
      <section class="stores section" id="tiendas">
        <div class="container">
          ${head(s)}
          <article class="location ${withMap ? "" : "location--nomap"} reveal">
            ${withMap ? `<div class="location__map" data-map-src="${esc(mapSrc(st))}" data-map-title="${t("map")}: ${esc(st.name)}">
              <div class="map-consent">
                <span class="map-consent__pin" aria-hidden="true"></span>
                <p>${t("mapMsg")}</p>
                <button type="button" class="btn btn--small" data-load-map>${t("showMap")}</button>
              </div>
            </div>` : ""}
            <div class="location__info">
              <span class="store__status ${open ? "is-open" : "is-closed"}">${open ? t("openNow") : t("closedNow")}</span>
              <h3>${esc(st.name)}</h3>
              <p class="store__addr">${lines(st.address)}</p>
              <dl class="hours">${groupSchedule(st.schedule).map((g) => `<div><dt>${g.label}</dt><dd>${g.val}</dd></div>`).join("")}</dl>
              <div class="store__actions">
                <a href="${esc(directionsUrl(st))}" target="_blank" rel="noopener" class="btn">${t("directions")}</a>
                ${st.phone ? `<a href="${telLink(st.phone)}" class="link">${esc(st.phone)}</a>` : ""}
              </div>
              <ul class="location__contact">
                ${C.general.whatsapp ? `<li><span>WhatsApp</span><a href="${waLink(C.general.whatsapp)}" target="_blank" rel="noopener">${esc(C.general.whatsapp)}</a></li>` : ""}
                ${C.general.email ? `<li><span>Email</span><a href="mailto:${esc(C.general.email)}">${esc(C.general.email)}</a></li>` : ""}
              </ul>
            </div>
          </article>
        </div>
      </section>`;
    },

  };

  const footer = () => {
    const g = C.general, f = C.footer || {};
    const navItems = [["products", "/#productos"], ["blog", "/blog"], ["workshop", "/#obrador"], ["history", "/#historia"], ["stores", "/#tiendas"]].map(([k, h]) => [k, langHref(h), esc(navLabel(k))])
      .filter(([k]) => k === "blog" || C[k]?.show !== false);
    const icon = {
      ig: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>`,
      fb: `<svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V8Z"/></svg>`,
      wa: `<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.8L4 20Z"/></svg>`,
    };
    return `
      <div class="container footer__grid">
        <div>
          <img src="${esc(g.logoLight || "/img/logo-light.png")}" alt="Forn Almenar" class="footer__logo" />
          ${paras(f.text)}
          <div class="social">
            ${g.instagram ? `<a href="${esc(g.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icon.ig}</a>` : ""}
            ${g.facebook ? `<a href="${esc(g.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${icon.fb}</a>` : ""}
            ${g.whatsapp ? `<a href="${waLink(g.whatsapp)}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon.wa}</a>` : ""}
          </div>
        </div>
        <div>
          <h4>${t("visit")}</h4>
          <p>${lines(C.stores?.items?.[0]?.address || "")}</p>
          ${g.phone ? `<p><a href="${telLink(g.phone)}">${esc(g.phone)}</a></p>` : ""}
        </div>
        <div>
          <h4>${t("browse")}</h4>
          <ul>${navItems.map(([, h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul>
        </div>
        <div>
          <h4>${t("legal")}</h4>
          <ul>${legalPages().map((l) => `<li><a href="${legalUrl(l)}">${esc(l.label || l.title)}</a></li>`).join("")}</ul>
        </div>
      </div>
      <div class="footer__bottom container">
        <span>© ${new Date().getFullYear()} Forn Almenar · ${t("since")}</span>
        <a href="#top">${t("backTop")}</a>
      </div>`;
  };

  const ORDER = ["hero", "marquee", "intro", "featured", "products", "blog", "cta", "tour", "workshop", "team", "history", "stores"];
  let C = null;

  /* =========================================================
     DISEÑO (colores, letras, formas) — editable en /admin → Diseño
     ========================================================= */
  const FONT_SETS = {
    clasica: { display: '"Big Shoulders Display", "Oswald", Impact, sans-serif', serif: '"Fraunces", Georgia, serif', body: '"DM Sans", system-ui, sans-serif', url: "" },
    elegante: { display: '"Playfair Display", Georgia, serif', serif: '"Cormorant Garamond", Georgia, serif', body: '"Lato", system-ui, sans-serif',
      url: "family=Playfair+Display:wght@700;800;900&family=Cormorant+Garamond:ital,wght@1,500;1,600&family=Lato:wght@400;700" },
    moderna: { display: '"Archivo Black", Impact, sans-serif', serif: '"Instrument Serif", Georgia, serif', body: '"Inter", system-ui, sans-serif',
      url: "family=Archivo+Black&family=Instrument+Serif:ital@1&family=Inter:wght@400;500;700" },
    artesana: { display: '"Bricolage Grotesque", sans-serif', serif: '"Caveat", cursive', body: '"Nunito Sans", system-ui, sans-serif',
      url: "family=Bricolage+Grotesque:wght@700;800&family=Caveat:wght@500;700&family=Nunito+Sans:wght@400;600;700" },
  };
  const hex = (h) => { const m = String(h || "").replace("#", "").match(/^([0-9a-f]{6})$/i); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const toHex = (c) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  const mixC = (a, b, t) => toHex(a.map((v, i) => v + (b[i] - v) * t));
  function applyDesign(d = {}) {
    const root = document.documentElement.style;
    const set = (k, v) => (v == null || v === "" ? root.removeProperty(k) : root.setProperty(k, v));
    // Colores: solo si se han personalizado (si no, se usan los del CSS original)
    const c = d.colors || {};
    const P = hex(c.primary), A = hex(c.accent), B = hex(c.background), T = hex(c.text);
    const W = [255, 255, 255], K = [0, 0, 0];
    set("--burgundy", P && toHex(P)); set("--burgundy-700", P && mixC(P, W, 0.12)); set("--burgundy-900", P && mixC(P, K, 0.3));
    set("--wheat", A && toHex(A)); set("--wheat-dark", A && mixC(A, K, 0.14));
    set("--paper", B && toHex(B));
    set("--cream", B && mixC(B, A || [200, 166, 126], 0.1)); set("--sand", B && mixC(B, A || [200, 166, 126], 0.33));
    set("--ink", T && toHex(T)); set("--muted", T && mixC(T, B || [255, 250, 244], 0.38));
    if (P) $('meta[name="theme-color"]')?.setAttribute("content", toHex(P));
    // Tipografías
    const f = FONT_SETS[d.fonts] || null;
    set("--f-display", f && d.fonts !== "clasica" ? f.display : null);
    set("--f-serif", f && d.fonts !== "clasica" ? f.serif : null);
    set("--f-body", f && d.fonts !== "clasica" ? f.body : null);
    let link = $("#design-fonts");
    if (f && f.url) {
      const href = `https://fonts.googleapis.com/css2?${f.url}&display=swap`;
      if (!link) { link = document.createElement("link"); link.id = "design-fonts"; link.rel = "stylesheet"; document.head.append(link); }
      if (link.href !== href) link.href = href;
    } else if (link) link.remove();
    // Formas y estilo
    set("--title-case", d.titleUpper === false ? "none" : null);
    set("--radius", { rectas: "4px", suaves: "12px" }[d.radius] || null);
    set("--btn-radius", d.buttons === "rectos" ? "6px" : null);
    set("--hero-dim", d.heroDim != null && d.heroDim !== "" ? String(Math.max(0.15, Math.min(1.2, Number(d.heroDim) / 100))) : null);
    // Textos del menú
    $$("[data-sec]").forEach((a) => {
      if (!a.dataset.label) a.dataset.label = a.textContent.trim();
      if (!a.dataset.href) a.dataset.href = a.getAttribute("href");
      a.textContent = navLabel(a.dataset.sec) || a.dataset.label;
      a.setAttribute("href", langHref(a.dataset.href));
    });
  }
  // Nombre de cada enlace del menú: el personalizado en /admin (en ese idioma) o el de siempre
  const navLabel = (k) => {
    const raw = (RAW && RAW.design && RAW.design.nav) || {};
    return String(raw[LANG === "es" ? k : `${k}_${LANG}`] || "").trim() || t("nav")[k] || k;
  };
  const sectionOrder = () => {
    const o = [...new Set((C.design && Array.isArray(C.design.order) ? C.design.order : []).filter((k) => ORDER.includes(k)))];
    ORDER.forEach((k, i) => {
      if (o.includes(k)) return;
      const prev = ORDER.slice(0, i).reverse().find((p) => o.includes(p));
      o.splice(prev ? o.indexOf(prev) + 1 : 0, 0, k);
    });
    return o;
  };

  let RAW = null;
  function render(content, { keepScroll = false } = {}) {
    RAW = content;
    C = localize(content, LANG);
    const y = scrollY;
    document.documentElement.lang = HTML_LANG[LANG];
    $$("[data-t]").forEach((el) => (el.textContent = t(el.dataset.t)));
    $("[data-wa]").setAttribute("aria-label", t("waAria"));
    $(".burger")?.setAttribute("aria-label", t("menu"));
    $$(".header__logo").forEach((a) => a.setAttribute("href", langHref("/")));
    drawNavLang();
    $$("[data-lang-switch]").forEach((box) => {
      box.setAttribute("aria-label", t("language"));
      $$("[data-lang]", box).forEach((a) => {
        const on = a.dataset.lang === LANG;
        a.classList.toggle("is-active", on);
        on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
        const u = new URL(location.href); u.hash = "";
        a.dataset.lang === "es" ? u.searchParams.delete("lang") : u.searchParams.set("lang", a.dataset.lang);
        u.searchParams.delete("preview");
        a.setAttribute("href", u.pathname + u.search);
      });
    });
    applyDesign(C.design || {});
    if (renderMaintenance()) return;
    const g = C.general || {};
    if (g.siteTitle) document.title = g.siteTitle;
    if (g.siteDescription) $('meta[name="description"]')?.setAttribute("content", g.siteDescription);
    $$("[data-logo]").forEach((el) => (el.src = g.logo || "/img/logo.png"));
    $$("[data-sec]").forEach((el) => (el.hidden = el.dataset.sec === "blog" ? false : C[el.dataset.sec]?.show === false));
    const wa = $("[data-wa]");
    wa.hidden = !g.whatsapp; wa.href = waLink(g.whatsapp);
    $("[data-cookies-text]").textContent = C.footer?.cookiesText || "";
    const ck = legalPages().find((p) => /cookie/i.test(p.slug + p.title));
    $("[data-cookies-link]").href = ck ? legalUrl(ck) : "#";

    if (PAGE === "blog") $("#main").innerHTML = blogPage();
    else if (PAGE === "post") $("#main").innerHTML = postPage();
    else if (PAGE === "legal") $("#main").innerHTML = legalPage();
    else {
      const tones = (C.design && C.design.tones) || {};
      $("#main").innerHTML = sectionOrder().filter((k) => C[k] && C[k].show !== false && S[k]).map((k) => {
        const html = S[k](C[k]);
        const tone = ["light", "cream", "dark"].includes(tones[k]) ? tones[k] : "";
        // marca cada sección con su nombre (y su fondo elegido) en la primera etiqueta
        return html.replace(/^(\s*<\w+)/, `$1 data-key="${k}"${tone ? ` data-tone="${tone}"` : ""}`);
      }).join("");
      $$("[data-tone]").forEach((el) => {
        el.classList.remove("section--cream", "section--dark");
        el.classList.add("tone-" + el.dataset.tone);
      });
    }
    $("#footer").innerHTML = footer();
    renderNotice();
    seo();
    initSection();
    if (keepScroll) scrollTo(0, y);
  }

  /* =========================================================
     MODO MANTENIMIENTO (se enciende en /admin → Mantenimiento)
     Quien ha entrado en el panel en este navegador sigue viendo la web normal, con un aviso.
     ========================================================= */
  let previewMaint = false, mntRaf = 0;
  const adminBypass = () => { try { return Number(localStorage.getItem("fa-admin") || 0) > Date.now(); } catch { return false; } };
  function renderMaintenance() {
    const M = C.maintenance || {};
    const on = isPreview ? previewMaint : !!M.on && !adminBypass();
    cancelAnimationFrame(mntRaf);
    document.body.classList.toggle("is-maint", on);
    $(".maint-pill")?.remove();
    if (!on) {
      if (M.on && !isPreview) document.body.insertAdjacentHTML("beforeend", `<div class="maint-pill" role="status"><span aria-hidden="true">🔧</span><span>${mt("pill")} <a href="/admin#maintenance">${mt("panel")}</a></span></div>`);
      $(".mnt")?.remove();
      return false;
    }
    const g = C.general || {}, st = (C.stores?.items || [])[0] || {};
    let box = $(".mnt");
    if (!box) { box = document.createElement("div"); box.className = "mnt"; document.body.prepend(box); }
    document.title = `${siteName()} · ${M.title || ""} ${M.titleAccent || ""}`.trim();
    const phone = [g.phone, st.phone].find((x) => x && !/000[\s.]?000/.test(x));
    box.innerHTML = `
      <div class="mnt__page">
        <header class="mnt__head">
          <img src="${esc(g.logoLight || "/img/logo-light.png")}" alt="Forn Almenar 1952" />
          ${langSwitch("lang--mnt")}
        </header>
        <main class="mnt__main">
          <section>
            ${M.eyebrow ? `<p class="eyebrow">${esc(M.eyebrow)}</p>` : ""}
            <h1>${lines(M.title)}${M.titleAccent ? `<em>${esc(M.titleAccent)}</em>` : ""}</h1>
            ${M.text ? `<p class="mnt__lead">${lines(M.text)}</p>` : ""}
            <div class="mnt__progress" aria-live="polite">
              <div class="mnt__ptop"><span class="mnt__stage" data-mnt-stage></span><span class="mnt__pct" data-mnt-pct>0%</span></div>
              <div class="mnt__bar" role="progressbar" aria-label="${mt("progress")}" aria-valuemin="0" aria-valuemax="100" data-mnt-bar><div class="mnt__fill" data-mnt-fill></div></div>
            </div>
          </section>
          <div class="oven-wrap" aria-hidden="true">
            <div class="steam"><span></span><span></span><span></span></div>
            <div class="oven">
              <div class="panel"><div class="knobs"><span class="knob"></span><span class="knob"></span></div><span class="lamp"></span><span class="display" data-mnt-temp>20°C</span></div>
              <div class="door"><div class="handle"></div>
                <div class="window">
                  <span class="coil coil--top"></span><span class="rack"></span>
                  <div class="bread"><svg viewBox="0 0 220 110">
                    <path class="crust" d="M8 104 C 6 60, 46 18, 110 16 C 174 18, 214 60, 212 104 Z" />
                    <path class="crust-top" d="M30 70 C 44 38, 76 26, 110 25 C 144 26, 176 38, 190 70 C 160 56, 140 52, 110 52 C 80 52, 60 56, 30 70 Z" opacity=".75" />
                    <g fill="none" stroke-width="5" stroke-linecap="round" class="score"><path d="M62 52 C 74 40, 88 36, 100 36" /><path d="M98 44 C 110 32, 124 28, 138 30" /><path d="M134 44 C 146 36, 156 36, 166 40" /></g>
                  </svg></div>
                  <span class="coil coil--bottom"></span><span class="shimmer"></span>
                </div>
              </div>
            </div>
            <div class="floor-glow"></div>
          </div>
        </main>
        <footer class="mnt__foot">
          ${M.showContact !== false && st.address ? `<span><strong>${mt("where")}</strong>${esc(cleanAddr(st.address))}</span>
          <span><a href="${esc(directionsUrl(st))}" target="_blank" rel="noopener">${t("directions")} →</a></span>` : ""}
          ${M.showContact !== false && phone ? `<span><strong>${mt("call")}</strong><a href="${telLink(phone)}">${esc(phone)}</a></span>` : ""}
          <span>© ${new Date().getFullYear()} Forn Almenar · ${t("since")}</span>
        </footer>
      </div>`;
    // Los "drawLang" del selector
    $$("[data-lang]", box).forEach((a) => a.classList.toggle("is-active", a.dataset.lang === LANG));
    // Barra, texto y temperatura sincronizados con el pan (ciclo de 12 s)
    const stage = $("[data-mnt-stage]", box), pct = $("[data-mnt-pct]", box), fill = $("[data-mnt-fill]", box), bar = $("[data-mnt-bar]", box), temp = $("[data-mnt-temp]", box);
    const steps = [0, 0.15, 0.38, 0.62, 0.84, 0.96], names = mt("stages");
    let last = "";
    const setStage = (txt) => { if (txt !== last) { last = txt; stage.innerHTML = `<span>${esc(txt)}</span>`; } };
    if (reduceMotion) { fill.style.width = "85%"; pct.textContent = "85%"; bar.setAttribute("aria-valuenow", 85); setStage(names[2]); temp.textContent = "220°C"; }
    else {
      const t0 = performance.now();
      const tick = (now) => {
        const p = ((now - t0) % 12000) / 12000, v = Math.min(99, Math.round(p * 104));
        fill.style.width = v + "%"; pct.textContent = v + "%"; bar.setAttribute("aria-valuenow", v);
        for (let i = steps.length - 1; i >= 0; i--) if (p >= steps[i]) { setStage(names[i]); break; }
        temp.textContent = Math.round(p < 0.15 ? 20 + (p / 0.15) * 200 : 220 + Math.sin(now / 700) * 3) + "°C";
        mntRaf = requestAnimationFrame(tick);
      };
      mntRaf = requestAnimationFrame(tick);
    }
    return true;
  }

  /* Cambiar de idioma sin recargar la página */
  function setLang(l) {
    if (!LANGS.includes(l) || !RAW) return;
    LANG = l;
    if (!isPreview) {
      try { localStorage.setItem("fa-lang", l); } catch {}
      const u = new URL(location.href);
      l === "es" ? u.searchParams.delete("lang") : u.searchParams.set("lang", l);
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    }
    render(RAW, { keepScroll: true });
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-lang]");
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    setLang(a.dataset.lang);
    if (burger.getAttribute("aria-expanded") === "true") toggleMenu(false);
  });

  /* =========================================================
     AVISO RÁPIDO (arriba del todo, con fechas)
     ========================================================= */
  const hashStr = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return String(h); };
  function currentNotice() {
    const N = C.notice;
    if (!N || N.show === false) return null;
    const today = madridDate();
    return (N.items || []).find((n) => n.active !== false && String(n.text || "").trim()
      && (!n.from || n.from <= today) && (!n.to || today <= n.to)) || null;
  }
  function renderNotice() {
    const box = $("#notice"), n = currentNotice();
    let closed = null;
    try { closed = sessionStorage.getItem("fa-notice"); } catch {}
    const id = n ? hashStr(n.text) : "";
    const show = n && (isPreview || closed !== id);
    document.body.classList.toggle("has-notice", !!show);
    if (!show) { box.hidden = true; box.innerHTML = ""; document.documentElement.style.removeProperty("--notice-h"); return; }
    const link = n.link ? (n.link.startsWith("#") && PAGE !== "home" ? langHref("/" + n.link) : n.link.startsWith("/") ? langHref(n.link) : n.link) : "";
    const ext = /^https?:/i.test(link);
    box.innerHTML = `<div class="notice__inner">${link
      ? `<a href="${esc(link)}" ${ext ? 'target="_blank" rel="noopener"' : ""}>${esc(n.text)} <span aria-hidden="true">→</span></a>`
      : `<span>${esc(n.text)}</span>`}
      <button type="button" class="notice__close" aria-label="${t("closeNotice")}">×</button></div>`;
    box.hidden = false;
    const measure = () => document.documentElement.style.setProperty("--notice-h", box.offsetHeight + "px");
    measure(); requestAnimationFrame(measure);
    $(".notice__close", box).addEventListener("click", () => {
      try { sessionStorage.setItem("fa-notice", id); } catch {}
      box.hidden = true; document.body.classList.remove("has-notice");
      document.documentElement.style.removeProperty("--notice-h");
    });
  }
  addEventListener("resize", () => { const b = $("#notice"); if (b && !b.hidden) document.documentElement.style.setProperty("--notice-h", b.offsetHeight + "px"); });

  /* =========================================================
     SEO: idiomas alternativos, Open Graph y datos estructurados (schema.org)
     ========================================================= */
  const abs = (u) => { try { return u ? new URL(u, location.origin).href : ""; } catch { return ""; } };
  const isPlaceholder = (v) => /000[\s.]?000/.test(String(v || ""));
  function setTag(sel, make, attrs) {
    let el = $(sel, document.head);
    if (!el) { el = make(); document.head.append(el); }
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }
  const meta = (prop, content, attr = "property") => content && setTag(`meta[${attr}="${prop}"]`, () => { const m = document.createElement("meta"); m.setAttribute(attr, prop); return m; }, { content });
  function seo() {
    if (isPreview) return;
    const base = location.origin + location.pathname;
    const urlFor = (l) => base + (l === "es" ? "" : `?lang=${l}`);
    setTag('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }), { href: urlFor(LANG) });
    [...LANGS, "x-default"].forEach((l) => {
      const hl = l === "va" ? "ca" : l;
      setTag(`link[rel="alternate"][hreflang="${hl}"]`, () => { const k = document.createElement("link"); k.rel = "alternate"; k.hreflang = hl; return k; }, { href: urlFor(l === "x-default" ? "es" : l) });
    });
    meta("og:title", document.title);
    meta("og:description", $('meta[name="description"]')?.getAttribute("content"));
    meta("og:url", urlFor(LANG));
    meta("og:type", PAGE === "post" ? "article" : "website");
    meta("og:locale", { es: "es_ES", va: "ca_ES", en: "en_GB" }[LANG]);
    meta("og:site_name", siteName());

    const g = C.general || {}, st = (C.stores?.items || [])[0] || {};
    const data = [];
    if (PAGE === "home") {
      const lines0 = String(st.address || "").split(/\n/).map((x) => x.trim()).filter(Boolean);
      const pc = String(st.address || "").match(/\b(\d{5})\s+([^\n,·]+)/);
      const geo = coordsOf(st.map);
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const groups = {};
      (st.schedule || []).forEach((d, i) => { if (d && d.open && d.close) (groups[`${d.open}-${d.close}`] = groups[`${d.open}-${d.close}`] || { opens: d.open, closes: d.close, days: [] }).days.push("https://schema.org/" + days[i]); });
      const phone = [g.phone, st.phone].find((x) => x && !isPlaceholder(x));
      data.push({
        "@context": "https://schema.org", "@type": "Bakery", "@id": location.origin + "/#horno",
        name: st.name || siteName(), description: g.siteDescription || "", url: urlFor(LANG),
        image: [abs("/img/fotos/og-image.jpg"), ...((C.hero?.slides) || []).map((x) => abs(x.image)).filter(Boolean).slice(0, 3)],
        logo: abs(g.logo || "/img/logo.png"),
        ...(phone ? { telephone: phone } : {}),
        ...(g.email && g.email !== "hola@fornalmenar.com" ? { email: g.email } : {}),
        address: {
          "@type": "PostalAddress",
          streetAddress: (lines0[0] || "").split(/\s*[·•|]\s*/)[0],
          ...(pc ? { postalCode: pc[1], addressLocality: pc[2].trim() } : {}),
          addressRegion: "Valencia", addressCountry: "ES",
        },
        ...(geo ? { geo: { "@type": "GeoCoordinates", latitude: Number(geo.split(",")[0]), longitude: Number(geo.split(",")[1]) } } : {}),
        hasMap: directionsUrl(st),
        openingHoursSpecification: Object.values(groups).map((x) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: x.days, opens: x.opens, closes: x.closes })),
        foundingDate: "1952", priceRange: "€",
        servesCuisine: LANG === "en" ? ["Bakery", "Pastries", "Coffee"] : LANG === "va" ? ["Forn", "Pastisseria", "Cafeteria"] : ["Panadería", "Pastelería", "Cafetería"],
        sameAs: [g.instagram, g.facebook].filter((x) => /^https?:/i.test(x || "")),
        inLanguage: LOCALE[LANG],
      });
    }
    if (PAGE === "post" && C._post) {
      const p = C._post;
      data.push({
        "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: excerptOf(p),
        datePublished: p.date || undefined, image: p.cover ? [abs(p.cover)] : undefined, inLanguage: LOCALE[LANG],
        mainEntityOfPage: urlFor(LANG), publisher: { "@type": "Organization", name: siteName(), logo: { "@type": "ImageObject", url: abs(g.logo || "/img/logo.png") } },
      });
    }
    let ld = $("#ld-json");
    if (!data.length) { ld?.remove(); return; }
    if (!ld) { ld = Object.assign(document.createElement("script"), { id: "ld-json", type: "application/ld+json" }); document.head.append(ld); }
    ld.textContent = JSON.stringify(data.length === 1 ? data[0] : data);
  }

  /* =========================================================
     PÁGINAS DEL BLOG
     ========================================================= */
  let previewPostId = null;
  const siteName = () => (C.general.siteTitle || "Forn Almenar").split("·")[0].trim();

  function blogPage() {
    const B = C.blog || {}, posts = publishedPosts();
    document.title = `${B.pageTitle || t("nav").blog} · ${siteName()}`;
    const cats = [...new Set(posts.map((p) => p.category).filter(Boolean))];
    return `
      <section class="page-head">
        <div class="container">
          <p class="eyebrow eyebrow--dark">${esc(siteName())}</p>
          <h1>${esc(B.pageTitle || t("nav").blog)}</h1>
          ${B.pageIntro ? `<p class="page-head__lead">${lines(B.pageIntro)}</p>` : ""}
        </div>
      </section>
      <section class="blog-list section">
        <div class="container">
          ${cats.length > 1 ? `<div class="filters" role="tablist" aria-label="${t("filterNews")}">
            <button class="filter is-active" data-blog-filter="all">${t("all")}</button>
            ${cats.map((c) => `<button class="filter" data-blog-filter="${esc(c)}">${esc(c)}</button>`).join("")}
          </div>` : ""}
          <div class="blog-grid" id="blog-grid">
            ${posts.length ? posts.map((p, i) => postCard(p, i % 3, i === 0)).join("") : `<p class="empty">${t("noNews")}</p>`}
          </div>
        </div>
      </section>`;
  }

  const legalPages = () => ((C.legal && C.legal.pages) || []).filter((p) => p.title);
  const legalUrl = (p) => langHref(`/legal/${encodeURIComponent(p.slug || p.id)}`);
  const allergenPage = () => legalPages().find((p) => p.id === "l4" || /alerg|al·lerg|allerg/i.test(`${p.slug} ${p.title}`));
  // Sustituye {{titular}}, {{nif}}… por los datos de «Datos generales»
  function fillTokens(html) {
    const g = C.general || {}, st = (C.stores?.items || [])[0] || {};
    const val = {
      titular: g.legalName, nif: g.taxId, email: g.email, telefono: g.phone || st.phone,
      direccion: String(st.address || "").replace(/\s*\n\s*/g, ", "), web: location.host,
    };
    return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => {
      if (!(k in val)) return m;
      return val[k] ? esc(val[k]) : `<mark class="todo">[${t("missing")}: ${k}]</mark>`;
    });
  }
  let previewPageId = null;
  function legalPage() {
    const all = legalPages();
    const slug = decodeURIComponent(location.pathname.split("/")[2] || "");
    const p = isPreview && previewPageId ? all.find((x) => x.id === previewPageId) : all.find((x) => x.slug === slug || x.id === slug);
    if (!p) {
      document.title = `${t("notFound")} · ${siteName()}`;
      return `<section class="page-head page-head--center"><div class="container">
        <h1>${t("notFound")}</h1><p class="page-head__lead">${t("moved")}</p><a href="${langHref("/")}" class="btn">${t("home")}</a></div></section>`;
    }
    document.title = `${p.title} · ${siteName()}`;
    return `
      <section class="page-head page-head--legal">
        <div class="container container--narrow">
          <p class="eyebrow eyebrow--dark">${t("legalInfo")}</p>
          <h1>${esc(p.title)}</h1>
        </div>
      </section>
      <article class="legal section">
        <div class="prose container container--narrow">${fillTokens(sanitize(p.body))}</div>
        ${all.length > 1 ? `<nav class="legal__nav container container--narrow" aria-label="${t("otherLegal")}">
          ${all.filter((x) => x.id !== p.id).map((x) => `<a href="${legalUrl(x)}" class="share-btn">${esc(x.label || x.title)}</a>`).join("")}
        </nav>` : ""}
      </article>`;
  }

  function postPage() {
    const all = (C.blog && C.blog.posts) || [];
    const slug = decodeURIComponent(location.pathname.split("/")[2] || "");
    const p = isPreview && previewPostId ? all.find((x) => x.id === previewPostId)
      : all.find((x) => (x.slug === slug || x.id === slug) && x.published !== false);
    if (!p) {
      document.title = `${t("postNotFoundT")} · ${siteName()}`;
      return `<section class="page-head page-head--center"><div class="container">
        <h1>${t("postNotFound")}</h1><p class="page-head__lead">${t("postMoved")}</p>
        <a href="${langHref("/blog")}" class="btn">${t("allNews")}</a></div></section>`;
    }
    document.title = `${p.title} · ${siteName()}`;
    C._post = p;
    $('meta[name="description"]')?.setAttribute("content", excerptOf(p));
    const more = publishedPosts().filter((x) => x.id !== p.id).slice(0, 3);
    const url = location.origin + postUrl(p);
    return `
      <article class="post">
        <header class="post__head container container--narrow">
          <a href="${langHref("/blog")}" class="post__back">${t("backNews")}</a>
          <div class="post-meta">${p.category ? `<span class="post-cat">${esc(p.category)}</span>` : ""}<time datetime="${esc(p.date)}">${fmtDate(p.date)}</time><span>· ${readingTime(p.body)} ${t("minRead")}</span></div>
          <h1>${esc(p.title)}</h1>
          ${p.excerpt ? `<p class="post__lead">${esc(p.excerpt)}</p>` : ""}
        </header>
        ${p.cover ? `<figure class="post__cover container"><img src="${esc(p.cover)}" alt="${esc(p.title)}" /></figure>` : ""}
        <div class="prose container container--narrow">${sanitize(p.body)}</div>
        <footer class="post__share container container--narrow">
          <span>${t("share")}</span>
          <a href="${waLink("", p.title + " " + url)}" target="_blank" rel="noopener" class="share-btn">WhatsApp</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" class="share-btn">Facebook</a>
          <button type="button" class="share-btn" data-copy="${esc(url)}">${t("copy")}</button>
        </footer>
      </article>
      ${more.length ? `
      <section class="news section section--cream">
        <div class="container">
          <header class="section__head"><p class="eyebrow eyebrow--dark">${t("keepReading")}</p><h2>${t("moreNews")}</h2></header>
          <div class="news__grid">${more.map((m, i) => postCard(m, i)).join("")}</div>
        </div>
      </section>` : ""}`;
  }

  /* =========================================================
     INTERACCIÓN
     ========================================================= */
  // Header y menú móvil (una sola vez)
  const header = $(".header");
  const onScroll = () => { header.classList.toggle("is-scrolled", scrollY > 40); document.body.classList.toggle("is-scrolled", scrollY > 40); };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const burger = $(".burger"), menu = $("#mobile-menu");
  const toggleMenu = (open) => {
    burger.setAttribute("aria-expanded", open);
    burger.classList.toggle("is-open", open);
    document.body.classList.toggle("no-scroll", open);
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add("is-open")); }
    else { menu.classList.remove("is-open"); setTimeout(() => (menu.hidden = true), 300); }
  };
  burger.addEventListener("click", () => toggleMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  let sliderTimer = null;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  const observe = (els) => els.forEach((el) => (isPreview ? el.classList.add("is-in") : io.observe(el)));

  function initSection() {
    /* Slider */
    clearInterval(sliderTimer);
    const slides = $$(".slide"), dots = $(".hero__dots");
    if (slides.length > 1 && dots) {
      let current = 0;
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.setAttribute("role", "tab"); b.setAttribute("aria-label", `${t("slide")} ${i + 1}`);
        b.addEventListener("click", () => go(i, true));
        dots.appendChild(b);
      });
      const go = (i, user) => {
        slides[current].classList.remove("is-active"); dots.children[current].classList.remove("is-active");
        current = (i + slides.length) % slides.length;
        slides[current].classList.add("is-active"); dots.children[current].classList.add("is-active");
        if (user) restart();
      };
      const restart = () => { clearInterval(sliderTimer); if (!reduceMotion) sliderTimer = setInterval(() => go(current + 1), 6500); };
      $$(".hero__arrow").forEach((b) => b.addEventListener("click", () => go(current + Number(b.dataset.dir), true)));
      dots.children[0].classList.add("is-active");
      restart();
      let x0 = null;
      const hero = $(".hero");
      hero.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
      hero.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1), true);
        x0 = null;
      });
    }

    observe($$(".reveal"));
    if (isPreview || cookieChoice() === "accept") loadMaps();
    initTour();

    /* Blog: filtros y copiar enlace */
    $$("[data-blog-filter]").forEach((b) => b.addEventListener("click", () => {
      $$("[data-blog-filter]").forEach((x) => x.classList.toggle("is-active", x === b));
      const f = b.dataset.blogFilter;
      $$("#blog-grid .post-card").forEach((card, i) => {
        const show = f === "all" || card.querySelector(".post-cat")?.textContent === f;
        card.hidden = !show;
        card.classList.toggle("post-card--big", f === "all" && i === 0);
      });
    }));
    $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = t("copied"); }
      catch { prompt(t("copyPrompt"), b.dataset.copy); }
      setTimeout(() => (b.textContent = t("copy")), 2000);
    }));

    /* Contadores */
    if (!isPreview && !reduceMotion) {
      const cio = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now();
        const tick = (t) => {
          const p = Math.min((t - t0) / 1400, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
          if (p < 1) requestAnimationFrame(tick);
        };
        el.textContent = "0" + suf;
        requestAnimationFrame(tick);
        cio.unobserve(el);
      }), { threshold: 0.6 });
      $$("[data-count]").forEach((el) => cio.observe(el));
    }

    /* Catálogo: categorías + filtros de alérgenos ("Sin gluten"…) */
    const grid = $("#products-grid");
    if (grid) {
      const P = C.products, catName = Object.fromEntries((P.categories || []).map((c) => [c.id, c.name]));
      const items = (P.items || []).filter(productShown);
      const known = (ids) => (Array.isArray(ids) ? ids : []).filter((id) => ALLERGENS[id]);
      const allergensHtml = (p) => {
        if (!Array.isArray(p.allergens)) return ""; // sin revisar: no se muestra nada (ni se filtra como "sin")
        const has = known(p.allergens), tr = known(p.traces).filter((id) => !has.includes(id));
        const chip = (id) => `<span class="alg"><i aria-hidden="true">${ALLERGENS[id][0]}</i>${esc(allergenName(id))}</span>`;
        if (!has.length && !tr.length) return `<p class="allergens allergens--none"><span aria-hidden="true">✓</span> ${esc(t("noAllergens"))}</p>`;
        return `<div class="allergens">
          ${has.length ? `<p><span class="allergens__k">${esc(t("contains"))}:</span> ${has.map(chip).join("")}</p>` : ""}
          ${tr.length ? `<p class="allergens__tr">${esc(t("traces"))}: ${tr.map((id) => esc(allergenName(id).toLowerCase())).join(", ")}</p>` : ""}
        </div>`;
      };
      const card = (p) => {
        const off = isSeasonal(p) && !inSeason(p.season); // solo pasa en la vista previa
        const tag = off ? t("outOfSeason") : p.tag || (isSeasonal(p) ? t("seasonal") : "");
        return `
        <article class="product reveal ${off ? "product--off" : ""}" data-cat="${esc(p.cat)}">
          <div class="product__img">
            ${img(p.image, p.name, 'onerror="this.remove()"')}
            ${tag ? `<span class="product__tag ${isSeasonal(p) && !p.tag ? "product__tag--season" : ""}">${esc(tag)}</span>` : ""}
          </div>
          <div class="product__body">
            ${catName[p.cat] ? `<span class="product__cat">${esc(catName[p.cat])}</span>` : ""}
            <h3>${esc(p.name)}</h3>
            ${p.desc ? `<p>${lines(p.desc)}</p>` : ""}
            ${allergensHtml(p)}
            <div class="product__foot">
              <strong>${esc(p.price)}</strong>
            </div>
          </div>
        </article>`;
      };
      const sec = grid.closest("section");
      const st = { cat: "all", free: new Set() };
      const passesFree = (p) => {
        if (!st.free.size) return true;
        if (!Array.isArray(p.allergens)) return false; // nunca se da por "sin X" un producto sin revisar
        const bad = new Set([...known(p.allergens), ...known(p.traces)]);
        return [...st.free].every((f) => FREE_FROM.find((x) => x[0] === f)[1].every((id) => !bad.has(id)));
      };
      const draw = () => {
        const list = items.filter((p) => (st.cat === "all" || p.cat === st.cat) && passesFree(p));
        grid.innerHTML = list.length ? list.map(card).join("") : `<p class="empty products__empty">${esc(t("noMatch"))}</p>`;
        const note = $("[data-free-note]", sec);
        if (note) note.hidden = !st.free.size;
        observe($$(".reveal", grid));
      };
      $$(".filter", sec).forEach((b) => b.addEventListener("click", () => {
        $$(".filter", sec).forEach((x) => { x.classList.remove("is-active"); x.setAttribute("aria-selected", "false"); });
        b.classList.add("is-active"); b.setAttribute("aria-selected", "true");
        st.cat = b.dataset.filter; draw();
      }));
      $$("[data-free]", sec).forEach((b) => b.addEventListener("click", () => {
        const on = !st.free.has(b.dataset.free);
        on ? st.free.add(b.dataset.free) : st.free.delete(b.dataset.free);
        b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on);
        draw();
      }));
      draw();
    }

  }

  /* Mapa: solo se carga con permiso (cookies de Google) */
  const cookieChoice = () => { try { return localStorage.getItem("fa-cookies"); } catch { return null; } };
  function loadMaps() {
    $$("[data-map-src]").forEach((box) => {
      if ($("iframe", box)) return;
      box.innerHTML = `<iframe src="${box.dataset.mapSrc}" title="${box.dataset.mapTitle}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
    });
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-load-map]")) loadMaps(); });

  /* =========================================================
     RECORRIDO VIRTUAL
     ========================================================= */
  function initTour() {
    const tour = $("[data-tour]");
    if (!tour) return;
    const stage = $(".tour__stage", tour);
    const scenes = $$(".tour__scene", tour);
    const byId = Object.fromEntries(scenes.map((s) => [s.dataset.id, s]));
    let cur = scenes[0], busy = false;
    const pos = new Map(scenes.map((s) => [s, { fx: (Number(s.dataset.focus) || 50) / 100, fy: 0.5 }]));

    const loadImg = (sc) => { const im = $("img", sc); if (im && !im.src && im.dataset.src) im.src = im.dataset.src; return im; };
    const prefetch = (sc) => $$(".hotspot", sc).forEach((h) => byId[h.dataset.to] && loadImg(byId[h.dataset.to]));

    // Tamaño de la foto: algo mayor que el visor para poder "mirar alrededor"
    function layout(sc) {
      const im = $("img", sc), pan = $(".tour__pan", sc);
      if (!im || !im.naturalWidth) return;
      const W = stage.clientWidth, H = stage.clientHeight;
      // Cubre el visor y amplía un poco más para poder "mirar alrededor"
      const k = Math.max(W / im.naturalWidth, H / im.naturalHeight) * 1.14;
      const pw = im.naturalWidth * k, ph = im.naturalHeight * k;
      pan.style.width = pw + "px"; pan.style.height = ph + "px";
      sc._dims = { W, H, pw, ph };
      place(sc);
    }
    function place(sc) {
      const d = sc._dims; if (!d) return;
      const p = pos.get(sc);
      p.fx = Math.min(1, Math.max(0, p.fx)); p.fy = Math.min(1, Math.max(0, p.fy));
      const x = -(d.pw - d.W) * p.fx, y = -(d.ph - d.H) * p.fy;
      $(".tour__pan", sc).style.transform = `translate3d(${x}px, ${y}px, 0)`;
      // La etiqueta de cada punto se pone hacia el lado donde hay sitio en pantalla
      $$(".hotspot", sc).forEach((hs) => {
        const sx = (parseFloat(hs.style.left) / 100) * d.pw + x;
        hs.classList.toggle("hotspot--left", sx > d.W * 0.58);
      });
    }
    scenes.forEach((sc) => { const im = $("img", sc); im.addEventListener("load", () => layout(sc)); if (im.complete && im.naturalWidth) layout(sc); });
    new ResizeObserver(() => scenes.forEach((sc) => sc._dims !== undefined || sc === cur ? layout(sc) : 0)).observe(stage);
    loadImg(cur); prefetch(cur);
    // Evita que el navegador desplace el visor por dentro al enfocar un punto
    stage.addEventListener("scroll", () => { stage.scrollLeft = 0; stage.scrollTop = 0; });
    $$(".tour__scene", stage).forEach((sc) => sc.addEventListener("scroll", () => { sc.scrollLeft = 0; sc.scrollTop = 0; }));

    // Arrastrar para mirar
    let drag = null;
    stage.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".hotspot, .tour__btn")) return;
      drag = { x: e.clientX, y: e.clientY, p: { ...pos.get(cur) }, moved: false };
      stage.setPointerCapture(e.pointerId); stage.classList.add("is-dragging");
    });
    stage.addEventListener("pointermove", (e) => {
      if (!drag || !cur._dims) return;
      const d = cur._dims, p = pos.get(cur);
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) { drag.moved = true; hideHint(); }
      p.fx = drag.p.fx - dx / Math.max(1, d.pw - d.W);
      p.fy = drag.p.fy - dy / Math.max(1, d.ph - d.H);
      place(cur);
    });
    const endDrag = () => { drag = null; stage.classList.remove("is-dragging"); };
    stage.addEventListener("pointerup", endDrag); stage.addEventListener("pointercancel", endDrag);

    // Cambiar de sala
    const hud = { n: $("[data-tour-n]", tour), name: $("[data-tour-name]", tour), text: $("[data-tour-text]", tour) };
    function go(id, from) {
      const next = byId[id];
      if (!next || next === cur || busy) return;
      busy = true; hideHint();
      const im = loadImg(next);
      const start = () => {
        layout(next);
        const prev = cur;
        if (from && !reduceMotion) {
          const r = from.getBoundingClientRect(), pr = $(".tour__pan", prev).getBoundingClientRect();
          $(".tour__pan", prev).style.transformOrigin = `${r.left + r.width / 2 - pr.left}px ${r.top + r.height / 2 - pr.top}px`;
        }
        prev.classList.add(from && !reduceMotion ? "is-leaving-zoom" : "is-leaving");
        next.classList.add("is-active", "is-entering"); next.setAttribute("aria-hidden", "false");
        cur = next; prefetch(next);
        const i = scenes.indexOf(next);
        hud.n.textContent = i + 1;
        hud.name.textContent = $("img", next).alt;
        const data = (C.tour.scenes || []).find((x) => x.id === id);
        hud.text.textContent = (data && data.text) || "";
        $$(".tour__thumb", tour).forEach((t) => { const on = t.dataset.go === id; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); if (on) t.scrollIntoView({ block: "nearest", inline: "center", behavior: reduceMotion ? "auto" : "smooth" }); });
        requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove("is-entering")));
        setTimeout(() => {
          prev.classList.remove("is-active", "is-leaving", "is-leaving-zoom"); prev.setAttribute("aria-hidden", "true");
          $(".tour__pan", prev).style.transformOrigin = "";
          pos.get(prev).fx = (Number(prev.dataset.focus) || 50) / 100; pos.get(prev).fy = 0.5; place(prev);
          busy = false;
        }, reduceMotion ? 0 : 750);
      };
      if (im.complete && im.naturalWidth) start(); else { stage.classList.add("is-loading"); im.addEventListener("load", () => { stage.classList.remove("is-loading"); start(); }, { once: true }); im.addEventListener("error", () => { stage.classList.remove("is-loading"); busy = false; }, { once: true }); }
    }
    tour.addEventListener("click", (e) => {
      const hs = e.target.closest(".hotspot"); if (hs) return go(hs.dataset.to, hs);
      const th = e.target.closest("[data-go]"); if (th) return go(th.dataset.go);
      const st = e.target.closest("[data-tour-step]");
      if (st) { const i = scenes.indexOf(cur); go(scenes[(i + Number(st.dataset.tourStep) + scenes.length) % scenes.length].dataset.id); }
      if (e.target.closest("[data-tour-full]")) toggleFull();
    });
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const i = scenes.indexOf(cur); go(scenes[(i + (e.key === "ArrowRight" ? 1 : -1) + scenes.length) % scenes.length].dataset.id); }
      if (e.key === "Escape" && tour.classList.contains("is-full")) toggleFull();
    });

    // Pantalla completa (con alternativa para iPhone)
    function toggleFull() {
      const on = !tour.classList.contains("is-full");
      if (on && tour.requestFullscreen && !/iPhone|iPad/.test(navigator.userAgent)) tour.requestFullscreen().catch(() => {});
      else if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
      tour.classList.toggle("is-full", on); document.body.classList.toggle("no-scroll", on);
      setTimeout(() => layout(cur), 60);
    }
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement && tour.classList.contains("is-full")) { tour.classList.remove("is-full"); document.body.classList.remove("no-scroll"); setTimeout(() => layout(cur), 60); }
    });

    // Pista inicial: un pequeño paseo de la cámara la primera vez que se ve
    const hint = $("[data-tour-hint]", tour);
    function hideHint() { hint && hint.classList.add("is-hidden"); }
    if (!reduceMotion && !isPreview) {
      const io2 = new IntersectionObserver((en) => {
        if (!en[0].isIntersecting) return; io2.disconnect();
        const p = pos.get(cur), f0 = p.fx, t0 = performance.now();
        const step = (t) => { if (drag) return; const k = Math.min(1, (t - t0) / 2600); p.fx = f0 + Math.sin(k * Math.PI * 2) * 0.18; place(cur); if (k < 1) requestAnimationFrame(step); };
        setTimeout(() => requestAnimationFrame(step), 500);
      }, { threshold: 0.5 });
      io2.observe(stage);
    }
  }

  /* Cookies */
  function initCookies() {
    if (isPreview) return;
    const box = $("#cookies");
    let consent = null;
    try { consent = localStorage.getItem("fa-cookies"); } catch {}
    if (!consent) setTimeout(() => { box.hidden = false; requestAnimationFrame(() => box.classList.add("is-in")); }, 1200);
    $$("[data-cookies]", box).forEach((b) => b.addEventListener("click", () => {
      try { localStorage.setItem("fa-cookies", b.dataset.cookies); } catch {}
      if (b.dataset.cookies === "accept") loadMaps();
      box.classList.remove("is-in");
      setTimeout(() => (box.hidden = true), 400);
    }));
  }

  /* =========================================================
     CARGA DEL CONTENIDO
     ========================================================= */
  const done = () => {
    document.body.classList.remove("is-loading");
    if (location.hash && !isPreview && PAGE === "home") setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 50);
  };

  async function load() {
    const defaultsP = fetch("/content/default.json").then((r) => r.json());
    let saved = null;
    try {
      const r = await fetch("/api/content", { cache: "no-cache" });
      if (r.ok) { const d = await r.json(); saved = d && d.content; }
    } catch {}
    const defaults = await defaultsP;
    if (!saved) return defaults;
    // Si lo guardado es de una versión anterior (p. ej. sin blog), completa lo que falte
    for (const k of Object.keys(defaults)) if (k !== "contentVersion" && !(k in saved)) saved[k] = defaults[k];
    fillTranslations(saved, defaults); // traducciones de los textos que siguen siendo los de ejemplo
    return saved;
  }

  if (isPreview) {
    // Vista previa del panel /admin: recibe el borrador por postMessage
    document.documentElement.classList.add("is-preview");
    let first = true;
    addEventListener("message", (e) => {
      if (e.origin !== location.origin || !e.data) return;
      if (e.data.type === "preview") {
        previewPostId = e.data.postId || null;
        previewPageId = e.data.pageId || null;
        if (LANGS.includes(e.data.lang)) LANG = e.data.lang;
        previewMaint = !!e.data.maintenance;
        render(e.data.content, { keepScroll: !first });
        if (first) { first = false; done(); }
      }
      if (e.data.type === "scrollTo") {
        const el = e.data.id === "top" ? null : document.getElementById(e.data.id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else if (e.data.id === "top") scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    parent.postMessage({ type: "preview-ready" }, location.origin);
  } else {
    // El idioma elegido se refleja en la dirección (?lang=va), así los enlaces y lo que se comparte mantienen el idioma
    if (LANG !== "es" && !new URLSearchParams(location.search).has("lang")) {
      const u = new URL(location.href); u.searchParams.set("lang", LANG);
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    }
    load().then((c) => { render(c); done(); initCookies(); })
      .catch(() => { document.body.classList.remove("is-loading"); });
  }
})();
