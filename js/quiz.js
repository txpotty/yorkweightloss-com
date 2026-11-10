/* Get Started quiz: intent test. Every step fires a beacon to Mission Control (/t/click with k=quiz_*), no backend otherwise. */
(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = $('[data-quiz]'); if (!root) return;
  var data; try { data = JSON.parse($('#quiz-data').textContent); } catch (e) { return; }
  var body = document.body, baseIntent = body.dataset.quizIntent || 'default', intent = baseIntent, baseGender = body.dataset.quizGender || 'f', gender = baseGender;
  var city = body.dataset.cityName || '', biz = body.dataset.business || '';
  var tok = function (s) { return String(s).replace(/\{\{city\}\}/g, city).replace(/\{\{business\}\}/g, biz); };
  var BASE = 'https://dashboard.ace.contractors';
  var sid; try { sid = sessionStorage.getItem('_t_sid'); if (!sid) { sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); sessionStorage.setItem('_t_sid', sid); } } catch (e) { sid = ''; }
  var src = ''; try { src = sessionStorage.getItem('_t_src') || ''; } catch (e) {}
  var sentOnce = {};
  function track(k, v, once) {
    if (once && sentOnce[k]) return; sentOnce[k] = 1;
    try {
      var payload = JSON.stringify({ d: location.hostname, p: location.pathname, t: Date.now(), phone: '', k: k, v: v ? String(v).slice(0, 120) : undefined, s: src, sid: sid });
      if (navigator.sendBeacon) navigator.sendBeacon(BASE + '/t/click', new Blob([payload], { type: 'text/plain' }));
      else { var x = new XMLHttpRequest(); x.open('POST', BASE + '/t/click', true); x.timeout = 2000; x.setRequestHeader('Content-Type', 'text/plain'); x.send(payload); }
    } catch (e) {}
  }
  var titleEl = $('[data-quiz-title]', root), optsEl = $('[data-quiz-options]', root), actEl = $('[data-quiz-actions]', root), nextBtn = $('[data-quiz-next]', root), bar = $('[data-quiz-bar]', root), bodyEl = $('[data-quiz-body]', root);
  var step = 0, answers = {}, opened = false, lastFocus = null, openSrc = '';
  var steps = data.steps;
  function pick(obj) { return obj[intent] || obj['default']; }
  function progress(i) { if (i >= steps.length) { bar.hidden = true; return; } bar.hidden = false; var h = ''; for (var k = 0; k < steps.length; k++) h += '<i class="' + (k < i ? 'on' : k === i ? 'now' : '') + '"></i>'; bar.innerHTML = h; }
  function open(srcName, pick) {
    openSrc = srcName || ''; lastFocus = document.activeElement; intent = baseIntent; gender = baseGender;
    root.hidden = false; body.classList.add('quiz-open'); step = 0; answers = {};
    track('quiz_start', openSrc + (intent !== 'default' ? '|' + intent : ''));
    if (pick && data.picker) picker(); else render();
    setTimeout(function () { var f = $('button, input', bodyEl); if (f) f.focus(); }, 30);
  }
  function close() { root.hidden = true; body.classList.remove('quiz-open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  /* "See treatments": category picker first, then the flow tailored to that category */
  function picker() {
    bar.hidden = true; actEl.hidden = true; titleEl.hidden = false; titleEl.textContent = tok(data.picker.title);
    optsEl.className = 'quiz-options picker';
    optsEl.innerHTML = '<p class="quiz-lead-sub">' + tok(data.picker.sub) + '</p>';
    data.picker.options.forEach(function (o) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'quiz-opt'; b.innerHTML = '<span>' + o.label.replace(/&/g, '&amp;') + '</span>';
      b.addEventListener('click', function () { intent = o.intent || 'default'; if (o.gender) gender = o.gender; answers.area = o.label; track('quiz_pick', o.label); setTimeout(render, 180); });
      optsEl.appendChild(b);
    });
  }
  function render() {
    var s = steps[step]; progress(step);
    var title = s.id === 'treatment' ? (data.intro_by_intent[intent] || s.title) : ((s.titles && s.titles[intent]) || s.title);
    titleEl.textContent = tok(title); titleEl.hidden = false;
    optsEl.innerHTML = ''; optsEl.className = 'quiz-options' + (s.type === 'multi' ? ' multi' : '');
    pick(s.options).forEach(function (label) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'quiz-opt'; b.setAttribute('role', s.type === 'multi' ? 'checkbox' : 'radio'); b.setAttribute('aria-checked', 'false');
      b.innerHTML = '<span>' + label.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span><i class="box" aria-hidden="true"></i>';
      b.addEventListener('click', function () {
        if (s.type === 'multi') {
          var on = b.getAttribute('aria-checked') === 'true'; b.setAttribute('aria-checked', on ? 'false' : 'true'); b.classList.toggle('on', !on);
          actEl.hidden = !$$('.quiz-opt.on', optsEl).length;
        } else { $$('.quiz-opt', optsEl).forEach(function (o) { o.classList.remove('on'); }); b.classList.add('on'); answers[s.id] = label; track('quiz_q' + (step + 1), label); setTimeout(advance, 220); }
      });
      optsEl.appendChild(b);
    });
    actEl.hidden = true;
  }
  function advance() {
    var s = steps[step];
    if (s.type === 'multi') { var picked = $$('.quiz-opt.on', optsEl).map(function (o) { return o.textContent.trim(); }); if (!picked.length) return; answers[s.id] = picked.join(', '); track('quiz_q' + (step + 1), answers[s.id]); }
    step++;
    if (step < steps.length) render(); else loading();
  }
  nextBtn.addEventListener('click', advance);
  function loading() {
    progress(steps.length); actEl.hidden = true;
    titleEl.textContent = tok(data.loading.title);
    optsEl.className = 'quiz-options loading'; optsEl.innerHTML = '<div class="quiz-spark" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M32 2c2 14 8 26 30 30-22 4-28 16-30 30-2-14-8-26-30-30 22-4 28-16 30-30z"/></svg></div><p class="quiz-loading-sub">Matching your answers with treatments available in ' + (city || 'your area') + '</p>';
    track('quiz_done', answers.treatment || '');
    setTimeout(result, data.loading.ms || 2500);
  }
  /* "Good news" screen: generic headline (not everyone came in through an eligibility CTA), a cutout portrait with no background
     underneath, gender-matched to the intent (men's sexual health and men's hair loss show a man). */
  function result() {
    progress(steps.length + 1); titleEl.hidden = true;
    var r = data.result, img = root.dataset[gender === 'm' ? 'imgM' : 'imgF'] || '';
    optsEl.className = 'quiz-options good';
    optsEl.innerHTML = '<div class="quiz-good"><h2>' + tok(r.title) + '</h2><p>' + tok(r.sub) + '</p><button type="button" class="btn btn-accent" data-quiz-plan>' + tok(r.cta) + '</button></div>' + (img ? '<div class="quiz-cutout"><img src="' + img + '" alt="" width="640" height="800" loading="eager"></div>' : '');
    var b = $('[data-quiz-plan]', optsEl); b.focus(); b.addEventListener('click', function () { track('quiz_plan', answers.treatment || ''); lead(); });
  }
  function lead() {
    var L = data.lead; titleEl.hidden = true;
    optsEl.className = 'quiz-options lead';
    optsEl.innerHTML = '<div class="quiz-good"><h2>' + tok(L.title) + '</h2><p>' + tok(L.sub) + '</p><form class="quiz-lead-form" novalidate><label class="quiz-field"><span>' + (L.label || 'Email') + '</span><input type="email" name="email" required autocomplete="email" inputmode="email"></label><button type="submit" class="btn btn-accent">' + tok(L.cta) + '</button></form></div>';
    var form = $('form', optsEl), input = $('input', optsEl); input.focus();
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var v = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { input.parentNode.classList.add('bad'); input.focus(); return; }
      track('quiz_lead', v);
      titleEl.hidden = false; titleEl.textContent = tok(L.done_title); optsEl.className = 'quiz-options';
      optsEl.innerHTML = '<div class="quiz-done"><div class="quiz-spark small" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M32 2c2 14 8 26 30 30-22 4-28 16-30 30-2-14-8-26-30-30 22-4 28-16 30-30z"/></svg></div><p>' + tok(L.done_sub) + '</p><button type="button" class="btn btn-primary" data-quiz-close>Done</button></div>';
      $('[data-quiz-close]', optsEl).addEventListener('click', close);
    });
  }
  $$('[data-quiz-open]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); open(b.dataset.quizSrc || 'cta', b.hasAttribute('data-quiz-pick')); }); });
  $$('[data-quiz-close]', root).forEach(function (b) { b.addEventListener('click', close); });
  root.addEventListener('click', function (e) { if (e.target === root) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !root.hidden) close(); });
  if (/[?#&]start\b/.test(location.search + location.hash)) open('url');
  if (/[?#&]treatments\b/.test(location.search + location.hash)) open('url', true);
})();
