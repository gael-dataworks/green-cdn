export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark teal/green matte metal
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2f4f4f,
    metalness: 0.2,
    roughness: 0.7,
  });

  // Glowing glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xd0e8ff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
    emissive: 0xaaddff,
    emissiveIntensity: 2.5,
  });

  // --- Dimensions ---
  const baseR = 0.35;
  const baseH = 0.12;
  const tankR = 0.30;
  const tankH = 0.15;
  const glassH = 0.55;
  const topCapR = 0.32;
  const topCapH = 0.14;
  const totalH = baseH + tankH + glassH + topCapH;

  // --- Base ---
  const baseGeom = new THREE.CylinderGeometry(baseR, baseR * 1.1, baseH, 32);
  const base = new THREE.Mesh(baseGeom, metalMat);
  base.position.y = baseH / 2;
  root.add(base);

  // --- Fuel Tank ---
  const tankGeom = new THREE.CylinderGeometry(tankR, tankR, tankH, 32);
  const tank = new THREE.Mesh(tankGeom, metalMat);
  tank.position.y = baseH + tankH / 2;
  root.add(tank);

  // --- Knob / Switch on Tank ---
  const knobGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
  const knob = new THREE.Mesh(knobGeom, metalMat);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0, baseH + tankH / 2, tankR + 0.01);
  root.add(knob);

  // --- Glass Chimney (Lathe for bulbous shape) ---
  // Profile from bottom to top (radius, y) relative to glass center
  const glassProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.28, 0.0),       // bottom rim
    new THREE.Vector2(0.32, 0.15),      // belly
    new THREE.Vector2(0.30, 0.40),      // taper start
    new THREE.Vector2(0.24, 0.55),      // top rim
    new THREE.Vector2(0.0, 0.55),       // close top
  ];
  const glassGeom = new THREE.LatheGeometry(glassProfile, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  glass.position.y = baseH + tankH + glassH / 2;
  root.add(glass);

  // --- Top Cap ---
  const capGeom = new THREE.CylinderGeometry(topCapR, topCapR * 0.9, topCapH, 32);
  const topCap = new THREE.Mesh(capGeom, metalMat);
  topCap.position.y = baseH + tankH + glassH + topCapH / 2;
  root.add(topCap);

  // --- Vent on Top Cap ---
  const ventGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16);
  const vent = new THREE.Mesh(ventGeom, metalMat);
  vent.position.y = baseH + tankH + glassH + topCapH + 0.02;
  root.add(vent);

  // --- Frame / Guard (4 vertical bars) ---
  // We use TubeGeometry to curve the bars slightly at top and bottom
  const frameR = 0.34; // slightly wider than glass
  const frameTubeR = 0.015;
  
  function createFrameBar(angle) {
    const x = Math.cos(angle) * frameR;
    const z = Math.sin(angle) * frameR;
    
    // Curve points: Base rim -> Up -> Top Cap rim
    const p1 = new THREE.Vector3(x, baseH * 0.8, z);
    const p2 = new THREE.Vector3(x, baseH + tankH + glassH * 0.5, z);
    const p3 = new THREE.Vector3(x * 0.95, baseH + tankH + glassH + topCapH * 0.2, z * 0.95);
    
    const curve = new THREE.CatmullRomCurve3([p1, p2, p3]);
    const tubeGeom = new THREE.TubeGeometry(curve, 20, frameTubeR, 8, false);
    const bar = new THREE.Mesh(tubeGeom, metalMat);
    root.add(bar);
  }

  // 4 bars at 0, 90, 180, 270 degrees
  for (let i = 0; i < 4; i++) {
    createFrameBar((i / 4) * Math.PI * 2);
  }

  // --- Horizontal Rings (Top and Bottom of glass area) ---
  // Bottom ring
  const bottomRingGeom = new THREE.TorusGeometry(frameR, frameTubeR, 8, 32);
  const bottomRing = new THREE.Mesh(bottomRingGeom, metalMat);
  bottomRing.rotation.x = Math.PI / 2;
  bottomRing.position.y = baseH + tankH + 0.02;
  root.add(bottomRing);

  // Top ring
  const topRingGeom = new THREE.TorusGeometry(frameR * 0.95, frameTubeR, 8, 32);
  const topRing = new THREE.Mesh(topRingGeom, metalMat);
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = baseH + tankH + glassH - 0.02;
  root.add(topRing);

  // --- Handle ---
  // Arching wire handle attached to the frame near the top
  const handleR = 0.15;
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-frameR * 0.8, baseH + tankH + glassH + topCapH * 0.5, 0),
    new THREE.Vector3(0, baseH + tankH + glassH + topCapH + 0.35, 0),
    new THREE.Vector3(frameR * 0.8, baseH + tankH + glassH + topCapH * 0.5, 0)
  ]);
  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.012, 8, false);
  const handle = new THREE.Mesh(handleGeom, metalMat);
  root.add(handle);

  // Handle attachment hooks (small loops on the frame)
  const hookGeom = new THREE.TorusGeometry(0.025, 0.008, 8, 16);
  const hookLeft = new THREE.Mesh(hookGeom, metalMat);
  hookLeft.rotation.y = Math.PI / 2;
  hookLeft.position.set(-frameR * 0.8, baseH + tankH + glassH + topCapH * 0.5, 0);
  root.add(hookLeft);

  const hookRight = new THREE.Mesh(hookGeom, metalMat);
  hookRight.rotation.y = Math.PI / 2;
  hookRight.position.set(frameR * 0.8, baseH + tankH + glassH + topCapH * 0.5, 0);
  root.add(hookRight);

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