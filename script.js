'use strict';

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════ */
const $  = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function easeOutCubic(t)  { return 1 - Math.pow(1 - t, 3); }
function clamp(v, mn, mx) { return Math.min(mx, Math.max(mn, v)); }
function lerp(a, b, t)    { return a + (b - a) * t; }

/* ═══════════════════════════════════════════════════════════════
   1. PRELOADER
═══════════════════════════════════════════════════════════════ */
(function initPreloader() {
  const el  = $('preloader');
  const bar = $('loader-bar');
  const cv  = $('loader-canvas');
  if (!cv) return;

  const ctx = cv.getContext('2d');
  const cx = 60, cy = 60, r = 46;
  let angle = 0, raf;

  function drawSpinner() {
    ctx.clearRect(0, 0, 120, 120);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(201,151,58,.15)';
    ctx.lineWidth   = 6;
    ctx.stroke();

    const grd = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    grd.addColorStop(0, '#c9973a');
    grd.addColorStop(1, '#f0c060');
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, angle - Math.PI / 2);
    ctx.strokeStyle = grd;
    ctx.lineWidth   = 6;
    ctx.lineCap     = 'round';
    ctx.stroke();

    const tdx = cx + Math.cos(angle - Math.PI / 2) * r;
    const tdy = cy + Math.sin(angle - Math.PI / 2) * r;
    ctx.beginPath();
    ctx.arc(tdx, tdy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle   = '#fff';
    ctx.shadowColor = '#f0c060';
    ctx.shadowBlur  = 10;
    ctx.fill();
    ctx.shadowBlur  = 0;

    ctx.font         = '30px serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#f0c060';
    ctx.fillText('📖', cx, cy);

    angle += 0.055;
    if (angle > Math.PI * 2) angle = 0;
    raf = requestAnimationFrame(drawSpinner);
  }
  drawSpinner();

  let prog = 0;
  const iv = setInterval(() => {
    prog = Math.min(prog + Math.random() * 16 + 4, 100);
    if (bar) bar.style.width = prog + '%';
    if (prog >= 100) {
      clearInterval(iv);
      cancelAnimationFrame(raf);
      setTimeout(() => {
        if (el) el.classList.add('hidden');
        setTimeout(() => el && el.remove(), 600);
      }, 300);
    }
  }, 160);
})();

/* ═══════════════════════════════════════════════════════════════
   2. BG CANVAS
═══════════════════════════════════════════════════════════════ */
(function initBgCanvas() {
  const cv = $('bg-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H, mouse = { x: -9999, y: -9999 };

  class Particle {
    constructor(init) { this.reset(init); }

    reset(init) {
      this.x    = Math.random() * W;
      this.y    = init ? Math.random() * H : H + 5;
      this.r    = Math.random() * 1.8 + 0.3;
      this.vx   = (Math.random() - 0.5) * 0.28;
      this.vy   = -(Math.random() * 0.35 + 0.08);
      this.life = 1;
      this.dec  = Math.random() * 0.0012 + 0.0005;
      this.gold = Math.random() > 0.45;
    }

    update() {
      this.x    += this.vx;
      this.y    += this.vy;
      this.life -= this.dec;

      if (this.y < -6 || this.life <= 0) {
        this.reset(false);
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);

      ctx.fillStyle = this.gold
        ? `rgba(201,151,58,${this.life * 0.5})`
        : `rgba(140,120,220,${this.life * 0.4})`;

      ctx.fill();
    }
  }

  class Star {
    constructor() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.15;
      this.vy = (Math.random() - 0.5) * 0.15;
      this.r  = Math.random() * 1.4 + 0.4;
      this.a  = Math.random() * 0.5 + 0.15;
      this.da = (Math.random() * 0.4 + 0.1) *
        0.006 *
        (Math.random() < 0.5 ? 1 : -1);
    }

    update() {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const d  = Math.hypot(dx, dy);

      if (d < 90) {
        const f = (90 - d) / 90 * 0.4;

        if (d > 0) {
          this.vx += (dx / d) * f;
          this.vy += (dy / d) * f;
        }
      }

      this.vx = clamp(this.vx * 0.97, -0.45, 0.45);
      this.vy = clamp(this.vy * 0.97, -0.45, 0.45);

      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0) this.x = W;
      if (this.x > W) this.x = 0;
      if (this.y < 0) this.y = H;
      if (this.y > H) this.y = 0;

      this.a += this.da;

      if (this.a < 0.1 || this.a > 0.7) {
        this.da *= -1;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,151,58,${this.a})`;
      ctx.fill();
    }
  }

  let particles = [];
  let stars = [];

  function resize() {
    W = cv.width  = window.innerWidth;
    H = cv.height = window.innerHeight;
  }

  function init() {
    resize();

    particles = Array.from(
      { length: 110 },
      () => new Particle(true)
    );

    stars = Array.from(
      { length: 65 },
      () => new Star()
    );
  }

  function connect() {
    const MAX_D = 135;

    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {

        const dx = stars[i].x - stars[j].x;
        const dy = stars[i].y - stars[j].y;
        const d  = Math.hypot(dx, dy);

        if (d < MAX_D) {
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);

          ctx.strokeStyle =
            `rgba(201,151,58,${(1 - d / MAX_D) * 0.2})`;

          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function drawMouseGlow() {
    let closest = null;
    let minD = 100;

    stars.forEach(s => {
      const d = Math.hypot(
        s.x - mouse.x,
        s.y - mouse.y
      );

      if (d < minD) {
        minD = d;
        closest = s;
      }
    });

    if (!closest) return;

    const grd =
      ctx.createRadialGradient(
        closest.x,
        closest.y,
        0,
        closest.x,
        closest.y,
        55
      );

    grd.addColorStop(
      0,
      'rgba(240,192,96,.18)'
    );

    grd.addColorStop(
      1,
      'transparent'
    );

    ctx.beginPath();
    ctx.arc(
      closest.x,
      closest.y,
      55,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = grd;
    ctx.fill();
  }

  function frame() {
    ctx.clearRect(
      0,
      0,
      W,
      H
    );

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    stars.forEach(s => {
      s.update();
      s.draw();
    });

    connect();
    drawMouseGlow();

    requestAnimationFrame(frame);
  }

  init();
  frame();

  window.addEventListener(
    'resize',
    resize,
    { passive: true }
  );

  window.addEventListener(
    'mousemove',
    e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    e => {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    },
    { passive: true }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   3. READING PROGRESS
═══════════════════════════════════════════════════════════════ */
(function initProgress() {

  const bar = $('progress-bar');

  if (!bar) return;

  let ticking = false;

  window.addEventListener(
    'scroll',
    () => {

      if (ticking) return;

      ticking = true;

      requestAnimationFrame(() => {

        const h =
          document.documentElement.scrollHeight -
          window.innerHeight;

        bar.style.width =
          (
            h > 0
              ? clamp(
                  window.scrollY / h * 100,
                  0,
                  100
                )
              : 0
          ) + '%';

        ticking = false;

      });

    },
    { passive: true }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   4. GO-TO-TOP
═══════════════════════════════════════════════════════════════ */
(function initGoTop() {

  const btn = $('go-top');

  if (!btn) return;

  window.addEventListener(
    'scroll',
    () => {
      btn.classList.toggle(
        'show',
        window.scrollY > 450
      );
    },
    { passive: true }
  );

  btn.addEventListener(
    'click',
    () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   5. SPLASH
═══════════════════════════════════════════════════════════════ */
(function initSplash() {

  const splash = $('splash');
  const btn    = $('splash-btn');
  const main   = $('main-content');

  if (!splash || !btn || !main) return;

  function hide() {

    splash.classList.add('hide');

    main.classList.remove('hidden');

    setTimeout(
      () => window.dispatchEvent(
        new Event('scroll')
      ),
      900
    );

    setTimeout(
      () => {
        splash.style.display = 'none';
      },
      900
    );
  }

  btn.addEventListener(
    'click',
    hide
  );

})();

/* ═══════════════════════════════════════════════════════════════
   6. NAVBAR
═══════════════════════════════════════════════════════════════ */
(function initNavbar() {

  const nav =
    document.querySelector('.navbar');

  const toggle =
    $('nav-toggle');

  const links =
    document.querySelector('.nav-links');

  const navAs =
    $$('.nav-links a');

  if (!nav) return;

  window.addEventListener(
    'scroll',
    () => {
      nav.classList.toggle(
        'scrolled',
        window.scrollY > 55
      );
    },
    { passive: true }
  );

  if (toggle && links) {

    toggle.addEventListener(
      'click',
      () => {

        const open =
          links.classList.toggle(
            'open'
          );

        const bars =
          toggle.querySelectorAll(
            'span'
          );

        bars[0].style.transform =
          open
            ? 'rotate(45deg) translate(5px,5px)'
            : '';

        bars[1].style.opacity =
          open
            ? '0'
            : '1';

        bars[2].style.transform =
          open
            ? 'rotate(-45deg) translate(5px,-5px)'
            : '';

        toggle.setAttribute(
          'aria-expanded',
          open
        );
      }
    );

    navAs.forEach(
      a =>
        a.addEventListener(
          'click',
          () => {

            links.classList.remove(
              'open'
            );

            const bars =
              toggle.querySelectorAll(
                'span'
              );

            bars.forEach(
              b => {
                b.style.transform = '';
                b.style.opacity = '';
              }
            );

          }
        )
    );
  }

  const sections =
    $$('section[id]');

  const obs =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          en => {

            if (!en.isIntersecting)
              return;

            navAs.forEach(
              a =>
                a.classList.toggle(
                  'active',
                  a.getAttribute('href') ===
                    '#' + en.target.id
                )
            );

          }
        );

      },
      {
        threshold: 0.4
      }
    );

  sections.forEach(
    s => obs.observe(s)
  );

})();

/* ═══════════════════════════════════════════════════════════════
   7. REVEAL ON SCROLL
═══════════════════════════════════════════════════════════════ */
(function initReveal() {

  const els =
    $$('.reveal');

  if (!els.length) return;

  const obs =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          en => {

            if (!en.isIntersecting)
              return;

            const delay =
              parseInt(
                en.target.dataset.delay || 0,
                10
              );

            setTimeout(
              () =>
                en.target.classList.add(
                  'visible'
                ),
              delay
            );

            obs.unobserve(
              en.target
            );

          }
        );

      },
      {
        threshold: 0.1,
        rootMargin:
          '0px 0px -40px 0px'
      }
    );

  els.forEach(
    el => obs.observe(el)
  );

})();

/* ═══════════════════════════════════════════════════════════════
   8. STAT RINGS
═══════════════════════════════════════════════════════════════ */
(function initStatRings() {

  const rings =
    $$('.stat-ring');

  if (!rings.length) return;

  const SIZE = 110;
  const CX   = 55;
  const CY   = 55;
  const R    = 42;
  const LW   = 5;

  const DUR = 1800;

  rings.forEach(
    cv => {

      cv.width =
        cv.height =
        SIZE;

      const ctx =
        cv.getContext('2d');

      const target =
        parseFloat(
          cv.dataset.val
        );

      const label =
        cv.dataset.label || '';

      const dec =
        parseInt(
          cv.dataset.dec || 0,
          10
        );

      let started = false;
      let startT = 0;

      function draw(
        progress,
        cur
      ) {

        ctx.clearRect(
          0,
          0,
          SIZE,
          SIZE
        );

        ctx.beginPath();

        ctx.arc(
          CX,
          CY,
          R,
          0,
          Math.PI * 2
        );

        ctx.strokeStyle =
          'rgba(201,151,58,.13)';

        ctx.lineWidth =
          LW;

        ctx.stroke();

        const grd =
          ctx.createLinearGradient(
            CX - R,
            CY,
            CX + R,
            CY
          );

        grd.addColorStop(
          0,
          '#c9973a'
        );

        grd.addColorStop(
          1,
          '#f0c060'
        );

        ctx.beginPath();

        ctx.arc(
          CX,
          CY,
          R,
          -Math.PI / 2,
          Math.PI * 2 * progress -
            Math.PI / 2
        );

        ctx.strokeStyle = grd;
        ctx.lineWidth   = LW;
        ctx.lineCap     = 'round';

        ctx.stroke();

        if (progress > 0.02) {

          const ex =
            CX +
            Math.cos(
              Math.PI * 2 * progress -
                Math.PI / 2
            ) *
            R;

          const ey =
            CY +
            Math.sin(
              Math.PI * 2 * progress -
                Math.PI / 2
            ) *
            R;

          ctx.beginPath();

          ctx.arc(
            ex,
            ey,
            3.5,
            0,
            Math.PI * 2
          );

          ctx.fillStyle =
            '#fff';

          ctx.shadowColor =
            '#f0c060';

          ctx.shadowBlur =
            8;

          ctx.fill();

          ctx.shadowBlur =
            0;
        }

        const display =
          dec
            ? cur.toFixed(dec)
            : Math.round(cur);

        const txt =
          display + label;

        ctx.font =
          `bold ${
            txt.length > 5
              ? 15
              : 19
          }px Cairo,sans-serif`;

        ctx.fillStyle =
          '#f0c060';

        ctx.textAlign =
          'center';

        ctx.textBaseline =
          'middle';

        ctx.fillText(
          txt,
          CX,
          CY
        );
      }

      function tick(ts) {

        if (!startT)
          startT = ts;

        const t =
          clamp(
            (ts - startT) /
              DUR,
            0,
            1
          );

        const ease =
          easeOutCubic(t);

        draw(
          ease,
          target * ease
        );

        if (t < 1)
          requestAnimationFrame(tick);
        else
          draw(
            1,
            target
          );
      }

      const obs =
        new IntersectionObserver(
          entries => {

            entries.forEach(
              en => {

                if (
                  en.isIntersecting &&
                  !started
                ) {

                  started =
                    true;

                  requestAnimationFrame(
                    tick
                  );

                  obs.unobserve(
                    cv
                  );
                }

              }
            );

          },
          {
            threshold: 0.4
          }
        );

      obs.observe(cv);

    }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   9. HERO BOOK 3D
═══════════════════════════════════════════════════════════════ */
(function initBook() {

  const scene =
    $('book-scene');

  const book =
    $('book-3d');

  if (!scene || !book)
    return;

  let cx = 0;
  let cy = 0;
  let tx = 0;
  let ty = 0;
  let raf = null;

  function loop() {

    cx =
      lerp(
        cx,
        tx,
        0.1
      );

    cy =
      lerp(
        cy,
        ty,
        0.1
      );

    book.style.transform =
      `rotateY(${cx}deg) rotateX(${cy}deg)`;

    raf =
      requestAnimationFrame(
        loop
      );
  }

  scene.addEventListener(
    'mousemove',
    e => {

      const rc =
        scene.getBoundingClientRect();

      const dx =
        (
          e.clientX -
          rc.left -
          rc.width / 2
        ) /
        (rc.width / 2);

      const dy =
        (
          e.clientY -
          rc.top -
          rc.height / 2
        ) /
        (rc.height / 2);

      tx = -dx * 28;
      ty =  dy * 12;

      if (!raf) {

        book.style.animation =
          'none';

        loop();
      }

    }
  );

  scene.addEventListener(
    'mouseleave',
    () => {

      cancelAnimationFrame(
        raf
      );

      raf = null;

      tx = 0;
      ty = 0;
      cx = 0;
      cy = 0;

      book.style.transition =
        'transform .8s ease';

      book.style.transform =
        '';

      book.style.animation =
        '';

      setTimeout(
        () => {
          book.style.transition =
            '';
        },
        850
      );

    }
  );

  scene.addEventListener(
    'touchmove',
    e => {

      const t =
        e.touches[0];

      const rc =
        scene.getBoundingClientRect();

      tx =
        -(
          (
            t.clientX -
            rc.left -
            rc.width / 2
          ) /
          (rc.width / 2)
        ) *
        20;

      ty =
        (
          (
            t.clientY -
            rc.top -
            rc.height / 2
          ) /
          (rc.height / 2)
        ) *
        8;

      if (!raf) {

        book.style.animation =
          'none';

        loop();
      }

    },
    {
      passive: true
    }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   10. MODAL
═══════════════════════════════════════════════════════════════ */
(function initModal() {

  const scene =
    $('book-scene');

  const modal =
    $('modal');

  const close =
    $('modal-close');

  if (!scene || !modal)
    return;

  function openModal() {

    modal.classList.add(
      'open'
    );

    document.body.style.overflow =
      'hidden';

    close?.focus();
  }

  function closeModal() {

    modal.classList.remove(
      'open'
    );

    document.body.style.overflow =
      '';
  }

  scene.addEventListener(
    'click',
    openModal
  );

  scene.addEventListener(
    'keydown',
    e => {

      if (
        e.key === 'Enter' ||
        e.key === ' '
      ) {

        e.preventDefault();

        openModal();
      }

    }
  );

  close?.addEventListener(
    'click',
    e => {

      e.stopPropagation();

      closeModal();
    }
  );

  modal.addEventListener(
    'click',
    e => {

      if (
        e.target === modal
      ) {

        closeModal();
      }

    }
  );

  document.addEventListener(
    'keydown',
    e => {

      if (
        e.key === 'Escape'
      ) {

        closeModal();
      }

    }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   11. QUOTES SLIDER
═══════════════════════════════════════════════════════════════ */
(function initSlider() {

  const slides =
    Array.from(
      $$('.slide')
    );

  const dots =
    Array.from(
      $$('.dot')
    );

  const btnPrev =
    $('q-prev');

  const btnNext =
    $('q-next');

  if (!slides.length)
    return;

  let cur = 0;
  let isAnimating = false;

  function go(i) {

    if (isAnimating)
      return;

    isAnimating =
      true;

    slides[cur].classList.remove(
      'active'
    );

    dots[cur]?.classList.remove(
      'active'
    );

    cur =
      (
        (i % slides.length) +
        slides.length
      ) %
      slides.length;

    slides[cur].classList.add(
      'active'
    );

    dots[cur]?.classList.add(
      'active'
    );

    setTimeout(
      () => {
        isAnimating =
          false;
      },
      550
    );
  }

  btnPrev?.addEventListener(
    'click',
    () =>
      go(cur - 1)
  );

  btnNext?.addEventListener(
    'click',
    () =>
      go(cur + 1)
  );

  dots.forEach(
    (d, i) =>
      d.addEventListener(
        'click',
        () => go(i)
      )
  );

  const sliderEl =
    document.querySelector(
      '.slider'
    );

  sliderEl?.setAttribute(
    'tabindex',
    '0'
  );

  sliderEl?.addEventListener(
    'keydown',
    e => {

      if (
        e.key === 'ArrowLeft'
      ) {
        go(cur - 1);
      }

      if (
        e.key === 'ArrowRight'
      ) {
        go(cur + 1);
      }

    }
  );

  let sx = 0;
  let sy = 0;

  const track =
    $('slides');

  track?.addEventListener(
    'touchstart',
    e => {

      sx =
        e.touches[0].clientX;

      sy =
        e.touches[0].clientY;

    },
    {
      passive: true
    }
  );

  track?.addEventListener(
    'touchend',
    e => {

      const dx =
        sx -
        e.changedTouches[0].clientX;

      const dy =
        Math.abs(
          sy -
          e.changedTouches[0].clientY
        );

      if (
        Math.abs(dx) > 40 &&
        dy < 60
      ) {

        go(
          cur +
          (dx > 0 ? 1 : -1)
        );

      }

    },
    {
      passive: true
    }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   12. FEELINGS
═══════════════════════════════════════════════════════════════ */
(function initFeelings() {

  const btns =
    $$('.feel-btn');

  const result =
    $('feel-result');

  if (
    !btns.length ||
    !result
  ) return;

  const msgs = {

    'حب 💘':
      '💘 الحب هو الدافع وراء كل كلمة في هذا الكتاب.',

    'حزن 😢':
      '😢 الحزن الجميل يعلّمنا قيمة ما فقدنا.',

    'أمل 🌟':
      '🌟 الأمل هو الجوهر الحقيقي لكل قصة حب.',

    'دهشة 😮':
      '😮 القلم الصادق يدهشك من أول سطر.',

    'سعادة 😊':
      '😊 سعادتك في القراءة هي أجمل مكافأة للكاتب.',

    'تأمل 🤔':
      '🤔 التأمل بعد القراءة دليل على عمق الأثر.'

  };

  btns.forEach(
    btn => {

      btn.addEventListener(
        'click',
        () => {

          btns.forEach(
            b =>
              b.classList.remove(
                'on'
              )
          );

          btn.classList.add(
            'on'
          );

          result.style.opacity =
            '0';

          result.style.transform =
            'translateY(8px)';

          setTimeout(
            () => {

              result.textContent =
                msgs[
                  btn.dataset.f
                ] || '';

              result.style.transition =
                'opacity .4s, transform .4s';

              result.style.opacity =
                '1';

              result.style.transform =
                'translateY(0)';

            },
            180
          );

        }
      );

    }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   13. RATING
═══════════════════════════════════════════════════════════════ */
(function initRating() {

  const stars =
    Array.from(
      $$('#stars .star')
    );

  const msg =
    $('rating-msg');

  const fill =
    $('rating-fill');

  if (!stars.length)
    return;

  const labels = [

    '',
    'لم يعجبني 😔',
    'مقبول 😐',
    'جيد 🙂',
    'رائع 😍',
    'تحفة فنية ✨'

  ];

  let chosen = 0;

  function highlight(v) {

    stars.forEach(
      s =>
        s.classList.toggle(
          'on',
          parseInt(
            s.dataset.v,
            10
          ) <= v
        )
    );

  }

  stars.forEach(
    s => {

      const v =
        parseInt(
          s.dataset.v,
          10
        );

      s.addEventListener(
        'mouseenter',
        () => {

          if (!chosen)
            highlight(v);

        }
      );

      s.addEventListener(
        'mouseleave',
        () => {

          if (!chosen)
            highlight(0);

        }
      );

      s.addEventListener(
        'click',
        () => {

          chosen =
            v;

          highlight(v);

          if (msg) {

            msg.textContent =
              labels[v] || '';

          }

          if (fill) {

            fill.style.width =
              (
                v / 5 * 100
              ) + '%';

          }

          s.style.transform =
            'scale(1.45)';

          setTimeout(
            () => {
              s.style.transform =
                '';
            },
            300
          );

        }
      );

      s.setAttribute(
        'tabindex',
        '0'
      );

      s.setAttribute(
        'role',
        'button'
      );

      s.addEventListener(
        'keydown',
        e => {

          if (
            e.key === 'Enter' ||
            e.key === ' '
          ) {

            e.preventDefault();

            s.click();
          }

        }
      );

    }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   14. CONTACT FORM
═══════════════════════════════════════════════════════════════ */
(function initContactForm() {

  const form =
    $('contact-form');

  const success =
    $('form-success');

  const backBtn =
    $('form-back');

  const subBtn =
    $('submit-btn');

  const gErr =
    $('form-err-global');

  const charCnt =
    $('char-cnt');

  const msgArea =
    $('f-msg');

  if (!form) return;

  if (
    msgArea &&
    charCnt
  ) {

    msgArea.addEventListener(
      'input',
      () => {

        const n =
          msgArea.value.length;

        const mx =
          parseInt(
            msgArea.maxLength,
            10
          ) || 1000;

        charCnt.textContent =
          `${n} / ${mx}`;

        charCnt.className =
          'char-cnt' +
          (
            n >= mx
              ? ' max'
              : n > mx * 0.88
                ? ' warn'
                : ''
          );

      }
    );

  }

  const fStars =
    Array.from(
      $$('.fs')
    );

  const fRating =
    $('f-rating');

  fStars.forEach(
    s => {

      const v =
        parseInt(
          s.dataset.v,
          10
        );

      s.addEventListener(
        'click',
        () => {

          fStars.forEach(
            x =>
              x.classList.toggle(
                'on',
                parseInt(
                  x.dataset.v
                ) <= v
              )
          );

          if (fRating) {

            fRating.value =
              `${v} / 5`;

          }

        }
      );

      s.addEventListener(
        'mouseenter',
        () =>
          fStars.forEach(
            x =>
              x.classList.toggle(
                'on',
                parseInt(
                  x.dataset.v
                ) <= v
              )
          )
      );

      s.addEventListener(
        'mouseleave',
        () => {

          const cur =
            fRating
              ? parseInt(
                  fRating.value
                ) || 0
              : 0;

          fStars.forEach(
            x =>
              x.classList.toggle(
                'on',
                parseInt(
                  x.dataset.v
                ) <= cur
              )
          );

        }
      );

    }
  );

  const EMAIL_RE =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const rules = {

    'f-name': {
      gId: 'fg-name',
      eId: 'err-name',
      check: v =>
        !v.trim()
          ? 'الاسم مطلوب'
          : v.trim().length < 2
            ? 'الاسم قصير جدًا'
            : ''
    },

    'f-email': {
      gId: 'fg-email',
      eId: 'err-email',
      check: v =>
        !v.trim()
          ? 'البريد الإلكتروني مطلوب'
          : !EMAIL_RE.test(v)
            ? 'صيغة البريد غير صحيحة'
            : ''
    },

    'f-subject': {
      gId: 'fg-subject',
      eId: 'err-subject',
      check: v =>
        !v
          ? 'يرجى اختيار موضوع'
          : ''
    },

    'f-msg': {
      gId: 'fg-msg',
      eId: 'err-msg',
      check: v =>
        !v.trim()
          ? 'الرسالة مطلوبة'
          : v.trim().length < 10
            ? 'الرسالة قصيرة جدًا (10 أحرف على الأقل)'
            : ''
    },

    'f-agree': {
      gId: 'fg-agree',
      eId: 'err-agree',
      chk: true,
      check: v =>
        !v
          ? 'يجب الموافقة للمتابعة'
          : ''
    }

  };

  function setFieldState(
    rule,
    errTxt
  ) {

    const g =
      $(rule.gId);

    const e =
      $(rule.eId);

    if (errTxt) {

      g?.classList.add(
        'err'
      );

      g?.classList.remove(
        'ok'
      );

      if (e) {

        e.textContent =
          errTxt;

        e.classList.add(
          'show'
        );

      }

    }
    else {

      g?.classList.remove(
        'err'
      );

      g?.classList.add(
        'ok'
      );

      if (e) {

        e.textContent =
          '';

        e.classList.remove(
          'show'
        );

      }

    }

  }

  function clearFieldState(
    rule
  ) {

    const g =
      $(rule.gId);

    const e =
      $(rule.eId);

    g?.classList.remove(
      'err',
      'ok'
    );

    if (e) {

      e.textContent =
        '';

      e.classList.remove(
        'show'
      );

    }

  }

  function validate(id) {

    const rule =
      rules[id];

    if (!rule)
      return true;

    const el =
      $(id);

    if (!el)
      return true;

    const val =
      rule.chk
        ? el.checked
        : el.value;

    const err =
      rule.check(val);

    setFieldState(
      rule,
      err
    );

    return !err;
  }

  Object.keys(
    rules
  ).forEach(
    id => {

      const el =
        $(id);

      if (!el)
        return;

      const r =
        rules[id];

      const evs =
        r.chk
          ? ['change']
          : ['input', 'blur'];

      evs.forEach(
        ev => {

          el.addEventListener(
            ev,
            () => {

              const val =
                r.chk
                  ? el.checked
                  : el.value;

              if (
                val ||
                ev === 'blur'
              ) {

                validate(id);

              }
              else {

                clearFieldState(r);

              }

            }
          );

        }
      );

    }
  );

  form.addEventListener(
    'submit',
    async e => {

      e.preventDefault();

      let allOk =
        true;

      Object.keys(
        rules
      ).forEach(
        id => {

          if (
            !validate(id)
          ) {

            allOk =
              false;

          }

        }
      );

      if (!allOk) {

        if (gErr) {

          gErr.textContent =
            '⚠️ يرجى تصحيح الأخطاء أعلاه أولاً';

          gErr.classList.add(
            'show'
          );

        }

        form
          .querySelector(
            '.field.err'
          )
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

        subBtn.style.animation =
          'none';

        subBtn.offsetHeight;

        subBtn.style.animation =
          'shake .4s ease';

        setTimeout(
          () => {
            subBtn.style.animation =
              '';
          },
          420
        );

        return;
      }

      if (gErr) {

        gErr.classList.remove(
          'show'
        );

      }

      subBtn.disabled =
        true;

      subBtn.classList.add(
        'loading'
      );

      try {

        const res =
          await fetch(
            form.action,
            {
              method: 'POST',
              body:
                new FormData(
                  form
                ),
              headers: {
                Accept:
                  'application/json'
              }
            }
          );

        if (res.ok) {

          form.style.display =
            'none';

          if (success) {

            success.classList.add(
              'show'
            );

            success.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });

          }

        }
        else {

          const json =
            await res
              .json()
              .catch(
                () => ({})
              );

          const txt =
            json?.errors
              ?.map(
                x => x.message
              )
              .join(' · ')
            ||
            'حدث خطأ أثناء الإرسال';

          if (gErr) {

            gErr.textContent =
              '❌ ' + txt;

            gErr.classList.add(
              'show'
            );

          }

        }

      }
      catch {

        if (gErr) {

          gErr.textContent =
            '❌ تعذّر الاتصال، تحقق من الإنترنت وحاول مجدداً';

          gErr.classList.add(
            'show'
          );

        }

      }
      finally {

        subBtn.disabled =
          false;

        subBtn.classList.remove(
          'loading'
        );

      }

    }
  );

  backBtn?.addEventListener(
    'click',
    () => {

      success?.classList.remove(
        'show'
      );

      form.style.display =
        '';

      form.reset();

      fStars.forEach(
        s =>
          s.classList.remove(
            'on'
          )
      );

      if (fRating) {

        fRating.value =
          '';

      }

      if (charCnt) {

        charCnt.textContent =
          '0 / 1000';

      }

      Object.values(
        rules
      ).forEach(
        r =>
          clearFieldState(r)
      );

      if (gErr) {

        gErr.classList.remove(
          'show'
        );

      }

    }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   15. SMOOTH SCROLL
═══════════════════════════════════════════════════════════════ */
$$('a[href^="#"]').forEach(
  a => {

    a.addEventListener(
      'click',
      e => {

        const id =
          a
            .getAttribute(
              'href'
            )
            .slice(1);

        const tgt =
          document.getElementById(
            id
          );

        if (!tgt)
          return;

        e.preventDefault();

        const offset =
          (
            document.querySelector(
              '.navbar'
            )?.offsetHeight ||
            70
          ) + 8;

        window.scrollTo({
          top:
            tgt.getBoundingClientRect()
              .top +
            window.scrollY -
            offset,
          behavior:
            'smooth'
        });

      }
    );

  }
);

/* ═══════════════════════════════════════════════════════════════
   16. REVIEWS HOVER
═══════════════════════════════════════════════════════════════ */
(function initReviews() {

  const reviewCards =
    $$('.review-card');

  if (!reviewCards.length)
    return;

  reviewCards.forEach(
    (card, idx) => {

      card.addEventListener(
        'mouseenter',
        () => {

          reviewCards.forEach(
            (c, i) => {

              c.style.opacity =
                i === idx
                  ? '1'
                  : '0.7';

            }
          );

        }
      );

      card.addEventListener(
        'mouseleave',
        () => {

          reviewCards.forEach(
            c => {
              c.style.opacity =
                '1';
            }
          );

        }
      );

    }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   17. THEME TOGGLE
═══════════════════════════════════════════════════════════════ */
(function initThemeToggle() {

  const btn =
    $('theme-toggle');

  const icon =
    btn?.querySelector(
      '.theme-icon'
    );

  if (!btn)
    return;

  const saved =
    localStorage.getItem(
      'theme'
    ) || 'dark';

  if (
    saved === 'light'
  ) {

    document.body.classList.add(
      'light-mode'
    );

    if (icon)
      icon.textContent =
        '☀️';

  }

  btn.addEventListener(
    'click',
    () => {

      const isLight =
        document.body.classList.toggle(
          'light-mode'
        );

      if (icon) {

        icon.style.transform =
          'rotate(360deg) scale(0)';

        setTimeout(
          () => {

            icon.textContent =
              isLight
                ? '☀️'
                : '🌙';

            icon.style.transition =
              'transform .4s ease';

            icon.style.transform =
              'rotate(0deg) scale(1)';

          },
          200
        );

      }

      localStorage.setItem(
        'theme',
        isLight
          ? 'light'
          : 'dark'
      );

      document.body.style.transition =
        'background .5s, color .5s';

      setTimeout(
        () => {

          document.body.style.transition =
            '';

        },
        550
      );

    }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   18. TICKER
═══════════════════════════════════════════════════════════════ */
(function initTicker() {

  const track =
    $('ticker-track');

  if (!track)
    return;

  // L'animation CSS continue indéfiniment.
  // Aucune pause au survol ni lors du défilement hors écran.

})();

/* ═══════════════════════════════════════════════════════════════
   19. FOOTER NEWSLETTER
═══════════════════════════════════════════════════════════════ */
(function initNewsletter() {

  const form =
    $('footer-newsletter-form');

  const msg =
    $('newsletter-msg');

  if (!form || !msg)
    return;

  form.addEventListener(
    'submit',
    e => {

      e.preventDefault();

      const emailInput =
        $('footer-email');

      const email =
        emailInput.value.trim();

      const emailRe =
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

      if (
        !email ||
        !emailRe.test(email)
      ) {

        msg.textContent =
          '❌ يرجى إدخال بريد إلكتروني صحيح';

        msg.style.color =
          '#ff8080';

        return;
      }

      msg.textContent =
        '✅ تم الاشتراك بنجاح! شكراً لك';

      msg.style.color =
        '#4caf82';

      emailInput.value =
        '';

    }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   20. BOOKING FORM
═══════════════════════════════════════════════════════════════ */
(function initBookingForm() {

  const form =
    $('booking-form');

  const subBtn =
    $('booking-submit');

  const gErr =
    $('booking-err-global');

  const wilayaSelect =
    $('b-wilaya');

  const copiesInput =
    $('b-copies');

  const deliveryDisplay =
    $('delivery-display');

  const booksDisplay =
    $('books-display');

  const totalDisplay =
    $('total-display');

  const deliveryHidden =
    $('delivery-price');

  const totalHidden =
    $('total-price');

  if (!form)
    return;

  const DELIVERY_PRICES = {

    "01": 1300,
    "02": 900,
    "03": 1000,
    "04": 900,
    "05": 900,
    "06": 900,
    "07": 1000,
    "08": 1300,
    "09": 700,
    "10": 900,
    "11": 1700,
    "12": 1000,
    "13": 900,
    "14": 900,
    "15": 900,
    "16": 500,
    "17": 950,
    "18": 900,
    "19": 900,
    "20": 900,
    "21": 900,
    "22": 900,
    "23": 900,
    "24": 900,
    "25": 900,
    "26": 900,
    "27": 900,
    "28": 900,
    "29": 900,
    "30": 1000,
    "31": 900,
    "32": 1200,
    "33": 1600,
    "34": 900,
    "35": 700,
    "36": 900,
    "37": 1600,
    "38": 900,
    "39": 1000,
    "40": 900,
    "41": 900,
    "42": 700,
    "43": 900,
    "44": 900,
    "45": 1200,
    "46": 900,
    "47": 1000,
    "48": 900,
    "49": 900,
    "50": 1300,
    "51": 1000,
    "52": 0,
    "53": 1600,
    "54": 1300,
    "55": 1000,
    "56": 2000,
    "57": 1300,
    "58": 1300

  };

  const BOOK_PRICE =
    600;

  function calculateTotal() {

    const wilaya =
      wilayaSelect?.value;

    const copies =
      parseInt(
        copiesInput?.value,
        10
      );

    const delivery =
      wilaya
        ? (
            DELIVERY_PRICES[
              wilaya
            ] || 0
          )
        : 0;

    const copiesValid =
      !isNaN(copies) &&
      copies > 0
        ? copies
        : 0;

    const booksCost =
      copiesValid *
      BOOK_PRICE;

    const total =
      delivery +
      booksCost;

    if (
      delivery === 0 &&
      wilaya
    ) {

      deliveryDisplay.textContent =
        'غير متاحة';

      totalDisplay.textContent =
        'غير متاح';

    }
    else {

      deliveryDisplay.textContent =
        delivery +
        ' DA';

      totalDisplay.textContent =
        total +
        ' DA';

    }

    booksDisplay.textContent =
      booksCost +
      ' DA';

    deliveryHidden.value =
      delivery;

    totalHidden.value =
      total;

  }

  wilayaSelect?.addEventListener(
    'change',
    calculateTotal
  );

  copiesInput?.addEventListener(
    'input',
    calculateTotal
  );

  calculateTotal();

  const rules = {

    'b-name': {
      gId: 'bg-name',
      eId: 'err-bname',
      check: v =>
        !v.trim()
          ? 'الاسم مطلوب'
          : v.trim().length < 2
            ? 'الاسم قصير جدًا'
            : ''
    },

    'b-surname': {
      gId: 'bg-surname',
      eId: 'err-bsurname',
      check: v =>
        !v.trim()
          ? 'اللقب مطلوب'
          : v.trim().length < 2
            ? 'اللقب قصير جدًا'
            : ''
    },

    'b-wilaya': {
      gId: 'bg-wilaya',
      eId: 'err-bwilaya',
      check: v =>
        !v
          ? 'يرجى اختيار الولاية'
          : ''
    },

    'b-phone': {
      gId: 'bg-phone',
      eId: 'err-bphone',
      check: v => {

        if (!v.trim())
          return 'رقم الهاتف مطلوب';

        if (
          !/^0[5-7][0-9]{8}$/.test(
            v.trim()
          )
        ) {

          return 'رقم هاتف جزائري غير صحيح';

        }

        return '';

      }
    },

    'b-copies': {
      gId: 'bg-copies',
      eId: 'err-bcopies',
      check: v => {

        if (!v)
          return 'عدد النسخ مطلوب';

        const n =
          parseInt(
            v,
            10
          );

        if (
          isNaN(n) ||
          n < 1
        ) {

          return 'أدخل رقمًا صحيحًا (1 أو أكثر)';

        }

        if (n > 50)
          return 'الحد الأقصى 50 نسخة';

        return '';

      }
    }

  };

  function setFieldState(
    rule,
    errTxt
  ) {

    const g =
      $(rule.gId);

    const e =
      $(rule.eId);

    if (errTxt) {

      g?.classList.add(
        'err'
      );

      g?.classList.remove(
        'ok'
      );

      if (e) {

        e.textContent =
          errTxt;

        e.classList.add(
          'show'
        );

      }

    }
    else {

      g?.classList.remove(
        'err'
      );

      g?.classList.add(
        'ok'
      );

      if (e) {

        e.textContent =
          '';

        e.classList.remove(
          'show'
        );

      }

    }

  }

  function clearFieldState(
    rule
  ) {

    const g =
      $(rule.gId);

    const e =
      $(rule.eId);

    g?.classList.remove(
      'err',
      'ok'
    );

    if (e) {

      e.textContent =
        '';

      e.classList.remove(
        'show'
      );

    }

  }

  function validate(id) {

    const rule =
      rules[id];

    if (!rule)
      return true;

    const el =
      $(id);

    if (!el)
      return true;

    const val =
      el.value;

    const err =
      rule.check(val);

    setFieldState(
      rule,
      err
    );

    return !err;

  }

  Object.keys(
    rules
  ).forEach(
    id => {

      const el =
        $(id);

      if (!el)
        return;

      const r =
        rules[id];

      ['input', 'blur'].forEach(
        ev => {

          el.addEventListener(
            ev,
            () => {

              if (
                el.value ||
                ev === 'blur'
              ) {

                validate(id);

              }
              else {

                clearFieldState(r);

              }

            }
          );

        }
      );

    }
  );

  form.addEventListener(
    'submit',
    async e => {

      e.preventDefault();

      let allOk =
        true;

      Object.keys(
        rules
      ).forEach(
        id => {

          if (
            !validate(id)
          ) {

            allOk =
              false;

          }

        }
      );

      const selectedWilaya =
        wilayaSelect?.value;

      if (
        selectedWilaya &&
        DELIVERY_PRICES[
          selectedWilaya
        ] === 0
      ) {

        allOk =
          false;

        if (gErr) {

          gErr.textContent =
            '❌ الولاية المختارة غير قابلة للتوصيل حالياً';

          gErr.classList.add(
            'show'
          );

        }

      }

      if (!allOk) {

        if (
          gErr &&
          !gErr.textContent.includes(
            'التوصيل'
          )
        ) {

          gErr.textContent =
            '⚠️ يرجى تصحيح الأخطاء أعلاه أولاً';

          gErr.classList.add(
            'show'
          );

        }

        subBtn.style.animation =
          'none';

        subBtn.offsetHeight;

        subBtn.style.animation =
          'shake .4s ease';

        setTimeout(
          () => {
            subBtn.style.animation =
              '';
          },
          420
        );

        return;
      }

      if (gErr) {

        gErr.classList.remove(
          'show'
        );

      }

      subBtn.disabled =
        true;

      subBtn.classList.add(
        'loading'
      );

      try {

        const res =
          await fetch(
            form.action,
            {
              method: 'POST',
              body:
                new FormData(
                  form
                ),
              headers: {
                Accept:
                  'application/json'
              }
            }
          );

        if (res.ok) {

          form.innerHTML = `
            <div class="form-success show" style="display:flex">
              <div class="success-ico">🎉</div>
              <h3>تم استلام طلبك بنجاح!</h3>
              <p>سنتواصل معك قريبًا لتأكيد الحجز.</p>
            </div>`;

        }
        else {

          const json =
            await res
              .json()
              .catch(
                () => ({})
              );

          const txt =
            json?.errors
              ?.map(
                x => x.message
              )
              .join(' · ')
            ||
            'حدث خطأ أثناء الإرسال';

          if (gErr) {

            gErr.textContent =
              '❌ ' + txt;

            gErr.classList.add(
              'show'
            );

          }

        }

      }
      catch {

        if (gErr) {

          gErr.textContent =
            '❌ تعذّر الاتصال، تحقق من الإنترنت وحاول مجدداً';

          gErr.classList.add(
            'show'
          );

        }

      }
      finally {

        subBtn.disabled =
          false;

        subBtn.classList.remove(
          'loading'
        );

      }

    }
  );

})();

/* ═══════════════════════════════════════════════════════════════
   21. CUTE BLACK FLYING MASCOT — SLOW / NATURAL FLIGHT
═══════════════════════════════════════════════════════════════ */
(function initLuckyMascot() {

  const mascot =
    document.getElementById(
      'lucky-mascot'
    );

  const character =
    document.getElementById(
      'lucky-character'
    );

  const bubble =
    document.getElementById(
      'lucky-bubble'
    );

  const title =
    document.getElementById(
      'lucky-title'
    );

  const text =
    document.getElementById(
      'lucky-text'
    );

  const toggle =
    document.getElementById(
      'lucky-toggle'
    );

  const close =
    document.getElementById(
      'lucky-close'
    );

  if (
    !mascot ||
    !character ||
    !bubble
  ) return;

  const messages = {

    hero: {
      title: 'Lucky ✨',
      text:
        'أهلاً بك ❤️ أنا رفيقك الصغير، وسأرافقك في رحلة "ابتسامتك إلهامي".',
      side: 'right'
    },

    about: {
      title: 'عن الكتاب 📖',
      text:
        'هنا تبدأ الحكاية… حب، وجع، فراق، وإلهام. كل إحساس له قصة.',
      side: 'left'
    },

    chapters: {
      title: 'الفصول 📚',
      text:
        'هيا! دعنا نكتشف الرحلة من البداية الجميلة حتى النهاية.',
      side: 'right'
    },

    reviews: {
      title: 'آراء القراء ⭐',
      text:
        'انظر كم من الكلمات الجميلة تركها القراء بعد الرحلة!',
      side: 'left'
    },

    quotes: {
      title: 'اقتباسات 💬',
      text:
        'بعض الكلمات تدخل القلب مباشرة… ✨',
      side: 'right'
    },

    feelings: {
      title: 'مشاعرك ❤️',
      text:
        'اختر شعورك بعد القراءة، وسأخبرك شيئًا صغيرًا.',
      side: 'left'
    },

    rating: {
      title: 'التقييم ⭐',
      text:
        'هل أعجبتك الرواية؟ أعطني تقييمك!',
      side: 'right'
    },

    booking: {
      title: 'الحجز 📕',
      text:
        'اختر الولاية وعدد النسخ، وسيحسب الموقع السعر لك تلقائيًا.',
      side: 'left'
    },

    contact: {
      title: 'تواصل 💌',
      text:
        'عندك سؤال؟ أرسل رسالة، وسيتواصل معك المسؤول.',
      side: 'right'
    }

  };

  let currentSection = null;
  let typingTimer = null;
  let closeTimer = null;

  function typeText(message) {

    clearInterval(
      typingTimer
    );

    text.textContent =
      '';

    mascot.classList.add(
      'talking'
    );

    let i = 0;

    typingTimer =
      setInterval(
        () => {

          text.textContent +=
            message.charAt(i);

          i++;

          if (
            i >= message.length
          ) {

            clearInterval(
              typingTimer
            );

            mascot.classList.remove(
              'talking'
            );

          }

        },
        22
      );

  }

  function showDialog(
    data,
    autoClose = true
  ) {

    if (!data) return;

    title.textContent =
      data.title;

    mascot.classList.remove(
      'dialog'
    );

    window.setTimeout(
      () => {

        mascot.classList.add(
          'dialog'
        );

        typeText(
          data.text
        );

      },
      150
    );

    if (autoClose) {

      clearTimeout(
        closeTimer
      );

      closeTimer =
        window.setTimeout(
          () => {

            mascot.classList.remove(
              'dialog'
            );

          },
          8500
        );

    }

  }

  function move(side) {

    mascot.classList.toggle(
      'left',
      side === 'left'
    );

  }

  const sections = [

    document.getElementById(
      'hero-section'
    ),

    document.getElementById(
      'about-section'
    ),

    document.getElementById(
      'chapters-section'
    ),

    document.getElementById(
      'reviews-section'
    ),

    document.getElementById(
      'quotes-section'
    ),

    document.querySelector(
      '.feelings-section'
    ),

    document.querySelector(
      '.rating-section'
    ),

    document.getElementById(
      'booking-section'
    ),

    document.getElementById(
      'contact-section'
    )

  ].filter(Boolean);

  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if (
              !entry.isIntersecting
            )
              return;

            let key = '';

            if (
              entry.target.id
            ) {

              key =
                entry.target.id
                  .replace(
                    '-section',
                    ''
                  );

            }

            if (
              entry.target.classList
                .contains(
                  'feelings-section'
                )
            ) {

              key =
                'feelings';

            }

            if (
              entry.target.classList
                .contains(
                  'rating-section'
                )
            ) {

              key =
                'rating';

            }

            if (
              !messages[key] ||
              currentSection === key
            ) return;

            currentSection =
              key;

            move(
              messages[key].side
            );

            showDialog(
              messages[key]
            );

          }
        );

      },
      {
        threshold: .35
      }
    );

  sections.forEach(
    section =>
      observer.observe(
        section
      )
  );

  toggle?.addEventListener(
    'click',
    () => {

      const open =
        mascot.classList.toggle(
          'dialog'
        );

      if (
        open &&
        currentSection
      ) {

        showDialog(
          messages[currentSection],
          false
        );

      }

    }
  );

  close?.addEventListener(
    'click',
    event => {

      event.stopPropagation();

      mascot.classList.remove(
        'dialog'
      );

      mascot.classList.remove(
        'talking'
      );

      clearInterval(
        typingTimer
      );

      clearTimeout(
        closeTimer
      );

    }
  );

  character.addEventListener(
    'click',
    () => {

      mascot.classList.add(
        'happy',
        'dialog'
      );

      if (currentSection) {

        showDialog(
          messages[currentSection],
          false
        );

      }

      window.setTimeout(
        () =>
          mascot.classList.remove(
            'happy'
          ),
        600
      );

    }
  );

  character.addEventListener(
    'keydown',
    event => {

      if (
        event.key === 'Enter' ||
        event.key === ' '
      ) {

        event.preventDefault();

        character.click();

      }

    }
  );

  function blink() {

    if (
      document.hidden
    ) {

      window.setTimeout(
        blink,
        3000
      );

      return;
    }

    mascot.classList.add(
      'blink'
    );

    window.setTimeout(
      () =>
        mascot.classList.remove(
          'blink'
        ),
      190
    );

    const next =
      2600 +
      Math.random() *
      4300;

    window.setTimeout(
      blink,
      next
    );

  }

  window.setTimeout(
    blink,
    2800
  );

  document
    .querySelectorAll(
      '.feel-btn'
    )
    .forEach(
      btn => {

        btn.addEventListener(
          'click',
          () => {

            const feeling =
              btn.dataset.f ||
              btn.textContent.trim();

            const replies = {

              'حب 💘':
                'أوووه 💘 يبدو أن الحب هو الشعور الأقوى اليوم!',

              'حزن 😢':
                'لا تحزن… بعض القصص الجميلة تحتاج القليل من الدموع 🌙',

              'أمل 🌟':
                'هذا أفضل اختيار 🌟 الأمل دائمًا جميل.',

              'دهشة 😮':
                'هاه! 😮 يبدو أن القصة فاجأتك فعلًا!',

              'سعادة 😊':
                'ابتسامتك هي أجمل شيء 😊',

              'تأمل 🤔':
                'بعض القصص تستمر داخلنا حتى بعد آخر صفحة 🤔'

            };

            const reply =
              replies[feeling];

            if (!reply)
              return;

            move(
              'right'
            );

            title.textContent =
              'Lucky 🤍';

            mascot.classList.add(
              'dialog',
              'happy'
            );

            typeText(
              reply
            );

            window.setTimeout(
              () =>
                mascot.classList.remove(
                  'happy'
                ),
              600
            );

          }
        );

      }
    );

  document
    .querySelectorAll(
      '#stars .star'
    )
    .forEach(
      star => {

        star.addEventListener(
          'click',
          () => {

            const value =
              parseInt(
                star.dataset.v,
                10
              );

            let response =
              'شكراً على تقييمك 🤍';

            if (
              value === 5
            ) {

              response =
                'واااو! ⭐⭐⭐⭐⭐ خمس نجوم! أنا سعيد جدًا!';

            }
            else if (
              value === 4
            ) {

              response =
                'تقييم رائع جدًا ⭐ شكرًا لك!';

            }
            else if (
              value === 3
            ) {

              response =
                'ثلاث نجوم ⭐ سأبقى معك حتى آخر صفحة!';

            }

            move(
              'left'
            );

            title.textContent =
              'Lucky ⭐';

            mascot.classList.add(
              'dialog',
              'happy'
            );

            typeText(
              response
            );

            window.setTimeout(
              () =>
                mascot.classList.remove(
                  'happy'
                ),
              600
            );

          }
        );

      }
    );

  const book =
    document.getElementById(
      'book-scene'
    );

  book?.addEventListener(
    'mouseenter',
    () => {

      title.textContent =
        'Lucky 📖';

      mascot.classList.add(
        'dialog'
      );

      typeText(
        'اضغط على الكتاب لمشاهدة الغلاف بشكل أكبر ✨'
      );

    }
  );

  function activateMascot() {

    mascot.classList.add(
      'active'
    );

    window.setTimeout(
      () => {

        if (
          !currentSection
        ) {

          move(
            'right'
          );

          showDialog(
            messages.hero
          );

        }

      },
      700
    );

  }

  const main =
    document.getElementById(
      'main-content'
    );

  if (main) {

    const mutation =
      new MutationObserver(
        () => {

          if (
            !main.classList.contains(
              'hidden'
            )
          ) {

            activateMascot();

            mutation.disconnect();

          }

        }
      );

    mutation.observe(
      main,
      {
        attributes: true,
        attributeFilter: [
          'class'
        ]
      }
    );

  }
  else {

    activateMascot();

  }

  /* ═══════════════════════════════════════
     SLOW NATURAL FLIGHT
     Mouvement doux et non mécanique
  ═══════════════════════════════════════ */

  function startNaturalFlight() {

    const start =
      performance.now();

    function frame(now) {

      const t =
        (now - start) /
        1000;

      /* déplacement horizontal lent */

      const x =
        Math.sin(
          t * 0.42
        ) * 3.8 +

        Math.sin(
          t * 0.18
        ) * 2.2 +

        Math.sin(
          t * 0.075
        ) * 1.2;

      /* mouvement vertical */

      const y =
        Math.sin(
          t * 0.57
        ) * 4.8 +

        Math.sin(
          t * 0.29
        ) * 2.0 +

        Math.sin(
          t * 0.11
        ) * 1.4;

      /* micro rotation */

      const rotate =
        Math.sin(
          t * 0.45
        ) * 1.8 +

        Math.sin(
          t * 0.21
        ) * .9;

      character.style.setProperty(
        '--fly-x',
        `${x.toFixed(2)}px`
      );

      character.style.setProperty(
        '--fly-y',
        `${y.toFixed(2)}px`
      );

      character.style.setProperty(
        '--fly-rotate',
        `${rotate.toFixed(2)}deg`
      );

      requestAnimationFrame(
        frame
      );

    }

    requestAnimationFrame(
      frame
    );

  }

  if (
    !window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  ) {

    startNaturalFlight();

  }

})();
