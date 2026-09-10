(() => {
  const canvas = document.querySelector('.reading-scene');
  if (!canvas || !window.THREE) return;
  const T = window.THREE;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true }); }
  catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(38, 1, .1, 100);
  camera.position.set(0, 0, 12);
  scene.add(new T.AmbientLight(0xffffff, 2.5));
  const light = new T.DirectionalLight(0xffffff, 3);
  light.position.set(-4, 7, 8);
  scene.add(light);
  const book = new T.Group();
  book.rotation.set(.45, -.3, -.16);
  scene.add(book);
  const pageTexture = document.createElement('canvas');
  pageTexture.width = 256;
  pageTexture.height = 384;
  const ink = pageTexture.getContext('2d');
  ink.fillStyle = '#e1e6e1';
  ink.fillRect(0, 0, 256, 384);
  ink.fillStyle = '#859c8d';
  for (let line = 0; line < 17; line++) ink.fillRect(line % 5 === 4 ? 86 : 34, 58 + line * 16, line % 5 === 4 ? 136 : 188, 2);
  const map = new T.CanvasTexture(pageTexture);
  map.colorSpace = T.SRGBColorSpace;
  const paper = new T.MeshStandardMaterial({ map, roughness: .9, side: T.DoubleSide });
  const binding = new T.MeshStandardMaterial({ color: '#627e70', roughness: 1 });
  const crease = new T.Mesh(new T.BoxGeometry(.035, 2.85, .03), binding);
  crease.position.z = .1;
  book.add(crease);
  [-1, 1].forEach(side => {
    const cover = new T.Mesh(new T.BoxGeometry(2.12, 2.94, .07), binding);
    cover.position.set(side * 1.06, 0, -.08);
    book.add(cover);
    for (let i = 0; i < 6; i++) {
      const leaf = new T.Mesh(new T.PlaneGeometry(2, 2.82, 12, 1), paper);
      leaf.position.set(side * 1.03, 0, i * .013);
      leaf.rotation.y = side * -.035;
      book.add(leaf);
    }
  });
  const geometry = new T.PlaneGeometry(2.02, 2.82, 28, 1);
  geometry.translate(1.01, 0, 0);
  const original = geometry.attributes.position.array.slice();
  const turn = new T.Mesh(geometry, paper);
  turn.position.z = .11;
  book.add(turn);
  let frame = 0, previous = 0;
  function fit() {
    const width = innerWidth, height = innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    book.position.set(width < 700 ? -1.3 : -camera.aspect * 2, 1.3, 0);
    book.scale.setScalar(width < 700 ? .7 : .9);
    draw(0);
  }
  function draw(now) {
    frame = 0;
    const progress = reduced.matches ? .4 : (now % 15000) / 15000;
    const angle = progress * Math.PI;
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = original[i * 3];
      positions.setXYZ(i, x * Math.cos(angle), original[i * 3 + 1], Math.sin(angle) * x + Math.sin(x / 2 * Math.PI) * Math.sin(angle) * .22);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    renderer.render(scene, camera);
    if (!reduced.matches && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    if (now - previous < 45) { frame = requestAnimationFrame(tick); return; }
    previous = now;
    draw(now);
  }
  function resume() { cancelAnimationFrame(frame); if (!document.hidden) draw(performance.now()); }
  addEventListener('resize', () => { cancelAnimationFrame(frame); fit(); });
  document.addEventListener('visibilitychange', resume);
  reduced.addEventListener('change', resume);
  canvas.addEventListener('webglcontextlost', () => { cancelAnimationFrame(frame); canvas.hidden = true; });
  fit();
})();
