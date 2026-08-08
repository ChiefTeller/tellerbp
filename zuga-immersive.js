(() => {
  const canvas = document.getElementById("zuga-field");
  const ctx = canvas.getContext("2d", { alpha: false });
  const enterButton = document.getElementById("enter-motion");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    width: 0,
    height: 0,
    dpi: 1,
    time: 0,
    boost: 1,
    scroll: 0,
    pointer: { x: 0, y: 0, active: false, pulse: 0 },
    particles: [],
    sparks: [],
  };

  const colors = {
    ink: "248,245,236",
    cyan: "98,240,255",
    amber: "244,196,93",
    red: "255,106,92",
    green: "121,225,140",
  };

  const relationNames = ["ניגוד", "השלמה", "תלות", "עצמאות", "השפעה"];
  const infoNames = ["I", "ΔI", "R", "τ", "P∞"];

  function fit() {
    state.dpi = Math.min(window.devicePixelRatio || 1, 2);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = Math.floor(state.width * state.dpi);
    canvas.height = Math.floor(state.height * state.dpi);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpi, 0, 0, state.dpi, 0, 0);
    seedParticles();
  }

  function seedParticles() {
    const count = Math.max(82, Math.min(168, Math.round((state.width * state.height) / 11000)));
    state.particles = Array.from({ length: count }, (_, index) => ({
      lane: index % 5,
      phase: Math.random(),
      speed: 0.000035 + Math.random() * 0.000052,
      size: 0.8 + Math.random() * 2.6,
      drift: Math.random() * Math.PI * 2,
      color: [colors.cyan, colors.amber, colors.green, colors.red][index % 4],
      word: infoNames[index % infoNames.length],
    }));

    state.sparks = Array.from({ length: Math.round(count * 0.36) }, (_, index) => ({
      phase: Math.random(),
      speed: 0.00006 + Math.random() * 0.00008,
      offset: (Math.random() - 0.5) * 90,
      size: 0.9 + Math.random() * 1.5,
      color: [colors.cyan, colors.amber, colors.green][index % 3],
    }));
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  function lemniscate(t, scale, cx, cy, squeeze = 0.58) {
    const s = Math.sin(t);
    const c = Math.cos(t);
    const denom = 1 + s * s;

    return {
      x: cx + (scale * c) / denom,
      y: cy + (scale * squeeze * s * c) / denom,
    };
  }

  function fieldCenter() {
    const portrait = state.width < 760;
    const depth = state.scroll;
    return {
      x: portrait ? state.width * (0.5 - depth * 0.04) : state.width * (0.46 + depth * 0.06),
      y: portrait ? state.height * (0.29 + depth * 0.12) : state.height * (0.5 - depth * 0.04),
      scale: Math.min(state.width * (portrait ? 0.58 + depth * 0.08 : 0.34 + depth * 0.03), state.height * 0.56),
    };
  }

  function drawBackground() {
    ctx.fillStyle = "#030303";
    ctx.fillRect(0, 0, state.width, state.height);

    const { x, y, scale } = fieldCenter();
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "rgba(248,245,236,0.055)";
    ctx.lineWidth = 1;

    for (let i = -9; i <= 9; i += 1) {
      const offset = i * (scale / 6);
      ctx.beginPath();
      ctx.moveTo(x - scale * 1.55, y + offset * 0.35);
      ctx.bezierCurveTo(
        x - scale * 0.55,
        y + offset * 0.78,
        x + scale * 0.55,
        y - offset * 0.78,
        x + scale * 1.55,
        y - offset * 0.35
      );
      ctx.stroke();
    }

    for (let i = -7; i <= 7; i += 1) {
      const offset = i * (scale / 8);
      ctx.beginPath();
      ctx.moveTo(x - scale * 1.42, y - offset);
      ctx.bezierCurveTo(
        x - scale * 0.35,
        y + offset * 0.82,
        x + scale * 0.35,
        y - offset * 0.82,
        x + scale * 1.42,
        y + offset
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawInfinityPath() {
    const { x, y, scale } = fieldCenter();
    const phase = state.time * 0.00042;

    ctx.save();
    ctx.lineCap = "round";
    for (let ring = 0; ring < 5; ring += 1) {
      const radius = scale * (1 + ring * 0.075);
      ctx.beginPath();
      for (let i = 0; i <= 720; i += 1) {
        const p = lemniscate((i / 720) * Math.PI * 2 + phase * (ring % 2 ? -0.28 : 0.18), radius, x, y);
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.strokeStyle = `rgba(${ring % 2 ? colors.amber : colors.cyan}, ${0.11 - ring * 0.012})`;
      ctx.lineWidth = 1.2 + ring * 0.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function phenomenonPositions() {
    const { x, y, scale } = fieldCenter();
    const pulse = Math.sin(state.time * 0.0012);
    const wobble = Math.cos(state.time * 0.0007);
    const distance = scale * (0.53 + pulse * 0.025);
    return {
      left: { x: x - distance, y: y - wobble * 12, label: "Zα", side: "תופעה א" },
      right: { x: x + distance, y: y + wobble * 12, label: "Zβ", side: "תופעה ב" },
      center: { x, y, scale },
    };
  }

  function drawRelations() {
    const nodes = phenomenonPositions();
    const phase = state.time * 0.001;
    const tension = 0.5 + Math.sin(phase * 1.7) * 0.5;
    const relationColor = tension > 0.55 ? colors.red : colors.green;

    ctx.save();
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < 9; i += 1) {
      const lift = (i - 4) * 12;
      const wave = Math.sin(phase + i * 0.58) * 52;
      ctx.beginPath();
      ctx.moveTo(nodes.left.x, nodes.left.y + lift * 0.18);
      ctx.bezierCurveTo(
        mix(nodes.left.x, nodes.right.x, 0.28),
        nodes.left.y + lift + wave,
        mix(nodes.left.x, nodes.right.x, 0.72),
        nodes.right.y - lift - wave,
        nodes.right.x,
        nodes.right.y - lift * 0.18
      );
      ctx.strokeStyle = `rgba(${i % 2 ? colors.cyan : relationColor}, ${0.13 + tension * 0.075})`;
      ctx.lineWidth = 0.8 + tension * 2.2 + (i === 4 ? 1.6 : 0);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(nodes.left.x, nodes.left.y);
    ctx.lineTo(nodes.right.x, nodes.right.y);
    ctx.strokeStyle = `rgba(${colors.amber}, ${0.18 + tension * 0.42})`;
    ctx.lineWidth = 2 + tension * 5.5;
    ctx.stroke();

    ctx.restore();

    drawRelationLabel(nodes, tension);
  }

  function drawRelationLabel(nodes, tension) {
    const portrait = state.width < 760;
    const midX = nodes.center.x - nodes.center.scale * (portrait ? 0.5 : 0.72);
    const midY = nodes.center.y + nodes.center.scale * (portrait ? 0.32 : 0.3);
    const labelIndex = Math.floor((state.time * 0.00034) % relationNames.length);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 13px Segoe UI, Arial, sans-serif";
    ctx.fillStyle = `rgba(${colors.ink}, 0.5)`;
    ctx.fillText(`${relationNames[labelIndex]}  ·  τ ${(tension * 100).toFixed(0)}%`, midX, midY + 44);
    ctx.restore();
  }

  function drawPhenomenon(node, accent) {
    const active = state.pointer.active;
    const pointerDistance = Math.hypot(state.pointer.x - node.x, state.pointer.y - node.y);
    const pointerPull = active ? Math.max(0, 1 - pointerDistance / 260) : 0;
    const pulse = 1 + Math.sin(state.time * 0.002 + node.x * 0.01) * 0.08 + pointerPull * 0.25;
    const radius = 36 * pulse;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + i * 17, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${accent}, ${0.2 - i * 0.052})`;
      ctx.lineWidth = 1.2 + i * 0.8;
      ctx.stroke();
    }

    for (let i = 0; i < 2; i += 1) {
      const scale = 21 + i * 8;
      ctx.beginPath();
      for (let j = 0; j <= 220; j += 1) {
        const p = lemniscate((j / 220) * Math.PI * 2 + state.time * 0.001 + i, scale, node.x, node.y, 0.7);
        if (j === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.strokeStyle = `rgba(${accent}, ${0.25 - i * 0.08})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, 6 + pointerPull * 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${colors.ink}, 0.96)`;
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(${colors.ink}, 0.9)`;
    ctx.font = "600 16px Segoe UI, Arial, sans-serif";
    ctx.fillText(node.label, node.x, node.y - radius - 23);
    ctx.font = "400 12px Segoe UI, Arial, sans-serif";
    ctx.fillStyle = `rgba(${colors.ink}, 0.55)`;
    ctx.fillText(node.side, node.x, node.y + radius + 25);
    ctx.restore();
  }

  function drawParticles(delta) {
    const { x, y, scale } = fieldCenter();
    const speedBoost = reducedMotion.matches ? 0.3 : state.boost;
    const nearPointer = state.pointer.active ? 1 : 0;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    state.particles.forEach((particle, index) => {
      particle.phase = (particle.phase + delta * particle.speed * speedBoost) % 1;
      const angle = particle.phase * Math.PI * 2;
      const laneScale = scale * (0.83 + particle.lane * 0.055);
      const p = lemniscate(angle, laneScale, x, y);
      const drift = Math.sin(angle * 3 + particle.drift + state.time * 0.0008) * (5 + particle.lane * 1.7);
      const px = p.x;
      const py = p.y + drift;
      const d = Math.hypot(state.pointer.x - px, state.pointer.y - py);
      const pull = nearPointer * Math.max(0, 1 - d / 220);

      ctx.beginPath();
      ctx.arc(px, py, particle.size + pull * 2.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particle.color}, ${0.34 + pull * 0.46})`;
      ctx.fill();

      if (index % 13 === 0 || pull > 0.55) {
        ctx.font = "600 11px Segoe UI, Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(${colors.ink}, ${0.28 + pull * 0.35})`;
        ctx.fillText(particle.word, px, py - 12);
      }
    });
    ctx.restore();
  }

  function drawInformationStreams(delta) {
    const nodes = phenomenonPositions();
    const speedBoost = reducedMotion.matches ? 0.35 : state.boost;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    state.sparks.forEach((spark) => {
      spark.phase = (spark.phase + delta * spark.speed * speedBoost) % 1;
      const reverse = spark.phase > 0.5;
      const t = reverse ? (spark.phase - 0.5) * 2 : spark.phase * 2;
      const from = reverse ? nodes.right : nodes.left;
      const to = reverse ? nodes.left : nodes.right;
      const curve = Math.sin(t * Math.PI) * spark.offset;
      const x = mix(from.x, to.x, t);
      const y = mix(from.y, to.y, t) + curve;

      ctx.beginPath();
      ctx.arc(x, y, spark.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${spark.color}, ${0.38 + Math.sin(t * Math.PI) * 0.38})`;
      ctx.fill();
    });
    ctx.restore();
  }

  function drawPossibilityField() {
    const { x, y, scale } = fieldCenter();
    const columns = Math.max(18, Math.round(state.width / 82));
    const rows = Math.max(8, Math.round(state.height / 100));

    ctx.save();
    ctx.globalAlpha = 0.32;
    for (let ix = 0; ix < columns; ix += 1) {
      for (let iy = 0; iy < rows; iy += 1) {
        const px = (ix + 0.5) * (state.width / columns);
        const py = (iy + 0.5) * (state.height / rows);
        const d = Math.hypot(px - x, py - y);
        const wave = Math.sin(d * 0.014 - state.time * 0.0014);
        if (wave > 0.62 && d < scale * 2.2) {
          ctx.beginPath();
          ctx.arc(px, py, 1.1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${colors.ink}, ${0.12 + (wave - 0.62) * 0.18})`;
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  function drawPointerPulse() {
    if (!state.pointer.active && state.pointer.pulse <= 0.02) return;

    state.pointer.pulse *= 0.94;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.arc(state.pointer.x, state.pointer.y, 48 + state.pointer.pulse * 84, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${colors.cyan}, ${state.pointer.pulse * 0.16})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  let last = performance.now();

  function frame(now) {
    const delta = Math.min(34, now - last);
    last = now;
    state.time = now;
    state.boost += ((document.documentElement.dataset.intent === "awake" ? 1.55 : 1) - state.boost) * 0.035;

    drawBackground();
    drawPossibilityField();
    drawInfinityPath();
    drawRelations();
    drawInformationStreams(delta);
    drawParticles(delta);

    const nodes = phenomenonPositions();
    drawPhenomenon(nodes.left, colors.cyan);
    drawPhenomenon(nodes.right, colors.amber);
    drawPointerPulse();

    requestAnimationFrame(frame);
  }

  function setPointer(event) {
    const point = event.touches ? event.touches[0] : event;
    state.pointer.x = point.clientX;
    state.pointer.y = point.clientY;
    state.pointer.active = true;
    state.pointer.pulse = Math.min(1, state.pointer.pulse + 0.08);
  }

  function syncScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    state.scroll = Math.min(1, Math.max(0, window.scrollY / max));
    document.documentElement.style.setProperty("--scroll", state.scroll.toFixed(3));
    document.documentElement.dataset.depth = state.scroll > 0.04 ? "reading" : "top";
  }

  window.addEventListener("resize", fit);
  window.addEventListener("scroll", syncScroll, { passive: true });
  window.addEventListener("pointermove", setPointer, { passive: true });
  window.addEventListener("pointerdown", setPointer, { passive: true });
  window.addEventListener("pointerleave", () => {
    state.pointer.active = false;
  });
  window.addEventListener("touchmove", setPointer, { passive: true });

  if (enterButton) {
    enterButton.addEventListener("click", () => {
      const target = document.querySelector(enterButton.dataset.scrollTarget);
      document.documentElement.dataset.intent = "awake";
      enterButton.classList.add("is-active");
      if (target) {
        target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
      }
    });
  }

  fit();
  syncScroll();
  requestAnimationFrame(frame);
})();
