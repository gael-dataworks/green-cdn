export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark aged metal for cage, socket, top cap
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    metalness: 0.5,
    roughness: 0.5,
  });

  // Dark wood for base and stem
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5d4037,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Clear glass for the bulb envelope and protective globe
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
  });

  // Filament wire (gold-ish)
  const filamentMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    metalness: 0.8,
    roughness: 0.4,
    emissive: 0xffaa00,
    emissiveIntensity: 0.5,
  });

  // --- 1. Wooden Base ---
  // Two-tiered round base
  const baseBottomGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 32);
  const baseBottom = new THREE.Mesh(baseBottomGeom, woodMat);
  baseBottom.position.y = 0.02;
  root.add(baseBottom);

  const baseTopGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 32);
  const baseTop = new THREE.Mesh(baseTopGeom, woodMat);
  baseTop.position.y = 0.06;
  root.add(baseTop);

  // --- 2. Wooden Stem ---
  // Turned wood profile connecting base to socket
  const stemProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.05, 0.0),
    new THREE.Vector2(0.05, 0.02),
    new THREE.Vector2(0.07, 0.04), // Bulbous part
    new THREE.Vector2(0.05, 0.08),
    new THREE.Vector2(0.04, 0.10),
    new THREE.Vector2(0.0, 0.10),
  ];
  const stemGeom = new THREE.LatheGeometry(stemProfile, 32);
  const stem = new THREE.Mesh(stemGeom, woodMat);
  stem.position.y = 0.10;
  root.add(stem);

  // --- 3. Socket Assembly ---
  // Black metal cylinder holding the bulb
  const socketGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 16);
  const socket = new THREE.Mesh(socketGeom, metalMat);
  socket.position.y = 0.20;
  root.add(socket);

  // --- 4. Light Bulb ---
  // Glass envelope
  const bulbProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.025, 0.0), // Base contact
    new THREE.Vector2(0.025, 0.02),
    new THREE.Vector2(0.08, 0.12), // Widest part
    new THREE.Vector2(0.07, 0.20), // Tapering to top
    new THREE.Vector2(0.03, 0.24), // Tip
    new THREE.Vector2(0.0, 0.24),
  ];
  const bulbGeom = new THREE.LatheGeometry(bulbProfile, 32);
  const bulb = new THREE.Mesh(bulbGeom, glassMat);
  bulb.position.y = 0.23; // Sit on top of socket
  root.add(bulb);

  // Filament (simplified zig-zag wire inside)
  const filamentPoints = [
    new THREE.Vector3(-0.02, 0.05, 0),
    new THREE.Vector3(-0.02, 0.10, 0),
    new THREE.Vector3(0.02, 0.10, 0),
    new THREE.Vector3(0.02, 0.05, 0),
  ];
  const filamentCurve = new THREE.CatmullRomCurve3(filamentPoints);
  const filamentGeom = new THREE.TubeGeometry(filamentCurve, 8, 0.002, 8, false);
  const filament = new THREE.Mesh(filamentGeom, filamentMat);
  filament.position.y = 0.24; // Relative to bulb base
  root.add(filament);

  // --- 5. Protective Cage ---
  
  // Top Cap (metal piece closing the cage)
  const topCapGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16);
  const topCap = new THREE.Mesh(topCapGeom, metalMat);
  topCap.position.y = 0.52;
  root.add(topCap);

  // Cage Rings (Horizontal wires)
  // Bottom ring (near socket)
  const cageBottomRingGeom = new THREE.TorusGeometry(0.11, 0.004, 8, 32);
  const cageBottomRing = new THREE.Mesh(cageBottomRingGeom, metalMat);
  cageBottomRing.rotation.x = Math.PI / 2;
  cageBottomRing.position.y = 0.26;
  root.add(cageBottomRing);

  // Middle ring (widest part)
  const cageMiddleRingGeom = new THREE.TorusGeometry(0.16, 0.004, 8, 32);
  const cageMiddleRing = new THREE.Mesh(cageMiddleRingGeom, metalMat);
  cageMiddleRing.rotation.x = Math.PI / 2;
  cageMiddleRing.position.y = 0.38;
  root.add(cageMiddleRing);

  // Vertical Bars (6 bars)
  const barCount = 6;
  const barRadius = 0.004;
  // Define curve for one bar: from top cap rim -> middle ring -> bottom ring
  // Top cap rim y=0.52, r=0.06
  // Middle ring y=0.38, r=0.16
  // Bottom ring y=0.26, r=0.11
  const barPoints = [
    new THREE.Vector3(0.06, 0.52, 0),
    new THREE.Vector3(0.16, 0.38, 0),
    new THREE.Vector3(0.11, 0.26, 0),
  ];
  const barCurve = new THREE.CatmullRomCurve3(barPoints);
  const barGeom = new THREE.TubeGeometry(barCurve, 16, barRadius, 8, false);

  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2;
    const bar = new THREE.Mesh(barGeom, metalMat);
    bar.rotation.y = angle;
    root.add(bar);
  }

  // --- 6. Handle Loop ---
  // Attached to top cap
  const handleRadius = 0.03;
  const handleTubeRadius = 0.005;
  // Torus is in XY plane by default. We want it vertical (XZ plane relative to upright Y).
  // Rotate 90 deg around Z.
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTubeRadius, 8, 16, Math.PI);
  const handle = new THREE.Mesh(handleGeom, metalMat);
  handle.rotation.z = Math.PI / 2; // Stand it up
  handle.rotation.y = Math.PI / 2; // Orient loop front-back or side-side? Image shows side profile loop.
  // Let's make it face the camera roughly or just standard orientation.
  // Actually, a simple TorusGeometry with arc Math.PI creates a U-shape.
  // Default Torus is in XY. Rotate X by 90 -> XZ plane (flat on ground).
  // We want it standing up. Rotate Z by 90 -> YZ plane.
  handle.position.y = 0.52 + handleRadius;
  root.add(handle);

  // Small mounting brackets for handle on top cap
  const bracketGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.015, 8);
  const bracketL = new THREE.Mesh(bracketGeom, metalMat);
  bracketL.rotation.z = Math.PI / 2;
  bracketL.position.set(-0.02, 0.52, 0);
  root.add(bracketL);

  const bracketR = new THREE.Mesh(bracketGeom, metalMat);
  bracketR.rotation.z = Math.PI / 2;
  bracketR.position.set(0.02, 0.52, 0);
  root.add(bracketR);

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