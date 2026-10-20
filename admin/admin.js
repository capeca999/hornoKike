/* =========================================================
   FORN ALMENAR · Panel de administración
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const h = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "html") el.innerHTML = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    children.flat().forEach((c) => c != null && c !== false && el.append(c.nodeType ? c : document.createTextNode(c)));
    return el;
  };
  const uid = () => Math.random().toString(36).slice(2, 9);

  /* ---------- Idiomas: los textos traducidos se guardan como "title_va", "title_en" ---------- */
  const LANGS = { es: "Castellano", va: "Valencià", en: "English" };
  const LANG_FLAG = { es: "ES", va: "VA", en: "EN" };
  // Campos que son iguales en todos los idiomas (teléfonos, enlaces, precios…)
  const NO_TR = new Set(["phone", "whatsapp", "email", "instagram", "facebook", "legalName", "taxId", "price", "suffix", "map", "mapsUrl", "address", "link", "pos", "slug", "from", "to"]);
  const isTr = (f) => f.tr !== false && !NO_TR.has(f.key) && ["text", "textarea"].includes(f.type);
  const keyFor = (f) => (state.lang !== "es" && isTr(f) ? `${f.key}_${state.lang}` : f.key);
  const short = (t, n = 140) => { const x = String(t || "").replace(/\s+/g, " ").trim(); return x.length > n ? x.slice(0, n) + "…" : x; };

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
    const fill = (o) => {
      if (Array.isArray(o)) return o.forEach(fill);
      if (!o || typeof o !== "object") return;
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === "string" && !/_(va|en)$/.test(k) && dict.has(v)) {
          const d = dict.get(v);
          for (const l of ["va", "en"]) if (d[l] && !(k + "_" + l in o)) o[k + "_" + l] = d[l];
        } else if (typeof v === "object") fill(v);
      }
    };
    fill(target);
  }

  /* ---------- Alérgenos, temporada y fechas ---------- */
  const ALLERGENS = [
    ["gluten", "🌾", "Gluten"], ["leche", "🥛", "Leche"], ["huevo", "🥚", "Huevo"], ["frutos", "🌰", "Frutos de cáscara"],
    ["cacahuetes", "🥜", "Cacahuetes"], ["soja", "🫘", "Soja"], ["sesamo", "⚪", "Sésamo"], ["sulfitos", "🍷", "Sulfitos"],
    ["mostaza", "🟡", "Mostaza"], ["apio", "🥬", "Apio"], ["altramuces", "🌼", "Altramuces"], ["pescado", "🐟", "Pescado"],
    ["crustaceos", "🦐", "Crustáceos"], ["moluscos", "🐚", "Moluscos"],
  ];
  const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const madridDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const mmddText = (v) => { const [m, d] = String(v || "").split("-").map(Number); return m && d ? `${d} de ${MONTHS[m - 1]}` : "—"; };
  const dateText = (v) => v ? new Date(v + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "";
  const inSeason = (se) => {
    if (!se || !se.on || !se.from || !se.to) return true;
    const d = madridDate().slice(5);
    return se.from <= se.to ? d >= se.from && d <= se.to : d >= se.from || d <= se.to;
  };
  const noticeState = (n, N) => {
    const today = madridDate();
    if (N && N.show === false) return ["off", "Avisos apagados"];
    if (n.active === false) return ["off", "Apagado"];
    if (!String(n.text || "").trim()) return ["off", "Sin texto"];
    if (n.from && n.from > today) return ["soon", `Programado: desde el ${dateText(n.from)}`];
    if (n.to && n.to < today) return ["past", `Terminó el ${dateText(n.to)}`];
    return ["on", n.to ? `Se ve ahora, hasta el ${dateText(n.to)}` : "Se ve ahora"];
  };

  /* =========================================================
     ESQUEMA: qué se puede editar y cómo
     ========================================================= */
  const ANCHORS = [
    ["#productos", "Productos"], ["#tiendas", "Dónde estamos"], ["#novedades", "Novedades"],
    ["#historia", "Nuestra historia"], ["#obrador", "Obrador"], ["#amor", "Sobre nosotros"],
  ];
  const head = (eyebrowHelp = "Texto pequeño encima del título.") => [
    { key: "eyebrow", label: "Antetítulo", type: "text", help: eyebrowHelp },
    { key: "title", label: "Título", type: "text" },
    { key: "titleAccent", label: "Título en cursiva", type: "text", help: "Aparece debajo, en letra cursiva dorada. Puedes dejarlo vacío." },
  ];
  const show = { key: "show", label: "Mostrar esta sección en la web", type: "toggle" };

  const SECTIONS = [
    {
      id: "general", name: "Datos generales", desc: "Teléfono, WhatsApp, redes, logo", anchor: "top",
      fields: [
        { type: "group", label: "Contacto", fields: [
          { key: "phone", label: "Teléfono", type: "text", placeholder: "+34 960 000 000" },
          { key: "whatsapp", label: "WhatsApp", type: "text", placeholder: "+34 600 000 000", help: "Se usa en el botón verde flotante y en «Dónde estamos». Déjalo vacío para ocultarlo." },
          { key: "email", label: "Email", type: "text", placeholder: "hola@fornalmenar.com" },
        ]},
        { type: "group", label: "Redes sociales", fields: [
          { key: "instagram", label: "Enlace de Instagram", type: "text", placeholder: "https://instagram.com/…", help: "Déjalo vacío para ocultar el icono." },
          { key: "facebook", label: "Enlace de Facebook", type: "text", placeholder: "https://facebook.com/…" },
        ]},
        { type: "group", label: "Logo", fields: [
          { key: "logo", label: "Logo (fondo claro)", type: "image", ratio: "logo", maxSize: 1200, keepPng: true },
          { key: "logoLight", label: "Logo para el pie (fondo granate)", type: "image", ratio: "logo", maxSize: 1200, keepPng: true, dark: true },
        ]},
        { type: "group", label: "Datos legales del titular", fields: [
          { key: "legalName", label: "Titular (nombre y apellidos o razón social)", type: "text", placeholder: "Forn Almenar, S.L." },
          { key: "taxId", label: "NIF / CIF", type: "text", placeholder: "B12345678" },
          { type: "note", text: "Se rellenan solos en el aviso legal y la política de privacidad. La dirección, el email y el teléfono se toman de «Dónde estamos» y de Contacto." },
        ]},
        { type: "group", label: "Google y buscadores", fields: [
          { key: "siteTitle", label: "Título de la pestaña", type: "text", help: "Lo que se ve en la pestaña del navegador y en Google." },
          { key: "siteDescription", label: "Descripción para Google", type: "textarea", rows: 3 },
          { type: "note", text: "La web ya le da a Google la ficha del horno (dirección, horario, ubicación del mapa, teléfono, fotos y redes) y un mapa del sitio en los tres idiomas. Para salir mejor en Google Maps, dad de alta o reclamad el horno en Google Business Profile con la misma dirección y teléfono." },
        ]},
      ],
    },
    {
      id: "maintenance", name: "Mantenimiento", desc: "Cerrar la web un rato con el horno horneándose", anchor: "top",
      fields: [
        { key: "on", label: "Web en mantenimiento", type: "toggle",
          help: "Encendido: los visitantes solo ven la página del horno horneándose (en los tres idiomas). Tú, en este navegador, sigues viendo la web normal con un aviso. Se aplica al pulsar «Guardar cambios»." },
        { type: "note", text: "La vista previa de la derecha te enseña cómo se ve la página de mantenimiento mientras estás en esta sección." },
        { type: "group", label: "Textos de la página", fields: [
          { key: "eyebrow", label: "Antetítulo", type: "text" },
          { key: "title", label: "Título", type: "text" },
          { key: "titleAccent", label: "Título en cursiva", type: "text" },
          { key: "text", label: "Texto", type: "textarea", rows: 3 },
          { key: "showContact", label: "Mostrar dirección, «Cómo llegar» y teléfono abajo", type: "toggle" },
        ]},
      ],
    },
    {
      id: "notice", name: "Aviso arriba", desc: "Mensaje corto en la franja de arriba, con fechas", anchor: "top",
      fields: [
        { key: "show", label: "Mostrar avisos en la web", type: "toggle", help: "Apágalo para quitar todos los avisos de golpe." },
        { type: "note", text: "Se ve el primer aviso de la lista que esté encendido y dentro de sus fechas. Si pones fechas, aparece y desaparece solo (por ejemplo, «Cerrado el 24 por la tarde» del 20 al 24). Las fechas son opcionales." },
        { key: "items", label: "Avisos", type: "list", addLabel: "Añadir aviso", addOnTop: true, max: 12,
          itemTitle: (s) => short(s.text, 70) || "Aviso sin texto",
          itemMeta: (s, c) => noticeState(s, c.notice)[1],
          itemClass: (s, c) => "notice-" + noticeState(s, c.notice)[0],
          newItem: () => ({ active: true, text: "", link: "", from: "", to: "" }),
          item: [
            { key: "active", label: "Encendido", type: "toggle" },
            { key: "text", label: "Texto del aviso", type: "textarea", rows: 2, placeholder: "Ej.: Este sábado abrimos hasta las 15:00", help: "Corto, de una línea. Puedes poner un emoji al principio: 🎄 🎉 ⚠️" },
            { key: "link", label: "Al pulsarlo lleva a… (opcional)", type: "select", options: () => [["", "No lleva a ningún sitio"], ...ANCHORS, ["/blog", "Página de Novedades"]] },
            { type: "row", fields: [
              { key: "from", label: "Se ve desde (opcional)", type: "date" },
              { key: "to", label: "Hasta (incluido)", type: "date" },
            ]},
          ] },
      ],
    },
    {
      id: "hero", name: "Portada", desc: "Las fotos grandes del principio", anchor: "inicio",
      fields: [show, {
        key: "slides", label: "Diapositivas", type: "list", addLabel: "Añadir diapositiva", max: 6,
        itemTitle: (s) => (s.title || "Diapositiva").replace(/\n/g, " "), itemImage: (s) => s.image,
        newItem: () => ({ eyebrow: "", title: "Nuevo título", text: "", button: "Ver productos", link: "#productos", image: "" }),
        item: [
          { key: "image", label: "Foto de fondo", type: "image", ratio: "wide", maxSize: 2200, help: "Mejor en horizontal y con buena luz." },
          { key: "pos", label: "En el móvil, ¿qué parte de la foto se ve?", type: "select",
            options: () => [["center", "El centro"], ["20% center", "La parte izquierda"], ["80% center", "La parte derecha"]] },
          { key: "eyebrow", label: "Antetítulo", type: "text" },
          { key: "title", label: "Título", type: "textarea", rows: 2, help: "Pulsa Intro para partir el título en dos líneas." },
          { key: "text", label: "Texto", type: "textarea", rows: 2 },
          { key: "button", label: "Texto del botón", type: "text", help: "Déjalo vacío para no mostrar botón." },
          { key: "link", label: "El botón lleva a…", type: "select", options: () => ANCHORS },
        ],
      }],
    },
    {
      id: "marquee", name: "Cinta de lemas", desc: "La franja dorada que se mueve", anchor: "lemas",
      fields: [show, {
        key: "items", label: "Lemas", type: "list", addLabel: "Añadir lema", inline: true,
        newItem: () => ({ text: "" }), item: [{ key: "text", label: "Lema", type: "text" }],
      }],
    },
    {
      id: "intro", name: "Sobre nosotros", desc: "Quiénes sois y cómo trabajáis", anchor: "amor",
      fields: [show, ...head(),
        { key: "text1", label: "Primer párrafo", type: "textarea", rows: 4 },
        { key: "text2", label: "Segundo párrafo", type: "textarea", rows: 4 },
        { type: "row", fields: [
          { key: "image1", label: "Foto alta", type: "image", ratio: "tall" },
          { key: "image2", label: "Foto pequeña", type: "image", ratio: "square" },
        ]},
        { key: "stats", label: "Cifras", type: "list", addLabel: "Añadir cifra", max: 4, inline: true,
          newItem: () => ({ value: 0, suffix: "", label: "" }),
          item: [
            { key: "value", label: "Número", type: "number" },
            { key: "suffix", label: "Símbolo", type: "text", placeholder: "%", small: true },
            { key: "label", label: "Texto", type: "text" },
          ] },
      ],
    },
    {
      id: "featured", name: "Destacados", desc: "Los 3 productos estrella", anchor: "destacados",
      fields: [show, ...head(), {
        key: "items", label: "Productos destacados", type: "list", addLabel: "Añadir destacado", max: 6,
        itemTitle: (s) => s.name, itemImage: (s) => s.image,
        newItem: () => ({ name: "Nuevo producto", text: "", image: "" }),
        item: [
          { key: "image", label: "Foto", type: "image", ratio: "square", help: "Se recorta en círculo." },
          { key: "name", label: "Nombre", type: "text" },
          { key: "text", label: "Descripción", type: "textarea", rows: 2 },
        ],
      }],
    },
    {
      id: "products", name: "Productos y precios", desc: "Catálogo, categorías y precios", anchor: "productos",
      fields: [show,
        { key: "items", label: "Productos", type: "list", addLabel: "Añadir producto", searchable: true, addOnTop: true,
          itemTitle: (s) => s.name, itemImage: (s) => s.image,
          itemMeta: (s, c) => [s.price, (c.products.categories.find((x) => x.id === s.cat) || {}).name, s.visible === false ? "Oculto" : "",
            s.season && s.season.on ? (inSeason(s.season) ? "De temporada · se ve ahora" : `Temporada desde el ${mmddText(s.season.from)}`) : "",
            Array.isArray(s.allergens) ? "Alérgenos ✓" : ""].filter(Boolean).join(" · "),
          newItem: (c) => ({ name: "Nuevo producto", cat: c.products.categories[0]?.id || "", price: "", desc: "", image: "", tag: "", visible: true }),
          item: [
            { key: "visible", label: "Mostrar en la web", type: "toggle", help: "Desactívalo si hoy no hay (sin borrarlo)." },
            { type: "row", fields: [
              { key: "name", label: "Nombre", type: "text" },
              { key: "price", label: "Precio", type: "text", placeholder: "3,50 €", small: true },
            ]},
            { key: "cat", label: "Categoría", type: "select", options: (c) => c.products.categories.map((x) => [x.id, x.name]) },
            { key: "desc", label: "Descripción corta", type: "textarea", rows: 2 },
            { key: "tag", label: "Etiqueta (opcional)", type: "text", placeholder: "Novedad, Favorito, De temporada…" },
            { key: "image", label: "Foto", type: "image", ratio: "photo" },
            { key: "season", label: "Temporada", type: "season" },
            { key: "allergens", label: "Alérgenos", type: "allergens" },
          ] },
        { key: "categories", label: "Categorías", type: "list", addLabel: "Añadir categoría", inline: true, rerender: true,
          help: "Son los botones para filtrar. Si borras una categoría, sus productos no se borran: cámbialos de categoría.",
          newItem: () => ({ id: "cat-" + uid(), name: "Nueva categoría" }),
          item: [{ key: "name", label: "Nombre", type: "text", rerender: true }] },
        { type: "group", label: "Títulos de la sección", collapsed: true, fields: head() },
      ],
    },
    {
      id: "cta", name: "Banner con foto", desc: "La franja con foto a pantalla completa", anchor: "banner",
      fields: [show,
        { key: "image", label: "Foto de fondo", type: "image", ratio: "wide", maxSize: 2200 },
        { key: "eyebrow", label: "Antetítulo", type: "text" },
        { key: "title", label: "Título", type: "textarea", rows: 2 },
        { key: "text", label: "Texto", type: "textarea", rows: 2 },
        { key: "button", label: "Texto del botón", type: "text", help: "Déjalo vacío para no mostrar botón." },
        { key: "link", label: "El botón lleva a…", type: "select", options: () => ANCHORS },
      ],
    },
    {
      id: "tour", name: "Visita el horno", desc: "Recorrido virtual por el local", anchor: "visita",
      fields: [show, ...head(),
        { key: "text", label: "Texto", type: "textarea", rows: 2 },
        { key: "scenes", label: "Salas del recorrido", type: "list", addLabel: "Añadir sala", max: 15,
          help: "La primera sala es la que se ve al empezar. En cada sala, pon puntos que lleven a otras salas.",
          itemTitle: (s, c, i) => `${i + 1}. ${s.name || "Sala sin nombre"}`, itemImage: (s) => s.image,
          itemMeta: (s) => `${(s.hotspots || []).length} punto${(s.hotspots || []).length === 1 ? "" : "s"}`,
          newItem: () => ({ id: "sala-" + uid(), name: "Nueva sala", text: "", image: "", focus: 50, hotspots: [] }),
          item: [
            { key: "name", label: "Nombre de la sala", type: "text" },
            { key: "text", label: "Descripción corta", type: "textarea", rows: 2 },
            { key: "image", label: "Foto (mejor en horizontal)", type: "image", ratio: "wide", maxSize: 2400 },
            { key: "hotspots", label: "Puntos para ir a otras salas", type: "hotspots" },
          ] },
      ],
    },
    {
      id: "workshop", name: "Obrador", desc: "El proceso y la galería de fotos", anchor: "obrador",
      fields: [show, ...head(),
        { key: "steps", label: "Pasos del proceso", type: "list", addLabel: "Añadir paso", max: 4,
          itemTitle: (s, c, i) => `${String(i + 1).padStart(2, "0")} · ${s.title}`,
          newItem: () => ({ title: "Nuevo paso", text: "" }),
          item: [{ key: "title", label: "Título", type: "text" }, { key: "text", label: "Texto", type: "textarea", rows: 2 }] },
        { key: "gallery", label: "Galería de fotos", type: "list", addLabel: "Añadir foto", grid: true, max: 8,
          newItem: () => ({ image: "" }), item: [{ key: "image", label: "", type: "image", ratio: "tall" }] },
      ],
    },
    {
      id: "team", name: "Equipo", desc: "Fotos y nombres del equipo", anchor: "equipo",
      fields: [show, ...head(),
        { key: "text", label: "Texto", type: "textarea", rows: 2 },
        { key: "items", label: "Personas", type: "list", addLabel: "Añadir persona", grid: true, max: 12,
          help: "El nombre y el puesto son opcionales: si los dejas vacíos, solo se ve la foto.",
          newItem: () => ({ image: "", name: "", role: "" }),
          item: [
            { key: "image", label: "", type: "image", ratio: "tall" },
            { key: "name", label: "Nombre", type: "text", tr: false },
            { key: "role", label: "Puesto", type: "text", placeholder: "Maestro panadero, barista…" },
          ] },
      ],
    },
    {
      id: "history", name: "Nuestra historia", desc: "La línea del tiempo", anchor: "historia",
      fields: [show, ...head(), {
        key: "items", label: "Momentos", type: "list", addLabel: "Añadir momento",
        itemTitle: (s) => `${s.year} · ${s.title}`,
        newItem: () => ({ year: "", title: "", text: "" }),
        item: [
          { type: "row", fields: [
            { key: "year", label: "Año", type: "text", small: true },
            { key: "title", label: "Título", type: "text" },
          ]},
          { key: "text", label: "Texto", type: "textarea", rows: 2 },
        ],
      }],
    },
    {
      id: "stores", name: "Dónde estamos", desc: "Dirección, mapa, teléfono y horario", anchor: "tiendas",
      fields: [show, {
        key: "items", type: "first",
        newItem: () => ({ name: "Forn Almenar", address: "", phone: "", showMap: true, map: "", mapsUrl: "", schedule: Array.from({ length: 7 }, () => ({ open: "", close: "" })) }),
        item: [
          { key: "name", label: "Nombre", type: "text", tr: false },
          { key: "address", label: "Dirección", type: "textarea", rows: 2 },
          { key: "phone", label: "Teléfono", type: "text" },
          { key: "schedule", label: "Horario", type: "schedule" },
          { type: "group", label: "Mapa de Google", fields: [
            { key: "showMap", label: "Mostrar el mapa", type: "toggle" },
            { key: "map", label: "Ubicación en el mapa", type: "textarea", rows: 2, placeholder: "39.48570, -0.36891",
              help: "Pega las coordenadas (en Google Maps: clic derecho sobre el horno → clic en los números para copiarlos) o el código de Compartir → Insertar un mapa. Si lo dejas vacío, se busca la dirección." },
            { key: "mapsUrl", label: "Enlace del botón «Cómo llegar» (opcional)", type: "text", help: "En Google Maps: Compartir → Copiar enlace. Si lo dejas vacío, se calcula solo." },
          ]},
        ],
      }, { type: "group", label: "Títulos de la sección", collapsed: true, fields: head() }],
    },
    {
      id: "blog", name: "Blog · Novedades", desc: "Noticias, anuncios y avisos", special: true, anchor: "novedades",
      fields: [
        { key: "show", label: "Mostrar las últimas novedades en la portada", type: "toggle" },
        { key: "homeCount", label: "¿Cuántas noticias se ven en la portada?", type: "number" },
        { type: "group", label: "Títulos del bloque en la portada", collapsed: true, fields: head() },
        { type: "group", label: "Página /blog", collapsed: true, fields: [
          { key: "pageTitle", label: "Título de la página", type: "text" },
          { key: "pageIntro", label: "Texto de introducción", type: "textarea", rows: 2 },
        ]},
      ],
    },
    {
      id: "footer", name: "Pie de página", desc: "Texto final, avisos legales y cookies", anchor: "footer",
      fields: [
        { key: "text", label: "Texto del pie", type: "textarea", rows: 3 },
        { key: "cookiesText", label: "Aviso de cookies", type: "textarea", rows: 2 },
        { type: "note", text: "Los enlaces legales del pie salen solos de la sección «Textos legales»." },
      ],
    },
    { id: "design", name: "Diseño y colores", desc: "Colores, letras, orden y fondos", special: true },
    { id: "legal", name: "Textos legales", desc: "Aviso legal, privacidad, cookies, alérgenos", special: true },
    { id: "backups", name: "Copias de seguridad", desc: "Volver a una versión anterior", special: true },
  ];

  /* =========================================================
     ESTADO
     ========================================================= */
  const state = {
    token: sessionStorage.getItem("fa-token") || "",
    content: null,
    savedJson: "",
    section: "blog",
    open: new Set(),
    search: "",
    device: innerWidth < 760 ? "mobile" : "desktop",
    previewReady: false,
    previewPath: "/",
    blogPost: null,
    legalPage: null,
    lang: "es",
  };

  /* ---------- API ---------- */
  async function api(path, opts = {}) {
    const r = await fetch(path, {
      ...opts,
      headers: { ...(opts.headers || {}), ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) },
    });
    let data = {};
    try { data = await r.json(); } catch {}
    if (r.status === 401 && path !== "/api/login") { logout(true); throw new Error(data.error || "Sesión caducada"); }
    if (!r.ok) throw new Error(data.error || `Error ${r.status}`);
    return data;
  }

  /* ---------- Toasts ---------- */
  function toast(msg, type = "ok", ms = 3500) {
    const t = h("div", { class: `toast toast--${type}` }, msg);
    $("#toasts").append(t);
    requestAnimationFrame(() => t.classList.add("is-in"));
    setTimeout(() => { t.classList.remove("is-in"); setTimeout(() => t.remove(), 300); }, ms);
  }

  /* =========================================================
     LOGIN
     ========================================================= */
  // Captcha (Cloudflare Turnstile): solo aparece si está configurado en Vercel
  const captcha = { enabled: false, token: "", widget: null };
  async function setupCaptcha() {
    if (captcha.widget !== null || captcha.loading) return;
    captcha.loading = true;
    try {
      const { turnstileSiteKey } = await (await fetch("/api/config")).json();
      if (!turnstileSiteKey) return;
      captcha.enabled = true;
      await new Promise((resolve, reject) => {
        const s = h("script", { src: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit", async: true });
        s.onload = resolve; s.onerror = reject;
        document.head.append(s);
      });
      const box = $("#captcha");
      box.hidden = false;
      captcha.widget = window.turnstile.render(box, {
        sitekey: turnstileSiteKey, language: "es", theme: "light",
        callback: (t) => { captcha.token = t; $(".login__error").textContent = ""; },
        "expired-callback": () => { captcha.token = ""; },
        "error-callback": () => { captcha.token = ""; },
      });
    } catch {
      $(".login__error").textContent = "No se ha podido cargar la verificación. Recarga la página.";
    } finally { captcha.loading = false; }
  }
  const resetCaptcha = () => { if (captcha.widget !== null && window.turnstile) { window.turnstile.reset(captcha.widget); captcha.token = ""; } };

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, err = $(".login__error", f), btn = $("button[type=submit]", f);
    if (captcha.enabled && !captcha.token) { err.textContent = "Marca la casilla de verificación antes de entrar."; return; }
    err.textContent = ""; btn.disabled = true; btn.textContent = "Entrando…";
    try {
      const { token } = await api("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: f.password.value, captcha: captcha.token }) });
      state.token = token; sessionStorage.setItem("fa-token", token);
      markAdmin();
      f.reset();
      start();
    } catch (ex) { err.textContent = ex.message; }
    resetCaptcha(); // cada token de Turnstile solo sirve una vez
    btn.disabled = false; btn.textContent = "Entrar";
  });

  // Marca este navegador como "del panel" (12 h): así ve la web aunque esté en mantenimiento
  const markAdmin = () => { try { localStorage.setItem("fa-admin", String(Date.now() + 12 * 3600 * 1000)); } catch {} };
  function updateMaintBadge() {
    const on = state.content?.maintenance?.on === true;
    let b = $("#maint-badge");
    if (!b) { b = h("button", { id: "maint-badge", class: "maint-badge", type: "button", onclick: () => goSection("maintenance") }, "🔧 Web en mantenimiento"); $("#status").after(b); }
    b.hidden = !on;
  }
  function showLogin() { $("#login").hidden = false; setupCaptcha(); }

  function logout(expired) {
    state.token = ""; sessionStorage.removeItem("fa-token");
    if (!expired) try { localStorage.removeItem("fa-admin"); } catch {}
    $("#app").hidden = true; showLogin();
    if (expired) $(".login__error").textContent = "La sesión ha caducado. Vuelve a entrar (tus cambios sin guardar siguen aquí).";
  }
  $("#logout-btn").addEventListener("click", () => {
    if (isDirty() && !confirm("Tienes cambios sin guardar. ¿Salir de todas formas?")) return;
    logout();
  });

  /* =========================================================
     ARRANQUE
     ========================================================= */
  async function start() {
    $("#login").hidden = true; $("#app").hidden = false;
    if (!state.content) {
      try {
        const { content } = await api("/api/content?fresh=" + Date.now());
        const defaults = await (await fetch("/content/default.json", { cache: "no-cache" })).json();
        state.defaults = defaults;
        state.content = content || defaults;
        // Si el contenido guardado es de una versión anterior, añade las secciones nuevas
        for (const k of Object.keys(defaults)) if (k !== "contentVersion" && !(k in state.content)) state.content[k] = defaults[k];
        // Traducciones al valenciano y al inglés de los textos que siguen siendo los de ejemplo
        fillTranslations(state.content, defaults);
      } catch (e) {
        toast("No se ha podido cargar el contenido: " + e.message, "error", 8000);
        state.content = await (await fetch("/content/default.json")).json();
      }
      state.savedJson = JSON.stringify(state.content);
    }
    const hash = location.hash.slice(1);
    if (SECTIONS.some((s) => s.id === hash)) state.section = hash;
    markAdmin();
    renderNav(); renderEditor(); updateStatus(); sendPreview(); updateMaintBadge();
    offerUpdate();
  }

  /* =========================================================
     ACTUALIZACIÓN DE CONTENIDO (p. ej. las fotos reales del horno)
     ========================================================= */
  const UPDATES = {
    2: {
      title: "Hay fotos nuevas del horno preparadas para la web",
      text: "Portada, Sobre nosotros, Destacados, todos los productos (con su foto), Banner, Obrador, Equipo y las noticias de ejemplo. No se tocan la dirección, el horario, los datos de contacto, los textos legales ni las noticias que hayáis escrito vosotros.",
      apply(c, d) {
        c.hero.slides = clone(d.hero.slides);
        c.intro.image1 = d.intro.image1; c.intro.image2 = d.intro.image2;
        c.featured.items = clone(d.featured.items);
        c.products.categories = clone(d.products.categories);
        c.products.items = clone(d.products.items);
        c.cta.image = d.cta.image;
        c.workshop.gallery = clone(d.workshop.gallery);
        c.team = clone(d.team);
        const samples = new Set(["p1", "p2", "p3"]);
        const own = (c.blog?.posts || []).filter((p) => !samples.has(p.id));
        c.blog = c.blog || clone(d.blog);
        c.blog.posts = [...clone(d.blog.posts), ...own];
      },
    },
    3: {
      title: "Nuevo: productos de temporada que aparecen solos",
      text: "Añade 4 ejemplos (roscón de Reyes, buñuelos, mona de Pascua y panellets) con sus fechas. Se añaden OCULTOS: revisa precio, foto y alérgenos y enciéndelos cuando queráis. No se toca nada más.",
      button: "Añadir los ejemplos",
      done: "Ejemplos añadidos al final de «Productos y precios». Pulsa «Guardar cambios» para guardarlos.",
      apply(c, d) {
        const items = c.products.items || (c.products.items = []);
        (d.products.items || []).filter((p) => p.season && p.season.on).forEach((p) => {
          if (!items.some((x) => x.id === p.id || x.name === p.name)) items.push({ ...clone(p), visible: false });
        });
      },
    },
  };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  function offerUpdate() {
    const d = state.defaults; if (!d) return;
    const from = Number(state.content.contentVersion) || 1, to = Number(d.contentVersion) || 1;
    if (from >= to || $(".update-bar")) return;
    // Se ofrecen de una en una, de la más antigua a la más nueva
    const v = Object.keys(UPDATES).map(Number).sort((a, b) => a - b).find((x) => x > from && x <= to && !state.skipped?.has(x));
    if (!v) return;
    const u = UPDATES[v];
    const bar = h("div", { class: "update-bar", role: "status" },
      h("div", {}, h("strong", {}, "✨ " + u.title), h("span", {}, u.text)),
      h("div", { class: "update-bar__actions" },
        h("button", { class: "btn btn--small btn--ghost", onclick: () => { (state.skipped = state.skipped || new Set()).add(v); bar.remove(); offerUpdate(); } }, "Ahora no"),
        h("button", { class: "btn btn--small btn--primary", onclick: () => {
          u.apply(state.content, d);
          state.content.contentVersion = v;
          bar.remove();
          changed({ rerender: true }); renderNav(); sendPreview();
          toast(u.done || "Fotos puestas. Revisa la vista previa y pulsa «Guardar cambios» para publicarlas.", "ok", 7000);
          offerUpdate();
        } }, u.button || "Poner las fotos nuevas")));
    $("#editor").prepend(bar);
  }

  /* =========================================================
     NAVEGACIÓN
     ========================================================= */
  function goSection(id) {
    const s = SECTIONS.find((x) => x.id === id);
    state.section = id; state.search = ""; state.blogPost = null; state.legalPage = null;
    history.replaceState(null, "", "#" + id);
    renderNav(); renderEditor();
    $("#editor").scrollTop = 0;
    document.body.classList.remove("menu-open");
    if (s.anchor && state.previewPath === "/") postPreview({ type: "scrollTo", id: s.anchor });
  }

  function renderNav() {
    const nav = $("#nav");
    nav.innerHTML = "";
    // Tarjeta destacada del blog, siempre arriba
    const posts = (state.content.blog?.posts || []);
    const live = posts.filter((p) => p.published !== false).length, drafts = posts.length - live;
    nav.append(h("div", { class: `blog-card ${state.section === "blog" ? "is-active" : ""}` },
      h("button", { type: "button", class: "blog-card__main", onclick: () => goSection("blog") },
        h("span", { class: "blog-card__icon", "aria-hidden": "true" }, "✎"),
        h("span", {}, h("strong", {}, "Blog · Novedades"),
          h("small", {}, `${live} publicada${live === 1 ? "" : "s"}${drafts ? ` · ${drafts} borrador${drafts === 1 ? "" : "es"}` : ""}`))),
      h("button", { type: "button", class: "blog-card__new", onclick: () => { goSection("blog"); createPost(); } }, "+ Escribir noticia")));
    const swatch = (state.content.design?.colors) || {};
    nav.append(h("button", { type: "button", class: `design-card ${state.section === "design" ? "is-active" : ""}`, onclick: () => goSection("design") },
      h("span", { class: "design-card__dots", "aria-hidden": "true" },
        ...[swatch.primary || "#561c24", swatch.accent || "#c8a67e", swatch.background || "#fffaf4"].map((c) => h("i", { style: `background:${c}` }))),
      h("span", {}, h("strong", {}, "Diseño y colores"), h("small", {}, "Colores, letras, orden de secciones"))));
    nav.append(h("p", { class: "nav-label" }, "Contenido de la web"));
    SECTIONS.filter((s) => s.id !== "blog" && s.id !== "design").forEach((s) => {
      if (s.id === "backups") nav.append(h("p", { class: "nav-label" }, "Seguridad"));
      const hidden = state.content[s.id]?.show === false;
      if (s.id === "maintenance") {
        const on = state.content.maintenance?.on === true;
        nav.append(h("button", { class: `nav-item nav-item--maint ${s.id === state.section ? "is-active" : ""} ${on ? "is-maint-on" : ""}`, onclick: () => goSection(s.id) },
          h("span", { class: "nav-item__name" }, "🔧 " + s.name, h("em", { class: on ? "maint-on" : "maint-off" }, on ? "ACTIVADO" : "apagado")), h("span", { class: "nav-item__desc" }, s.desc)));
        return;
      }
      nav.append(h("button", {
        class: `nav-item ${s.id === state.section ? "is-active" : ""} ${hidden ? "is-off" : ""}`,
        onclick: () => goSection(s.id),
      }, h("span", { class: "nav-item__name" }, s.name, hidden ? h("em", {}, "oculta") : ""), h("span", { class: "nav-item__desc" }, s.desc)));
    });
  }
  $("#new-post-btn").addEventListener("click", () => { goSection("blog"); createPost(); });

  /* ---------- Idioma que se está editando ---------- */
  function setLang(l) {
    if (!LANGS[l] || state.lang === l) return;
    state.lang = l;
    document.body.dataset.lang = l;
    $$("#langbar [data-lang]").forEach((b) => { b.classList.toggle("is-active", b.dataset.lang === l); b.setAttribute("aria-pressed", b.dataset.lang === l); });
    const y = $("#editor").scrollTop; renderEditor(); $("#editor").scrollTop = y;
    sendPreview();
  }
  $$("#langbar [data-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  $("#menu-btn").addEventListener("click", () => document.body.classList.toggle("menu-open"));

  /* =========================================================
     EDITOR (formularios generados desde el esquema)
     ========================================================= */
  function renderEditor() {
    const sec = SECTIONS.find((s) => s.id === state.section);
    const ed = $("#editor");
    const keepBar = $(".update-bar", ed);
    ed.innerHTML = "";
    if (keepBar) ed.append(keepBar);
    setPreviewPath(sec.id === "blog" ? (state.blogPost ? "/blog/_preview" : "/blog")
      : sec.id === "legal" ? "/legal/_preview" : "/");
    schedulePreview(); // la vista previa sigue a la noticia o página legal abierta
    if (state.lang !== "es") ed.append(h("div", { class: `lang-banner lang-banner--${state.lang}` },
      h("strong", {}, `Estás editando la versión en ${LANGS[state.lang].toLowerCase() === "valencià" ? "valenciano" : "inglés"}`),
      h("span", {}, "Los campos con la etiqueta ", h("b", {}, LANG_FLAG[state.lang]), " son la traducción. Si dejas uno vacío, en la web se verá el texto en castellano. Las fotos, precios, horarios y enlaces son los mismos en todos los idiomas.")));
    if (sec.id === "blog" && state.blogPost) return renderPostEditor(ed);
    if (sec.id === "legal" && state.legalPage) return renderLegalEditor(ed);
    ed.append(h("div", { class: "editor__head" }, h("h1", {}, sec.name), h("p", {}, sec.desc)));
    if (sec.id === "blog") return renderBlogList(ed, sec);
    if (sec.id === "legal") return renderLegalList(ed);
    if (sec.id === "design") return renderDesign(ed);
    if (sec.special) return renderBackups(ed);
    const obj = state.content[sec.id] || (state.content[sec.id] = {});
    ed.append(renderFields(sec.fields, obj, sec.id));
  }

  function changed({ rerender = false } = {}) {
    updateStatus();
    schedulePreview();
    if (rerender) { const y = $("#editor").scrollTop; renderEditor(); $("#editor").scrollTop = y; }
  }

  function renderFields(fields, obj, path) {
    const frag = document.createDocumentFragment();
    fields.forEach((f) => frag.append(renderField(f, obj, path)));
    return frag;
  }

  // Si cambias el texto en castellano y ya había traducciones, avisa de que hay que revisarlas
  function flagStale(input) {
    const field = input.closest(".field");
    const done = field ? $$(".tr-dot.is-done", field) : [];
    if (!done.length || $(".field__stale", field)) return;
    done.forEach((d) => { d.classList.add("is-stale"); d.title = "Has cambiado el castellano: revisa esta traducción"; });
    input.after(h("span", { class: "field__stale" }, `✏️ Has cambiado el texto en castellano: revisa también la traducción (${done.map((d) => d.textContent).join(" · ")}). Pulsa en las etiquetas de arriba para ir a ella.`));
  }
  function wrap(f, input, extraClass = "", obj = null) {
    const tr = obj && isTr(f), other = state.lang !== "es";
    let badge = "", hint = "";
    if (tr && other) {
      badge = h("span", { class: `tr-badge tr-badge--${state.lang}`, title: `Traducción al ${state.lang === "va" ? "valenciano" : "inglés"}` }, LANG_FLAG[state.lang]);
      if (String(obj[f.key] || "").trim()) hint = h("span", { class: "field__orig" }, h("b", {}, "En castellano: "), short(obj[f.key], 220));
    } else if (obj && other && ["text", "textarea"].includes(f.type)) {
      badge = h("span", { class: "tr-badge tr-badge--common", title: "Este dato es igual en todos los idiomas" }, "común");
    } else if (tr && !other && String(obj[f.key] || "").trim()) {
      // En castellano: indica si ya hay traducciones (y lleva a ellas)
      badge = h("span", { class: "tr-dots" }, ...["va", "en"].map((l) => h("button", {
        type: "button", class: `tr-dot ${String(obj[`${f.key}_${l}`] || "").trim() ? "is-done" : ""}`,
        title: String(obj[`${f.key}_${l}`] || "").trim() ? `Traducido al ${l === "va" ? "valenciano" : "inglés"}: ${short(obj[`${f.key}_${l}`], 90)}` : `Falta la traducción al ${l === "va" ? "valenciano" : "inglés"}`,
        onclick: (e) => { e.preventDefault(); setLang(l); },
      }, LANG_FLAG[l])));
    }
    return h("label", { class: `field ${f.small ? "field--small" : ""} ${extraClass} ${tr && other ? "field--tr" : ""}` },
      f.label || badge ? h("span", { class: "field__label" }, f.label, badge) : "",
      input, hint,
      f.help ? h("span", { class: "field__help" }, f.help) : "");
  }

  function renderField(f, obj, path) {
    const p = `${path}.${f.key}`;
    switch (f.type) {
      case "group": {
        const body = h("div", { class: "group__body" }, renderFields(f.fields, obj, path));
        const d = h("details", { class: "group", open: !f.collapsed }, h("summary", {}, f.label), body);
        return d;
      }
      case "row":
        return h("div", { class: "row" }, renderFields(f.fields, obj, path));
      case "date": {
        const input = h("input", { type: "date", value: obj[f.key] || "" });
        input.addEventListener("input", () => { obj[f.key] = input.value; changed(); });
        return wrap(f, input);
      }
      case "text":
      case "number": {
        const k = keyFor(f), tr = k !== f.key;
        const input = h("input", { type: f.type === "number" ? "number" : "text", value: obj[k] ?? "", placeholder: tr ? short(obj[f.key], 90) : f.placeholder || "" });
        input.addEventListener("input", () => {
          if (tr && !input.value.trim()) delete obj[k];
          else obj[k] = f.type === "number" ? Number(input.value) || 0 : input.value;
          if (!tr) flagStale(input);
          changed();
        });
        if (f.rerender) input.addEventListener("change", () => changed({ rerender: true }));
        return wrap(f, input, "", obj);
      }
      case "textarea": {
        const k = keyFor(f), tr = k !== f.key;
        const ta = h("textarea", { rows: f.rows || 3, placeholder: tr ? short(obj[f.key], 90) : f.placeholder || "" });
        ta.value = obj[k] ?? "";
        ta.addEventListener("input", () => { if (tr && !ta.value.trim()) delete obj[k]; else obj[k] = ta.value; if (!tr) flagStale(ta); changed(); });
        return wrap(f, ta, "", obj);
      }
      case "season": return renderSeason(f, obj);
      case "allergens": return renderAllergens(f, obj);
      case "select": {
        const opts = f.options(state.content);
        const sel = h("select", {}, opts.map(([v, l]) => h("option", { value: v, selected: obj[f.key] === v }, l)));
        if (obj[f.key] && !opts.some(([v]) => v === obj[f.key])) sel.prepend(h("option", { value: obj[f.key], selected: true }, "— Elige una opción —"));
        sel.addEventListener("change", () => { obj[f.key] = sel.value; changed({ rerender: f.key === "cat" }); });
        return wrap(f, sel);
      }
      case "toggle": {
        const cb = h("input", { type: "checkbox", checked: f.key === "on" ? obj[f.key] === true : obj[f.key] !== false });
        cb.addEventListener("change", () => {
          if (f.key === "on" && cb.checked && !confirm("¿Poner la web en mantenimiento? Al guardar, los visitantes solo verán la página del horno horneándose.")) { cb.checked = false; return; }
          obj[f.key] = cb.checked; changed(); if (f.key === "show" || f.key === "on") { renderNav(); updateMaintBadge(); }
        });
        return h("label", { class: `toggle ${f.key === "show" ? "toggle--main" : ""}` }, cb, h("span", { class: "toggle__ui" }),
          h("span", { class: "toggle__text" }, f.label, f.help ? h("small", {}, f.help) : ""));
      }
      case "hotspots": return renderHotspots(f, obj);
      case "note":
        return h("p", { class: "note" }, f.text);
      case "first": {
        // Edita directamente el primer elemento de una lista (p. ej. el único horno)
        const arr = obj[f.key] || (obj[f.key] = []);
        if (!arr[0]) arr[0] = f.newItem();
        return renderFields(f.item, arr[0], `${p}.0`);
      }
      case "image": return renderImage(f, obj);
      case "list": return renderList(f, obj, p);
      case "schedule": return renderSchedule(f, obj);
    }
    return document.createTextNode("");
  }

  /* ---------- Imagen ---------- */
  function renderImage(f, obj) {
    const box = h("div", { class: `img-field img-field--${f.ratio || "photo"} ${f.dark ? "img-field--dark" : ""}` });
    const file = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp,image/gif", hidden: true });
    const draw = (loading = false) => {
      box.innerHTML = "";
      const src = obj[f.key];
      box.append(
        h("div", { class: "img-field__preview" },
          src ? h("img", { src, alt: "" }) : h("span", { class: "img-field__empty" }, "Sin foto"),
          loading ? h("div", { class: "img-field__loading" }, h("span", { class: "spinner" }), "Subiendo…") : ""),
        h("div", { class: "img-field__actions" },
          h("button", { type: "button", class: "btn btn--small", onclick: () => file.click(), disabled: loading }, src ? "Cambiar foto" : "Subir foto"),
          src && !loading ? h("button", { type: "button", class: "btn btn--small btn--ghost", onclick: () => { obj[f.key] = ""; draw(); changed(); } }, "Quitar") : ""),
        file);
    };
    const upload = async (fileObj) => {
      if (!fileObj || !fileObj.type.startsWith("image/")) return toast("Ese archivo no es una imagen.", "error");
      draw(true);
      try {
        const blob = await prepareImage(fileObj, f.maxSize || 1600, f.keepPng);
        const { url } = await api("/api/upload", { method: "POST", headers: { "X-File-Type": blob.type, "Content-Type": "application/octet-stream" }, body: blob });
        obj[f.key] = url;
        changed({ rerender: true });
        toast("Foto subida. Recuerda guardar los cambios.");
      } catch (e) { toast("No se ha podido subir la foto: " + e.message, "error", 6000); }
      draw();
    };
    file.addEventListener("change", () => upload(file.files[0]));
    box.addEventListener("dragover", (e) => { e.preventDefault(); box.classList.add("is-drag"); });
    box.addEventListener("dragleave", () => box.classList.remove("is-drag"));
    box.addEventListener("drop", (e) => { e.preventDefault(); box.classList.remove("is-drag"); upload(e.dataTransfer.files[0]); });
    draw();
    return h("div", { class: "field" }, f.label ? h("span", { class: "field__label" }, f.label) : "", box,
      h("span", { class: "field__help" }, f.help || "Puedes arrastrar la foto aquí. Se optimiza sola."));
  }

  // Reduce y comprime la foto en el navegador antes de subirla
  async function prepareImage(file, maxSize, keepPng) {
    if (file.type === "image/gif") {
      if (file.size > 4_000_000) throw new Error("El GIF pesa demasiado (máx. 4 MB).");
      return file;
    }
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), hgt = Math.round(bmp.height * scale);
    const canvas = Object.assign(document.createElement("canvas"), { width: w, height: hgt });
    canvas.getContext("2d").drawImage(bmp, 0, 0, w, hgt);
    const type = keepPng && file.type === "image/png" ? "image/png" : "image/webp";
    let quality = 0.85, blob;
    do {
      blob = await new Promise((r) => canvas.toBlob(r, type, quality));
      if (!blob || (type === "image/webp" && blob.type !== "image/webp")) blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
      quality -= 0.1;
    } while (blob.size > 3_500_000 && quality > 0.3);
    if (blob.size > 4_000_000) throw new Error("La foto pesa demasiado incluso comprimida.");
    return blob;
  }

  /* ---------- Listas ---------- */
  function renderList(f, obj, path) {
    const arr = obj[f.key] || (obj[f.key] = []);
    const root = h("div", { class: `list ${f.inline ? "list--inline" : ""} ${f.grid ? "list--grid" : ""}` });
    const header = h("div", { class: "list__head" }, h("span", { class: "field__label" }, `${f.label} (${arr.length})`));
    root.append(header);
    if (f.help) root.append(h("p", { class: "field__help" }, f.help));

    const addBtn = () => (!f.max || arr.length < f.max)
      ? h("button", { type: "button", class: "btn btn--add", onclick: () => {
          const it = f.newItem(state.content);
          state.search = "";
          if (f.addOnTop) arr.unshift(it); else arr.push(it);
          state.open.add(`${path}.${f.addOnTop ? 0 : arr.length - 1}`);
          changed({ rerender: true });
        } }, "+ " + f.addLabel)
      : h("p", { class: "field__help" }, `Máximo ${f.max}.`);

    if (f.searchable) {
      const search = h("input", { type: "search", class: "list__search", placeholder: "Buscar producto…", value: state.search });
      search.addEventListener("input", () => {
        state.search = search.value;
        const q = search.value.trim().toLowerCase();
        $$(".item", root).forEach((el) => (el.hidden = q && !el.dataset.search.includes(q)));
      });
      root.append(h("div", { class: "list__tools" }, search, addBtn()));
    }

    const items = h("div", { class: "list__items" });
    const move = (i, d) => {
      const j = i + d;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      const a = state.open.has(`${path}.${i}`), b = state.open.has(`${path}.${j}`);
      state.open.delete(`${path}.${i}`); state.open.delete(`${path}.${j}`);
      if (a) state.open.add(`${path}.${j}`); if (b) state.open.add(`${path}.${i}`);
      changed({ rerender: true });
    };
    const remove = (i) => {
      const name = f.itemTitle ? f.itemTitle(arr[i], state.content, i) : "este elemento";
      if (!confirm(`¿Seguro que quieres borrar «${name || "este elemento"}»?`)) return;
      arr.splice(i, 1);
      state.open = new Set([...state.open].filter((k) => !k.startsWith(path + ".")));
      changed({ rerender: true });
    };
    const controls = (i) => h("div", { class: "item__controls" },
      h("button", { type: "button", class: "icon-btn", title: "Subir", "aria-label": "Subir", disabled: i === 0, onclick: (e) => { e.preventDefault(); move(i, -1); } }, "↑"),
      h("button", { type: "button", class: "icon-btn", title: "Bajar", "aria-label": "Bajar", disabled: i === arr.length - 1, onclick: (e) => { e.preventDefault(); move(i, 1); } }, "↓"),
      h("button", { type: "button", class: "icon-btn icon-btn--danger", title: "Borrar", "aria-label": "Borrar", onclick: (e) => { e.preventDefault(); remove(i); } }, "✕"));

    const q = (state.search || "").toLowerCase();
    arr.forEach((it, i) => {
      const key = `${path}.${i}`;
      if (f.inline || f.grid) {
        items.append(h("div", { class: "item item--inline" }, h("div", { class: "item__fields" }, renderFields(f.item, it, key)), controls(i)));
        return;
      }
      const title = (f.itemTitle && f.itemTitle(it, state.content, i)) || "Sin título";
      const thumb = f.itemImage ? f.itemImage(it) : null;
      const meta = f.itemMeta ? f.itemMeta(it, state.content) : "";
      const det = h("details", { class: `item ${it.visible === false ? "is-off" : ""} ${f.itemClass ? f.itemClass(it, state.content) : ""}`, open: state.open.has(key), "data-search": `${title} ${meta}`.toLowerCase() },
        h("summary", {},
          f.itemImage ? h("span", { class: "item__thumb" }, thumb ? h("img", { src: thumb, alt: "" }) : "") : "",
          h("span", { class: "item__title" }, title, meta ? h("small", {}, meta) : ""),
          controls(i)),
        h("div", { class: "item__body" }, renderFields(f.item, it, key)));
      if (q && !det.dataset.search.includes(q)) det.hidden = true;
      det.addEventListener("toggle", () => (det.open ? state.open.add(key) : state.open.delete(key)));
      // Actualiza el título al escribir
      det.addEventListener("input", () => {
        const t = $(".item__title", det);
        t.firstChild.textContent = (f.itemTitle && f.itemTitle(it, state.content, i)) || "Sin título";
        const sm = $("small", t);
        if (sm && f.itemMeta) sm.textContent = f.itemMeta(it, state.content);
      });
      items.append(det);
    });
    root.append(items);
    if (!f.searchable) root.append(addBtn());
    return root;
  }

  /* ---------- Puntos del recorrido virtual ---------- */
  function renderHotspots(f, scene) {
    const list = scene.hotspots || (scene.hotspots = []);
    const others = () => (state.content.tour?.scenes || []).filter((x) => x !== scene && x.id);
    const box = h("div", { class: "hs" });
    let placing = null; // índice del punto que se está colocando
    const draw = () => {
      box.innerHTML = "";
      const pic = h("div", { class: `hs__pic ${placing !== null ? "is-placing" : ""}` },
        scene.image ? h("img", { src: scene.image, alt: "" }) : h("span", { class: "img-field__empty" }, "Sube primero la foto de la sala"),
        ...list.map((p, i) => h("span", { class: `hs__mark ${placing === i ? "is-on" : ""}`, style: `left:${p.x}%;top:${p.y}%` }, String(i + 1))));
      if (placing !== null) pic.append(h("div", { class: "hs__tip" }, `Haz clic en la foto donde quieras el punto ${placing + 1}`));
      pic.addEventListener("click", (e) => {
        if (placing === null || !scene.image) return;
        const r = pic.getBoundingClientRect();
        list[placing].x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10;
        list[placing].y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10;
        placing = null; draw(); changed();
      });
      box.append(pic);
      list.forEach((p, i) => {
        const lk = state.lang === "es" ? "label" : `label_${state.lang}`;
        const label = h("input", { type: "text", value: p[lk] || "", placeholder: state.lang === "es" ? "Texto del punto (p. ej. «El salón»)" : `${LANG_FLAG[state.lang]} · ${p.label || ""}` });
        label.addEventListener("input", () => { if (lk !== "label" && !label.value.trim()) delete p[lk]; else p[lk] = label.value; changed(); });
        const opts = others();
        const to = h("select", {}, h("option", { value: "" }, "— ¿A qué sala lleva? —"), ...opts.map((o) => h("option", { value: o.id, selected: p.to === o.id }, o.name || "Sala sin nombre")));
        to.addEventListener("change", () => { p.to = to.value; changed(); });
        box.append(h("div", { class: "hs__row" },
          h("span", { class: "hs__num" }, String(i + 1)),
          h("div", { class: "hs__fields" }, label, to),
          h("button", { type: "button", class: `btn btn--small ${placing === i ? "btn--primary" : ""}`, onclick: () => { placing = placing === i ? null : i; draw(); } }, placing === i ? "Haz clic en la foto…" : "Colocar en la foto"),
          h("button", { type: "button", class: "icon-btn icon-btn--danger", title: "Quitar punto", "aria-label": "Quitar punto", onclick: () => { list.splice(i, 1); placing = null; draw(); changed(); } }, "✕")));
      });
      box.append(h("button", { type: "button", class: "btn btn--add", onclick: () => { list.push({ x: 50, y: 50, label: "", to: "" }); placing = list.length - 1; draw(); changed(); } }, "+ Añadir punto"));
    };
    draw();
    return h("div", { class: "field" }, h("span", { class: "field__label" }, f.label), box,
      h("span", { class: "field__help" }, "Cada punto es un círculo en la foto con un texto. Al pulsarlo en la web, te lleva a la sala elegida."));
  }

  /* ---------- Temporada de un producto ---------- */
  function renderSeason(f, obj) {
    const box = h("div", { class: "season" });
    const draw = () => {
      box.innerHTML = "";
      const se = obj.season || {};
      const cb = h("input", { type: "checkbox", checked: !!se.on });
      cb.addEventListener("change", () => {
        obj.season = cb.checked ? { on: true, from: se.from || "12-01", to: se.to || "12-31" } : { ...se, on: false };
        if (!cb.checked && !obj.season.from) delete obj.season;
        draw(); changed();
      });
      box.append(h("label", { class: "toggle" }, cb, h("span", { class: "toggle__ui" }),
        h("span", { class: "toggle__text" }, "Solo en su temporada", h("small", {}, "Aparece y desaparece solo cada año entre estas fechas."))));
      if (!se.on) return;
      const pick = (which) => {
        const [m, d] = String(se[which] || "01-01").split("-").map(Number);
        const day = h("select", { "aria-label": "Día" }, Array.from({ length: 31 }, (_, i) => h("option", { value: i + 1, selected: i + 1 === d }, String(i + 1))));
        const mon = h("select", { "aria-label": "Mes" }, MONTHS.map((n, i) => h("option", { value: i + 1, selected: i + 1 === m }, n)));
        const set = () => { obj.season[which] = `${String(mon.value).padStart(2, "0")}-${String(day.value).padStart(2, "0")}`; draw(); changed(); };
        day.addEventListener("change", set); mon.addEventListener("change", set);
        return h("span", { class: "season__pick" }, day, h("span", {}, "de"), mon);
      };
      const now = inSeason(se);
      box.append(
        h("div", { class: "season__range" }, h("span", {}, "Del"), pick("from"), h("span", {}, "al"), pick("to")),
        h("p", { class: `season__state ${now ? "is-on" : ""}` }, obj.visible === false
          ? "⚠️ Ahora está oculto: enciende «Mostrar en la web» para que salga en su temporada."
          : now ? "✅ Hoy está en temporada: se ve en la web." : `🌙 Hoy no se ve. Volverá solo el ${mmddText(se.from)}.`));
    };
    draw();
    return h("div", { class: "field" }, h("span", { class: "field__label" }, f.label), box);
  }

  /* ---------- Alérgenos de un producto ---------- */
  function renderAllergens(f, obj) {
    const box = h("div", { class: "alg-field" });
    const grid = (key, title) => {
      const list = obj[key] || (obj[key] = []);
      return h("div", { class: "alg-group" }, h("span", { class: "alg-group__title" }, title),
        h("div", { class: "alg-grid" }, ALLERGENS.map(([id, icon, name]) => {
          const cb = h("input", { type: "checkbox", checked: list.includes(id) });
          cb.addEventListener("change", () => {
            const i = list.indexOf(id);
            if (cb.checked && i < 0) list.push(id); else if (!cb.checked && i >= 0) list.splice(i, 1);
            changed(); draw();
          });
          return h("label", { class: `alg-opt ${list.includes(id) ? "is-on" : ""}` }, cb, h("span", { "aria-hidden": "true" }, icon), name);
        })));
    };
    const draw = () => {
      box.innerHTML = "";
      const reviewed = Array.isArray(obj.allergens);
      const cb = h("input", { type: "checkbox", checked: reviewed });
      cb.addEventListener("change", () => {
        if (cb.checked) { obj.allergens = []; obj.traces = obj.traces || []; }
        else {
          if ((obj.allergens || []).length && !confirm("¿Quitar los alérgenos marcados de este producto?")) { cb.checked = true; return; }
          delete obj.allergens; delete obj.traces;
        }
        changed(); draw();
      });
      box.append(h("label", { class: "toggle" }, cb, h("span", { class: "toggle__ui" }),
        h("span", { class: "toggle__text" }, "He revisado los alérgenos de este producto",
          h("small", {}, reviewed ? "Se muestran en la tarjeta y el producto puede salir en los filtros «Sin gluten», «Sin leche»…"
            : "Mientras no lo marques, no se muestra nada y el producto nunca sale en los filtros «Sin…»."))));
      if (!reviewed) return;
      const hasTr = (obj.traces || []).length > 0;
      box.append(grid("allergens", "Lleva (como ingrediente):"),
        h("details", { class: "alg-traces", open: hasTr }, h("summary", {}, `Puede contener trazas de… ${hasTr ? `(${obj.traces.length})` : "(opcional)"}`), grid("traces", "Marca solo las que queráis avisar expresamente:")),
        h("p", { class: "field__help" }, (obj.allergens || []).length || (obj.traces || []).length ? "" : "Si no marcas ninguno, en la web pondrá «Sin ninguno de los 14 alérgenos principales». Asegúrate de que es así."));
    };
    draw();
    return h("div", { class: "field" }, h("span", { class: "field__label" }, f.label), box);
  }

  /* ---------- Horario ---------- */
  function renderSchedule(f, obj) {
    const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const sch = obj[f.key] || (obj[f.key] = []);
    for (let i = 0; i < 7; i++) sch[i] = sch[i] || { open: "", close: "" };
    const table = h("div", { class: "schedule" });
    const draw = () => {
      table.innerHTML = "";
      sch.forEach((d, i) => {
        const closed = !d.open || !d.close;
        const o = h("input", { type: "time", value: d.open, disabled: closed });
        const c = h("input", { type: "time", value: d.close, disabled: closed });
        o.addEventListener("input", () => { d.open = o.value; changed(); });
        c.addEventListener("input", () => { d.close = c.value; changed(); });
        const cb = h("input", { type: "checkbox", checked: !closed });
        cb.addEventListener("change", () => {
          if (cb.checked) { const prev = sch.find((x) => x.open && x.close) || { open: "08:00", close: "14:00" }; d.open = prev.open; d.close = prev.close; }
          else { d.open = ""; d.close = ""; }
          draw(); changed();
        });
        table.append(h("div", { class: `schedule__row ${closed ? "is-closed" : ""}` },
          h("label", { class: "schedule__day" }, cb, DAYS[i]),
          closed ? h("span", { class: "schedule__closed" }, "Cerrado") : h("span", { class: "schedule__times" }, o, "a", c)));
      });
      table.append(h("button", { type: "button", class: "btn btn--small btn--ghost", onclick: () => {
        const mon = sch[0];
        for (let i = 1; i < 6; i++) sch[i] = { ...mon };
        draw(); changed();
      } }, "Copiar el horario del lunes al resto de la semana (hasta el sábado)"));
    };
    draw();
    return h("div", { class: "field" }, h("span", { class: "field__label" }, f.label), table,
      h("span", { class: "field__help" }, "Marca los días que abrís. Si un día hacéis horario partido, poned la hora de apertura y la de cierre."));
  }

  /* =========================================================
     BLOG
     ========================================================= */
  const blogData = () => state.content.blog || (state.content.blog = { show: true, homeCount: 3, posts: [] });
  const today = () => new Date().toISOString().slice(0, 10);
  const slugify = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "entrada";
  const uniqueSlug = (base, id) => {
    const used = new Set(blogData().posts.filter((p) => p.id !== id).map((p) => p.slug));
    let s = base, n = 2;
    while (used.has(s)) s = `${base}-${n++}`;
    return s;
  };
  const fmtDate = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "Sin fecha";
  const CATS = ["Noticia", "Anuncio", "Aviso", "Evento", "Receta"];

  function createPost() {
    const id = "p" + Date.now().toString(36);
    blogData().posts.unshift({ id, slug: "", title: "", category: "Noticia", date: today(), cover: "", excerpt: "", body: "", published: false, pinned: false });
    changed();
    openPost(id);
    renderNav();
    setTimeout(() => $(".input-title")?.focus(), 50);
  }

  function openPost(id) {
    state.blogPost = id;
    renderEditor();
    $("#editor").scrollTop = 0;
  }

  function renderBlogList(ed, sec) {
    const B = blogData();
    const posts = [...B.posts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.date).localeCompare(String(a.date)));
    const newPost = createPost;
    const search = h("input", { type: "search", class: "list__search", placeholder: "Buscar noticia…" });
    const list = h("div", { class: "posts" });
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      list.innerHTML = "";
      const shown = posts.filter((p) => !q || `${p.title} ${p.category}`.toLowerCase().includes(q));
      if (!shown.length) list.append(h("p", { class: "muted empty-note" }, B.posts.length ? "No hay noticias con ese texto." : "Aún no hay noticias. ¡Crea la primera!"));
      shown.forEach((p) => list.append(h("button", { type: "button", class: `post-row ${p.published === false ? "is-draft" : ""}`, onclick: () => openPost(p.id) },
        h("span", { class: "item__thumb" }, p.cover ? h("img", { src: p.cover, alt: "" }) : ""),
        h("span", { class: "post-row__main" },
          h("strong", {}, p.title || "Sin título"),
          h("small", {}, [p.category, fmtDate(p.date)].filter(Boolean).join(" · "))),
        h("span", { class: "post-row__badges" },
          p.pinned ? h("span", { class: "badge badge--gold" }, "Destacada") : "",
          ...["va", "en"].map((l) => h("span", { class: `tr-dot tr-dot--static ${p["title_" + l] && p["body_" + l] ? "is-done" : ""}`, title: p["title_" + l] && p["body_" + l] ? `Traducida al ${l === "va" ? "valenciano" : "inglés"}` : `Sin traducir al ${l === "va" ? "valenciano" : "inglés"} (se verá en castellano)` }, LANG_FLAG[l])),
          h("span", { class: `badge ${p.published === false ? "badge--draft" : "badge--ok"}` }, p.published === false ? "Borrador" : "Publicada")),
        h("span", { class: "post-row__go", "aria-hidden": "true" }, "›"))));
    };
    search.addEventListener("input", draw);
    draw();
    ed.append(
      h("div", { class: "list__tools" }, search, h("button", { type: "button", class: "btn btn--add", onclick: newPost }, "+ Nueva noticia")),
      list,
      h("div", { class: "blog-settings" }, h("h2", { class: "subhead" }, "Ajustes del blog"), renderFields(sec.fields, B, "blog")));
  }

  function renderPostEditor(ed) {
    const B = blogData();
    const post = B.posts.find((p) => p.id === state.blogPost);
    if (!post) { state.blogPost = null; return renderEditor(); }
    const back = h("button", { type: "button", class: "back-link", onclick: () => { state.blogPost = null; renderEditor(); } }, "← Todas las noticias");

    const statusBox = h("div", { class: "post-status" });
    const drawStatus = () => {
      statusBox.className = `post-status ${post.published === false ? "is-draft" : "is-live"}`;
      statusBox.innerHTML = "";
      statusBox.append(
        h("div", {}, h("strong", {}, post.published === false ? "Borrador" : "Publicada"),
          h("span", {}, post.published === false ? "No se ve en la web hasta que la publiques y guardes." : "Visible en la web al guardar los cambios.")),
        h("button", { type: "button", class: `btn btn--small ${post.published === false ? "btn--primary" : ""}`, onclick: () => {
          post.published = post.published === false;
          drawStatus(); changed(); renderNav();
          if (post.published) toast("Lista para publicar. Pulsa «Guardar cambios» para que aparezca en la web.");
        } }, post.published === false ? "Publicar" : "Pasar a borrador"));
    };
    drawStatus();

    // Título (actualiza la dirección mientras no se haya cambiado a mano)
    const L = state.lang, sfx = L === "es" ? "" : "_" + L;
    const titleInput = h("input", { type: "text", class: "input-title", value: post["title" + sfx] || "", placeholder: sfx ? short(post.title, 90) || "Título de la noticia" : "Título de la noticia" });
    const slugInput = h("input", { type: "text", value: post.slug });
    const slugPreview = h("span", { class: "field__help" });
    const drawSlug = () => { slugPreview.textContent = `Dirección: ${location.origin}/blog/${post.slug || "…"}`; };
    titleInput.addEventListener("input", () => {
      if (sfx) { if (titleInput.value.trim()) post["title" + sfx] = titleInput.value; else delete post["title" + sfx]; changed(); return; }
      post.title = titleInput.value;
      if (!post.slugEdited) { post.slug = uniqueSlug(slugify(post.title), post.id); slugInput.value = post.slug; drawSlug(); }
      changed();
    });
    slugInput.addEventListener("input", () => { post.slugEdited = true; post.slug = slugify(slugInput.value); drawSlug(); changed(); });
    slugInput.addEventListener("change", () => { post.slug = uniqueSlug(slugify(slugInput.value), post.id); slugInput.value = post.slug; drawSlug(); changed(); });
    drawSlug();

    // Categoría con sugerencias
    const listId = "cats-" + post.id;
    const usedCats = [...new Set([...CATS, ...B.posts.map((p) => p.category).filter(Boolean)])];
    const catInput = h("input", { type: "text", value: post["category" + sfx] || "", list: sfx ? null : listId, placeholder: sfx ? post.category || "" : "Noticia, Anuncio, Aviso…" });
    catInput.addEventListener("input", () => { if (sfx && !catInput.value.trim()) delete post["category" + sfx]; else post["category" + sfx] = catInput.value; changed(); });
    const flag = () => (sfx ? h("span", { class: `tr-badge tr-badge--${L}` }, LANG_FLAG[L]) : "");

    ed.append(
      back,
      h("div", { class: "editor__head" }, h("h1", {}, post.title ? "Editar noticia" : "Nueva noticia")),
      statusBox,
      h("label", { class: `field ${sfx ? "field--tr" : ""}` }, h("span", { class: "field__label" }, "Título", flag()), titleInput,
        sfx && post.title ? h("span", { class: "field__orig" }, h("b", {}, "En castellano: "), post.title) : ""),
      h("div", { class: "row" },
        h("label", { class: `field ${sfx ? "field--tr" : ""}` }, h("span", { class: "field__label" }, "Tipo", flag()), catInput,
          h("datalist", { id: listId }, usedCats.map((c) => h("option", { value: c })))),
        renderField({ key: "date", label: "Fecha", type: "date", small: true }, post, "post")),
      renderField({ key: "pinned", label: "Destacar", type: "toggle", help: "Sale la primera y más grande en el blog y en la portada." }, post, "post"),
      renderField({ key: "cover", label: "Foto de portada", type: "image", ratio: "wide", maxSize: 2000 }, post, "post"),
      renderField({ key: "excerpt", label: "Resumen", type: "textarea", rows: 2, help: "Una o dos frases para la tarjeta. Si lo dejas vacío se usa el principio del texto." }, post, "post"),
      h("div", { class: `field ${sfx ? "field--tr" : ""}` }, h("span", { class: "field__label" }, "Texto de la noticia", flag()), richEditor(post, "body" + sfx),
        sfx && !post["body" + sfx] && post.body ? h("button", { type: "button", class: "btn btn--small btn--ghost copy-es", onclick: () => { post["body" + sfx] = post.body; changed(); renderEditor(); } }, "Copiar el texto en castellano para traducirlo encima") : "",
        h("span", { class: "field__help" }, "Selecciona texto para ponerlo en negrita, hacer un título, una lista o un enlace. Con el botón de imagen puedes meter fotos dentro del texto.")),
      h("details", { class: "group" }, h("summary", {}, "Opciones avanzadas"),
        h("div", { class: "group__body" },
          h("label", { class: "field" }, h("span", { class: "field__label" }, "Dirección de la noticia"), slugInput, slugPreview),
          h("button", { type: "button", class: "btn btn--danger", onclick: () => {
            if (!confirm(`¿Borrar la noticia «${post.title || "sin título"}»? Podrás recuperarla desde Copias de seguridad si ya estaba guardada.`)) return;
            B.posts.splice(B.posts.indexOf(post), 1);
            state.blogPost = null; changed(); renderEditor(); renderNav();
            toast("Noticia borrada. Pulsa «Guardar cambios» para aplicarlo.");
          } }, "Borrar esta noticia"))),
    );
  }

  /* =========================================================
     TEXTOS LEGALES
     ========================================================= */
  const legalData = () => state.content.legal || (state.content.legal = { pages: [] });
  function renderLegalList(ed) {
    const L = legalData();
    ed.append(
      h("p", { class: "lead" }, "Son las páginas enlazadas en el pie de la web. Están redactadas con un modelo base: revísalas (o que las revise vuestro asesor) y completa los datos del titular en «Datos generales»."),
      h("div", { class: "posts" }, L.pages.map((p) => h("button", { type: "button", class: "post-row", onclick: () => { state.legalPage = p.id; renderEditor(); $("#editor").scrollTop = 0; } },
        h("span", { class: "legal-icon", "aria-hidden": "true" }, "§"),
        h("span", { class: "post-row__main" }, h("strong", {}, p.title || "Sin título"), h("small", {}, `/legal/${p.slug}`)),
        /\{\{\s*(titular|nif)\s*\}\}/.test(p.body) && (!state.content.general.legalName || !state.content.general.taxId)
          ? h("span", { class: "badge badge--draft" }, "Faltan datos") : h("span", { class: "badge badge--ok" }, "Lista"),
        h("span", { class: "post-row__go", "aria-hidden": "true" }, "›")))),
      h("button", { type: "button", class: "btn btn--add", onclick: () => {
        const id = "l" + Date.now().toString(36);
        L.pages.push({ id, slug: "", title: "", label: "", body: "", autoSlug: true });
        state.legalPage = id; changed(); renderEditor();
      } }, "+ Añadir otra página legal"));
  }
  function renderLegalEditor(ed) {
    const L = legalData();
    const page = L.pages.find((p) => p.id === state.legalPage);
    if (!page) { state.legalPage = null; return renderEditor(); }
    const LG = state.lang, sfx = LG === "es" ? "" : "_" + LG;
    const flag = () => (sfx ? h("span", { class: `tr-badge tr-badge--${LG}` }, LANG_FLAG[LG]) : "");
    const titleInput = h("input", { type: "text", class: "input-title", value: page["title" + sfx] || "", placeholder: sfx ? page.title || "" : "Título de la página" });
    titleInput.addEventListener("input", () => {
      if (sfx) { if (titleInput.value.trim()) page["title" + sfx] = titleInput.value; else delete page["title" + sfx]; changed(); return; }
      page.title = titleInput.value;
      if (page.autoSlug) page.slug = slugify(page.title); // solo en páginas nuevas: las existentes mantienen su dirección
      changed();
    });
    const tokens = ["titular", "nif", "direccion", "email", "telefono", "web"];
    ed.append(
      h("button", { type: "button", class: "back-link", onclick: () => { state.legalPage = null; renderEditor(); } }, "← Todos los textos legales"),
      h("div", { class: "editor__head" }, h("h1", {}, page.title || "Nueva página")),
      h("label", { class: `field ${sfx ? "field--tr" : ""}` }, h("span", { class: "field__label" }, "Título", flag()), titleInput),
      renderField({ key: "label", label: "Texto del enlace en el pie", type: "text", placeholder: "Política de cookies", help: "Si lo dejas vacío, se usa el título." }, page, "legal"),
      h("div", { class: `field ${sfx ? "field--tr" : ""}` }, h("span", { class: "field__label" }, "Texto", flag()), richEditor(page, "body" + sfx),
        sfx && !page["body" + sfx] && page.body ? h("button", { type: "button", class: "btn btn--small btn--ghost copy-es", onclick: () => { page["body" + sfx] = page.body; changed(); renderEditor(); } }, "Copiar el texto en castellano para traducirlo encima") : "",
        h("span", { class: "field__help" }, "Puedes escribir estas palabras entre llaves y se sustituyen solas por los datos reales: ",
          ...tokens.map((t) => h("code", {}, `{{${t}}}`)))),
      page.id.startsWith("l") && !["l1", "l2", "l3", "l4"].includes(page.id)
        ? h("button", { type: "button", class: "btn btn--danger", onclick: () => {
            if (!confirm(`¿Borrar la página «${page.title || "sin título"}»?`)) return;
            L.pages.splice(L.pages.indexOf(page), 1); state.legalPage = null; changed(); renderEditor();
          } }, "Borrar esta página") : "",
    );
  }

  // Editor de texto enriquecido (Quill)
  function richEditor(post, key = "body") {
    const wrapEl = h("div", { class: "rich" });
    const area = h("div", {});
    wrapEl.append(area);
    if (!window.Quill) { wrapEl.append(h("p", { class: "muted" }, "No se ha podido cargar el editor.")); return wrapEl; }
    const quill = new Quill(area, {
      theme: "snow",
      placeholder: "Escribe aquí la noticia…",
      modules: {
        toolbar: {
          container: [[{ header: [2, 3, false] }], ["bold", "italic", "underline", "strike"], [{ list: "ordered" }, { list: "bullet" }], ["blockquote", "link", "image"], [{ align: [] }], ["clean"]],
          handlers: {
            image: () => {
              const input = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp,image/gif" });
              input.addEventListener("change", async () => {
                const file = input.files[0];
                if (!file) return;
                const range = quill.getSelection(true) || { index: quill.getLength() };
                const t = h("div", { class: "toast is-in" }, "Subiendo foto…");
                $("#toasts").append(t);
                try {
                  const blob = await prepareImage(file, 1600);
                  const { url } = await api("/api/upload", { method: "POST", headers: { "X-File-Type": blob.type, "Content-Type": "application/octet-stream" }, body: blob });
                  quill.insertEmbed(range.index, "image", url, "user");
                  quill.setSelection(range.index + 1, 0, "silent");
                } catch (e) { toast("No se ha podido subir la foto: " + e.message, "error", 6000); }
                t.remove();
              });
              input.click();
            },
          },
        },
      },
    });
    if (post[key]) quill.clipboard.dangerouslyPasteHTML(post[key], "silent");
    quill.on("text-change", (_d, _o, source) => {
      if (source !== "user") return;
      const empty = quill.getText().trim() === "" && !quill.root.querySelector("img");
      const html = empty ? "" : quill.getSemanticHTML().replace(/&nbsp;/g, " ");
      if (key !== "body" && !html) delete post[key]; else post[key] = html;
      changed();
    });
    // Ayudas en español para los botones
    const tips = { "ql-bold": "Negrita", "ql-italic": "Cursiva", "ql-underline": "Subrayado", "ql-strike": "Tachado", "ql-blockquote": "Cita", "ql-link": "Enlace", "ql-image": "Insertar foto", "ql-clean": "Quitar formato", "ql-header": "Tipo de texto", "ql-align": "Alineación" };
    $$(".ql-toolbar button, .ql-toolbar .ql-picker", wrapEl).forEach((b) => {
      const cls = [...b.classList].find((c) => tips[c]);
      if (cls) b.title = tips[cls];
      if (b.classList.contains("ql-list")) b.title = b.value === "ordered" ? "Lista numerada" : "Lista con puntos";
    });
    return wrapEl;
  }

  /* =========================================================
     DISEÑO Y COLORES
     ========================================================= */
  const ORIGINAL = { primary: "#561c24", accent: "#c8a67e", background: "#fffaf4", text: "#2a1a1c" };
  const PALETTES = [
    { name: "Original Forn Almenar", colors: ORIGINAL },
    { name: "Chocolate", colors: { primary: "#4a2c1d", accent: "#d4a373", background: "#fdf8f1", text: "#2b1d14" } },
    { name: "Verde oliva", colors: { primary: "#3f4a32", accent: "#c9a86a", background: "#fbf9f3", text: "#22261c" } },
    { name: "Azul noche", colors: { primary: "#1f2a44", accent: "#d8b26e", background: "#f8f7f3", text: "#1b1f2a" } },
    { name: "Rosa pastelería", colors: { primary: "#8c3b52", accent: "#e2ab95", background: "#fff8f6", text: "#3a1f27" } },
    { name: "Terracota", colors: { primary: "#9a3f22", accent: "#e0b062", background: "#fffaf2", text: "#2e1a12" } },
  ];
  const FONT_SETS = [
    ["clasica", "Clásica (la original)", "'Big Shoulders Display', Impact, sans-serif", "Fraunces, Georgia, serif"],
    ["elegante", "Elegante", "'Playfair Display', Georgia, serif", "'Cormorant Garamond', Georgia, serif"],
    ["moderna", "Moderna", "'Archivo Black', Impact, sans-serif", "'Instrument Serif', Georgia, serif"],
    ["artesana", "Artesana", "'Bricolage Grotesque', sans-serif", "Caveat, cursive"],
  ];
  const SECTION_NAMES = { hero: "Portada", marquee: "Cinta de lemas", intro: "Sobre nosotros", featured: "Destacados", products: "Productos",
    blog: "Novedades (blog)", cta: "Banner con foto", tour: "Visita el horno", workshop: "Obrador", team: "Equipo", history: "Nuestra historia", stores: "Dónde estamos" };
  const DEFAULT_ORDER = ["hero", "marquee", "intro", "featured", "products", "blog", "cta", "tour", "workshop", "team", "history", "stores"];
  const DEFAULT_TONE = { marquee: "Dorado", intro: "Claro", featured: "Crema", products: "Claro", blog: "Claro", tour: "Oscuro", workshop: "Oscuro", team: "Claro", history: "Crema", stores: "Claro" };
  const NAV_TR = {
    va: { hero: "Inici", products: "Productes", blog: "Novetats", history: "La nostra història", workshop: "Obrador", stores: "On som" },
    en: { hero: "Home", products: "Products", blog: "News", history: "Our story", workshop: "Bakehouse", stores: "Find us" },
  };
  const NAV_ITEMS = [["hero", "Inicio"], ["products", "Productos"], ["blog", "Novedades"], ["history", "Nuestra historia"], ["workshop", "Obrador"], ["stores", "Dónde estamos"]];

  // Contraste (WCAG) entre dos colores
  const lum = (hx) => { const c = (hx || "").replace("#", ""); if (c.length !== 6) return 1;
    return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0); };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

  function renderDesign(ed) {
    const D = state.content.design || (state.content.design = {});
    const colors = () => ({ ...ORIGINAL, ...(D.colors || {}) });
    const redraw = () => { const y = $("#editor").scrollTop; renderEditor(); $("#editor").scrollTop = y; renderNav(); };
    const update = (fn, rerender = false) => { fn(); changed(); if (rerender) redraw(); };

    ed.append(h("p", { class: "lead" }, "Cambia el aspecto de la web sin tocar los textos. Lo ves al momento en la vista previa; no se publica hasta que pulses «Guardar cambios»."));

    /* --- Paletas --- */
    const cur = colors();
    const isSame = (p) => Object.keys(ORIGINAL).every((k) => p.colors[k].toLowerCase() === (cur[k] || "").toLowerCase());
    ed.append(h("section", { class: "dgroup" },
      h("h2", { class: "subhead" }, "Colores"),
      h("p", { class: "field__help" }, "Elige una combinación lista o ajusta cada color a tu gusto."),
      h("div", { class: "palettes" }, PALETTES.map((p) => h("button", {
        type: "button", class: `palette ${isSame(p) ? "is-active" : ""}`,
        onclick: () => update(() => { D.colors = p.id === "x" ? {} : { ...p.colors }; if (p.colors === ORIGINAL) delete D.colors; }, true),
      }, h("span", { class: "palette__sw" }, ...["primary", "accent", "background", "text"].map((k) => h("i", { style: `background:${p.colors[k]}` }))), h("span", {}, p.name)))),
      h("div", { class: "colors" }, [
        ["primary", "Color principal", "Botones, títulos, cabecera del pie y fondos oscuros."],
        ["accent", "Color de acento", "Detalles dorados, antetítulos, la cinta de lemas."],
        ["background", "Fondo", "El fondo claro de la web (los tonos crema salen de aquí)."],
        ["text", "Texto", "El color del texto normal."],
      ].map(([k, label, help]) => {
        const val = cur[k];
        const pick = h("input", { type: "color", value: val, "aria-label": label });
        const txt = h("input", { type: "text", value: val, maxlength: 7, class: "color-hex" });
        const setVal = (v) => { if (!/^#[0-9a-f]{6}$/i.test(v)) return; D.colors = { ...colors(), [k]: v.toLowerCase() }; pick.value = v; txt.value = v; changed(); checkContrast(); };
        pick.addEventListener("input", () => setVal(pick.value));
        pick.addEventListener("change", () => renderNav());
        txt.addEventListener("change", () => setVal(txt.value.trim().startsWith("#") ? txt.value.trim() : "#" + txt.value.trim()));
        return h("label", { class: "color-field" }, h("span", { class: "color-field__pick" }, pick),
          h("span", { class: "color-field__text" }, h("strong", {}, label), h("small", {}, help)), txt);
      })),
    ));
    const warn = h("p", { class: "contrast-warn", hidden: true });
    ed.lastChild.append(warn);
    function checkContrast() {
      const c = colors(); const msgs = [];
      if (contrast(c.text, c.background) < 4.5) msgs.push("el texto se lee mal sobre el fondo");
      if (contrast(c.primary, c.background) < 3) msgs.push("el color principal se distingue poco del fondo");
      if (contrast(c.primary, "#f7f0e7") < 4) msgs.push("los textos claros sobre el color principal se leerán mal (prueba un tono más oscuro)");
      warn.hidden = !msgs.length;
      warn.textContent = msgs.length ? "⚠️ Ojo: " + msgs.join("; ") + "." : "";
    }
    checkContrast();

    /* --- Tipografía --- */
    ed.append(h("section", { class: "dgroup" },
      h("h2", { class: "subhead" }, "Tipo de letra"),
      h("div", { class: "fonts" }, FONT_SETS.map(([id, name, display, serif]) => h("button", {
        type: "button", class: `font-opt ${(D.fonts || "clasica") === id ? "is-active" : ""}`,
        onclick: () => update(() => { if (id === "clasica") delete D.fonts; else D.fonts = id; }, true),
      }, h("span", { class: "font-opt__title", style: `font-family:${display}` }, "Forn Almenar"),
        h("span", { class: "font-opt__accent", style: `font-family:${serif};font-style:italic` }, "desde 1952"),
        h("small", {}, name)))),
      renderField({ key: "titleUpper", label: "Títulos en MAYÚSCULAS", type: "toggle" }, D, "design"),
    ));
    // Carga las fuentes en el panel para que se vean las muestras
    if (!$("#admin-font-samples")) document.head.append(h("link", { id: "admin-font-samples", rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@900&family=Fraunces:ital@1&family=Playfair+Display:wght@800&family=Cormorant+Garamond:ital,wght@1,600&family=Archivo+Black&family=Instrument+Serif:ital@1&family=Bricolage+Grotesque:wght@800&family=Caveat:wght@700&display=swap" }));

    /* --- Estilo --- */
    const dim = h("input", { type: "range", min: 20, max: 120, step: 5, value: D.heroDim ?? 100 });
    const dimOut = h("output", {}, `${D.heroDim ?? 100}%`);
    dim.addEventListener("input", () => { D.heroDim = Number(dim.value); if (D.heroDim === 100) delete D.heroDim; dimOut.textContent = `${dim.value}%`; changed(); });
    ed.append(h("section", { class: "dgroup" },
      h("h2", { class: "subhead" }, "Estilo"),
      h("div", { class: "row" },
        renderField({ key: "radius", label: "Esquinas de fotos y tarjetas", type: "select", options: () => [["", "Redondeadas"], ["suaves", "Suaves"], ["rectas", "Rectas"]] }, D, "design"),
        renderField({ key: "buttons", label: "Forma de los botones", type: "select", options: () => [["", "Redondos"], ["rectos", "Rectangulares"]] }, D, "design")),
      h("label", { class: "field" }, h("span", { class: "field__label" }, "Oscurecer las fotos con texto encima (portada y banner)"),
        h("div", { class: "range" }, h("small", {}, "Más luz"), dim, h("small", {}, "Más oscuro"), dimOut),
        h("span", { class: "field__help" }, "Si bajas mucho, el texto blanco puede leerse peor sobre fotos claras.")),
    ));

    /* --- Secciones: orden, visibilidad y fondo --- */
    const order = () => {
      const o = [...new Set((D.order || []).filter((k) => DEFAULT_ORDER.includes(k)))];
      DEFAULT_ORDER.forEach((k, i) => { if (o.includes(k)) return; const prev = DEFAULT_ORDER.slice(0, i).reverse().find((p) => o.includes(p)); o.splice(prev ? o.indexOf(prev) + 1 : 0, 0, k); });
      return o;
    };
    const tones = D.tones || {};
    const list = h("div", { class: "sec-order" });
    order().forEach((k, i, arr) => {
      const sec = state.content[k] || {};
      const fixed = k === "hero";
      const move = (d) => update(() => { const o = order(); const j = i + d; if (j < 1 || j >= o.length) return; [o[i], o[j]] = [o[j], o[i]]; D.order = o; }, true);
      const vis = h("input", { type: "checkbox", checked: sec.show !== false });
      vis.addEventListener("change", () => update(() => { (state.content[k] = state.content[k] || {}).show = vis.checked; }, true));
      const toneSel = h("select", { "aria-label": "Fondo" },
        h("option", { value: "" }, `Fondo: ${DEFAULT_TONE[k] || "foto"} (original)`),
        ...[["light", "Fondo claro"], ["cream", "Fondo crema"], ["dark", "Fondo oscuro"]].map(([v, l]) => h("option", { value: v, selected: tones[k] === v }, l)));
      toneSel.addEventListener("change", () => update(() => { D.tones = { ...(D.tones || {}), [k]: toneSel.value }; if (!toneSel.value) delete D.tones[k]; }));
      list.append(h("div", { class: `sec-row ${sec.show === false ? "is-off" : ""}` },
        h("label", { class: "sec-row__vis", title: "Mostrar u ocultar" }, vis, h("span", { class: "toggle__ui" })),
        h("span", { class: "sec-row__name" }, SECTION_NAMES[k], fixed ? h("small", {}, "siempre arriba") : ""),
        ["hero", "cta"].includes(k) ? h("span", { class: "sec-row__tone muted" }, "Fondo: su foto") : toneSel,
        h("span", { class: "item__controls" },
          h("button", { type: "button", class: "icon-btn", title: "Subir", disabled: fixed || i <= 1, onclick: () => move(-1) }, "↑"),
          h("button", { type: "button", class: "icon-btn", title: "Bajar", disabled: fixed || i === arr.length - 1, onclick: () => move(1) }, "↓"))));
    });
    ed.append(h("section", { class: "dgroup" },
      h("h2", { class: "subhead" }, "Secciones de la portada"),
      h("p", { class: "field__help" }, "Cambia el orden con las flechas, enciende o apaga cada sección y elige su color de fondo."),
      list));

    /* --- Menú --- */
    const nav = D.nav || {};
    ed.append(h("section", { class: "dgroup" },
      h("h2", { class: "subhead" }, "Textos del menú"),
      h("p", { class: "field__help" }, state.lang === "es" ? "Los nombres de los enlaces de arriba. Déjalo vacío para usar el original."
        : `Nombres del menú en ${state.lang === "va" ? "valenciano" : "inglés"}. Si lo dejas vacío, se usa la traducción de siempre.`),
      h("div", { class: "nav-labels" }, NAV_ITEMS.map(([k, def]) => {
        const nk = state.lang === "es" ? k : `${k}_${state.lang}`;
        const inp = h("input", { type: "text", value: nav[nk] || "", placeholder: state.lang === "es" ? def : NAV_TR[state.lang][k] });
        inp.addEventListener("input", () => { D.nav = { ...(D.nav || {}), [nk]: inp.value }; if (!inp.value.trim()) delete D.nav[nk]; changed(); });
        return h("label", { class: "field" }, h("span", { class: "field__label" }, def, state.lang === "es" ? "" : h("span", { class: `tr-badge tr-badge--${state.lang}` }, LANG_FLAG[state.lang])), inp);
      }))));

    /* --- Restaurar --- */
    ed.append(h("section", { class: "dgroup dgroup--reset" },
      h("div", {}, h("strong", {}, "¿Quieres volver al diseño de siempre?"),
        h("span", {}, "Restaura colores, letras, estilo, orden, fondos y textos del menú. Los textos, fotos y productos no se tocan.")),
      h("button", { type: "button", class: "btn btn--danger", onclick: () => {
        if (!confirm("¿Volver al diseño original de la web?")) return;
        update(() => { delete state.content.design; }, true);
        toast("Diseño original restaurado. Pulsa «Guardar cambios» para publicarlo.");
      } }, "Restaurar diseño original")));
  }

  /* ---------- Copias de seguridad ---------- */
  async function renderBackups(ed) {
    const box = h("div", { class: "backups" }, h("p", { class: "muted" }, "Cargando copias…"));
    ed.append(
      h("p", { class: "lead" }, "Cada vez que guardas, se crea una copia automática. Si algo sale mal, puedes volver a cualquiera de las últimas 30 versiones."),
      h("div", { class: "backups__actions" },
        h("button", { class: "btn btn--small btn--ghost", onclick: () => download(state.content, "forn-almenar-contenido.json") }, "Descargar el contenido actual")),
      box);
    try {
      const { items } = await api("/api/history");
      box.innerHTML = "";
      if (!items.length) return box.append(h("p", { class: "muted" }, "Todavía no hay copias. Se crearán al guardar por primera vez."));
      items.forEach((it, i) => {
        const date = parseStamp(it.key);
        box.append(h("div", { class: "backup" },
          h("div", {}, h("strong", {}, date.toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" })), i === 0 ? h("span", { class: "pill" }, "Versión actual") : ""),
          i === 0 ? "" : h("button", { class: "btn btn--small", onclick: async (e) => {
            if (!confirm("Se sustituirá la web por esta versión. (La versión actual también queda guardada como copia.) ¿Continuar?")) return;
            e.target.disabled = true;
            try {
              const { content } = await api("/api/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: it.key }) });
              state.content = content; state.savedJson = JSON.stringify(content);
              updateStatus(); sendPreview(); renderNav(); renderEditor();
              toast("Versión restaurada. La web ya la muestra.");
            } catch (ex) { toast(ex.message, "error"); e.target.disabled = false; }
          } }, "Restaurar")));
      });
    } catch (e) { box.innerHTML = ""; box.append(h("p", { class: "muted" }, "No se han podido cargar las copias: " + e.message)); }
  }
  const parseStamp = (key) => {
    const m = key.match(/(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/);
    return m ? new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}Z`) : new Date();
  };
  const download = (data, name) => {
    const a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })), download: name });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  /* =========================================================
     GUARDAR
     ========================================================= */
  const isDirty = () => state.content && JSON.stringify(state.content) !== state.savedJson;
  function updateStatus() {
    const dirty = isDirty(), st = $("#status");
    st.dataset.state = dirty ? "dirty" : "saved";
    st.textContent = dirty ? "Cambios sin guardar" : "Todo guardado";
    $("#save-btn").disabled = !dirty;
  }
  async function save() {
    if (!isDirty()) return;
    const btn = $("#save-btn");
    btn.disabled = true; const label = btn.innerHTML; btn.textContent = "Guardando…";
    try {
      const json = JSON.stringify(state.content);
      await api("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: state.content }) });
      state.savedJson = json;
      toast("¡Guardado! La web se actualiza en unos segundos.");
    } catch (e) { toast("No se ha podido guardar: " + e.message, "error", 7000); }
    btn.innerHTML = label;
    updateStatus();
  }
  $("#save-btn").addEventListener("click", save);
  addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); } });
  addEventListener("beforeunload", (e) => { if (isDirty()) { e.preventDefault(); e.returnValue = ""; } });

  /* =========================================================
     VISTA PREVIA
     ========================================================= */
  const frame = $("#preview-frame");
  const postPreview = (msg) => frame.contentWindow?.postMessage(msg, location.origin);
  const sendPreview = () => {
    if (state.previewReady && state.content) postPreview({ type: "preview", lang: state.lang, maintenance: state.section === "maintenance", content: state.content, postId: state.section === "blog" ? state.blogPost : null,
      pageId: state.section === "legal" ? (state.legalPage || state.content.legal?.pages?.[0]?.id) : null });
  };
  function setPreviewPath(path) {
    if (state.previewPath === path) return;
    state.previewPath = path; state.previewReady = false;
    frame.src = `${path}?preview=1`;
  }
  let pvTimer;
  const schedulePreview = () => { clearTimeout(pvTimer); pvTimer = setTimeout(sendPreview, 250); };
  addEventListener("message", (e) => {
    if (e.origin === location.origin && e.data?.type === "preview-ready") {
      state.previewReady = true; sendPreview();
      const sec = SECTIONS.find((s) => s.id === state.section);
      if (sec?.anchor && state.previewPath === "/") setTimeout(() => postPreview({ type: "scrollTo", id: sec.anchor }), 300);
    }
  });

  // Escala el iframe para que se vea como en un ordenador real
  const stage = $("#preview-stage");
  function fit() {
    const W = state.device === "mobile" ? 390 : 1280;
    const sw = stage.clientWidth - 32, sh = stage.clientHeight - 32;
    const scale = Math.min(1, sw / W);
    frame.style.width = W + "px";
    frame.style.height = (state.device === "mobile" ? Math.min(844, sh / scale) : sh / scale) + "px";
    frame.style.transform = `scale(${scale})`;
    frame.parentElement.style.setProperty("--fw", W * scale + "px");
    stage.dataset.device = state.device;
  }
  $$(".seg button").forEach((x) => x.classList.toggle("is-active", x.dataset.device === state.device));
  new ResizeObserver(fit).observe(stage);
  $$(".seg button").forEach((b) => b.addEventListener("click", () => {
    $$(".seg button").forEach((x) => x.classList.toggle("is-active", x === b));
    state.device = b.dataset.device; fit();
  }));
  $("#preview-toggle").addEventListener("click", () => { document.body.classList.toggle("show-preview"); setTimeout(fit, 50); });

  /* ---------- Inicio ---------- */
  if (state.token) start(); else showLogin();
})();
