// Ticking counter — hours of US jobsite measuring-and-cutting labor accumulated
// since the page was opened.
//
// Rate is calculated from:
//   ~1.4M annual US housing starts (Census/NAHB)
//   × ~32 hours of on-site measure-and-cut framing labor per home
//     (derived from HUD Cityscape 2021 pre-cut framing study showing 2–6
//      days saved with a ~5-person crew, ~40% of which is measure-and-cut)
//   ÷ seconds in a year
// ≈ 1.42 hours per second nationwide.
//
// We round to 1.4 hr/sec — defensible, conservative, easy to footnote.

const HOURS_PER_SECOND = 1.4;
const start = performance.now();

const el = document.getElementById("counter");

function formatHours(h) {
  return h.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function tick() {
  const elapsed = (performance.now() - start) / 1000;
  const hours = elapsed * HOURS_PER_SECOND;
  el.textContent = formatHours(hours);
  requestAnimationFrame(tick);
}

if (el) {
  // Pause counter when the page is hidden so it doesn't drift when
  // the user comes back to a tab they left open all day.
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

  function tickPaused() {
    if (document.hidden) {
      requestAnimationFrame(tickPaused);
      return;
    }
    const elapsed = (performance.now() - start) / 1000 - pausedSeconds;
    el.textContent = formatHours(elapsed * HOURS_PER_SECOND);
    requestAnimationFrame(tickPaused);
  }

  requestAnimationFrame(tickPaused);
}
