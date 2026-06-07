export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Glass: Clear, high transmission, low roughness.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5, // Helps with refraction volume look
  });

  // Cork: Procedural texture for speckled look.
  const corkSize = 128;
  const corkData = new Uint8Array(corkSize * corkSize * 4);
  const baseR = 196, baseG = 165, baseB = 116; // #c4a574
  for (let i = 0; i < corkSize * corkSize; i++) {
    // Deterministic pseudo-noise using sine waves
    const x = i % corkSize;
    const y = Math.floor(i / corkSize);
    const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.1) + Math.sin(x * 0.05 + y * 0.05)) * 20;
    const r = Math.min(255, Math.max(0, baseR + noise));
    const g = Math.min(255, Math.max(0, baseG + noise));
    const b = Math.min(255, Math.max(0, baseB + noise));
    corkData[i * 4] = r;
    corkData[i * 4 + 1] = g;
    corkData[i * 4 + 2] = b;
    corkData[i * 4 + 3] = 255;
  }
  const corkTexture = new THREE.DataTexture(corkData, corkSize, corkSize, THREE.RGBAFormat);
  corkTexture.colorSpace = THREE.SRGBColorSpace;
  corkTexture.needsUpdate = true;

  const corkMat = new THREE.MeshStandardMaterial({
    map: corkTexture,
    color: 0xffffff, // Modulate base
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Geometries ---

  // Bottle Body (Lathe)
  // Profile defines the outer silhouette. 
  // Points are (radius, height).
  const bottleProfile = [
    new THREE.Vector2(0.00, 0.00),   // Bottom center
    new THREE.Vector2(0.17, 0.00),   // Bottom edge
    new THREE.Vector2(0.17, 0.55),   // Body top
    new THREE.Vector2(0.14, 0.65),   // Shoulder curve start
    new THREE.Vector2(0.075, 0.75),  // Neck start
    new THREE.Vector2(0.075, 0.88),  // Neck top
    new THREE.Vector2(0.085, 0.90),  // Lip flare
    new THREE.Vector2(0.00, 0.90),   // Top center (closes the mesh)
  ];
  const bottleGeom = new THREE.LatheGeometry(bottleProfile, 32);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle);

  // Inner neck hint (to show it's hollow/open)
  // A thin inverted cone/cylinder inside the neck
  const innerNeckGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.15, 32);
  const innerNeck = new THREE.Mesh(innerNeckGeom, glassMat);
  innerNeck.position.y = 0.825; // Just below the lip
  // Make it slightly transparent/darker to suggest depth
  innerNeck.material = glassMat; 
  root.add(innerNeck);

  // Cork Stopper
  // Top part (wider)
  const corkTopH = 0.12;
  const corkTopGeom = new THREE.CylinderGeometry(0.09, 0.085, corkTopH, 16);
  const corkTop = new THREE.Mesh(corkTopGeom, corkMat);
  corkTop.position.y = 0.90 + corkTopH / 2;
  root.add(corkTop);

  // Bottom part (narrower, goes into neck)
  const corkBottomH = 0.14;
  const corkBottomGeom = new THREE.CylinderGeometry(0.075, 0.07, corkBottomH, 16);
  const corkBottom = new THREE.Mesh(corkBottomGeom, corkMat);
  corkBottom.position.y = 0.90 - corkBottomH / 2;
  root.add(corkBottom);

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