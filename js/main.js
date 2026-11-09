(function () {
  "use strict";
  /* ===== CONFIGURAÇÃO (edite aqui) ===== */
  var WA = "5573988204426";
  var EMAIL = "tupilena90@gmail.com";
  /* Troque pelo link exato da loja no iFood quando tiver (Copiar link no app do iFood): */
  var IFOOD_URL = "https://www.ifood.com.br/busca?q=Marmitex%20Caseira%20Tempero%20Tupinamba";
  var TZ = "America/Bahia";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var waLink = function (txt) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(txt); };
  var mailLink = function (subj, body) { return "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body); };

  /* ===== Hora na Bahia ===== */
  function nowBahia() {
    var p = {};
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: map[p.weekday], min: (+p.hour % 24) * 60 + (+p.minute) };
    } catch (e) { var d = new Date(); return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() }; }
  }
  var params = new URLSearchParams(location.search);
  var T = nowBahia();
  if (params.has("dia")) T.day = +params.get("dia"); /* teste: ?dia=3 */
  if (params.has("min")) T.min = +params.get("min");

  /* ===== Idioma ===== */
  var LANG = "pt";
  var orig = new Map();
  function store(el, key) { if (!orig.has(el)) orig.set(el, {}); var o = orig.get(el); if (!(key in o)) o[key] = key === "html" ? el.innerHTML : el.getAttribute(key); return o[key]; }
  function tr(k) { var d = (window.I18N || {})[LANG] || {}; return d[k] != null ? d[k] : (window.I18N.pt[k]); }
  function applyLang(l) {
    LANG = (l === "en" || l === "es") ? l : "pt";
    var dict = (window.I18N || {})[LANG] || {};
    document.documentElement.lang = LANG === "pt" ? "pt-BR" : LANG;
    $$("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n"), base = store(el, "html");
      el.innerHTML = (LANG !== "pt" && dict[k] != null) ? dict[k] : base;
    });
    $$("[data-i18n-alt]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-alt"), base = store(el, "alt");
      el.setAttribute("alt", (LANG !== "pt" && dict[k] != null) ? dict[k] : base);
    });
    $$("[data-i18n-ph]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-ph"), base = store(el, "placeholder");
      el.setAttribute("placeholder", (LANG !== "pt" && dict[k] != null) ? dict[k] : base);
    });
    $$("[data-i18n-aria]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-aria"), base = store(el, "aria-label");
      el.setAttribute("aria-label", (LANG !== "pt" && dict[k] != null) ? dict[k] : base);
    });
    $$(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)); });
    document.title = tr("ui.title");
    try { localStorage.setItem("tt_lang", LANG); } catch (e) {}
    renderToday();
  }
  $$(".lang button").forEach(function (b) { b.addEventListener("click", function () { applyLang(b.dataset.lang); }); });

  /* ===== Prato do dia ===== */
  var cards = $$(".dish");
  function cardFor(day) { return cards.filter(function (c) { return +c.dataset.day === day; })[0]; }
  function fmt(p) { return "R$ " + (+p).toFixed(2).replace(".", ","); }
  var isWeekday = T.day >= 1 && T.day <= 5;
  var shownDay = isWeekday ? T.day : 1;

  function renderToday() {
    var c = cardFor(shownDay); if (!c) return;
    $("#todayDish").textContent = $("h3", c).textContent;
    $("#todayPrice").textContent = fmt(c.dataset.price);
    var lbl = $(".today-lbl");
    if (!isWeekday) lbl.textContent = tr("ui.next") + " " + $(".dish-day > span", c).textContent;
    var st = $("#status"), cls = "", txt = "";
    if (!isWeekday) { cls = "closed"; txt = tr("ui.weekend"); }
    else if (T.min < 600) { cls = "soon"; txt = tr("ui.ordering"); }
    else if (T.min < 690) { cls = "soon"; txt = tr("ui.lateorder"); }
    else if (T.min < 840) { cls = "open"; txt = tr("ui.open"); }
    else { cls = "closed"; var nd = T.day === 5 ? 1 : T.day + 1; txt = tr("ui.over") + " · " + tr("ui.next") + " " + tr("ui.nextday")[nd]; }
    st.className = "status " + cls; st.textContent = txt;
  }

  function selectDay(day, scroll) {
    $$(".daytabs button").forEach(function (b) { b.setAttribute("aria-selected", String(+b.dataset.day === day)); });
    cards.forEach(function (c) { c.classList.toggle("is-sel", +c.dataset.day === day); });
    var c = cardFor(day);
    if (scroll && c) {
      var r = c.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight) c.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  if (isWeekday) {
    var tc = cardFor(T.day); if (tc) tc.classList.add("is-today");
    var tb = $('.daytabs button[data-day="' + T.day + '"]'); if (tb) tb.classList.add("is-today");
    /* Em telas pequenas, o prato de hoje vem primeiro na lista */
    if (tc && matchMedia("(max-width:640px)").matches) tc.parentNode.insertBefore(tc, tc.parentNode.firstChild);
  }
  selectDay(shownDay, false);
  $$(".daytabs button").forEach(function (b) { b.addEventListener("click", function () { selectDay(+b.dataset.day, true); }); });

  /* ===== Links de pedido ===== */
  var dayNamesPt = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  function orderText(dish, day) {
    return "Olá! Gostaria de fazer um pedido de marmitex.\n" +
      "Prato: " + dish + (day ? " (" + day + ")" : "") + "\n" +
      "Quantidade: 1\n" +
      "Nome: \n" +
      "Horário de retirada (11h30–14h): ";
  }
  var todayCard = cardFor(shownDay);
  var todayDishPt = todayCard ? todayCard.dataset.dish : "";
  $$(".js-wa-order").forEach(function (a) { a.href = waLink(orderText(todayDishPt, isWeekday ? "hoje" : dayNamesPt[shownDay])); });
  $$(".js-mail-order").forEach(function (a) { a.href = mailLink("Pedido de marmitex", orderText(todayDishPt, isWeekday ? "hoje" : dayNamesPt[shownDay]) + "\nTelefone: \n"); });
  cards.forEach(function (c) { var a = $(".js-wa-dish", c); if (a) a.href = waLink(orderText(c.dataset.dish, dayNamesPt[+c.dataset.day])); });
  $$(".js-ifood").forEach(function (a) { a.href = IFOOD_URL; });

  /* ===== Formulários (sem servidor: abrem WhatsApp/e-mail) ===== */
  function handleForm(form, subject, build) {
    var lastBtn = "wa";
    $$("button[data-send]", form).forEach(function (b) { b.addEventListener("click", function () { lastBtn = b.dataset.send; }); });
    form.addEventListener("input", function (e) { if (e.target.classList.contains("invalid") && String(e.target.value).trim()) { e.target.classList.remove("invalid"); if (!$(".invalid", form)) $(".form-msg", form).hidden = true; } });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var ok = true;
      $$("[required]", form).forEach(function (i) { var bad = !String(i.value).trim(); i.classList.toggle("invalid", bad); if (bad) ok = false; });
      $(".form-msg", form).hidden = ok;
      if (!ok) { var f = $(".invalid", form); if (f) f.focus(); return; }
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      var body = build(data);
      if (lastBtn === "mail") location.href = mailLink(subject(data), body);
      else window.open(waLink(body), "_blank", "noopener");
    });
  }
  var bizForm = $("#bizForm");
  if (bizForm) handleForm(bizForm,
    function () { return "Pedido de marmitas"; },
    function (d) {
      return "Olá! Quero fazer um pedido de marmitas.\n" +
        "Nome: " + d.nome + "\n" +
        "Quantidade: " + d.quantidade + "\n" +
        "Para quando: " + (d.quando || "-") +
        (d.msg ? "\nMensagem: " + d.msg : "");
    });
  var jobForm = $("#jobForm");
  if (jobForm) handleForm(jobForm,
    function (d) { return "Candidatura – " + d.vaga; },
    function (d) {
      return "Olá! Tenho interesse em trabalhar com vocês.\n" +
        "Nome: " + d.nome + "\n" +
        "Vaga: " + d.vaga +
        (d.msg ? "\nMensagem: " + d.msg : "");
    });

  /* ===== Menu (hambúrguer) ===== */
  var burger = $(".burger"), nav = $("#mainnav");
  function setNav(open) { nav.classList.toggle("open", open); burger.setAttribute("aria-expanded", String(open)); }
  burger.addEventListener("click", function () { setNav(!nav.classList.contains("open")); });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });
  document.addEventListener("click", function (e) { if (nav.classList.contains("open") && !nav.contains(e.target) && !burger.contains(e.target)) setNav(false); });

  /* Link ativo no menu */
  if ("IntersectionObserver" in window) {
    var links = $$("a", nav);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) links.forEach(function (l) { l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["inicio", "cardapio", "sobre", "empresas", "trabalhe", "contato"].forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* Botão flutuante do WhatsApp aparece depois do topo */
  var fab = $(".fab");
  function fabCheck() { fab.classList.toggle("hide", scrollY < 520); }
  fabCheck(); addEventListener("scroll", fabCheck, { passive: true });

  /* Idioma inicial: ?lang= > salvo > padrão português */
  var saved = null; try { saved = localStorage.getItem("tt_lang"); } catch (e) {}
  applyLang(params.get("lang") || saved || "pt");
})();
