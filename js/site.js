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
  const PAGE = document.body.dataset.page || "home"; // home | blog | post

  /* ---------- La cabecera y el menú están en el HTML. Aquí: marcar "Novedades" y añadir WhatsApp + cookies ---------- */
  if (PAGE !== "home") $$('[data-sec="blog"]').forEach((a) => a.setAttribute("aria-current", "page"));
  document.body.insertAdjacentHTML("beforeend", `
    <a class="wa-float" href="#" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp" data-wa hidden>
      <svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.8L4 20Z"/><path d="M9 9.5c.3 2 2.3 4.2 4.8 4.8l1-1.1 1.6.8c-.2 1.1-1 1.7-2 1.7-3.3-.3-6.4-3.4-6.6-6.6 0-1 .6-1.8 1.7-2l.8 1.6-1.3.8Z" fill="currentColor" stroke="none"/></svg>
    </a>
    <div class="cookies" id="cookies" hidden>
      <p><span data-cookies-text></span> <a href="#" data-cookies-link>Más información</a></p>
      <div><button class="btn btn--small btn--ghost-dark" data-cookies="reject">Rechazar</button><button class="btn btn--small" data-cookies="accept">Aceptar</button></div>
    </div>`);

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
    return isNaN(dt) ? "" : dt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  };
  const stripTags = (html) => { const d = document.createElement("div"); d.innerHTML = String(html || "").replace(/<\/(p|h[1-6]|li|blockquote)>|<br\s*\/?>/gi, " $&"); return (d.textContent || "").replace(/\s+/g, " ").trim(); };
  const excerptOf = (p, n = 150) => p.excerpt || (() => { const t = stripTags(p.body); return t.length > n ? t.slice(0, n).replace(/\s\S*$/, "") + "…" : t; })();
  const postUrl = (p) => `/blog/${encodeURIComponent(p.slug || p.id)}`;
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
      <div class="post-card__img">${img(p.cover, p.title)}${p.pinned ? '<span class="post-card__pin">Destacado</span>' : ""}</div>
      <div class="post-card__body">
        <div class="post-meta">${p.category ? `<span class="post-cat">${esc(p.category)}</span>` : ""}<time datetime="${esc(p.date)}">${fmtDate(p.date)}</time></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(excerptOf(p))}</p>
        <span class="post-card__more">Leer más <span aria-hidden="true">→</span></span>
      </div>
    </a>`;

  const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const groupSchedule = (sch = []) => {
    const out = [];
    sch.forEach((d, i) => {
      const val = d && d.open && d.close ? `${d.open} – ${d.close}` : "Cerrado";
      const last = out[out.length - 1];
      if (last && last.val === val && last.to === i - 1) last.to = i;
      else out.push({ from: i, to: i, val });
    });
    return out.map((g) => ({
      label: g.from === g.to ? DAYS[g.from] + (g.from === 6 ? "s" : "")
        : g.to - g.from === 1 ? `${DAYS[g.from]} y ${DAYS[g.to].toLowerCase()}`
        : `${DAYS[g.from]} a ${DAYS[g.to].toLowerCase()}`,
      val: g.val,
    }));
  };
  const madridNow = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday);
    return { day, min: (+p.hour % 24) * 60 + +p.minute };
  };
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
            <article class="slide ${i === 0 ? "is-active" : ""}" style="--img:url('${esc(sl.image)}')">
              <div class="slide__content">
                ${sl.eyebrow ? `<p class="eyebrow">${esc(sl.eyebrow)}</p>` : ""}
                ${i === 0 ? `<h1>${lines(sl.title)}</h1>` : `<h2 class="h1">${lines(sl.title)}</h2>`}
                ${sl.text ? `<p class="slide__lead">${lines(sl.text)}</p>` : ""}
                ${sl.button ? `<a href="${esc(sl.link || "#productos")}" class="btn btn--light">${esc(sl.button)}</a>` : ""}
              </div>
            </article>`).join("")}
        </div>
        ${(s.slides || []).length > 1 ? `
        <div class="hero__controls">
          <button class="hero__arrow" data-dir="-1" aria-label="Anterior">←</button>
          <div class="hero__dots" role="tablist"></div>
          <button class="hero__arrow" data-dir="1" aria-label="Siguiente">→</button>
        </div>` : ""}
        <a href="#amor" class="hero__scroll" aria-label="Bajar"><span></span></a>
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
      const cats = (s.categories || []).filter((c) => (s.items || []).some((p) => p.visible !== false && p.cat === c.id));
      return `
      <section class="catalog section" id="productos">
        <div class="container">
          ${head(s)}
          ${cats.length > 1 ? `
          <div class="filters reveal" role="tablist" aria-label="Filtrar productos">
            <button class="filter is-active" data-filter="all" role="tab" aria-selected="true">Todo</button>
            ${cats.map((c) => `<button class="filter" data-filter="${esc(c.id)}" role="tab" aria-selected="false">${esc(c.name)}</button>`).join("")}
          </div>` : ""}
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
          <div class="news__more reveal"><a href="/blog" class="btn">Ver todas las novedades</a></div>
        </div>
      </section>`;
    },

    cta: (s) => `
      <section class="cta" id="banner-encargos" style="--img:url('${esc(s.image)}')">
        <div class="container cta__inner reveal">
          ${s.eyebrow ? `<p class="eyebrow">${esc(s.eyebrow)}</p>` : ""}
          <h2>${lines(s.title)}</h2>
          ${s.text ? `<p>${lines(s.text)}</p>` : ""}
          <div class="cta__actions">
            ${s.button ? `<a href="#contacto" class="btn btn--light">${esc(s.button)}</a>` : ""}
            ${C.general.whatsapp ? `<a href="${waLink(C.general.whatsapp)}" class="btn btn--ghost" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>` : ""}
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
            <figure class="reveal" ${delay(i)}>${img(g.image, "Nuestro obrador")}</figure>`).join("")}</div>` : ""}
        </div>
      </section>`,

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

    stores: (s) => `
      <section class="stores section" id="tiendas">
        <div class="container">
          ${head(s)}
          <div class="stores__grid">
            ${(s.items || []).map((st, i) => {
              const open = isOpen(st.schedule);
              return `
              <article class="store reveal" ${delay(i)}>
                <div class="store__head">
                  <h3>${esc(st.name)}</h3>
                  <span class="store__status ${open ? "is-open" : "is-closed"}">${open ? "Abierto ahora" : "Cerrado ahora"}</span>
                </div>
                <p class="store__addr">${lines(st.address)}</p>
                <dl class="hours">${groupSchedule(st.schedule).map((g) => `<div><dt>${g.label}</dt><dd>${g.val}</dd></div>`).join("")}</dl>
                <div class="store__actions">
                  ${st.phone ? `<a href="${telLink(st.phone)}" class="link">${esc(st.phone)}</a>` : ""}
                  ${st.mapsUrl ? `<a href="${esc(st.mapsUrl)}" target="_blank" rel="noopener" class="link">Cómo llegar →</a>` : ""}
                </div>
              </article>`;
            }).join("")}
          </div>
        </div>
      </section>`,

    contact: (s) => {
      const g = C.general;
      const stores = (C.stores?.items || []);
      return `
      <section class="contact section section--cream" id="contacto">
        <div class="container contact__grid">
          <div class="reveal">
            ${s.eyebrow ? `<p class="eyebrow eyebrow--dark">${esc(s.eyebrow)}</p>` : ""}
            <h2>${title(s.title, s.titleAccent)}</h2>
            ${paras(s.text)}
            <ul class="contact__info">
              ${g.phone ? `<li><span>Teléfono</span><a href="${telLink(g.phone)}">${esc(g.phone)}</a></li>` : ""}
              ${g.whatsapp ? `<li><span>WhatsApp</span><a href="${waLink(g.whatsapp)}" target="_blank" rel="noopener">${esc(g.whatsapp)}</a></li>` : ""}
              ${g.email ? `<li><span>Email</span><a href="mailto:${esc(g.email)}">${esc(g.email)}</a></li>` : ""}
            </ul>
          </div>
          <form class="form reveal" id="order-form" novalidate>
            <div class="form__row">
              <label>Nombre<input name="nombre" required autocomplete="name" /></label>
              <label>Teléfono<input name="telefono" type="tel" required autocomplete="tel" /></label>
            </div>
            <div class="form__row">
              <label>Tipo de encargo
                <select name="tipo">${(s.orderTypes || []).map((o) => `<option>${esc(o.text)}</option>`).join("")}</select>
              </label>
              <label>Fecha de recogida<input name="fecha" type="date" required /></label>
            </div>
            ${stores.length > 1 ? `<label>Tienda<select name="tienda">${stores.map((st) => `<option>${esc(st.name)}</option>`).join("")}</select></label>` : ""}
            <label>¿Qué necesitas?<textarea name="mensaje" rows="4" placeholder="Ej.: Tarta de chocolate para 10 personas con «Felicidades Lucía»" required></textarea></label>
            <label class="check"><input type="checkbox" name="privacidad" required /> <span>Acepto la <a href="${esc(C.footer?.legal?.[0]?.url || "#")}">política de privacidad</a></span></label>
            <button class="btn" type="submit">Enviar encargo</button>
            <p class="form__msg" role="status"></p>
          </form>
        </div>
      </section>`;
    },
  };

  const footer = () => {
    const g = C.general, f = C.footer || {};
    const navItems = [["products", "/#productos", "Productos"], ["blog", "/blog", "Novedades"], ["workshop", "/#obrador", "Obrador"], ["history", "/#historia", "Nuestra historia"], ["contact", "/#contacto", "Encargos"]]
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
          <h4>Visítanos</h4>
          <p>${(C.stores?.items || []).map((s) => lines(s.address)).join("<br/>")}</p>
          ${g.phone ? `<p><a href="${telLink(g.phone)}">${esc(g.phone)}</a></p>` : ""}
        </div>
        <div>
          <h4>Navega</h4>
          <ul>${navItems.map(([, h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul>
        </div>
        <div>
          <h4>Aviso legal</h4>
          <ul>${(f.legal || []).map((l) => `<li><a href="${esc(l.url || "#")}">${esc(l.label)}</a></li>`).join("")}</ul>
        </div>
      </div>
      <div class="footer__bottom container">
        <span>© ${new Date().getFullYear()} Forn Almenar · Desde 1952</span>
        <a href="#top">Volver arriba ↑</a>
      </div>`;
  };

  const ORDER = ["hero", "marquee", "intro", "featured", "products", "blog", "cta", "workshop", "history", "stores", "contact"];
  let C = null;

  function render(content, { keepScroll = false } = {}) {
    C = content;
    const y = scrollY;
    const g = C.general || {};
    if (g.siteTitle) document.title = g.siteTitle;
    if (g.siteDescription) $('meta[name="description"]')?.setAttribute("content", g.siteDescription);
    $$("[data-logo]").forEach((el) => (el.src = g.logo || "/img/logo.png"));
    $$("[data-header-btn]").forEach((el) => (el.textContent = g.headerButton || "Haz tu encargo"));
    $$("[data-sec]").forEach((el) => (el.hidden = el.dataset.sec === "blog" ? false : C[el.dataset.sec]?.show === false));
    const wa = $("[data-wa]");
    wa.hidden = !g.whatsapp; wa.href = waLink(g.whatsapp);
    $("[data-cookies-text]").textContent = C.footer?.cookiesText || "";
    $("[data-cookies-link]").href = C.footer?.legal?.[1]?.url || "#";

    if (PAGE === "blog") $("#main").innerHTML = blogPage();
    else if (PAGE === "post") $("#main").innerHTML = postPage();
    else $("#main").innerHTML = ORDER.filter((k) => C[k] && C[k].show !== false && S[k]).map((k) => S[k](C[k])).join("");
    $("#footer").innerHTML = footer();
    initSection();
    if (keepScroll) scrollTo(0, y);
  }

  /* =========================================================
     PÁGINAS DEL BLOG
     ========================================================= */
  let previewPostId = null;
  const siteName = () => (C.general.siteTitle || "Forn Almenar").split("·")[0].trim();

  function blogPage() {
    const B = C.blog || {}, posts = publishedPosts();
    document.title = `${B.pageTitle || "Novedades"} · ${siteName()}`;
    const cats = [...new Set(posts.map((p) => p.category).filter(Boolean))];
    return `
      <section class="page-head">
        <div class="container">
          <p class="eyebrow eyebrow--dark">${esc(siteName())}</p>
          <h1>${esc(B.pageTitle || "Novedades")}</h1>
          ${B.pageIntro ? `<p class="page-head__lead">${lines(B.pageIntro)}</p>` : ""}
        </div>
      </section>
      <section class="blog-list section">
        <div class="container">
          ${cats.length > 1 ? `<div class="filters" role="tablist" aria-label="Filtrar novedades">
            <button class="filter is-active" data-blog-filter="all">Todo</button>
            ${cats.map((c) => `<button class="filter" data-blog-filter="${esc(c)}">${esc(c)}</button>`).join("")}
          </div>` : ""}
          <div class="blog-grid" id="blog-grid">
            ${posts.length ? posts.map((p, i) => postCard(p, i % 3, i === 0)).join("") : `<p class="empty">Todavía no hay novedades. ¡Vuelve pronto!</p>`}
          </div>
        </div>
      </section>`;
  }

  function postPage() {
    const all = (C.blog && C.blog.posts) || [];
    const slug = decodeURIComponent(location.pathname.split("/")[2] || "");
    const p = isPreview && previewPostId ? all.find((x) => x.id === previewPostId)
      : all.find((x) => (x.slug === slug || x.id === slug) && x.published !== false);
    if (!p) {
      document.title = `Noticia no encontrada · ${siteName()}`;
      return `<section class="page-head page-head--center"><div class="container">
        <h1>No encontramos esta noticia</h1><p class="page-head__lead">Puede que se haya movido o ya no esté publicada.</p>
        <a href="/blog" class="btn">Ver todas las novedades</a></div></section>`;
    }
    document.title = `${p.title} · ${siteName()}`;
    $('meta[name="description"]')?.setAttribute("content", excerptOf(p));
    const more = publishedPosts().filter((x) => x.id !== p.id).slice(0, 3);
    const url = location.origin + postUrl(p);
    return `
      <article class="post">
        <header class="post__head container container--narrow">
          <a href="/blog" class="post__back">← Todas las novedades</a>
          <div class="post-meta">${p.category ? `<span class="post-cat">${esc(p.category)}</span>` : ""}<time datetime="${esc(p.date)}">${fmtDate(p.date)}</time><span>· ${readingTime(p.body)} min de lectura</span></div>
          <h1>${esc(p.title)}</h1>
          ${p.excerpt ? `<p class="post__lead">${esc(p.excerpt)}</p>` : ""}
        </header>
        ${p.cover ? `<figure class="post__cover container"><img src="${esc(p.cover)}" alt="${esc(p.title)}" /></figure>` : ""}
        <div class="prose container container--narrow">${sanitize(p.body)}</div>
        <footer class="post__share container container--narrow">
          <span>Compartir</span>
          <a href="${waLink("", p.title + " " + url)}" target="_blank" rel="noopener" class="share-btn">WhatsApp</a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" class="share-btn">Facebook</a>
          <button type="button" class="share-btn" data-copy="${esc(url)}">Copiar enlace</button>
        </footer>
      </article>
      ${more.length ? `
      <section class="news section section--cream">
        <div class="container">
          <header class="section__head"><p class="eyebrow eyebrow--dark">Sigue leyendo</p><h2>Más <em>novedades</em></h2></header>
          <div class="news__grid">${more.map((m, i) => postCard(m, i)).join("")}</div>
        </div>
      </section>` : ""}`;
  }

  /* =========================================================
     INTERACCIÓN
     ========================================================= */
  // Header y menú móvil (una sola vez)
  const header = $(".header");
  const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 40);
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
        b.setAttribute("role", "tab"); b.setAttribute("aria-label", `Diapositiva ${i + 1}`);
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
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "¡Enlace copiado!"; }
      catch { prompt("Copia este enlace:", b.dataset.copy); }
      setTimeout(() => (b.textContent = "Copiar enlace"), 2000);
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

    /* Catálogo */
    const grid = $("#products-grid");
    if (grid) {
      const P = C.products, catName = Object.fromEntries((P.categories || []).map((c) => [c.id, c.name]));
      const items = (P.items || []).filter((p) => p.visible !== false);
      const card = (p) => `
        <article class="product reveal" data-cat="${esc(p.cat)}">
          <div class="product__img">
            ${img(p.image, p.name, 'onerror="this.remove()"')}
            ${p.tag ? `<span class="product__tag">${esc(p.tag)}</span>` : ""}
          </div>
          <div class="product__body">
            ${catName[p.cat] ? `<span class="product__cat">${esc(catName[p.cat])}</span>` : ""}
            <h3>${esc(p.name)}</h3>
            ${p.desc ? `<p>${lines(p.desc)}</p>` : ""}
            <div class="product__foot">
              <strong>${esc(p.price)}</strong>
              ${C.contact?.show !== false ? `<a href="#contacto" class="product__add" data-product="${esc(p.name)}">Encargar +</a>` : ""}
            </div>
          </div>
        </article>`;
      const draw = (f) => {
        grid.innerHTML = (f === "all" ? items : items.filter((p) => p.cat === f)).map(card).join("");
        observe($$(".reveal", grid));
      };
      $$(".filter").forEach((b) => b.addEventListener("click", () => {
        $$(".filter").forEach((x) => { x.classList.remove("is-active"); x.setAttribute("aria-selected", "false"); });
        b.classList.add("is-active"); b.setAttribute("aria-selected", "true");
        draw(b.dataset.filter);
      }));
      grid.addEventListener("click", (e) => {
        const a = e.target.closest(".product__add");
        const form = $("#order-form");
        if (!a || !form) return;
        form.mensaje.value = `Me gustaría encargar: ${a.dataset.product}\nCantidad: `;
        setTimeout(() => form.nombre.focus({ preventScroll: true }), 700);
      });
      draw("all");
    }

    /* Formulario → WhatsApp */
    const form = $("#order-form");
    if (form) {
      const min = new Date(); min.setDate(min.getDate() + (Number(C.contact.minDays) || 0));
      form.fecha.min = min.toISOString().split("T")[0];
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const msg = $(".form__msg", form);
        if (!form.checkValidity()) {
          msg.textContent = "Revisa los campos marcados, por favor.";
          msg.className = "form__msg is-error";
          form.classList.add("was-validated");
          return;
        }
        const f = Object.fromEntries(new FormData(form));
        const text = `Hola, soy ${f.nombre} (${f.telefono}).\nEncargo: ${f.tipo || ""}\nRecogida: ${f.fecha}${f.tienda ? ` en ${f.tienda}` : ""}\n\n${f.mensaje}`;
        const num = C.general.whatsapp;
        if (num) window.open(waLink(num, text), "_blank", "noopener");
        else location.href = `mailto:${C.general.email}?subject=${encodeURIComponent("Encargo web")}&body=${encodeURIComponent(text)}`;
        msg.textContent = "¡Gracias! Te hemos abierto WhatsApp con tu encargo listo para enviar.";
        msg.className = "form__msg is-ok";
        form.reset(); form.classList.remove("was-validated");
      });
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
      const r = await fetch("/api/content");
      if (r.ok) { const d = await r.json(); saved = d && d.content; }
    } catch {}
    const defaults = await defaultsP;
    if (!saved) return defaults;
    // Si lo guardado es de una versión anterior (p. ej. sin blog), completa lo que falte
    for (const k of Object.keys(defaults)) if (!(k in saved)) saved[k] = defaults[k];
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
        render(e.data.content, { keepScroll: !first });
        if (first) { first = false; done(); }
      }
      if (e.data.type === "scrollTo") {
        const el = document.getElementById(e.data.id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else if (e.data.id === "top") scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    parent.postMessage({ type: "preview-ready" }, location.origin);
  } else {
    load().then((c) => { render(c); done(); initCookies(); })
      .catch(() => { document.body.classList.remove("is-loading"); });
  }
})();
