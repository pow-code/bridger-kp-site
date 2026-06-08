/* ============================================================
   Bridger — КП-сайт (Слой 4 моушн, финал v3.2)
   Lenis (плавный скролл) + GSAP/ScrollTrigger (reveal, инфографика,
   count-up, параллакс) + кастомный курсор-свечение.
   Перф-инварианты: transform/opacity, IntersectionObserver-логика
   через ScrollTrigger, prefers-reduced-motion полностью уважается.
   Деградация: нет JS/нет CDN/reduced-motion → весь контент виден
   (CSS держит финальные состояния, числа уже финальные в HTML).
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- кастомный курсор-свечение (desktop, hover, motion-ok) ---- */
  var glow = document.getElementById('cursorGlow');
  if (glow && !reduce && window.matchMedia('(hover:hover)').matches) {
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy, shown = false;
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; glow.style.opacity = '1'; }
    }, { passive: true });
    (function loop() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---- count-up (анимация только при разрешённом движении) ---- */
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    var dur = 1300, start = null;
    el.textContent = pre + '0' + suf;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + Math.round(target * eased) + suf;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = pre + target + suf;
    }
    requestAnimationFrame(step);
  }

  /* reduced-motion ИЛИ GSAP не загрузился → оставить всё как есть (CSS = финал). */
  if (reduce || typeof window.gsap === 'undefined') { return; }

  var gsap = window.gsap;
  var hasST = typeof window.ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(window.ScrollTrigger);

  /* ---- Lenis: премиум плавный скролл (через GSAP-тикер, без двойного rAF) ---- */
  if (typeof window.Lenis !== 'undefined') {
    var lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasST) {
      lenis.on('scroll', window.ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
  }

  /* без ScrollTrigger — просто прогнать count-up, reveal оставить видимым */
  if (!hasST) {
    document.querySelectorAll('[data-count]').forEach(runCount);
    return;
  }
  var ST = window.ScrollTrigger;

  /* ---- reveal: FROM скрытого → видимого (без JS контент виден) ---- */
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    var d = parseInt(el.getAttribute('data-d') || '0', 10);
    gsap.from(el, {
      opacity: 0, y: 26, duration: 0.8, ease: 'power2.out', delay: d * 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* ---- §3 схема связей: прорисовка линий → узел «Вы» загорается ---- */
  var schema = document.querySelector('.schema');
  if (schema) {
    var lines = schema.querySelectorAll('.sline span');
    var youNode = schema.querySelector('.snode-you');
    var tl = gsap.timeline({ scrollTrigger: { trigger: schema, start: 'top 82%', once: true } });
    tl.from(lines, { scaleX: 0, duration: 0.85, ease: 'power2.out', stagger: 0.45 });
    if (youNode) tl.from(youNode, { scale: 0.82, opacity: 0.35, duration: 0.5, ease: 'back.out(2)' }, '-=0.15');
  }

  /* ---- §4 портрет: поля «заполняются» (плейсхолдеры, без цифр) ---- */
  var pcallout = document.querySelector('.portrait-callout');
  if (pcallout) {
    gsap.from(pcallout.querySelectorAll('.pbar'), {
      scaleX: 0, duration: 0.8, ease: 'power2.out', stagger: 0.1,
      scrollTrigger: { trigger: pcallout, start: 'top 80%', once: true }
    });
  }

  /* ---- §6 count-up на честных числах ---- */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    ST.create({ trigger: el, start: 'top 85%', once: true, onEnter: function () { runCount(el); } });
  });

  /* ---- лёгкий параллакс hero-мотива (без конфликта с дыханием орбов) ---- */
  var motif = document.querySelector('.hero-motif');
  if (motif) {
    gsap.to(motif, {
      yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

})();
