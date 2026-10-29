/* ============================================================
   bell · Ops Engineer — 交互脚本
   无依赖，全部原生 API
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 年份 ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 主题切换 ---------- */
  var rootEl = document.documentElement;
  var themeToggle = document.getElementById("themeToggle");
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function currentTheme() {
    return rootEl.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function syncTheme(theme) {
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "light" ? "切换到深色模式" : "切换到浅色模式"
      );
    }
    if (themeMeta) {
      themeMeta.setAttribute("content", theme === "light" ? "#f7f6f2" : "#06070a");
    }
  }

  syncTheme(currentTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = currentTheme() === "light" ? "dark" : "light";
      if (next === "light") rootEl.setAttribute("data-theme", "light");
      else rootEl.removeAttribute("data-theme");
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
      syncTheme(next);
    });
  }

  /* ---------- 导航滚动状态 ---------- */
  var nav = document.getElementById("nav");
  var progressBar = document.getElementById("progressBar");

  /* ---------- 移动端菜单 ---------- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  function closeMenu() {
    if (!navLinks || !navToggle) return;
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "打开菜单");
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    });

    navLinks.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- 滚动进度 + 当前区块 ---------- */
  var sections = Array.prototype.slice.call(
    document.querySelectorAll("main section[id]")
  );
  var links = Array.prototype.slice.call(
    document.querySelectorAll(".nav-link")
  );

  var ticking = false;
  var toTop = document.getElementById("toTop");
  var toTopRing = document.getElementById("toTopRing");
  var RING_LEN = 131.95;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

    if (nav) nav.classList.toggle("is-scrolled", y > 12);

    if (progressBar) {
      progressBar.style.width = (pct * 100).toFixed(2) + "%";
    }

    if (toTop) {
      toTop.classList.toggle("show", y > window.innerHeight * 0.55);
    }
    if (toTopRing) {
      toTopRing.style.strokeDashoffset = (RING_LEN * (1 - pct)).toFixed(1);
    }

    // 当前区块：取视口上方 38% 处最近的一个 section
    var mark = y + window.innerHeight * 0.38;
    var current = "";
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= mark) current = sections[i].id;
    }
    links.forEach(function (a) {
      var isActive = a.getAttribute("href") === "#" + current;
      a.classList.toggle("is-active", isActive);
      if (isActive) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---------- 元素入场 ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          // 同一父级内依次错开，形成一点节奏
          var siblings = Array.prototype.filter.call(
            el.parentElement.children,
            function (n) {
              return n.classList && n.classList.contains("reveal");
            }
          );
          var idx = siblings.indexOf(el);
          el.style.transitionDelay = Math.min(idx, 4) * 70 + "ms";
          el.classList.add("is-visible");
          revealObserver.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- 跟随鼠标的柔光 ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    var root = document.documentElement;
    var mx = 0,
      my = 0,
      rafId = null;

    window.addEventListener(
      "pointermove",
      function (e) {
        mx = e.clientX;
        my = e.clientY;
        if (rafId) return;
        rafId = window.requestAnimationFrame(function () {
          root.style.setProperty("--mx", mx + "px");
          root.style.setProperty("--my", my + "px");
          rafId = null;
        });
      },
      { passive: true }
    );
  }

  /* ---------- 卡片跟随鼠标的高光 ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    var glowRaf = null;
    var lastEvent = null;

    document.addEventListener(
      "pointermove",
      function (e) {
        lastEvent = e;
        if (glowRaf) return;
        glowRaf = window.requestAnimationFrame(function () {
          glowRaf = null;
          var target = lastEvent.target;
          if (!target || !target.closest) return;
          var card = target.closest(".glow-card");
          if (!card) return;
          var rect = card.getBoundingClientRect();
          card.style.setProperty("--cx", lastEvent.clientX - rect.left + "px");
          card.style.setProperty("--cy", lastEvent.clientY - rect.top + "px");
        });
      },
      { passive: true }
    );
  }

  /* ---------- 复制邮箱 ---------- */
  var copyBtn = document.getElementById("copyMail");
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 2000);
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var mail = copyBtn.getAttribute("data-mail") || "";
      if (!mail) return;

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(mail)
          .then(function () {
            showToast("邮箱已复制 · " + mail);
          })
          .catch(function () {
            showToast(legacyCopy(mail) ? "邮箱已复制 · " + mail : "复制失败，请手动选择");
          });
      } else {
        showToast(legacyCopy(mail) ? "邮箱已复制 · " + mail : "复制失败，请手动选择");
      }
    });
  }
})();
