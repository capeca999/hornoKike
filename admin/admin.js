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
        { type: "group", label: "Google y buscadores", fields: [
          { key: "siteTitle", label: "Título de la pestaña", type: "text", help: "Lo que se ve en la pestaña del navegador y en Google." },
          { key: "siteDescription", label: "Descripción para Google", type: "textarea", rows: 3 },
        ]},
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
          itemMeta: (s, c) => [s.price, (c.products.categories.find((x) => x.id === s.cat) || {}).name, s.visible === false ? "Oculto" : ""].filter(Boolean).join(" · "),
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
          { key: "name", label: "Nombre", type: "text" },
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
        { key: "legal", label: "Enlaces legales", type: "list", addLabel: "Añadir enlace", inline: true,
          newItem: () => ({ label: "", url: "" }),
          item: [{ key: "label", label: "Texto", type: "text" }, { key: "url", label: "Enlace", type: "text", placeholder: "https://…" }] },
      ],
    },
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
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, err = $(".login__error", f), btn = $("button", f);
    err.textContent = ""; btn.disabled = true; btn.textContent = "Entrando…";
    try {
      const { token } = await api("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: f.password.value }) });
      state.token = token; sessionStorage.setItem("fa-token", token);
      f.reset();
      start();
    } catch (ex) { err.textContent = ex.message; }
    btn.disabled = false; btn.textContent = "Entrar";
  });

  function logout(expired) {
    state.token = ""; sessionStorage.removeItem("fa-token");
    $("#app").hidden = true; $("#login").hidden = false;
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
        const defaults = await (await fetch("/content/default.json")).json();
        state.content = content || defaults;
        // Si el contenido guardado es de una versión anterior, añade las secciones nuevas
        for (const k of Object.keys(defaults)) if (!(k in state.content)) state.content[k] = defaults[k];
      } catch (e) {
        toast("No se ha podido cargar el contenido: " + e.message, "error", 8000);
        state.content = await (await fetch("/content/default.json")).json();
      }
      state.savedJson = JSON.stringify(state.content);
    }
    const hash = location.hash.slice(1);
    if (SECTIONS.some((s) => s.id === hash)) state.section = hash;
    renderNav(); renderEditor(); updateStatus(); sendPreview();
  }

  /* =========================================================
     NAVEGACIÓN
     ========================================================= */
  function goSection(id) {
    const s = SECTIONS.find((x) => x.id === id);
    state.section = id; state.search = ""; state.blogPost = null;
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
    nav.append(h("p", { class: "nav-label" }, "Contenido de la web"));
    SECTIONS.filter((s) => s.id !== "blog").forEach((s) => {
      if (s.id === "backups") nav.append(h("p", { class: "nav-label" }, "Seguridad"));
      const hidden = state.content[s.id]?.show === false;
      nav.append(h("button", {
        class: `nav-item ${s.id === state.section ? "is-active" : ""} ${hidden ? "is-off" : ""}`,
        onclick: () => goSection(s.id),
      }, h("span", { class: "nav-item__name" }, s.name, hidden ? h("em", {}, "oculta") : ""), h("span", { class: "nav-item__desc" }, s.desc)));
    });
  }
  $("#new-post-btn").addEventListener("click", () => { goSection("blog"); createPost(); });
  $("#menu-btn").addEventListener("click", () => document.body.classList.toggle("menu-open"));

  /* =========================================================
     EDITOR (formularios generados desde el esquema)
     ========================================================= */
  function renderEditor() {
    const sec = SECTIONS.find((s) => s.id === state.section);
    const ed = $("#editor");
    ed.innerHTML = "";
    setPreviewPath(sec.id === "blog" ? (state.blogPost ? "/blog/_preview" : "/blog") : "/");
    if (sec.id === "blog" && state.blogPost) return renderPostEditor(ed);
    ed.append(h("div", { class: "editor__head" }, h("h1", {}, sec.name), h("p", {}, sec.desc)));
    if (sec.id === "blog") return renderBlogList(ed, sec);
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

  function wrap(f, input, extraClass = "") {
    return h("label", { class: `field ${f.small ? "field--small" : ""} ${extraClass}` },
      f.label ? h("span", { class: "field__label" }, f.label) : "",
      input,
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
        const input = h("input", { type: f.type === "number" ? "number" : "text", value: obj[f.key] ?? "", placeholder: f.placeholder || "" });
        input.addEventListener("input", () => { obj[f.key] = f.type === "number" ? Number(input.value) || 0 : input.value; changed(); });
        if (f.rerender) input.addEventListener("change", () => changed({ rerender: true }));
        return wrap(f, input);
      }
      case "textarea": {
        const ta = h("textarea", { rows: f.rows || 3, placeholder: f.placeholder || "" });
        ta.value = obj[f.key] ?? "";
        ta.addEventListener("input", () => { obj[f.key] = ta.value; changed(); });
        return wrap(f, ta);
      }
      case "select": {
        const opts = f.options(state.content);
        const sel = h("select", {}, opts.map(([v, l]) => h("option", { value: v, selected: obj[f.key] === v }, l)));
        if (obj[f.key] && !opts.some(([v]) => v === obj[f.key])) sel.prepend(h("option", { value: obj[f.key], selected: true }, "— Elige una opción —"));
        sel.addEventListener("change", () => { obj[f.key] = sel.value; changed({ rerender: f.key === "cat" }); });
        return wrap(f, sel);
      }
      case "toggle": {
        const cb = h("input", { type: "checkbox", checked: obj[f.key] !== false });
        cb.addEventListener("change", () => { obj[f.key] = cb.checked; changed(); if (f.key === "show") renderNav(); });
        return h("label", { class: `toggle ${f.key === "show" ? "toggle--main" : ""}` }, cb, h("span", { class: "toggle__ui" }),
          h("span", { class: "toggle__text" }, f.label, f.help ? h("small", {}, f.help) : ""));
      }
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
      const det = h("details", { class: `item ${it.visible === false ? "is-off" : ""}`, open: state.open.has(key), "data-search": `${title} ${meta}`.toLowerCase() },
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
    const titleInput = h("input", { type: "text", class: "input-title", value: post.title, placeholder: "Título de la noticia" });
    const slugInput = h("input", { type: "text", value: post.slug });
    const slugPreview = h("span", { class: "field__help" });
    const drawSlug = () => { slugPreview.textContent = `Dirección: ${location.origin}/blog/${post.slug || "…"}`; };
    titleInput.addEventListener("input", () => {
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
    const catInput = h("input", { type: "text", value: post.category || "", list: listId, placeholder: "Noticia, Anuncio, Aviso…" });
    catInput.addEventListener("input", () => { post.category = catInput.value; changed(); });

    ed.append(
      back,
      h("div", { class: "editor__head" }, h("h1", {}, post.title ? "Editar noticia" : "Nueva noticia")),
      statusBox,
      h("label", { class: "field" }, h("span", { class: "field__label" }, "Título"), titleInput),
      h("div", { class: "row" },
        h("label", { class: "field" }, h("span", { class: "field__label" }, "Tipo"), catInput,
          h("datalist", { id: listId }, usedCats.map((c) => h("option", { value: c })))),
        renderField({ key: "date", label: "Fecha", type: "date", small: true }, post, "post")),
      renderField({ key: "pinned", label: "Destacar", type: "toggle", help: "Sale la primera y más grande en el blog y en la portada." }, post, "post"),
      renderField({ key: "cover", label: "Foto de portada", type: "image", ratio: "wide", maxSize: 2000 }, post, "post"),
      renderField({ key: "excerpt", label: "Resumen", type: "textarea", rows: 2, help: "Una o dos frases para la tarjeta. Si lo dejas vacío se usa el principio del texto." }, post, "post"),
      h("div", { class: "field" }, h("span", { class: "field__label" }, "Texto de la noticia"), richEditor(post),
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

  // Editor de texto enriquecido (Quill)
  function richEditor(post) {
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
    if (post.body) quill.clipboard.dangerouslyPasteHTML(post.body, "silent");
    quill.on("text-change", (_d, _o, source) => {
      if (source !== "user") return;
      const empty = quill.getText().trim() === "" && !quill.root.querySelector("img");
      post.body = empty ? "" : quill.getSemanticHTML().replace(/&nbsp;/g, " ");
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
    if (state.previewReady && state.content) postPreview({ type: "preview", content: state.content, postId: state.section === "blog" ? state.blogPost : null });
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
  if (state.token) start(); else $("#login").hidden = false;
})();
