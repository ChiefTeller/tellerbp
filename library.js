(() => {
  const main = document.querySelector('.library-main');
  if (!main) return;
  const shelves = document.querySelector('.library-shelves');
  const links = [...document.querySelectorAll('.standing-book')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let renderer, scene, camera, models = [], shelfModels = [], opening = null;
  let active = null, frame = 0, lastTime = 0, idleTime = 0;

  function syncView(focus = false) {
    shelves.hidden = false;
    document.body.dataset.libraryView = 'shelves';
    opening = null;
    active = null;
    if (renderer) rebuild();
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (focus) links[0]?.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', () => syncView(true));
  window.addEventListener('pageshow', () => syncView());
  syncView();

  // Navigation stays native when WebGL is unavailable, including new-tab clicks.
  function ordinaryClick(event) {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  }
  function activate(event, link) {
    if (!renderer || !ordinaryClick(event) || reduced.matches) return;
    event.preventDefault();
    if (opening) return;
    const model = models.find(item => item.link === link);
    if (!model) { location.href = link.href; return; }
    opening = { model, start: performance.now() };
    requestFrame();
    window.setTimeout(() => {
      location.assign(link.href);
    }, 620);
  }
  links.forEach(link => {
    link.addEventListener('click', event => activate(event, link));
    ['pointerenter', 'focus'].forEach(name => link.addEventListener(name, () => {
      active = link; idleTime = performance.now(); requestFrame();
    }));
    ['pointerleave', 'blur'].forEach(name => link.addEventListener(name, () => {
      if (active === link) active = null;
      idleTime = performance.now(); requestFrame();
    }));
  });

  if (!window.THREE) return;
  const T = window.THREE;
  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.domElement.className = 'library-scene';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  main.prepend(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    frame = 0;
    document.body.classList.remove('scene-ready');
    renderer = null;
  });

  function texture(link, width, height, color) {
    const canvas = document.createElement('canvas');
    const scale = 3;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    // A woven binding texture catches the light without loading cover images.
    ctx.fillStyle = '#ffffff08';
    for (let x = 1; x < width; x += 2) ctx.fillRect(x, 0, .5, height);
    for (let y = 1; y < height; y += 3) ctx.fillRect(0, y, width, .5);
    ctx.strokeStyle = '#f8e7c04d';
    ctx.lineWidth = .65;
    ctx.strokeRect(8, 12, width - 16, height - 24);
    ctx.fillStyle = '#fff3dc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    let fontSize = width < 90 ? 20 : 25;
    const title = link.querySelector('h2').textContent;
    const words = title.trim().split(/\s+/);
    const maxWidth = width - 19;
    ctx.font = `${fontSize}px "Times New Roman", serif`;
    const longest = Math.max(...words.map(word => ctx.measureText(word).width));
    if (longest > maxWidth) fontSize *= maxWidth / longest;
    ctx.font = `${fontSize}px "Times New Roman", serif`;
    let lines = [], line = '';
    words.forEach(word => {
      if (line && ctx.measureText(`${line} ${word}`).width > maxWidth) {
        lines.push(line); line = word;
      } else line = line ? `${line} ${word}` : word;
    });
    if (line) lines.push(line);
    const lineHeight = fontSize * 1.45;
    lines.forEach((line, index) => ctx.fillText(line, width / 2, height * .46 + (index - (lines.length - 1) / 2) * lineHeight));
    ctx.font = '11px Georgia, serif';
    ctx.fillText('TellerBP', width / 2, height - 36);
    ctx.fillStyle = '#fff3dc90';
    ctx.fillRect(width * .3, height - 64, width * .4, .7);
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return map;
  }
  function mesh(w, h, d, material, x = 0, y = 0, z = 0) {
    const item = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    item.position.set(x, y, z);
    item.castShadow = true;
    item.receiveShadow = true;
    return item;
  }
  function disposeScene() {
    scene?.traverse(object => {
      object.geometry?.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => { material.map?.dispose(); material.dispose(); });
      }
    });
  }
  function rebuild() {
    if (!renderer) return;
    disposeScene();
    const bounds = main.getBoundingClientRect();
    const width = bounds.width, height = bounds.height;
    renderer.setSize(width, height);
    scene = new T.Scene();
    camera = new T.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 2200);
    camera.position.set(0, 0, 1000);
    scene.add(new T.AmbientLight(0xffffff, 2));
    const light = new T.DirectionalLight(0xfff9ed, 2.3);
    light.position.set(-width * .4, height * .7, 600);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, { left: -width, right: width, top: height, bottom: -height, near: 1, far: 2000 });
    light.shadow.bias = -.001;
    scene.add(light);
    const wall = new T.Mesh(new T.PlaneGeometry(width, height), new T.ShadowMaterial({ opacity: .065 }));
    wall.position.z = -25;
    wall.receiveShadow = true;
    scene.add(wall);
    models = links.map(link => {
      const rect = link.getBoundingClientRect();
      const w = rect.width, h = rect.height, d = 30;
      const color = getComputedStyle(link).getPropertyValue('--binding').trim();
      const binding = new T.MeshStandardMaterial({ color, roughness: .88 });
      const paper = new T.MeshStandardMaterial({ color: '#e8e7dd', roughness: 1 });
      const group = new T.Group();
      const x = rect.left - bounds.left + w / 2 - width / 2;
      const y = height / 2 - (rect.top - bounds.top + h / 2);
      group.position.set(x, y, 0);
      group.rotation.y = -.24;
      group.add(mesh(w - 5, h - 7, d - 5, paper));
      group.add(mesh(w, h, 2.5, binding, 0, 0, -d / 2));
      group.add(mesh(4, h, d, binding, -w / 2 + 2));
      for (let n = 1; n < 9; n++) {
        group.add(mesh(.6, h - 10, .5, new T.MeshStandardMaterial({ color: '#aab4aa', roughness: 1 }), w / 2 - 2, 0, -d / 2 + n * d / 10));
      }
      const hinge = new T.Group();
      hinge.position.set(-w / 2, 0, d / 2);
      const front = new T.MeshStandardMaterial({ map: texture(link, w, h, color), roughness: .9 });
      hinge.add(mesh(w, h, 2.5, [binding, binding, binding, binding, front, paper], w / 2));
      group.add(hinge);
      scene.add(group);
      return { link, group, hinge, y, lift: 0, bottom: rect.bottom - bounds.top };
    });
    shelfModels = [];
    {
      const rows = [];
      models.forEach(model => {
        let row = rows.find(row => Math.abs(row.bottom - model.bottom) < 10);
        if (!row) { row = { bottom: model.bottom, items: [] }; rows.push(row); }
        row.items.push(model);
      });
      rows.forEach(row => {
        const left = Math.min(...row.items.map(item => item.link.getBoundingClientRect().left)) - bounds.left - 16;
        const right = Math.max(...row.items.map(item => item.link.getBoundingClientRect().right)) - bounds.left + 16;
        const shelf = mesh(right - left, 9, 94, new T.MeshStandardMaterial({ color: '#cbd4ce', roughness: .72 }), (left + right) / 2 - width / 2, height / 2 - row.bottom - 10, -5);
        scene.add(shelf); shelfModels.push(shelf);
      });
    }
    renderer.render(scene, camera);
    document.body.classList.add('scene-ready');
    idleTime = performance.now();
    requestFrame();
  }
  function requestFrame() {
    if (renderer && !frame && !document.hidden) frame = requestAnimationFrame(animate);
  }
  function animate(now) {
    frame = 0;
    if (!renderer || document.hidden) return;
    const dt = Math.min((now - lastTime) / 1000, .05);
    lastTime = now;
    let changing = false;
    models.forEach(model => {
      const target = active === model.link && !reduced.matches ? 11 : 0;
      model.lift += (target - model.lift) * Math.min(1, dt * 12);
      changing ||= Math.abs(target - model.lift) > .02;
      model.group.position.y = model.y + model.lift;
      model.group.position.z = model.lift * 1.1;
      model.group.rotation.y = -.24 + model.lift * .007;
      if (opening?.model === model) {
        const progress = Math.min((now - opening.start) / 580, 1);
        model.hinge.rotation.y = -Math.sin(progress * Math.PI / 2) * 1.5;
        model.group.position.z += progress * 60;
      } else model.hinge.rotation.y = 0;
    });
    renderer.render(scene, camera);
    if (opening || changing || now - idleTime < 400) requestFrame();
  }
  new ResizeObserver(() => rebuild()).observe(main);
  document.fonts?.ready.then(() => rebuild());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else requestFrame();
  });
  rebuild();
})();
