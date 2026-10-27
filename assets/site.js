/* Rapide Pro Transport Déménagement : menu, tunnel de devis, formulaire pros. Sans framework. */
(function () {
  'use strict';
  var W = window, D = document;
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };

  /* Menu téléphone */
  var burger = $('.burger'), nav = $('nav.main');
  if (burger) burger.addEventListener('click', function () {
    var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
  });


  /* Ouverture au défilement : trois images qui se fondent, un léger zoom, des légendes. Écritures seulement quand la valeur change. */
  var intro = $('#intro');
  if (intro && D.documentElement.classList.contains('js')) {
    var scenes = $$('.scene', intro), caps = $$('.c', intro), cue = $('.cue', intro), stage = $('.intro-stage', intro);
    var last = { o: [], z: [], c: -1, q: -1 };
    var ss = function (a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    var ticking = false;
    var draw = function () {
      ticking = false;
      var total = intro.offsetHeight - stage.offsetHeight; if (total <= 0) return;
      var p = Math.max(0, Math.min(1, -intro.getBoundingClientRect().top / total));
      var o = [1 - ss(.30, .42, p), ss(.30, .42, p) - ss(.64, .76, p), ss(.64, .76, p)];
      scenes.forEach(function (s, i) {
        var op = o[i].toFixed(3); if (op !== last.o[i]) { s.style.opacity = op; last.o[i] = op; }
        var z = (1 + .1 * ss(i * .32 - .12, i * .32 + .5, p)).toFixed(3);
        if (z !== last.z[i]) { s.firstElementChild.nextElementSibling.style.setProperty('--z', z); last.z[i] = z; }
      });
      var c = p < .36 ? 0 : p < .7 ? 1 : 2;
      if (c !== last.c) { caps.forEach(function (e, i) { e.classList.toggle('on', i === c); }); last.c = c; }
      var q = (1 - ss(0, .06, p)).toFixed(2); if (q !== last.q && cue) { cue.style.opacity = q; last.q = q; }
    };
    var req = function () { if (!ticking) { ticking = true; W.requestAnimationFrame(draw); } };
    W.addEventListener('scroll', req, { passive: true }); W.addEventListener('resize', req); draw();
    var sticky = $('#sticky');
    if (sticky && 'IntersectionObserver' in W) new IntersectionObserver(function (es) { sticky.style.visibility = es[0].isIntersecting ? 'hidden' : ''; }, { threshold: 0 }).observe(intro);
  }

  function post(f) {
    if (D.body.hasAttribute('data-demo')) return Promise.resolve({ ok: true }); // version de démonstration : rien n'est envoyé
    return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() });
  }
  try { var sp = new URLSearchParams(W.location.search).get('source'); var so = $('#source'); if (sp && so) so.value = sp.slice(0, 40); } catch (e) {}

  /* Tunnel de devis, 7 étapes */
  var form = $('#f-devis');
  if (form) {
    form.classList.add('steps-on');
    var steps = $$('.step', form), cur = 1, KEY = 'rp-devis-v2';
    var pstep = $('#pstep'), prev = $('#prev'), next = $('#next'), send = $('#send'), err = $('#err');
    var save = function () {
      try {
        var o = {}; new FormData(form).forEach(function (v, k) { if (k === 'bot-field' || k === 'form-name') return; o[k] = o[k] ? o[k] + '|' + v : v; });
        W.localStorage.setItem(KEY, JSON.stringify(o));
      } catch (e) {}
    };
    var restore = function () {
      var o = {}; try { o = JSON.parse(W.localStorage.getItem(KEY) || '{}'); } catch (e) {}
      Object.keys(o).forEach(function (k) {
        var els = form.elements[k]; if (!els) return;
        var vals = String(o[k]).split('|'), list = els.length !== undefined && !els.tagName ? Array.prototype.slice.call(els) : [els];
        list.forEach(function (el) {
          if (el.type === 'radio' || el.type === 'checkbox') el.checked = vals.indexOf(el.value) > -1;
          else if (el.type !== 'hidden') el.value = vals[0];
        });
      });
    };
    var show = function (n) {
      cur = Math.max(1, Math.min(steps.length, n));
      steps.forEach(function (s, i) { s.classList.toggle('on', i + 1 === cur); });
      pstep.textContent = 'ÉTAPE ' + cur + ' SUR ' + steps.length;
      form.style.setProperty('--step', cur);
      prev.hidden = cur === 1; next.hidden = cur === steps.length; send.hidden = cur !== steps.length;
      err.textContent = '';
      if (n > 1 || cur > 1) form.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
    var valid = function () {
      var f = $$('input, select, textarea', steps[cur - 1]);
      for (var i = 0; i < f.length; i++) if (!f[i].checkValidity()) { f[i].reportValidity(); return false; }
      return true;
    };
    next.addEventListener('click', function () { if (valid()) { save(); show(cur + 1); } });
    prev.addEventListener('click', function () { show(cur - 1); });
    form.addEventListener('input', save);
    $$('[data-s]', form).forEach(function (b) { b.addEventListener('click', function () { $('#surf').value = b.dataset.s; save(); }); });
    var items = [], weight = 0;
    $$('#meubles button', form).forEach(function (b) {
      b.addEventListener('click', function () {
        items.push(b.dataset.n); weight += +b.dataset.w;
        var fill = Math.min(1, weight / 22); $('.truck .box', form).style.setProperty('--fill', fill.toFixed(2));
        $('#tmeta').textContent = fill >= 1 ? 'CAMION PLEIN : ' + items.length + ' ÉLÉMENTS' : 'LE CAMION SE REMPLIT : ' + items.length + ' ÉLÉMENT' + (items.length > 1 ? 'S' : '');
        $('#meubles-val').value = items.join(', '); save();
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid()) return;
      send.disabled = true; err.textContent = '';
      post(form).then(function (r) {
        if (!r.ok) throw new Error('envoi');
        $$('.step, .progress, .actions, .err', form).forEach(function (el) { el.style.display = 'none'; });
        $('#ok').classList.add('on'); try { W.localStorage.removeItem(KEY); } catch (x) {}
      }).catch(function () {
        send.disabled = false; err.textContent = "L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez : vos réponses sont gardées.";
      });
    });
    restore(); cur = 1; steps.forEach(function (s, i) { s.classList.toggle('on', i === 0); }); prev.hidden = true; send.hidden = true;
  }

  /* Formulaire des pros */
  var f2 = $('#f-collab');
  if (f2) f2.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = $$('input, select, textarea', f2).filter(function (el) { return !el.checkValidity(); })[0];
    if (bad) { bad.reportValidity(); return; }
    $('#err2').textContent = '';
    post(f2).then(function (r) {
      if (!r.ok) throw new Error('envoi');
      $$('.field, .row2, .check, .actions, .err', f2).forEach(function (el) { el.style.display = 'none'; });
      $('#ok2').classList.add('on');
    }).catch(function () { $('#err2').textContent = "L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez."; });
  });
})();
