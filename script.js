const root = document.documentElement;
const backTop = document.querySelector("[data-back-top]");
const hero = document.querySelector(".hero");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const zugaTheoryCopyText = `[Zuga Structure = מבנה זוגא]
**∞ = Zuga = Z= (Z1, Z2, R, τ, I, P)**

**Z1= Z Phenomenon | Z2= Z Phenomenon;**

**R= Relations | τ= Tension | I= Information;**

**P = Infinite Possibilities and States, |P| = ∞ ;**

**α= Alpha State, β= Beta State…;**

**Δ= Change;**

**⇄ = Transition and mutual influence;**

**Ω={Z1,Z2,Z3,…},∣Ω∣=∞ ;**

**∀Zx∈Ω:Zx=(Zx1,Zx2,Rx,τx,Ix,Px);**


Zuga Movement
**(∞⇄Zα⇄ΔR,Δτ,ΔI⇄Zβ⇄∞)∈P**

זוגא נעה מ־Alpha state אל Beta state דרך שינוי ביחסים, במתח ובמידע, בתוך שדה של אינסוף אפשרויות.


**Zuga Definition**

**Zuga is the infinite movement between a pair of phenomena linked by relations of opposition, complementarity, dependence, independence, and mutual influence. Between them unfolds a range of possibilities across which the tension varies. The infinite movement and the changing tension generate infinite possibilities that extend across this range and sustain the Zuga.**

**Understanding Zuga allows us to recognize that we, too, move within Zuga structures and to examine the relations and tensions acting upon us.**

**APPLY META ZUGA. WITNESS THE TRANSITION AND LET THE CHANGE BE THE EVIDENCE.**

**Zself = Witness(Zα, Zβ); Zβ → ΔZself → Zγ;**

**[Zuga structure]**`;

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

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      // Continue to the fallback below for local file previews and stricter browsers.
    }
  }

  const copyField = document.createElement("textarea");
  copyField.value = text;
  copyField.setAttribute("readonly", "");
  copyField.style.position = "fixed";
  copyField.style.opacity = "0";
  copyField.style.pointerEvents = "none";
  document.body.appendChild(copyField);
  copyField.select();
  document.execCommand("copy");
  copyField.remove();
}

document.querySelectorAll("[data-copy-zuga]").forEach((button) => {
  const status = button.parentElement?.querySelector("[data-copy-zuga-status]");
  const originalText = button.textContent.trim();

  button.addEventListener("click", async () => {
    try {
      await copyText(zugaTheoryCopyText);
      const successText = button.dataset.copySuccess || "Copied";
      button.textContent = successText;
      if (status) status.textContent = successText;
      window.setTimeout(() => {
        button.textContent = originalText;
        if (status) status.textContent = "";
      }, 1800);
    } catch (error) {
      if (status) status.textContent = "לא ניתן להעתיק אוטומטית";
    }
  });
});

const zugaLab = document.querySelector("[data-zuga-lab]");

if (zugaLab) {
  const deck = zugaLab.querySelector("[data-lab-deck]");
  const title = zugaLab.querySelector("[data-lab-title]");
  const z1 = zugaLab.querySelector("[data-lab-z1]");
  const z2 = zugaLab.querySelector("[data-lab-z2]");
  const tension = zugaLab.querySelector("[data-lab-tension]");
  const trend = zugaLab.querySelector("[data-lab-trend]");
  const meter = zugaLab.querySelector("[data-lab-meter]");
  const stage = zugaLab.querySelector(".lab-stage");

  function setCentralZuga(name, first, second, tau, trendText) {
    title.textContent = name;
    z1.textContent = first;
    z2.textContent = second;
    tension.textContent = tau;
    trend.textContent = trendText;
    const value = tau.match(/(\d+)/)?.[1] || "88";
    meter.style.setProperty("--tension", `${Math.min(100, Number(value))}%`);
    stage.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  zugaLab.querySelector("[data-lab-root]")?.addEventListener("click", () => {
    deck.hidden = false;
    setCentralZuga("ישראל - העולם", "ישראל", "העולם", "τ=80-95/100", "תתי הזוגא של ישראל פתוחות לבחינה");
  });

  zugaLab.querySelectorAll("[data-inner-zuga]").forEach((button) => {
    button.addEventListener("click", () => {
      const pair = button.dataset.innerZuga;
      const [first, second] = pair.split("⇄").map((part) => part.trim());
      const card = button.closest(".lab-card");
      const tau = `τ=${card?.dataset.tension || "88"}/100`;
      const trendText = card?.dataset.trend ? `מגמה: ${card.dataset.trend}` : "זוגא פנימית";
      deck.hidden = false;
      setCentralZuga(pair, first, second, tau, trendText);
    });
  });
}

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
