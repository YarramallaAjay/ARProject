(() => {
  const { innerWidth: W, innerHeight: H, devicePixelRatio: DPR } = window;

  if (!window.THREE) {
    const msg = document.createElement('div');
    msg.textContent = 'Three.js failed to load. Please check your internet connection or try a hard refresh (Ctrl+F5).';
    msg.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;color:#fff;background:#0b1022;font:14px/1.4 system-ui';
    document.body.appendChild(msg);
    return;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b1022, 25, 120);

  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 500);
  camera.position.set(0.7, 0.55, 1.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, DPR));
  renderer.setSize(W, H);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById('app').appendChild(renderer.domElement);

  // Controls (fallback if OrbitControls is not available)
  let controls = null;
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 0.8;
    controls.maxDistance = 6.0;
    controls.target.set(0, 0, 0);
    controls.update();
  } else {
    let isDragging = false;
    let lastX = 0, lastY = 0;
    const onDown = (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
    const onUp = () => { isDragging = false; };
    const onMove = (e) => {
      if (!isDragging) return;
      const dx = (e.clientX - lastX) * 0.005;
      const dy = (e.clientY - lastY) * 0.005;
      camera.position.applyAxisAngle(new THREE.Vector3(0,1,0), -dx);
      camera.position.y = Math.min(2.0, Math.max(-2.0, camera.position.y + dy));
      camera.lookAt(0,0,0);
      lastX = e.clientX; lastY = e.clientY;
    };
    const onWheel = (e) => {
      const dir = Math.sign(e.deltaY);
      const dist = camera.position.length();
      const nd = Math.min(6, Math.max(0.8, dist + dir * 0.2));
      camera.position.setLength(nd);
    };
    renderer.domElement.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });
  }

  // Lights
  const amb = new THREE.AmbientLight(0xffffff, 0.28);
  scene.add(amb);

  const hemi = new THREE.HemisphereLight(0xbcd7ff, 0x0b0f1e, 0.8);
  scene.add(hemi);

  const dir1 = new THREE.DirectionalLight(0xffffff, 1.1);
  dir1.position.set(2.5, 3.0, 2.0);
  scene.add(dir1);

  const dir2 = new THREE.DirectionalLight(0x88aaff, 0.6);
  dir2.position.set(-3.5, 1.0, -2.5);
  scene.add(dir2);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({
      color: 0x040814,
      metalness: 0.4,
      roughness: 0.9,
      transparent: true,
      opacity: 0.9,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.75;
  scene.add(floor);

  // Themes
  const themes = {
    midnight: {
      name: 'Midnight Blue',
      front: new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.2,
        clearcoat: 0.6,
        clearcoatRoughness: 0.15,
        sheen: 0.3,
      }),
      back: new THREE.MeshPhysicalMaterial({
        color: 0x111827,
        metalness: 0.8,
        roughness: 0.25,
        clearcoat: 0.5,
      }),
      accent: 0x60a5fa,
    },
    sunset: {
      name: 'Sunset Gold',
      front: new THREE.MeshPhysicalMaterial({
        color: 0x7c2d12,
        metalness: 0.95,
        roughness: 0.3,
        emissive: 0x331a06,
      }),
      back: new THREE.MeshPhysicalMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.4 }),
      accent: 0xf59e0b,
    },
    neon: {
      name: 'Neon Purple',
      front: new THREE.MeshPhysicalMaterial({ color: 0x3b0764, metalness: 0.9, roughness: 0.25 }),
      back: new THREE.MeshPhysicalMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.35 }),
      accent: 0xa855f7,
    },
    minimal: {
      name: 'Minimal White',
      front: new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, metalness: 0.05, roughness: 0.3 }),
      back: new THREE.MeshPhysicalMaterial({ color: 0xe2e8f0, metalness: 0.05, roughness: 0.35 }),
      accent: 0x0ea5e9,
    },
    carbon: {
      name: 'Carbon Fiber',
      front: new THREE.MeshPhysicalMaterial({ color: 0x0b1220, metalness: 1.0, roughness: 0.1 }),
      back: new THREE.MeshPhysicalMaterial({ color: 0x0b1220, metalness: 0.9, roughness: 0.2 }),
      accent: 0x22d3ee,
    },
  };

  function buildCardGeometry() {
    const width = 8.56 / 10;
    const height = 5.398 / 10;
    const thickness = 0.078 / 10;
    const radius = 0.55 / 10;

    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    const r = radius;

    shape.moveTo(x + r, y);
    shape.lineTo(x + width - r, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + r);
    shape.lineTo(x + width, y + height - r);
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    shape.lineTo(x + r, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const extrude = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.003,
      bevelThickness: 0.003,
      curveSegments: 32,
    });

    extrude.translate(0, 0, -thickness / 2);
    extrude.computeVertexNormals();

    return { geometry: extrude, width, height, thickness };
  }

  const { geometry: cardGeometry, thickness: cardThickness } = buildCardGeometry();

  const themeSelect = document.getElementById('theme');
  let currentThemeKey = themeSelect.value || 'midnight';
  let currentTheme = themes[currentThemeKey];

  const cardGroup = new THREE.Group();
  scene.add(cardGroup);

  // Material order for ExtrudeGeometry groups: [sides(0), top(1), bottom(2)]
  let frontMat = currentTheme.front.clone();
  let backMat = currentTheme.back.clone();
  const sideMat = new THREE.MeshPhysicalMaterial({ color: 0x0a0f1e, metalness: 0.6, roughness: 0.35 });

  const cardMesh = new THREE.Mesh(cardGeometry, [sideMat, frontMat, backMat]);

  const card = new THREE.Group();
  card.add(cardMesh);
  card.rotation.x = -0.2;
  card.rotation.y = 0.5;
  card.scale.setScalar(1.6);
  cardGroup.add(card);

  // Details
  const detailsGroup = new THREE.Group();
  card.add(detailsGroup);

  function makeQuad(w, h, color, emissive = 0x000000, roughness = 0.5, metalness = 0.0) {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshPhysicalMaterial({ color, emissive, roughness, metalness });
    return new THREE.Mesh(geo, mat);
  }

  const frontZ = cardThickness / 2 + 0.001;
  const backZ = -cardThickness / 2 - 0.001;

  const chip = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.14, 0.01),
    new THREE.MeshPhysicalMaterial({ color: 0xd4af37, metalness: 1.0, roughness: 0.25, clearcoat: 0.3 })
  );
  chip.position.set(-0.22, 0.08, frontZ);
  detailsGroup.add(chip);

  const logo = new THREE.Mesh(
    new THREE.CircleGeometry(0.08, 40),
    new THREE.MeshPhysicalMaterial({ color: currentTheme.accent, emissive: currentTheme.accent, emissiveIntensity: 0.25 })
  );
  logo.position.set(0.25, 0.09, frontZ);
  detailsGroup.add(logo);

  const numberStrip = makeQuad(0.55, 0.05, 0x0e0e10, currentTheme.accent, 0.8);
  numberStrip.position.set(0, -0.05, frontZ);
  detailsGroup.add(numberStrip);

  const magStripe = makeQuad(0.72, 0.09, 0x0c0c0c);
  magStripe.position.set(0, 0.15, backZ);
  magStripe.rotation.y = Math.PI;
  detailsGroup.add(magStripe);

  const cvv = makeQuad(0.4, 0.05, 0xf1f5f9);
  cvv.position.set(0.03, 0.02, backZ);
  cvv.rotation.y = Math.PI;
  detailsGroup.add(cvv);

  const rimGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.60),
    new THREE.MeshBasicMaterial({ color: currentTheme.accent, transparent: true, opacity: 0.05 })
  );
  rimGlow.position.set(0, 0, frontZ + 0.001);
  detailsGroup.add(rimGlow);

  const grid = new THREE.GridHelper(30, 40, 0x1f2937, 0x0f172a);
  grid.position.y = -0.749;
  scene.add(grid);

  // Flip logic
  const flipBtn = document.getElementById('flipBtn');
  function flip() {
    const start = card.rotation.y;
    const end = start + Math.PI;
    const duration = 550;
    const startTime = performance.now();

    function animateFlip(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      card.rotation.y = start + (end - start) * ease;
      if (t < 1) requestAnimationFrame(animateFlip);
    }
    requestAnimationFrame(animateFlip);
  }
  flipBtn.addEventListener('click', flip);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); flip(); }
  });

  // Theme switching
  function applyTheme(key) {
    currentThemeKey = key;
    currentTheme = themes[key];

    frontMat.color.set(currentTheme.front.color);
    frontMat.metalness = currentTheme.front.metalness;
    frontMat.roughness = currentTheme.front.roughness;

    backMat.color.set(currentTheme.back.color);
    backMat.metalness = currentTheme.back.metalness;
    backMat.roughness = currentTheme.back.roughness;

    logo.material.color.set(currentTheme.accent);
    logo.material.emissive.set(currentTheme.accent);

    numberStrip.material.emissive.set(currentTheme.accent);
    rimGlow.material.color.set(currentTheme.accent);
  }

  themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));

  // Resize
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Animate
  let t0 = performance.now();
  function animate(now) {
    const dt = (now - t0) / 1000; t0 = now;
    const hover = Math.sin(now * 0.0016) * 0.02;
    cardGroup.position.y = hover;
    cardGroup.rotation.y += 0.003 * dt;

    controls && controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})(); 