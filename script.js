// ─────────────────────────────────────────────────────────────
// Scroll-reveal: fade up elements with [data-reveal] when they
// enter the viewport.
// ─────────────────────────────────────────────────────────────

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function revealOnScroll() {
  const targets = document.querySelectorAll("[data-reveal]");

  if (reduceMotion) {
    targets.forEach(el => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -10% 0px" });

  targets.forEach(el => observer.observe(el));
}

// ─────────────────────────────────────────────────────────────
// The swap: a sticky section where a disorganized heap of stock
// crossfades into sorted, labeled, cut-to-length bundles as you
// scroll through it.
//
// Progress runs 0 → 1 across the section's scrollable travel, and
// is published as the custom property --p. The two figures read it
// directly in CSS, so no per-frame style thrash on the SVGs.
//
// The swap runs over the centre 72% of the travel, with a 14% hold at
// each end so both states register before and after the transition.
// Widening this band was the fix for dead scroll: at 45% most of the
// section's travel did nothing.
// ─────────────────────────────────────────────────────────────

function swapOnScroll() {
  const section = document.querySelector(".swap");
  if (!section || reduceMotion) return;

  const SWAP_START = 0.14;
  const SWAP_END = 0.86;

  let ticking = false;

  function update() {
    ticking = false;

    const rect = section.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    if (travel <= 0) {
      section.style.setProperty("--p", "1");
      return;
    }

    // 0 when the section's top hits the viewport top,
    // 1 when its bottom does.
    const raw = Math.min(1, Math.max(0, -rect.top / travel));

    // ease the middle band into a full 0 → 1 crossfade
    const t = Math.min(1, Math.max(0, (raw - SWAP_START) / (SWAP_END - SWAP_START)));
    const eased = t * t * (3 - 2 * t); // smoothstep

    section.style.setProperty("--p", eased.toFixed(3));
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

function init() {
  revealOnScroll();
  swapOnScroll();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
