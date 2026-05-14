// ─────────────────────────────────────────────────────────────
// Live counter — hours of US jobsite measuring-and-cutting labor
// accumulated since the page was opened.
//
// Rate derivation:
//   ~1.4M annual US housing starts (Census/NAHB)
//   × ~32 hours of on-site measure-and-cut framing labor per home
//     (from HUD Cityscape 2021 pre-cut framing study — 2–6 days saved
//      with ~5-person crew, of which ~40% is measure-and-cut)
//   ÷ seconds in a year
// ≈ 1.42 hours per second nationwide → rounded to 1.4 hr/sec.
// ─────────────────────────────────────────────────────────────

const HOURS_PER_SECOND = 1.4;
const start = performance.now();

function formatHours(h) {
  return h.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

const liveCounterEl = document.getElementById("counter");

if (liveCounterEl) {
  let hiddenAt = null;
  let pausedSeconds = 0;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = performance.now();
    } else if (hiddenAt) {
      pausedSeconds += (performance.now() - hiddenAt) / 1000;
      hiddenAt = null;
    }
  });

  function tick() {
    if (!document.hidden) {
      const elapsed = (performance.now() - start) / 1000 - pausedSeconds;
      liveCounterEl.textContent = formatHours(elapsed * HOURS_PER_SECOND);
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ─────────────────────────────────────────────────────────────
// Scroll-reveal: fade up elements with [data-reveal] when they
// enter the viewport. Count-up any [data-count-to] inside them.
// ─────────────────────────────────────────────────────────────

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateCount(el) {
  const target = parseFloat(el.dataset.countTo);
  const duration = parseFloat(el.dataset.countDuration) || 1500;
  const startTime = performance.now();

  function frame(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = easeOutCubic(t);
    const value = target * eased;
    el.textContent = Math.round(value).toLocaleString("en-US");
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function revealOnScroll() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const targets = document.querySelectorAll("[data-reveal], .pile");

  if (reduceMotion) {
    // No animation — just show everything and set final numbers.
    targets.forEach(el => {
      el.classList.add("is-visible");
      el.querySelectorAll("[data-count-to]").forEach(c => {
        c.textContent = parseFloat(c.dataset.countTo).toLocaleString("en-US");
      });
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add("is-visible");

      el.querySelectorAll("[data-count-to]").forEach(animateCount);

      observer.unobserve(el);
    });
  }, { threshold: 0.25, rootMargin: "0px 0px -10% 0px" });

  targets.forEach(el => observer.observe(el));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", revealOnScroll);
} else {
  revealOnScroll();
}
