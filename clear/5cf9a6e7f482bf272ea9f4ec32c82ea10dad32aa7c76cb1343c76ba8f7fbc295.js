export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.5,
    metalness: 0.1,
  });

  const darkGreyMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.6,
    metalness: 0.2,
  });

  const silverTrimMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.3,
    metalness: 0.8,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.05,
  });

  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.0,
    transparent: true,
    opacity: 0.9,
  });

  const emissiveBlueMat = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
    emissive: 0x0088ff,
    emissiveIntensity: 2.0,
    roughness: 0.2,
    metalness: 0.0,
  });

  // --- Procedural Textures ---

  // Control Panel Texture: "Frappé" text, red button, knob, blue light
  function createControlPanelTexture() {
    const w = 256, h = 256;
    const data = new Uint8Array(w * h * 4);
    // Background dark grey
    for (let i = 0; i < w * h; i++) {
      data[i * 4] = 40;
      data[i * 4 + 1] = 40;
      data[i * 4 + 2] = 45;
      data[i * 4 + 3] = 255;
    }
    // Helper to draw rect
    function drawRect(x, y, w, h, r, g, b) {
      for (let iy = y; iy < y + h; iy++) {
        for (let ix = x; ix < x + w; ix++) {
          if (ix >= 0 && ix < 256 && iy >= 0 && iy < 256) {
            const idx = (iy * 256 + ix) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
      }
    }
    // "Frappé" text simulation (white bars)
    drawRect(60, 80, 120, 15, 255, 255, 255); // F
    drawRect(60, 100, 120, 15, 255, 255, 255); // r
    drawRect(60, 120, 120, 15, 255, 255, 255); // a
    // Red button
    drawRect(200, 80, 30, 30, 200, 50, 50);
    // Knob (grey circle approx)
    drawRect(80, 160, 30, 30, 100, 100, 100);
    // Blue light rect
    drawRect(150, 160, 40, 30, 50, 150, 255);

    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  // Base Logo Texture: "rappé"
  function createBaseLogoTexture() {
    const w = 256, h = 64;
    const data = new Uint8Array(w * h * 4);
    // Transparent black background
    for (let i = 0; i < w * h; i++) {
      data[i * 4] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 0;
    }
    // White text bars
    function drawRect(x, y, w, h) {
      for (let iy = y; iy < y + h; iy++) {
        for (let ix = x; ix < x + w; ix++) {
          const idx = (iy * 256 + ix) * 4;
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 255;
        }
      }
    }
    drawRect(80, 20, 100, 10);
    drawRect(80, 35, 100, 10);
    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  const controlPanelTex = createControlPanelTexture();
  const baseLogoTex = createBaseLogoTexture();

  const controlPanelMat = new THREE.MeshStandardMaterial({
    map: controlPanelTex,
    roughness: 0.4,
    metalness: 0.0,
  });

  const baseLogoMat = new THREE.MeshStandardMaterial({
    map: baseLogoTex,
    transparent: true,
    roughness: 0.5,
    metalness: 0.0,
  });

  // --- Geometry Helpers ---

  function createRoundedBox(width, height, depth, radius, segments) {
    const shape = new THREE.Shape();
    const eps = 0.00001;
    const r = radius - eps;
    const w = width / 2 - r;
    const d = depth / 2 - r;
    
    shape.moveTo(-w, -d - r);
    shape.lineTo(-w, d + r);
    shape.quadraticCurveTo(-w, d, -w + r, d);
    shape.lineTo(w - r, d);
    shape.quadraticCurveTo(w, d, w, d + r);
    shape.lineTo(w, -d - r);
    shape.quadraticCurveTo(w, -d, w - r, -d);
    shape.lineTo(-w + r, -d);
    shape.quadraticCurveTo(-w, -d, -w, -d - r);

    const extrudeSettings = {
      steps: 1,
      depth: height,
      bevelEnabled: false,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    return geom;
  }

  // --- Base ---
  const baseGeom = createRoundedBox(0.55, 0.06, 0.35, 0.04, 8);
  const base = new THREE.Mesh(baseGeom, blackPlasticMat);
  base.position.y = 0.03;
  root.add(base);

  // Base Logo
  const logoGeom = new THREE.PlaneGeometry(0.15, 0.04);
  const logo = new THREE.Mesh(logoGeom, baseLogoMat);
  logo.position.set(0, 0.031, 0.176);
  root.add(logo);

  // Drip Tray Grille (simplified as lines on base)
  const trayGeom = new THREE.BoxGeometry(0.35, 0.01, 0.25);
  const tray = new THREE.Mesh(trayGeom, darkGreyMat);
  tray.position.set(0, 0.065, 0.05);
  root.add(tray);

  // --- Body ---
  // Lower Body
  const bodyLowerGeom = createRoundedBox(0.32, 0.25, 0.28, 0.03, 8);
  const bodyLower = new THREE.Mesh(bodyLowerGeom, blackPlasticMat);
  bodyLower.position.set(0, 0.185, -0.02);
  root.add(bodyLower);

  // Upper Body
  const bodyUpperGeom = createRoundedBox(0.32, 0.25, 0.28, 0.03, 8);
  const bodyUpper = new THREE.Mesh(bodyUpperGeom, blackPlasticMat);
  bodyUpper.position.set(0, 0.435, -0.02);
  root.add(bodyUpper);

  // --- Control Panel ---
  const panelFrameGeom = new THREE.BoxGeometry(0.14, 0.14, 0.02);
  const panelFrame = new THREE.Mesh(panelFrameGeom, silverTrimMat);
  panelFrame.position.set(0.08, 0.48, 0.141);
  root.add(panelFrame);

  const panelScreenGeom = new THREE.PlaneGeometry(0.12, 0.12);
  const panelScreen = new THREE.Mesh(panelScreenGeom, controlPanelMat);
  panelScreen.position.set(0.08, 0.48, 0.142);
  root.add(panelScreen);

  // Blue Light Square (Lower Body)
  const blueLightGeom = new THREE.BoxGeometry(0.08, 0.08, 0.02);
  const blueLight = new THREE.Mesh(blueLightGeom, emissiveBlueMat);
  blueLight.position.set(0.08, 0.22, 0.141);
  root.add(blueLight);

  // --- Spout ---
  const spoutGeom = new THREE.CylinderGeometry(0.025, 0.02, 0.08, 16);
  const spout = new THREE.Mesh(spoutGeom, blackPlasticMat);
  spout.rotation.x = Math.PI / 2;
  spout.position.set(-0.12, 0.35, 0.05);
  root.add(spout);
  
  const spoutTipGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.04, 16);
  const spoutTip = new THREE.Mesh(spoutTipGeom, silverTrimMat);
  spoutTip.rotation.x = Math.PI / 2;
  spoutTip.position.set(-0.12, 0.31, 0.05);
  root.add(spoutTip);

  // --- Cup ---
  // Cup Profile for Lathe
  const cupProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.06, 0),
    new THREE.Vector2(0.065, 0.02),
    new THREE.Vector2(0.065, 0.18),
    new THREE.Vector2(0.07, 0.19),
    new THREE.Vector2(0.065, 0.20),
    new THREE.Vector2(0.055, 0.20),
  ];
  const cupGeom = new THREE.LatheGeometry(cupProfile, 32);
  const cup = new THREE.Mesh(cupGeom, glassMat);
  cup.position.set(-0.14, 0.10, 0.05);
  root.add(cup);

  // Cup Handle
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.065, 0.12, 0),
    new THREE.Vector3(0.10, 0.12, 0),
    new THREE.Vector3(0.10, 0.16, 0),
    new THREE.Vector3(0.065, 0.16, 0),
  ]);
  const handleGeom = new THREE.TubeGeometry(handleCurve, 16, 0.008, 8, false);
  const handle = new THREE.Mesh(handleGeom, glassMat);
  handle.position.set(-0.14, 0.10, 0.05);
  // Rotate handle to align with cup side (cup is lathe, handle is added manually)
  // The cup is rotationally symmetric, but we place the handle on the -X side relative to machine
  // Cup center is at -0.14. Handle needs to be on the left (-X relative to cup center).
  // Lathe creates a full cylinder. We need to cut a hole or just place handle.
  // Simplification: The handle is a separate mesh attached to the side.
  handle.rotation.z = Math.PI / 2; // Tube is along Z by default? No, CatmullRom is in XY usually.
  // Let's re-orient handle curve to be in XZ plane relative to cup
  const handleCurveXZ = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.065, 0, -0.04),
    new THREE.Vector3(0.11, 0, -0.04),
    new THREE.Vector3(0.11, 0, 0.04),
    new THREE.Vector3(0.065, 0, 0.04),
  ]);
  const handleGeomXZ = new THREE.TubeGeometry(handleCurveXZ, 20, 0.006, 8, false);
  const handleMesh = new THREE.Mesh(handleGeomXZ, glassMat);
  handleMesh.position.set(-0.14, 0.14, 0.05);
  root.add(handleMesh);

  // Liquid
  const liquidGeom = new THREE.CylinderGeometry(0.055, 0.055, 0.14, 32);
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  liquid.position.set(-0.14, 0.14, 0.05);
  root.add(liquid);

  // Feet
  const footGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.015, 16);
  const footPositions = [
    [-0.25, 0, 0.15],
    [0.25, 0, 0.15],
    [-0.25, 0, -0.15],
    [0.25, 0, -0.15],
  ];
  for (const pos of footPositions) {
    const foot = new THREE.Mesh(footGeom, blackPlasticMat);
    foot.position.set(...pos);
    root.add(foot);
  }

  fitToUnitCube(THREE, root);
  return root;
}

function fitToUnitCube(THREE, root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 0.95 / maxDim;
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
}