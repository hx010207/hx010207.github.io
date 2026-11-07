// ---------- preloader (video + loading % counter) ----------
(function () {
  const root = document.documentElement;
  const pre = document.getElementById("preloader");
  if (!pre) { root.classList.remove("preloading"); return; }
  const numEl = document.getElementById("pl-num");
  const vid = document.getElementById("pl-video");
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const conn = navigator.connection || {};
  const saveData = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
  if (vid && (REDUCED || saveData)) { try { vid.pause(); } catch (e) {} vid.remove(); }

  let shown = 0, target = 0, loaded = false, done = false;
  const start = Date.now();

  const timer = setInterval(() => {
    target = loaded ? 100 : Math.min(92, target + Math.random() * 7 + 1);
    shown += (target - shown) * 0.22;
    if (numEl) numEl.textContent = Math.round(shown);
    if (loaded && shown >= 99.3) {
      clearInterval(timer);
      if (numEl) numEl.textContent = 100;
      finish();
    }
  }, 95);

  const markLoaded = () => { loaded = true; };
  // use a quick, reliable signal — don't block on the heavy preloader video
  if (document.readyState !== "loading") setTimeout(markLoaded, 500);
  else document.addEventListener("DOMContentLoaded", () => setTimeout(markLoaded, 500));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(markLoaded, 200));
  setTimeout(markLoaded, 3000); // hard cap

  function finish() {
    if (done) return; done = true;
    const wait = Math.max(0, 1100 - (Date.now() - start)); // min on-screen time
    setTimeout(() => {
      pre.classList.add("done");
      root.classList.remove("preloading");
      setTimeout(() => { if (pre.parentNode) pre.parentNode.removeChild(pre); }, 700);
    }, wait);
  }
})();

// ---------- theme: default cyber-dark ----------
(function () {
  const saved = localStorage.getItem("theme");
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  document.documentElement.setAttribute("data-theme", saved || (prefersLight ? "light" : "dark"));
})();

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", function () {
  const root = document.documentElement;

  /* live clock */
  const clock = document.getElementById("clock");
  function tick() { if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour12: true }); }
  tick(); setInterval(tick, 1000);

  /* theme toggle */
  const toggle = document.getElementById("theme-toggle");
  const label = () => { if (toggle) toggle.textContent = root.getAttribute("data-theme") === "dark" ? "◑ SECURE" : "◐ LIGHT"; };
  label();
  if (toggle) toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next); localStorage.setItem("theme", next); label();
  });

  /* mobile menu */
  const menuBtn = document.getElementById("menu-btn");
  const links = document.getElementById("nav-links");
  if (menuBtn && links) menuBtn.addEventListener("click", () => links.classList.toggle("open"));

  /* reduced motion: paint final state, skip the rest */
  if (REDUCED) {
    document.querySelectorAll(".reveal,.pop").forEach(e => e.classList.add("in"));
    document.querySelectorAll(".display").forEach(e => e.classList.add("lit"));
    document.querySelectorAll(".hero .scatter, .hero .pill.avail").forEach(e => { e.style.opacity = 1; });
    return;
  }

  /* ---------- split display headings into letters, grouped by word ---------- */
  document.querySelectorAll(".display").forEach((el) => {
    if (el.dataset.split) return;
    const first = el.firstChild;
    if (!first || first.nodeType !== 3) return;   // leading text node only
    el.dataset.split = "1";
    const text = first.textContent.trim();
    if (!text) return;
    const frag = document.createDocumentFragment();
    const words = text.split(/\s+/);
    words.forEach((w, wi) => {
      const word = document.createElement("span");
      word.className = "word";
      [...w].forEach((c) => {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = c;
        word.appendChild(s);
      });
      frag.appendChild(word);
      if (wi < words.length - 1) frag.appendChild(document.createTextNode(" "));
    });
    el.replaceChild(frag, first);
  });

  /* ---------- staggered reveal via IntersectionObserver ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const t = e.target;
      io.unobserve(t);
      if (t.classList.contains("display")) {
        const chars = t.querySelectorAll(".ch");
        chars.forEach((c, i) => c.style.setProperty("--d", (i * 28) + "ms"));
        t.classList.add("lit");
      } else {
        t.classList.add("in");
      }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll(".reveal, .display").forEach((el) => io.observe(el));

  /* stagger children inside any [data-stagger] container */
  document.querySelectorAll("[data-stagger]").forEach((wrap) => {
    [...wrap.children].forEach((child, i) => {
      child.classList.add("reveal");
      child.style.setProperty("--d", (i * 80) + "ms");
      io.observe(child);
    });
  });

  /* ---------- hero load sequence: stickers pop in with stagger ---------- */
  const stickers = [...document.querySelectorAll(".hero .scatter, .hero .pill.avail")];
  stickers.forEach((s, i) => { s.classList.add("pop"); s.style.setProperty("--d", (250 + i * 90) + "ms"); });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    stickers.forEach((s) => s.classList.add("in"));
    // start idle floating only after pop-in settles
    setTimeout(() => document.body.classList.add("float-on"), 1400);
  }));
  // light the hero title immediately
  const heroTitle = document.querySelector(".hero .display");
  if (heroTitle) {
    heroTitle.querySelectorAll(".ch").forEach((c, i) => c.style.setProperty("--d", (120 + i * 34) + "ms"));
    requestAnimationFrame(() => heroTitle.classList.add("lit"));
    io.unobserve(heroTitle);
  }

  /* ---------- magnetic buttons (offset * 0.3, clamped) ---------- */
  document.querySelectorAll("[data-magnetic], .btn-contact, .contact-btn").forEach((btn) => {
    let raf;
    const move = (ev) => {
      const r = btn.getBoundingClientRect();
      const x = (ev.clientX - (r.left + r.width / 2)) * 0.3;
      const y = (ev.clientY - (r.top + r.height / 2)) * 0.3;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { btn.style.transform = `translate(${x}px, ${y}px)`; });
    };
    const reset = () => { cancelAnimationFrame(raf); btn.style.transform = ""; };
    btn.addEventListener("mousemove", move);
    btn.addEventListener("mouseleave", reset);
  });

  /* ---------- subtle parallax on decorative hero layers ---------- */
  const layers = [...document.querySelectorAll(".s-note-l, .s-note-r, .s-arrow")];
  if (layers.length) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        layers.forEach((l, i) => { l.style.marginTop = (y * (i % 2 ? 0.05 : -0.04)) + "px"; });
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }
});
