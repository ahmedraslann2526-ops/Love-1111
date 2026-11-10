/* =========================================================
   11/11 Love Surprise — script.js
   ========================================================= */
(function () {
  "use strict";

  var PASSWORD = "love";
  var START_DATE = new Date("2026-04-01T00:00:00"); // تاريخ بداية العلاقة (بالتوقيت المحلي)

  var $ = function (sel) { return document.querySelector(sel); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1) خلفية الجسيمات (قلوب + نجوم) — Canvas خفيف
     --------------------------------------------------------- */
  var Particles = (function () {
    var canvas = $("#particles");
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = 1, items = [], running = false, last = 0;

    function count() {
      var area = W * H;
      var n = Math.round(area / 16000);
      return Math.max(18, Math.min(n, 46));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = count();
      while (items.length < target) items.push(make(true));
      if (items.length > target) items.length = target;
    }

    function make(randomY) {
      var isHeart = Math.random() < 0.45;
      return {
        heart: isHeart,
        x: Math.random() * W,
        y: randomY ? Math.random() * H : H + 20,
        size: isHeart ? 6 + Math.random() * 9 : 0.6 + Math.random() * 1.6,
        vy: isHeart ? 0.15 + Math.random() * 0.35 : 0.04 + Math.random() * 0.12,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.004 + Math.random() * 0.01,
        alpha: isHeart ? 0.25 + Math.random() * 0.45 : 0.3 + Math.random() * 0.7,
        twinkle: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.5 ? "255,77,109" : "255,143,171"
      };
    }

    function drawHeart(x, y, s) {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.3);
      ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
      ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
      ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
      ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
      ctx.fill();
    }

    function frame(t) {
      if (!running) return;
      var dt = Math.min((t - last) / 16.67, 3) || 1;
      last = t;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        p.y -= p.vy * dt;
        p.sway += p.swaySpeed * dt;
        p.twinkle += 0.03 * dt;
        var x = p.x + Math.sin(p.sway) * (p.heart ? 14 : 4);
        if (p.y < -30) { items[i] = make(false); continue; }
        if (p.heart) {
          ctx.fillStyle = "rgba(" + p.hue + "," + p.alpha + ")";
          drawHeart(x, p.y, p.size);
        } else {
          var a = p.alpha * (0.55 + 0.45 * Math.sin(p.twinkle));
          ctx.fillStyle = "rgba(255,230,238," + a + ")";
          ctx.beginPath();
          ctx.arc(x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
    function stop() { running = false; }

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(resize, 150);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    resize();
    if (reduceMotion) { frame(performance.now()); } // رسم ثابت مرة واحدة
    return { start: start };
  })();
  Particles.start();

  /* ---------------------------------------------------------
     2) الموسيقى
     --------------------------------------------------------- */
  var audio = $("#song");
  var musicBtn = $("#musicBtn");
  var musicPrompt = $("#musicPrompt");

  function setMusicUI(playing) {
    musicBtn.classList.toggle("is-paused", !playing);
    musicBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    musicBtn.setAttribute("aria-label", playing ? "إيقاف الأغنية" : "تشغيل الأغنية");
    if (playing) musicPrompt.hidden = true;
  }

  function playMusic() {
    var p;
    try { p = audio.play(); } catch (e) { p = null; }
    if (p && typeof p.then === "function") {
      p.then(function () { setMusicUI(true); })
       .catch(function () { setMusicUI(false); musicPrompt.hidden = false; });
    }
  }

  audio.addEventListener("play", function () { setMusicUI(true); });
  audio.addEventListener("pause", function () { setMusicUI(false); });
  audio.addEventListener("error", function () { musicBtn.hidden = true; musicPrompt.hidden = true; });

  musicBtn.addEventListener("click", function () {
    if (audio.paused) playMusic(); else audio.pause();
  });
  musicPrompt.addEventListener("click", playMusic);

  /* ---------------------------------------------------------
     3) شاشة كلمة السر
     --------------------------------------------------------- */
  var lock = $("#lock");
  var form = $("#lockForm");
  var input = $("#password");
  var errorEl = $("#lockError");
  var curtain = $("#curtain");
  var app = $("#app");
  var unlocked = false;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (unlocked) return;
    var value = (input.value || "").trim().toLowerCase();

    if (value !== PASSWORD) {
      errorEl.textContent = "مش دي كلمة السر يا قلبي، حاولي تاني 😘";
      errorEl.classList.remove("show");
      form.classList.remove("shake");
      void form.offsetWidth; // إعادة تشغيل الأنيميشن
      errorEl.classList.add("show");
      form.classList.add("shake");
      if (navigator.vibrate) { try { navigator.vibrate(120); } catch (err) {} }
      input.select();
      return;
    }

    unlocked = true;
    // تشغيل الأغنية فورًا داخل نفس ضغطة الزرار (مهم لـ iPhone Safari)
    playMusic();
    input.blur();
    errorEl.classList.remove("show");
    unlock();
  });

  input.addEventListener("input", function () {
    if (errorEl.classList.contains("show")) errorEl.classList.remove("show");
  });

  function unlock() {
    curtain.classList.add("play");
    lock.classList.add("is-leaving");

    setTimeout(function () {
      lock.hidden = true;
      document.body.classList.remove("is-locked");
      app.hidden = false;
      app.classList.add("is-revealed");
      musicBtn.hidden = false;
      window.scrollTo(0, 0);
      initReveal();
      Counter.start();
    }, reduceMotion ? 50 : 900);

    setTimeout(function () {
      curtain.classList.remove("play");
      curtain.hidden = true;
    }, reduceMotion ? 100 : 2100);
  }

  /* ---------------------------------------------------------
     4) عداد العلاقة
     --------------------------------------------------------- */
  var Counter = (function () {
    var el = {
      total: $("#totalDays"),
      months: $("#months"),
      remDays: $("#remDays"),
      d: $("#cDays"),
      h: $("#cHours"),
      m: $("#cMinutes"),
      s: $("#cSeconds")
    };
    var timer = null;

    // فرق الأيام التقويمية (مستقل عن التوقيت الصيفي)
    function dayDiff(a, b) {
      var ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
      var ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
      return Math.round((ub - ua) / 86400000);
    }

    function compute(now) {
      if (now < START_DATE) {
        return { total: 0, months: 0, remDays: 0, h: 0, m: 0, s: 0 };
      }
      var s0 = START_DATE;
      // الشهور الكاملة + الأيام المتبقية
      var months = (now.getFullYear() - s0.getFullYear()) * 12 + (now.getMonth() - s0.getMonth());
      var anchor = addMonths(s0, months);
      if (anchor > now) { months -= 1; anchor = addMonths(s0, months); }
      var remDays = dayDiff(anchor, now);

      // الوقت المنقضي: أيام + ساعات + دقائق + ثواني (حسب الساعة المحلية)
      var total = dayDiff(s0, now);
      var startClock = s0.getHours() * 3600 + s0.getMinutes() * 60 + s0.getSeconds();
      var nowClock = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      var secs = nowClock - startClock;
      if (secs < 0) { secs += 86400; total -= 1; remDays -= 1; }
      if (remDays < 0) { months -= 1; remDays = dayDiff(addMonths(s0, months), now) - 1; }

      return {
        total: total,
        months: months,
        remDays: remDays,
        h: Math.floor(secs / 3600),
        m: Math.floor((secs % 3600) / 60),
        s: secs % 60
      };
    }

    function addMonths(date, n) {
      var y = date.getFullYear();
      var m = date.getMonth() + n;
      var d = date.getDate();
      var lastDay = new Date(y, m + 1, 0).getDate();
      return new Date(y, m, Math.min(d, lastDay), date.getHours(), date.getMinutes(), date.getSeconds());
    }

    function pad(n) { return n < 10 ? "0" + n : String(n); }

    function set(node, value) {
      if (node.textContent === value) return;
      node.textContent = value;
      if (!reduceMotion && node.classList.contains("unit__num")) {
        node.classList.remove("tick");
        void node.offsetWidth;
        node.classList.add("tick");
      }
    }

    function render() {
      var r = compute(new Date());
      set(el.total, String(r.total));
      set(el.months, String(r.months));
      set(el.remDays, String(r.remDays));
      set(el.d, String(r.total));
      set(el.h, pad(r.h));
      set(el.m, pad(r.m));
      set(el.s, pad(r.s));
    }

    function start() {
      if (timer) return;
      render();
      // مزامنة مع بداية كل ثانية
      setTimeout(function () {
        render();
        timer = setInterval(render, 1000);
      }, 1000 - (Date.now() % 1000));
    }

    // متاح للاختبار من الكونسول
    window.__loveCounter = compute;

    return { start: start };
  })();

  /* ---------------------------------------------------------
     5) ظهور الأقسام بالتدريج
     --------------------------------------------------------- */
  function initReveal() {
    var nodes = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      nodes.forEach(function (n) { n.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------------------------------------------------------
     6) زر "بحبك" + البوب أب + انفجار القلوب
     --------------------------------------------------------- */
  var popup = $("#lovePopup");
  var loveBtn = $("#loveBtn");
  var burst = $("#burst");
  var HEARTS = ["❤️", "💖", "💗", "💕", "💘", "😍", "💋", "🌹"];
  var closeTimer = null;

  function heartBurst(cx, cy) {
    if (reduceMotion) return;
    var n = window.innerWidth < 500 ? 26 : 36;
    var frag = document.createDocumentFragment();
    var maxDist = Math.min(window.innerWidth, window.innerHeight) * 0.6;
    for (var i = 0; i < n; i++) {
      var s = document.createElement("span");
      var angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      var dist = maxDist * (0.45 + Math.random() * 0.55);
      s.textContent = HEARTS[i % HEARTS.length];
      s.style.setProperty("--x", cx + "px");
      s.style.setProperty("--y", cy + "px");
      s.style.setProperty("--tx", Math.cos(angle) * dist + "px");
      s.style.setProperty("--ty", Math.sin(angle) * dist + "px");
      s.style.setProperty("--s", (16 + Math.random() * 20) + "px");
      s.style.setProperty("--r", (Math.random() * 120 - 60) + "deg");
      s.style.setProperty("--d", (1 + Math.random() * 0.8) + "s");
      frag.appendChild(s);
    }
    burst.appendChild(frag);
    setTimeout(function () { burst.innerHTML = ""; }, 2000);
  }

  function openPopup() {
    clearTimeout(closeTimer);
    var r = loveBtn.getBoundingClientRect();
    heartBurst(r.left + r.width / 2, r.top + r.height / 2);
    popup.hidden = false;
    popup.classList.remove("closing");
    document.body.classList.add("popup-open");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        popup.classList.add("open");
        setTimeout(function () {
          heartBurst(window.innerWidth / 2, window.innerHeight / 2);
        }, 250);
      });
    });
    var closeBtn = popup.querySelector(".popup__close");
    setTimeout(function () { try { closeBtn.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }

  function closePopup() {
    if (popup.hidden) return;
    popup.classList.add("closing");
    popup.classList.remove("open");
    document.body.classList.remove("popup-open");
    closeTimer = setTimeout(function () {
      popup.hidden = true;
      popup.classList.remove("closing");
      try { loveBtn.focus({ preventScroll: true }); } catch (e) {}
    }, 420);
  }

  loveBtn.addEventListener("click", openPopup);
  popup.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closePopup();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePopup();
  });

  // تركيز تلقائي على خانة كلمة السر في الديسكتوب فقط (منعًا لظهور الكيبورد فجأة على الموبايل)
  if (window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    setTimeout(function () { input.focus(); }, 600);
  }
})();
