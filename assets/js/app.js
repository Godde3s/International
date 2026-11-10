/* قوانین بین‌المللی — رفتارهای صفحه
   همهٔ کد Vanilla JS است؛ هیچ کتابخانه‌ای در کار نیست. */
(function () {
  'use strict';

  var d = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- تم تیره/روشن ---------- */
  var themeBtn = d.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var root = d.documentElement;
      var next = root.dataset.theme === 'light' ? '' : 'light';
      if (next) { root.dataset.theme = next; } else { delete root.dataset.theme; }
      try { localStorage.setItem('intl-theme', next); } catch (e) {}
      themeBtn.setAttribute('aria-pressed', String(next === 'light'));
    });
  }

  /* ---------- سربرگ چسبان ---------- */
  var head = d.querySelector('.site-head');
  if (head) {
    var onScrollHead = function () {
      head.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScrollHead();
    window.addEventListener('scroll', onScrollHead, { passive: true });
  }

  /* ---------- بازگشت به بالا ---------- */
  var toTop = d.querySelector('.to-top');
  if (toTop) {
    var onScrollTop = function () {
      toTop.classList.toggle('show', window.scrollY > 620);
    };
    onScrollTop();
    window.addEventListener('scroll', onScrollTop, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- نمایان‌شدن بخش‌ها هنگام اسکرول ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('seen');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08 });
    d.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    d.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('seen'); });
  }

  /* ---------- مُهرِ سرلوحه ---------- */
  var seal = d.querySelector('.hero-seal .seal');
  if (seal && !reduceMotion) seal.classList.add('stamp-in');

  /* ---------- شمارش استارت: نشان‌گر راه‌رفته روی رقم‌ها ---------- */
  var cd = d.querySelector('.countdown .cd-digits');
  if (cd && !reduceMotion) {
    var cells = cd.querySelectorAll('span');
    var i = 0;
    setInterval(function () {
      cells.forEach(function (c) { c.classList.remove('lit'); });
      cells[i % cells.length].classList.add('lit');
      i++;
    }, 420);
  }

  /* ---------- فهرست فعال ---------- */
  var tocLinks = Array.prototype.slice.call(d.querySelectorAll('.toc a[href^="#"]'));
  var arts = tocLinks.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);
  if (arts.length && 'IntersectionObserver' in window) {
    var active = null;
    var tocIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) active = en.target.id;
      });
      tocLinks.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + active);
      });
    }, { rootMargin: '-30% 0px -55% 0px' });
    arts.forEach(function (s) { tocIO.observe(s); });
  }

  /* ---------- ابزارها: کپی متن، کپی لینک ---------- */
  function plainText(el) {
    var clone = el.cloneNode(true);
    var rm = clone.querySelectorAll('.art-tools, .art-head .no, .no-result');
    rm.forEach(function (n) { n.remove(); });
    return (clone.textContent || '').replace(/\s*\n\s*/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
  }
  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else { fallbackCopy(text, done); }
  }
  function fallbackCopy(text, done) {
    var ta = d.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    d.body.appendChild(ta);
    ta.select();
    try { d.execCommand('copy'); } catch (e) {}
    d.body.removeChild(ta);
    done();
  }
  function markDone(btn, labelDone) {
    btn.classList.add('done');
    var lbl = btn.querySelector('.tb-label');
    var old = lbl ? lbl.textContent : '';
    if (lbl) lbl.textContent = labelDone;
    setTimeout(function () {
      btn.classList.remove('done');
      if (lbl) lbl.textContent = old;
    }, 1600);
  }
  d.querySelectorAll('.art[data-title]').forEach(function (art) {
    var title = art.getAttribute('data-title');
    var cBtn = art.querySelector('.js-copy');
    if (cBtn) {
      cBtn.addEventListener('click', function () {
        copyText(plainText(art), function () { markDone(cBtn, 'کپی شد'); });
      });
    }
    var lBtn = art.querySelector('.js-link');
    if (lBtn) {
      lBtn.addEventListener('click', function () {
        var url = location.origin + location.pathname + '#' + art.id;
        if (history.replaceState) history.replaceState(null, '', '#' + art.id);
        copyText(url, function () { markDone(lBtn, 'لینک کپی شد'); });
      });
    }
  });

  /* ---------- جستجو در متن سند ---------- */
  var searchInput = d.getElementById('doc-search');
  if (searchInput) {
    var allArts = Array.prototype.slice.call(d.querySelectorAll('.art'));
    var meta = d.querySelector('.search-meta');
    var noResult = d.querySelector('.no-result');

    // یکسان‌سازی حروف برای مقایسه: ی/ك عربی، نیم‌فاصله، ا/أ/إ/آ، رقم فارسی/لاتین
    function norm(s) {
      return String(s)
        .replace(/[\u200c\u200f\u200e]/g, ' ')
        .replace(/[یى]/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/[أإآ]/g, 'ا')
        .replace(/[ة]/g, 'ه')
        .replace(/[۰-۹]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) - 1728); })
        .replace(/\s+/g, ' ')
        .toLowerCase();
    }
    allArts.forEach(function (art) {
      art._hay = norm((art.getAttribute('data-title') || '') + ' ' + plainText(art));
    });
    // بازنشانی هایلایت‌ها (برگشت متن از داخل mark)
    function resetMarks() {
      allArts.forEach(function (art) {
        art.querySelectorAll('mark[data-dyn]').forEach(function (m) {
          var parent = m.parentNode;
          parent.replaceChild(d.createTextNode(m.textContent), m);
          parent.normalize();
        });
      });
    }
    function highlight(art, q) {
      var walker = d.createTreeWalker(art, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          var p = node.parentElement;
          if (p.closest('.art-tools')) return NodeFilter.FILTER_REJECT;
          return norm(node.nodeValue).indexOf(q) !== -1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      var hits = [];
      while (walker.nextNode()) hits.push(walker.currentNode);
      hits.forEach(function (node) {
        var hay = norm(node.nodeValue);
        var raw = node.nodeValue;
        var idx = hay.indexOf(q);
        if (idx === -1) return;
        // نگاشت تقریبی موقعیت پس از یکسان‌سازی به متن خام (طول‌ها برابرند؛ یکسان‌سازی طول را تغییر نمی‌دهد به جز نیم‌فاصله)
        if (raw.length !== hay.length) {
          // نیم‌فاصله به فاصله تبدیل شده؛ جستجو در متن خام با پوشش پیرامونی
          var a = Math.max(0, idx - 1), b = Math.min(raw.length, idx + q.length + 1);
          var range = document.createRange();
          range.setStart(node, a); range.setEnd(node, b);
          var m = d.createElement('mark');
          m.setAttribute('data-dyn', '1');
          try { range.surroundContents(m); } catch (e) {}
          return;
        }
        var range = document.createRange();
        range.setStart(node, idx); range.setEnd(node, idx + q.length);
        var m = d.createElement('mark');
        m.setAttribute('data-dyn', '1');
        try { range.surroundContents(m); } catch (e) {}
      });
    }

    var tId = null;
    searchInput.addEventListener('input', function () {
      clearTimeout(tId);
      tId = setTimeout(runSearch, 120);
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { searchInput.value = ''; runSearch(); }
    });
    // کلید میان‌بر «/»
    d.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/input|textarea/i.test(d.activeElement.tagName)) {
        e.preventDefault();
        searchInput.focus();
      }
    });

    function runSearch() {
      var q = norm(searchInput.value.trim());
      resetMarks();
      var shown = 0;
      allArts.forEach(function (art) {
        var hit = !q || art._hay.indexOf(q) !== -1;
        art.classList.toggle('is-hidden', !hit);
        if (hit) { shown++; if (q) highlight(art, q); }
      });
      noResult.classList.toggle('show', q && shown === 0);
      if (meta) meta.textContent = q ? (shown + ' ماده') : '';
    }
    runSearch();
  }

  /* ---------- پرش به نشانی عمیق هنگام بازشدن صفحه ---------- */
  if (location.hash) {
    var target = d.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('art')) {
      target.classList.add('flash');
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }
})();
