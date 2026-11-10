/* قوانین بین‌المللی — رفتارهای صفحه (سبک اپلیکیشن‌های iOS)
   تمام کد Vanilla JS است؛ بدون هیچ کتابخانه‌ای.
   بهبود تدریجی: بدون جاوااسکریپت هم همهٔ متن‌ها خوانا و در دسترس‌اند. */
(function () {
  'use strict';

  var d = document;
  var root = d.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function faNum(n) {
    return String(n).replace(/\d/g, function (ch) {
      return '۰۱۲۳۴۵۶۷۸۹'[+ch];
    });
  }

  /* ---------- تم تیره/روشن ---------- */
  var themeBtn = d.getElementById('theme-toggle');
  var metaTheme = d.getElementById('meta-theme');
  function paintMeta() {
    if (!metaTheme) return;
    metaTheme.setAttribute('content',
      root.dataset.theme === 'light' ? '#f2f2f7' : '#000000');
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.dataset.theme === 'light' ? '' : 'light';
      if (next) { root.dataset.theme = next; } else { delete root.dataset.theme; }
      try { localStorage.setItem('intl-theme', next); } catch (e) {}
      themeBtn.setAttribute('aria-pressed', String(next === 'light'));
      paintMeta();
    });
  }
  paintMeta();

  /* ---------- نوار بالا: خط مویی + عنوان کوچک هنگام اسکرول ---------- */
  var navbar = d.querySelector('.navbar');
  var largeTitle = d.querySelector('.large-title');
  if (navbar) {
    var onNavScroll = function () {
      navbar.classList.toggle('is-stuck', window.scrollY > 4);
    };
    onNavScroll();
    window.addEventListener('scroll', onNavScroll, { passive: true });
  }
  if (navbar && largeTitle && 'IntersectionObserver' in window) {
    var titleIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        // وقتی عنوان بزرگ از زیر نوار رد شد، عنوان کوچک ظاهر می‌شود
        navbar.classList.toggle('is-titled',
          !en.isIntersecting && en.boundingClientRect.top < en.rootBounds.top + 60);
      });
    }, { rootMargin: '-60px 0px 0px 0px', threshold: 0 });
    titleIO.observe(largeTitle);
  }

  /* ---------- بلوک ابزار سند: ارتفاع ثابت، بدون جمع‌شدن (جلوگیری از پرش محتوا) ---------- */
  var tools = d.getElementById('doc-tools');
  var searchInput = d.getElementById('doc-search');

  /* ---------- نمایان‌شدن بخش‌ها هنگام اسکرول ---------- */
  var revealEls = Array.prototype.slice.call(d.querySelectorAll('.reveal'));
  // کارت‌های سند هم آرام ظاهر می‌شوند
  d.querySelectorAll('.doc-list .art').forEach(function (a) {
    if (!reduceMotion) a.classList.add('reveal');
    revealEls.push(a);
  });
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('seen');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('seen'); });
  }

  /* ---------- HUD اطلاع‌رسانی (مثل iOS) ---------- */
  var hud = d.createElement('div');
  hud.className = 'hud';
  hud.setAttribute('role', 'status');
  hud.setAttribute('aria-live', 'polite');
  hud.innerHTML =
    '<div class="hud-pill">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12.8 9.6 18 19.5 6.8"/></svg>' +
    '<span class="hud-text"></span></div>';
  d.body.appendChild(hud);
  var hudText = hud.querySelector('.hud-text');
  var hudTimer = null;
  function showHud(msg) {
    hudText.textContent = msg;
    hud.classList.add('show');
    clearTimeout(hudTimer);
    hudTimer = setTimeout(function () { hud.classList.remove('show'); }, 1500);
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
  function markDone(btn) {
    btn.classList.add('done');
    setTimeout(function () { btn.classList.remove('done'); }, 1600);
  }
  d.querySelectorAll('.art[data-title]').forEach(function (art) {
    var cBtn = art.querySelector('.js-copy');
    if (cBtn) {
      cBtn.addEventListener('click', function () {
        copyText(plainText(art), function () { markDone(cBtn); showHud('متن ماده کپی شد'); });
      });
    }
    var lBtn = art.querySelector('.js-link');
    if (lBtn) {
      lBtn.addEventListener('click', function () {
        var url = location.origin + location.pathname + '#' + art.id;
        if (history.replaceState) history.replaceState(null, '', '#' + art.id);
        copyText(url, function () { markDone(lBtn); showHud('لینک ماده کپی شد'); });
      });
    }
  });

  /* ---------- جستجو در متن سند ---------- */
  if (searchInput) {
    var allArts = Array.prototype.slice.call(d.querySelectorAll('.art'));
    var meta = d.querySelector('.search-meta');
    var noResult = d.querySelector('.no-result');
    var field = searchInput.closest('.search-field');
    var clearBtn = d.querySelector('.search-clear');

    // یکسان‌سازی حروف برای مقایسه: ی/ي و ك عربی، نیم‌فاصله، ا/أ/إ/آ، ة/ه، رقم فارسی/لاتین
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
          if (node.parentElement.closest('.art-tools')) return NodeFilter.FILTER_REJECT;
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
        var a = idx, b = idx + q.length;
        // نیم‌فاصله در یکسان‌سازی به فاصله تبدیل شده؛ پوشش پیرامونی برای اطمینان
        if (raw.length !== hay.length) {
          a = Math.max(0, idx - 1);
          b = Math.min(raw.length, idx + q.length + 1);
        }
        var range = d.createRange();
        range.setStart(node, a); range.setEnd(node, b);
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
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        runSearch();
        searchInput.focus();
      });
    }
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
      noResult.classList.toggle('show', Boolean(q) && shown === 0);
      field.classList.toggle('has-value', searchInput.value.length > 0);
      tools.classList.toggle('is-searching', Boolean(q));
      if (meta) meta.textContent = q ? (faNum(shown) + ' ماده') : '';
    }
    runSearch();
  }

  /* ---------- تراشه‌های فهرست: پیمایش فعال + پرش ---------- */
  var chips = Array.prototype.slice.call(d.querySelectorAll('.chip[href^="#"]'));
  if (chips.length) {
    var chipsEl = d.querySelector('.chips');
    var chipArts = chips.map(function (c) { return d.getElementById(c.getAttribute('href').slice(1)); })
      .filter(Boolean);

    // وسط‌چین‌کردن تراشهٔ فعال — فقط داخل خودِ نوار تراشه‌ها، بدون هیچ تکان صفحه
    var userChipScrollUntil = 0;
    if (chipsEl) {
      ['pointerdown', 'wheel', 'touchstart'].forEach(function (ev) {
        chipsEl.addEventListener(ev, function () {
          userChipScrollUntil = Date.now() + 1400;
        }, { passive: true });
      });
    }
    function centerChip(c, smooth) {
      if (!chipsEl || Date.now() < userChipScrollUntil) return;
      var cr = chipsEl.getBoundingClientRect();
      var r = c.getBoundingClientRect();
      if (r.left >= cr.left && r.right <= cr.right) return;   // کامل دیده می‌شود
      var target = chipsEl.scrollLeft + (r.left + r.width / 2 - (cr.left + cr.width / 2));
      chipsEl.scrollTo({
        left: target,
        behavior: smooth && !reduceMotion ? 'smooth' : 'auto'
      });
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function (e) {
        e.preventDefault();
        chips.forEach(function (x) { x.classList.remove('is-active'); });
        c.classList.add('is-active');
        userChipScrollUntil = 0;
        centerChip(c, true);
        var t = d.getElementById(c.getAttribute('href').slice(1));
        if (t) t.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start'
        });
        history.replaceState(null, '', c.getAttribute('href'));
      });
    });

    // نشان‌گر تراشهٔ فعال هنگام اسکرول
    if ('IntersectionObserver' in window) {
      var active = null;
      var chipIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) active = en.target.id;
        });
        chips.forEach(function (c) {
          var on = c.getAttribute('href') === '#' + active;
          c.classList.toggle('is-active', on);
          if (on) centerChip(c, true);
        });
      }, { rootMargin: '-35% 0px -55% 0px' });
      chipArts.forEach(function (s) { chipIO.observe(s); });
    }
  }

  /* ---------- پرش به نشانی عمیق هنگام باز شدن صفحه ---------- */
  if (location.hash) {
    var target = d.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('art')) {
      target.classList.add('flash');
      setTimeout(function () {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }, 60);
      setTimeout(function () { target.classList.remove('flash'); }, 2200);
    }
  }
})();
