/* Narratve Space — site interactions */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- Hero headline entrance ------------------------------------------ */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.add('is-loaded'); });
  });

  /* ---- Nav: scrolled state + mobile menu ------------------------------- */
  var nav = document.querySelector('[data-nav]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var menu = document.querySelector('[data-nav-menu]');

  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 834px)').addEventListener('change', function (mq) {
    if (mq.matches) setMenu(false);
  });

  /* ---- Scroll reveal ---------------------------------------------------- */
  var revealables = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // Stagger siblings that enter together
        var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
          return c.hasAttribute('data-reveal');
        });
        var i = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(i, 4) * 80 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---- Hero campaign fragments ----------------------------------------- */
  var fragWrap = document.querySelector('[data-fragments]');
  if (fragWrap) {
    var frags = fragWrap.querySelectorAll('.fragment');
    var indexEl = fragWrap.querySelector('[data-fragment-index]');
    var current = 0;
    var timer = null;

    function show(next) {
      var prev = frags[current];
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      setTimeout(function () { prev.classList.remove('is-leaving'); }, 820);
      current = next;
      frags[current].classList.add('is-active');
      indexEl.textContent = String(current + 1).padStart(2, '0');
    }
    function start() {
      if (reduceMotion || timer) return;
      timer = setInterval(function () { show((current + 1) % frags.length); }, 2800);
    }
    function stop() { clearInterval(timer); timer = null; }

    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }).observe(fragWrap);
    } else {
      start();
    }
  }

  /* ---- Services: cursor-follow preview --------------------------------- */
  var list = document.querySelector('[data-services]');
  var preview = document.querySelector('[data-service-preview]');
  var inner = document.querySelector('[data-service-preview-inner]');

  var ARTS = {
    1: '<b class="c"></b><span class="t">Aa</span>',
    2: '<span class="t">“</span><b class="l"></b>',
    3: '<b class="bar"></b><b class="h"></b><b class="p1"></b><b class="p2"></b><b class="btn-s"></b>',
    4: '<b class="card"></b><b class="img"></b><b class="pill"></b>',
    5: '<i></i><i></i><i></i><i></i><i></i>',
    6: '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>',
    7: '<b class="bars"></b><b class="play"></b>',
    8: '<b class="n"></b>'
  };

  if (list && preview && finePointer) {
    Object.keys(ARTS).forEach(function (k) {
      var d = document.createElement('div');
      d.className = 'sart sart--' + k;
      d.dataset.art = k;
      d.innerHTML = ARTS[k];
      inner.appendChild(d);
    });
    var arts = inner.querySelectorAll('.sart');

    var x = 0, y = 0, tx = 0, ty = 0, raf = null, visible = false;

    function loop() {
      var k = reduceMotion ? 1 : 0.16;
      x += (tx - x) * k;
      y += (ty - y) * k;
      var rot = reduceMotion ? 0 : Math.max(-8, Math.min(8, (tx - x) * 0.06));
      preview.style.transform = 'translate3d(' + (x + 32) + 'px,' + (y - 40) + 'px,0) translate(0,-50%) rotate(' + rot + 'deg)';
      if (visible || Math.abs(tx - x) > 0.5) raf = requestAnimationFrame(loop);
      else raf = null;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }

    list.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!visible) { x = tx; y = ty; }
      kick();
    });
    list.addEventListener('mouseover', function (e) {
      var row = e.target.closest('.service');
      if (!row) return;
      var n = row.dataset.art;
      arts.forEach(function (a) { a.classList.toggle('is-active', a.dataset.art === n); });
      visible = true;
      preview.classList.add('is-visible');
      kick();
    });
    list.addEventListener('mouseleave', function () {
      visible = false;
      preview.classList.remove('is-visible');
    });
  }

  /* ---- Market clocks ---------------------------------------------------- */
  var clocks = document.querySelectorAll('[data-clock]');
  function tick() {
    var now = new Date();
    clocks.forEach(function (el) {
      try {
        el.textContent = now.toLocaleTimeString('en-GB', {
          timeZone: el.dataset.clock, hour: '2-digit', minute: '2-digit', hour12: false
        });
      } catch (e) { /* unsupported time zone — leave placeholder */ }
    });
  }
  if (clocks.length) { tick(); setInterval(tick, 15000); }

  /* ---- Work filters ----------------------------------------------------- */
  var filterBar = document.querySelector('[data-filters]');
  if (filterBar) {
    var cards = document.querySelectorAll('[data-work-grid] [data-cats]');
    var emptyMsg = document.querySelector('[data-work-empty]');
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;
      var f = btn.dataset.filter;
      filterBar.querySelectorAll('[data-filter]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      var shown = 0;
      cards.forEach(function (c) {
        var on = f === '*' || c.dataset.cats.split('|').indexOf(f) !== -1;
        c.hidden = !on;
        if (on) { shown++; c.classList.add('is-in'); }
      });
      if (emptyMsg) emptyMsg.hidden = shown > 0;
    });
  }

  /* ---- Contact form ----------------------------------------------------- */
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var svc = params.get('service');
    var select = form.querySelector('select[name="service"]');
    if (svc && select) {
      Array.prototype.forEach.call(select.options, function (o) { if (o.value === svc) o.selected = true; });
    }
    var status = form.querySelector('[data-form-status]');
    var endpoint = form.getAttribute('data-endpoint');
    var success = form.getAttribute('data-success') || '/thank-you/';

    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) return; // let the browser show messages
      e.preventDefault();
      var submit = form.querySelector('[type="submit"]');
      var data = new FormData(form);
      if (data.get('company_website')) return; // honeypot
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      status.textContent = 'Sending…';

      var req = endpoint
        ? fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        : fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data).toString()
          });

      req.then(function (res) {
        if (!res.ok) throw new Error(res.status);
        window.location.href = success;
      }).catch(function () {
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        var mail = form.getAttribute('data-fallback-email');
        status.innerHTML = 'Sorry — your message could not be sent. ' +
          (mail ? 'Please email us at <a href="mailto:' + mail + '">' + mail + '</a>.' : 'Please try again shortly.');
      });
    });
  }
})();
