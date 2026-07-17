const root = document.documentElement;
const backTop = document.querySelector("[data-back-top]");
const hero = document.querySelector(".hero");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  root.style.setProperty("--progress", progress.toFixed(4));
  backTop?.classList.toggle("visible", window.scrollY > window.innerHeight * 0.72);
}

function setPointer(event) {
  if (!hero || reduceMotion) return;
  const rect = hero.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  root.style.setProperty("--hero-x", `${Math.max(0, Math.min(100, x))}%`);
  root.style.setProperty("--hero-y", `${Math.max(0, Math.min(100, y))}%`);
}

backTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));
window.addEventListener("scroll", updateProgress, { passive: true });
hero?.addEventListener("pointermove", setPointer, { passive: true });
updateProgress();
