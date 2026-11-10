/* weight-loss-clinic template (DFJ engine): vanilla JS (no deps) */
(function () {
  var body = document.body;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- remembered city (statewide pages link services to the visitor's last city) ---- */
  /* Statewide pages say "Texas" until the visitor picks a city on /locations/ ("chosen").
     Merely landing on a city page does not switch the statewide pages over. */
  var KEY = 'site_city';
  function readSaved() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function chooseCity(slug, name) { try { localStorage.setItem(KEY, JSON.stringify({ slug: slug, name: name, chosen: true })); } catch (e) {} }
  try {
    if (body.dataset.citySlug) {
      var prev = readSaved();
      var keep = !!(prev && prev.chosen && prev.slug === body.dataset.citySlug);
      localStorage.setItem(KEY, JSON.stringify({ slug: body.dataset.citySlug, name: body.dataset.cityName, chosen: keep }));
    } else if (body.classList.contains('statewide')) {
      var saved = readSaved();
      if (!(saved && saved.chosen)) saved = null;
      var def = body.dataset.defaultCity, st = body.dataset.st;
      if (saved && saved.slug && saved.slug !== def) {
        $$('a[href]').forEach(function (a) {
          var h = a.getAttribute('href');
          if (h.indexOf(def + '-weight-loss/') === -1) return;
          h = h.split(def + '-weight-loss/').join(saved.slug + '-weight-loss/');
          h = h.split('-' + def + '-' + st + '/').join('-' + saved.slug + '-' + st + '/');
          a.setAttribute('href', h);
        });
      }
      if (saved && saved.slug) {
        $$('.js-loc-label').forEach(function (el) {
          var svg = el.querySelector('svg');
          el.textContent = saved.name + ', ' + st.toUpperCase() + ' ';
          if (svg) el.appendChild(svg);
        });
      }
    }
  } catch (e) { /* storage blocked */ }

  /* ---- mobile nav: clone desktop services menu into the drawer ---- */
  var clone = $('[data-m-clone]'), src = $('.main-nav .sub-menu.level-1');
  if (clone && src) {
    $$(':scope > li', src).forEach(function (li) {
      var a = li.querySelector(':scope > a'), sub = li.querySelector(':scope > ul');
      var item = document.createElement('li');
      var row = document.createElement('div'); row.className = 'm-row';
      var link = document.createElement('a'); link.href = a.getAttribute('href'); link.textContent = a.textContent.trim(); row.appendChild(link);
      if (sub) {
        var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'm-toggle'; btn.setAttribute('aria-label', 'Expand'); btn.setAttribute('data-m-toggle', '');
        var spr = (document.querySelector('use[href*="sprite.svg"]') || { getAttribute: function () { return '/images/sprite.svg#x'; } }).getAttribute('href').split('#')[0];
        btn.innerHTML = '<svg aria-hidden="true"><use href="' + spr + '#i-caret"/></svg>'; row.appendChild(btn);
        var ul = document.createElement('ul'); ul.className = 'm-sub';
        $$(':scope > li > a', sub).forEach(function (sa) { var sli = document.createElement('li'); var sl = document.createElement('a'); sl.href = sa.getAttribute('href'); sl.textContent = sa.textContent.trim(); sli.appendChild(sl); ul.appendChild(sli); });
        item.appendChild(row); item.appendChild(ul);
      } else item.appendChild(row);
      clone.appendChild(item);
    });
  }
  /* ---- mobile nav ---- */
  function setNav(open) { body.classList.toggle('nav-open', open); $$('[data-nav-open]').forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); }); }
  $$('[data-nav-open]').forEach(function (b) { b.addEventListener('click', function () { setNav(true); }); });
  $$('[data-nav-close]').forEach(function (b) { b.addEventListener('click', function () { setNav(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
  $$('[data-m-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { b.parentElement.closest('li').classList.toggle('open'); });
  });

  /* ---- FAQ accordion ---- */
  $$('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var open = item.classList.contains('open');
      $$('.faq-item.open', item.parentElement).forEach(function (o) { o.classList.remove('open'); o.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); });
      if (!open) { item.classList.add('open'); q.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---- tabs ---- */
  $$('[data-tabs]').forEach(function (nav) {
    var root = nav.parentElement;
    $$('button[data-tab]', nav).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button[data-tab]', nav).forEach(function (x) { x.classList.remove('active'); });
        $$('.tab-pane', root).forEach(function (p) { p.classList.remove('active'); });
        b.classList.add('active');
        var pane = $('[data-pane="' + b.dataset.tab + '"]', root);
        if (pane) pane.classList.add('active');
      });
    });
  });

  /* ---- carousels (scroll-snap) ---- */
  $$('[data-carousel]').forEach(function (c) {
    var track = $('.track', c), dots = $('[data-dots]', c);
    var items = $$(':scope > *', track);
    if (!items.length) return;
    function perView() { var w = track.clientWidth, iw = items[0].getBoundingClientRect().width; return Math.max(1, Math.round(w / iw)); }
    function pages() { return Math.max(1, Math.ceil(items.length / perView())); }
    function current() { var iw = items[0].getBoundingClientRect().width + 24; return Math.round(track.scrollLeft / (iw * perView())); }
    function go(p) { var iw = items[0].getBoundingClientRect().width + 24; track.scrollTo({ left: p * iw * perView(), behavior: 'smooth' }); }
    function render() {
      if (!dots) return;
      var n = pages(), cur = Math.min(current(), n - 1);
      dots.innerHTML = '';
      for (var i = 0; i < n; i++) {
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Slide ' + (i + 1));
        if (i === cur) b.className = 'active';
        (function (i) { b.addEventListener('click', function () { go(i); }); })(i);
        dots.appendChild(b);
      }
    }
    var prev = $('[data-prev]', c), next = $('[data-next]', c);
    if (prev) prev.addEventListener('click', function () { go(Math.max(0, current() - 1)); });
    if (next) next.addEventListener('click', function () { go(Math.min(pages() - 1, current() + 1)); });
    var t; track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(render, 120); });
    window.addEventListener('resize', render);
    render();
  });

  /* ---- reveal on scroll ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.fade-up').forEach(function (el) { io.observe(el); });
  } else { $$('.fade-up').forEach(function (el) { el.classList.add('visible'); }); }

  /* ---- locations page ---- */
  var grid = $('[data-loc-grid]');
  if (grid) {
    var data = [];
    try { data = JSON.parse($('#cities-data').textContent); } catch (e) {}
    var input = $('[data-loc-input]'), empty = $('[data-loc-empty]'), nearest = $('[data-loc-nearest]');
    var cards = $$('.loc-card', grid);
    /* map <-> list sync */
    var mapEl = $('[data-loc-map]'), pins = mapEl ? $$('.pin', mapEl) : [];
    var pinBy = {}; pins.forEach(function (p) { pinBy[p.dataset.slug] = p; });
    var cardBy = {}; cards.forEach(function (c) { cardBy[c.dataset.slug] = c; });
    var labelBy = {}; if (mapEl) $$('.labels .name', mapEl).forEach(function (t) { labelBy[t.dataset.slug] = t; });
    /* ---- map pan / zoom (viewBox based; pins, labels and strokes scale back by 1/z in CSS) ---- */
    if (mapEl) (function () {
      var svg = $('svg', mapEl); if (!svg) return;
      var vb0 = svg.getAttribute('viewBox').split(/\s+/).map(Number), W0 = vb0[2], H0 = vb0[3];
      var z = 1, vx = 0, vy = 0, active = false, ZMAX = 8;
      var labels = $$('.labels .name', svg), chips = $$('[data-zoom-fit]', mapEl);
      function apply() {
        var w = W0 / z, h = H0 / z; vx = Math.max(0, Math.min(W0 - w, vx)); vy = Math.max(0, Math.min(H0 - h, vy));
        svg.setAttribute('viewBox', vx.toFixed(2) + ' ' + vy.toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2));
        svg.style.setProperty('--z', z.toFixed(3));
        svg.style.touchAction = z > 1.01 ? 'none' : 'pan-y';
        mapEl.classList.toggle('zoomed', z > 1.01); mapEl.classList.toggle('zoomed-deep', z >= 3);
        labels.forEach(function (t) { t.setAttribute('y', (parseFloat(t.dataset.py) - parseFloat(t.dataset.off) / z).toFixed(1)); });
        chips.forEach(function (b) { b.classList.remove('on'); });
      }
      /* at deep zoom, show the minor labels that fit: greedy, biggest cities first, hide any that would overlap */
      function layoutLabels() {
        var deep = z >= 3, taken = [];
        labels.forEach(function (t) { if (!t.classList.contains('minor')) { try { taken.push(t.getBBox()); } catch (e) {} } });
        labels.forEach(function (t) {
          if (!t.classList.contains('minor')) return;
          if (!deep) { t.classList.remove('clash'); return; }
          var b; try { b = t.getBBox(); } catch (e) { return; }
          var pad = 2 / z, clash = taken.some(function (r) { return b.x < r.x + r.width + pad && b.x + b.width + pad > r.x && b.y < r.y + r.height + pad && b.y + b.height + pad > r.y; });
          t.classList.toggle('clash', clash); if (!clash) taken.push(b);
        });
      }
      function zoomTo(nz, fx, fy) {
        nz = Math.max(1, Math.min(ZMAX, nz));
        if (fx == null) { fx = vx + W0 / z / 2; fy = vy + H0 / z / 2; }
        var rx = (fx - vx) / (W0 / z), ry = (fy - vy) / (H0 / z);
        z = nz; vx = fx - rx * (W0 / z); vy = fy - ry * (H0 / z); apply(); layoutLabels();
      }
      function fit(x, y, w, h) { var pad = 54; var nz = Math.min(W0 / (w + pad), H0 / (h + pad)); z = Math.max(1, Math.min(ZMAX, nz)); vx = x + w / 2 - W0 / z / 2; vy = y + h / 2 - H0 / z / 2; apply(); layoutLabels(); }
      function pt(cx, cy) { var r = svg.getBoundingClientRect(); return [vx + (cx - r.left) / r.width * (W0 / z), vy + (cy - r.top) / r.height * (H0 / z)]; }
      $$('[data-zoom-in]', mapEl).forEach(function (b) { b.addEventListener('click', function () { zoomTo(z * 1.6); }); });
      $$('[data-zoom-out]', mapEl).forEach(function (b) { b.addEventListener('click', function () { zoomTo(z / 1.6); }); });
      $$('[data-zoom-reset]', mapEl).forEach(function (b) { b.addEventListener('click', function () { z = 1; vx = 0; vy = 0; apply(); layoutLabels(); setHot(null); }); });
      chips.forEach(function (b) { b.addEventListener('click', function () { var a = b.dataset.zoomFit.split(',').map(Number); fit(a[0], a[1], a[2], a[3]); b.classList.add('on'); setHot(null); }); });
      svg.addEventListener('wheel', function (e) { if (!(e.ctrlKey || e.metaKey || active)) return; e.preventDefault(); var p = pt(e.clientX, e.clientY); zoomTo(z * (e.deltaY < 0 ? 1.25 : 0.8), p[0], p[1]); }, { passive: false });
      svg.addEventListener('dblclick', function (e) { e.preventDefault(); var p = pt(e.clientX, e.clientY); zoomTo(z * 1.7, p[0], p[1]); });
      var ptrs = {}, drag = null, moved = false, pinch = null;
      function ids() { return Object.keys(ptrs); }
      svg.addEventListener('pointerdown', function (e) {
        active = true; ptrs[e.pointerId] = e; var n = ids().length;
        if (n === 1) { drag = { x: e.clientX, y: e.clientY, vx: vx, vy: vy }; moved = false; }
        else if (n === 2) { var a = ptrs[ids()[0]], b = ptrs[ids()[1]]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: z }; drag = null; }
      });
      svg.addEventListener('pointermove', function (e) {
        if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = e; var r = svg.getBoundingClientRect();
        if (pinch && ids().length === 2) { var a = ptrs[ids()[0]], b = ptrs[ids()[1]]; var d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); var p = pt((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2); zoomTo(pinch.z * d / pinch.d, p[0], p[1]); moved = true; return; }
        if (drag && z > 1.01) { var dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; svg.classList.add('dragging'); } vx = drag.vx - dx / r.width * (W0 / z); vy = drag.vy - dy / r.height * (H0 / z); apply(); }
      });
      function up(e) { delete ptrs[e.pointerId]; if (ids().length < 2) pinch = null; if (!ids().length) { drag = null; svg.classList.remove('dragging'); } }
      svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up); svg.addEventListener('pointerleave', up);
      svg.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
      mapEl.addEventListener('mouseleave', function () { active = false; });
      /* nearest-pin hover and click: overlapping pins in a metro cluster no longer steal each other's hover */
      var pinPts = pins.map(function (p) { var m = /translate\(([\d.-]+)[ ,]([\d.-]+)\)/.exec(p.getAttribute('transform') || ''); return { el: p, slug: p.dataset.slug, x: m ? +m[1] : 0, y: m ? +m[2] : 0 }; });
      var cur = null;
      function nearest(cx, cy) { var p = pt(cx, cy), best = null, bd = 16 / z; pinPts.forEach(function (q) { var d = Math.hypot(q.x - p[0], q.y - p[1]); if (d < bd) { bd = d; best = q; } }); return best; }
      function setHot(q) { var slug = q ? q.slug : null; if (slug === cur) return; if (cur) hot(cur, false); cur = slug; if (cur) hot(cur, true); svg.classList.toggle('hot', !!cur); }
      svg.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse' || drag && moved) return; setHot(nearest(e.clientX, e.clientY)); });
      svg.addEventListener('pointerleave', function () { setHot(null); });
      svg.addEventListener('click', function (e) {
        if (moved) return;
        var q = nearest(e.clientX, e.clientY); if (!q) return;
        var c = cardBy[q.slug]; chooseCity(q.slug, c ? c.dataset.name : q.slug);
        window.location.href = q.el.getAttribute('href');
      });
      mapEl.setZoom = zoomTo; mapEl.fitBox = fit;
    })();
    function hot(slug, on) {
      var p = pinBy[slug], c = cardBy[slug], l = labelBy[slug];
      if (p) {
        p.classList.toggle('hot', on);
        /* draw a copy of the dot in a top layer so it is never hidden behind neighbouring pins (moving the real pin would re-trigger hover) */
        var hl = p.ownerSVGElement && p.ownerSVGElement.querySelector('[data-hover-layer]');
        if (hl) { while (hl.firstChild) hl.removeChild(hl.firstChild); if (on) { var g = p.cloneNode(true); g.removeAttribute('href'); g.removeAttribute('class'); g.setAttribute('class', 'ghost'); hl.appendChild(g); } }
      }
      if (l) { l.classList.toggle('hot', on); if (on) l.parentNode.appendChild(l); }      /* raise the label above neighbouring labels */
      if (c) c.classList.toggle('hot', on);
    }
    cards.forEach(function (c) { c.addEventListener('mouseenter', function () { hot(c.dataset.slug, true); }); c.addEventListener('mouseleave', function () { hot(c.dataset.slug, false); }); });
    cards.forEach(function (c) { c.addEventListener('click', function () { chooseCity(c.dataset.slug || c.getAttribute('href').replace(/.*?\/?([a-z0-9-]+)-weight-loss\/$/, '$1'), c.dataset.name); }); });
    document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-choose-city]'); if (a) chooseCity(a.dataset.chooseCity, a.dataset.chooseName); });
    function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
    function filter() {
      var q = norm(input.value), n = 0;
      cards.forEach(function (c) { var hit = !q || norm(c.dataset.name).indexOf(q) !== -1 || (c.dataset.ac || '').indexOf(q) !== -1; c.classList.toggle('hide', !hit); if (hit) n++; var p = pinBy[c.dataset.slug], l = labelBy[c.dataset.slug]; if (p) p.classList.toggle('dim', !!q && !hit); if (l) l.classList.toggle('dim', !!q && !hit); });
      empty.style.display = n ? 'none' : 'block';
    }
    input.addEventListener('input', filter);
    $('[data-loc-go]').addEventListener('click', function () {
      filter();
      var first = cards.filter(function (c) { return !c.classList.contains('hide'); })[0];
      if (first && cards.filter(function (c) { return !c.classList.contains('hide'); }).length === 1) { first.click(); }
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') $('[data-loc-go]').click(); });
    function dist(a, b, c, d) { var r = 3959, p = Math.PI / 180, x = (c - a) * p, y = (d - b) * p; var h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * p) * Math.cos(c * p) * Math.sin(y / 2) * Math.sin(y / 2); return 2 * r * Math.asin(Math.sqrt(h)); }
    $('[data-loc-geo]').addEventListener('click', function () {
      if (!navigator.geolocation) return;
      nearest.className = 'loc-nearest show'; nearest.textContent = 'Finding the closest city to you...';
      navigator.geolocation.getCurrentPosition(function (pos) {
        var best = null, bd = 1e9;
        data.forEach(function (c) { var d = dist(pos.coords.latitude, pos.coords.longitude, c.lat, c.lng); if (d < bd) { bd = d; best = c; } });
        if (!best) return;
        if (mapEl) {
          try {
            var pr = JSON.parse(mapEl.dataset.proj), you = $('[data-you]', mapEl);
            var x = pr.pad + (pos.coords.longitude - pr.minLng) * pr.k * pr.cosMid, y = pr.pad + (pr.maxLat - pos.coords.latitude) * pr.k;
            if (you) { you.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'); you.classList.add('on'); }
            pins.forEach(function (p) { p.classList.remove('near'); }); if (pinBy[best.slug]) pinBy[best.slug].classList.add('near');
          } catch (e) {}
        }
        nearest.innerHTML = '<div><strong>Closest city: ' + best.name + ', ' + best.st + '</strong><br><span style="color:#4B5563;font-size:14px">About ' + Math.round(bd) + ' miles from your location</span></div><a class="btn btn-primary btn-sm" data-choose-city="' + best.slug + '" data-choose-name="' + best.name + '" href="' + best.href + '">View ' + best.name + ' Plumbing</a>';
      }, function () { nearest.textContent = 'We could not read your location. Type your city above instead.'; });
    });
  }
})();
