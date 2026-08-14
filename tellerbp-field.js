(() => {
  const canvas = document.getElementById("teller-field");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palette = {
    ink: "rgba(46, 36, 27, 0.72)",
    quiet: "rgba(46, 36, 27, 0.22)",
    gold: "rgba(167, 122, 46, 0.78)",
    amber: "rgba(219, 159, 68, 0.82)",
    blue: "rgba(65, 93, 102, 0.68)",
    green: "rgba(108, 143, 62, 0.64)",
    red: "rgba(190, 100, 88, 0.55)",
    paper: "rgba(255, 250, 240, 0.92)"
  };
  const bookNames = ["זוגא", "זיכוך", "אלוהים", "אלוה", "מדינה", "טאו", "עדות"];
  const particles = Array.from({ length: 82 }, (_, index) => ({
    t: Math.random(),
    lane: index % 9,
    speed: 0.00045 + Math.random() * 0.0008,
    size: 0.72 + Math.random() * 0.72,
    color: [palette.gold, palette.blue, palette.green, palette.red][index % 4],
    title: bookNames[index % bookNames.length],
    reverse: index % 3 === 0
  }));

  let width = 0;
  let height = 0;
  let dpr = 1;
  let pointerX = 0.5;
  let pointerY = 0.5;
  let last = performance.now();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getField() {
    const compact = width < 760;
    return {
      alpha: {
        x: compact ? width * 0.68 : width * 0.72,
        y: compact ? height * 0.31 : height * 0.44
      },
      beta: {
        x: compact ? width * 0.28 : width * 0.28,
        y: compact ? height * 0.58 : height * 0.52
      },
      center: {
        x: width * (0.5 + (pointerX - 0.5) * 0.035),
        y: height * (0.47 + (pointerY - 0.5) * 0.025)
      }
    };
  }

  function cubic(a, b, c, d, t) {
    const mt = 1 - t;
    return {
      x: mt ** 3 * a.x + 3 * mt ** 2 * t * b.x + 3 * mt * t ** 2 * c.x + t ** 3 * d.x,
      y: mt ** 3 * a.y + 3 * mt ** 2 * t * b.y + 3 * mt * t ** 2 * c.y + t ** 3 * d.y
    };
  }

  function laneCurve(lane, reverse = false) {
    const field = getField();
    const spread = lane - 4;
    const lift = spread * (height < 760 ? 16 : 27);
    const bend = Math.sin(lane * 1.7) * 46;
    const start = reverse ? field.beta : field.alpha;
    const end = reverse ? field.alpha : field.beta;
    const c1 = {
      x: field.center.x + (reverse ? -width * 0.16 : width * 0.16),
      y: field.center.y - lift - bend
    };
    const c2 = {
      x: field.center.x + (reverse ? width * 0.16 : -width * 0.16),
      y: field.center.y + lift + bend * 0.6
    };
    return { start, c1, c2, end };
  }

  function drawBackground(time) {
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.42, 0, width * 0.5, height * 0.42, Math.max(width, height) * 0.78);
    gradient.addColorStop(0, "rgba(255, 246, 224, 0.9)");
    gradient.addColorStop(0.42, "rgba(255, 250, 240, 0.72)");
    gradient.addColorStop(1, "rgba(247, 237, 218, 0.98)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(124, 85, 28, 0.075)";
    ctx.lineWidth = 1;
    for (let x = (time * 0.006) % 86; x < width; x += 86) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 76) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y + Math.sin(time * 0.0004 + y * 0.01) * 14);
      ctx.stroke();
    }
  }

  function drawCurves(time) {
    for (let lane = 0; lane < 9; lane += 1) {
      const reverse = lane % 2 === 0;
      const curve = laneCurve(lane, reverse);
      ctx.beginPath();
      ctx.moveTo(curve.start.x, curve.start.y);
      ctx.bezierCurveTo(curve.c1.x, curve.c1.y, curve.c2.x, curve.c2.y, curve.end.x, curve.end.y);
      ctx.strokeStyle = [palette.gold, palette.blue, palette.green][lane % 3];
      ctx.globalAlpha = 0.12 + Math.sin(time * 0.001 + lane) * 0.025;
      ctx.lineWidth = lane === 4 ? 2 : 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawNode(node, label, title, align) {
    const radius = width < 760 ? 34 : 46;
    const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 2.5);
    glow.addColorStop(0, "rgba(219, 159, 68, 0.22)");
    glow.addColorStop(1, "rgba(219, 159, 68, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(167, 122, 46, 0.42)";
    ctx.fillStyle = "rgba(255, 253, 248, 0.72)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.gold;
    ctx.font = `${width < 760 ? 25 : 34}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "ltr";
    ctx.fillText(label, node.x, node.y - 2);

    ctx.direction = "rtl";
    ctx.fillStyle = palette.ink;
    ctx.font = `${width < 760 ? 14 : 16}px Segoe UI, Arial, sans-serif`;
    ctx.textAlign = align;
    ctx.fillText(title, node.x + (align === "right" ? -radius - 12 : radius + 12), node.y + 4);
  }

  function drawBookParticle(particle, time, delta) {
    if (!reduceMotion) {
      particle.t += particle.speed * delta * (particle.reverse ? -1 : 1);
      if (particle.t > 1) particle.t -= 1;
      if (particle.t < 0) particle.t += 1;
    }

    const curve = laneCurve(particle.lane, particle.reverse);
    const wave = Math.sin(time * 0.0016 + particle.lane) * 0.012;
    const t = Math.max(0, Math.min(1, particle.t + wave));
    const point = cubic(curve.start, curve.c1, curve.c2, curve.end, t);
    const next = cubic(curve.start, curve.c1, curve.c2, curve.end, Math.min(1, t + 0.01));
    const angle = Math.atan2(next.y - point.y, next.x - point.x);
    const w = 18 * particle.size;
    const h = 12 * particle.size;

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.42 + Math.sin(time * 0.002 + particle.lane) * 0.12;
    ctx.fillStyle = "rgba(255, 253, 248, 0.82)";
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(0, h / 2);
    ctx.strokeStyle = "rgba(124, 85, 28, 0.28)";
    ctx.stroke();
    ctx.restore();

    if (particle.lane % 3 === 1 && (width > 720 || particle.size > 1.1)) {
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = palette.ink;
      ctx.direction = "rtl";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${width < 760 ? 10 : 12}px Segoe UI, Arial, sans-serif`;
      ctx.fillText(particle.title, point.x, point.y - 18);
      ctx.globalAlpha = 1;
    }
  }

  function drawLabels(field, time) {
    ctx.direction = "ltr";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(46, 36, 27, 0.56)";
    ctx.font = `${width < 760 ? 12 : 15}px Cascadia Mono, Consolas, monospace`;
    ctx.fillText("I = Books / Information", field.center.x, field.center.y - (width < 760 ? 54 : 78));
    ctx.fillStyle = palette.gold;
    ctx.fillText(`τ ${(72 + Math.sin(time * 0.001) * 14).toFixed(0)}%`, field.center.x, field.center.y + (width < 760 ? 54 : 76));
    ctx.direction = "rtl";
  }

  function render(now) {
    const delta = Math.min(48, now - last);
    last = now;
    const field = getField();

    drawBackground(now);
    drawCurves(now);
    particles.forEach((particle) => drawBookParticle(particle, now, delta));
    drawLabels(field, now);
    drawNode(field.alpha, "Zα", "תורת זוגא", "right");
    drawNode(field.beta, "Zβ", "האדם", "left");

    if (!reduceMotion) requestAnimationFrame(render);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener(
    "pointermove",
    (event) => {
      pointerX = event.clientX / Math.max(1, width);
      pointerY = event.clientY / Math.max(1, height);
    },
    { passive: true }
  );

  resize();
  requestAnimationFrame(render);
})();
