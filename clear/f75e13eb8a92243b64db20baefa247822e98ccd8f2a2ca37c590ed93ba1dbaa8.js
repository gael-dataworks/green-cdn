export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Rustic wood: warm brown, matte/satin finish
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Dark industrial metal: black/dark gray, slightly worn
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.3,
    roughness: 0.5,
  });

  // Clear glass for the outer globe
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Bulb glass: slightly frosted/tinted, emissive
  const bulbGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffee,
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
    emissive: 0xffaa55,
    emissiveIntensity: 0.8,
  });

  // Filament wire: thin dark metal
  const filamentMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.8,
    roughness: 0.4,
  });

  // --- Base ---
  // Bottom thick disc
  const baseBottomGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.05, 32);
  const baseBottom = new THREE.Mesh(baseBottomGeom, woodMat);
  baseBottom.position.y = 0.025;
  root.add(baseBottom);

  // Top slightly smaller disc
  const baseTopGeom = new THREE.CylinderGeometry(0.20, 0.20, 0.04, 32);
  const baseTop = new THREE.Mesh(baseTopGeom, woodMat);
  baseTop.position.y = 0.07;
  root.add(baseTop);

  // --- Stem (Turned Wood) ---
  // Profile for lathe: narrow base, bulbous middle, narrow top
  const stemProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.06, 0.0),
    new THREE.Vector2(0.06, 0.02),
    new THREE.Vector2(0.08, 0.04), // bulb start
    new THREE.Vector2(0.10, 0.08), // widest
    new THREE.Vector2(0.08, 0.12), // taper
    new THREE.Vector2(0.06, 0.14),
    new THREE.Vector2(0.06, 0.16),
    new THREE.Vector2(0.0, 0.16),
  ];
  const stemGeom = new THREE.LatheGeometry(stemProfile, 32);
  const stem = new THREE.Mesh(stemGeom, woodMat);
  stem.position.y = 0.09; // sits on baseTop
  root.add(stem);

  // --- Socket Assembly ---
  const socketGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.08, 16);
  const socket = new THREE.Mesh(socketGeom, metalMat);
  socket.position.y = 0.17;
  root.add(socket);

  // Small ring detail on socket
  const socketRingGeom = new THREE.TorusGeometry(0.065, 0.008, 8, 24);
  const socketRing = new THREE.Mesh(socketRingGeom, metalMat);
  socketRing.rotation.x = Math.PI / 2;
  socketRing.position.y = 0.19;
  root.add(socketRing);

  // --- Light Bulb ---
  // Bulb profile: round bottom, tapering neck
  const bulbProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.05, 0.0),
    new THREE.Vector2(0.05, 0.02),
    new THREE.Vector2(0.09, 0.06), // belly
    new THREE.Vector2(0.09, 0.10),
    new THREE.Vector2(0.06, 0.14), // neck
    new THREE.Vector2(0.04, 0.16),
    new THREE.Vector2(0.0, 0.16),
  ];
  const bulbGeom = new THREE.LatheGeometry(bulbProfile, 32);
  const bulb = new THREE.Mesh(bulbGeom, bulbGlassMat);
  bulb.position.y = 0.21; // sits inside socket
  root.add(bulb);

  // Filament (simplified zig-zag wire)
  const filamentPoints = [
    new THREE.Vector3(0, 0.02, 0),
    new THREE.Vector3(0.02, 0.04, 0),
    new THREE.Vector3(-0.02, 0.06, 0),
    new THREE.Vector3(0.02, 0.08, 0),
    new THREE.Vector3(0, 0.10, 0),
  ];
  const filamentCurve = new THREE.CatmullRomCurve3(filamentPoints);
  const filamentGeom = new THREE.TubeGeometry(filamentCurve, 8, 0.003, 8, false);
  const filament = new THREE.Mesh(filamentGeom, filamentMat);
  filament.position.y = 0.22;
  root.add(filament);

  // --- Glass Globe (Outer) ---
  // Bell shape surrounding the bulb
  const globeProfile = [
    new THREE.Vector2(0.065, 0.0), // starts at socket rim
    new THREE.Vector2(0.065, 0.05),
    new THREE.Vector2(0.14, 0.15), // widens
    new THREE.Vector2(0.16, 0.25), // max width
    new THREE.Vector2(0.12, 0.35), // tapers up
    new THREE.Vector2(0.08, 0.42), // neck
    new THREE.Vector2(0.08, 0.45),
    new THREE.Vector2(0.0, 0.45),
  ];
  const globeGeom = new THREE.LatheGeometry(globeProfile, 32);
  const globe = new THREE.Mesh(globeGeom, glassMat);
  globe.position.y = 0.17; // aligns with socket top
  root.add(globe);

  // --- Metal Cage ---
  const cageGroup = new THREE.Group();

  // Top Cap
  const topCapGeom = new THREE.SphereGeometry(0.09, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const topCap = new THREE.Mesh(topCapGeom, metalMat);
  topCap.position.y = 0.62;
  cageGroup.add(topCap);

  // Handle Loop
  const handleGeom = new THREE.TorusGeometry(0.04, 0.006, 8, 24, Math.PI);
  const handle = new THREE.Mesh(handleGeom, metalMat);
  handle.rotation.z = Math.PI / 2;
  handle.position.y = 0.62;
  cageGroup.add(handle);

  // Vertical Bars (4 bars)
  // Curve from top cap down to middle ring
  const barCount = 4;
  const barRadius = 0.005;
  const barSegments = 16;
  
  // Define curve points relative to bar local space, then rotate
  // Start: near top cap (y=0.45 relative to globe base), End: middle ring (y=0.25)
  // We will construct the curve in XZ plane then rotate around Y
  
  const barCurvePoints = [
    new THREE.Vector3(0.08, 0.45, 0), // Top connection
    new THREE.Vector3(0.16, 0.35, 0), // Mid curve out
    new THREE.Vector3(0.16, 0.25, 0), // Bottom connection
  ];
  
  const barCurve = new THREE.CatmullRomCurve3(barCurvePoints);
  const barGeom = new THREE.TubeGeometry(barCurve, barSegments, barRadius, 8, false);

  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2;
    const bar = new THREE.Mesh(barGeom, metalMat);
    bar.rotation.y = angle;
    bar.position.y = 0.17; // Align with globe base
    cageGroup.add(bar);
  }

  // Middle Ring
  const middleRingGeom = new THREE.TorusGeometry(0.16, 0.006, 8, 32);
  const middleRing = new THREE.Mesh(middleRingGeom, metalMat);
  middleRing.rotation.x = Math.PI / 2;
  middleRing.position.y = 0.42; // 0.17 + 0.25
  cageGroup.add(middleRing);

  // Bottom Support Ring (near socket)
  const bottomRingGeom = new THREE.TorusGeometry(0.07, 0.005, 8, 32);
  const bottomRing = new THREE.Mesh(bottomRingGeom, metalMat);
  bottomRing.rotation.x = Math.PI / 2;
  bottomRing.position.y = 0.17;
  cageGroup.add(bottomRing);

  root.add(cageGroup);

  // --- Normalization ---
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