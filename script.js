/* Pranakshi Varshney | Resume website
   Small JavaScript layer: mouse light trail, spotlight, scroll reveal,
   nav highlight, mobile menu, card tilt and print button. */

(function () {
  "use strict";

  // Tell the CSS that JavaScript is running (used by the reveal animation)
  document.documentElement.setAttribute("data-js", "");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasHover = window.matchMedia("(hover: hover)").matches;

  /* ---------- Loading screen ---------- */
  window.addEventListener("load", function () {
    var loader = document.getElementById("loader");
    setTimeout(function () { if (loader) loader.classList.add("done"); }, 700);
  });

  /* ---------- Mouse light trail on a canvas ---------- */
  var canvas = document.getElementById("trail");
  var spotlight = document.getElementById("spotlight");

  if (canvas && hasHover && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var mouse = { x: -200, y: -200, px: -200, py: -200, active: false };
    var hue = 0;

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    window.addEventListener("mousemove", function (e) {
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;

      // soft glow that follows the cursor
      if (spotlight) {
        spotlight.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
      }

      // emit gold sparks along the movement
      var dx = mouse.x - mouse.px;
      var dy = mouse.y - mouse.py;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var count = Math.min(4, Math.ceil(dist / 12));
      for (var i = 0; i < count; i++) {
        hue = (hue + 3) % 30; // stays in the gold range
        particles.push({
          x: mouse.x - dx * (i / count),
          y: mouse.y - dy * (i / count),
          vx: (Math.random() - 0.5) * 0.9,
          vy: (Math.random() - 0.5) * 0.9 - 0.15,
          life: 1,
          size: Math.random() * 2.4 + 0.8,
          tone: 38 + hue // hsl hue 38 to 68: amber to soft gold
        });
      }
      if (particles.length > 260) particles.splice(0, particles.length - 260);
    });

    document.addEventListener("mouseleave", function () { mouse.active = false; });

    // glowing ring that eases toward the cursor
    var ring = { x: -200, y: -200 };

    function frame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // particles
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.022;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.fillStyle = "hsla(" + p.tone + ", 70%, 65%, " + (p.life * 0.9) + ")";
        ctx.shadowColor = "rgba(230, 200, 133, 0.9)";
        ctx.shadowBlur = 12;
        ctx.arc(p.x, p.y, p.size * p.life + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // ring
      ring.x += (mouse.x - ring.x) * 0.16;
      ring.y += (mouse.y - ring.y) * 0.16;
      if (mouse.active) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(230, 200, 133, 0.55)";
        ctx.lineWidth = 1;
        ctx.arc(ring.x, ring.y, 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Scroll progress bar ---------- */
  var progress = document.getElementById("progress");
  function updateProgress() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    if (progress) progress.style.width = pct + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  /* ---------- Reveal sections when they enter the screen ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Highlight the nav link of the section on screen ---------- */
  var links = document.querySelectorAll(".nav-links a");
  var sections = [];
  links.forEach(function (a) {
    var s = document.querySelector(a.getAttribute("href"));
    if (s) sections.push({ link: a, el: s });
  });

  if ("IntersectionObserver" in window) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          sections.forEach(function (s) {
            if (s.el === entry.target) s.link.classList.add("active");
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { navObs.observe(s.el); });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var navLinks = document.getElementById("navLinks");
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        navLinks.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Cards: light follows the mouse, gentle 3D tilt ---------- */
  if (hasHover) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        card.style.setProperty("--mx", x + "px");
        card.style.setProperty("--my", y + "px");
        if (!reduceMotion) {
          var rx = ((y / r.height) - 0.5) * -6;
          var ry = ((x / r.width) - 0.5) * 6;
          card.style.transform = "perspective(800px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-3px)";
        }
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Save as PDF ---------- */
  var printBtn = document.getElementById("printBtn");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
})();
