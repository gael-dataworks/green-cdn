export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear glass material using Physical material for transmission/refraction
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5, // Helps with refraction volume
  });

  // Cork material with procedural speckle texture
  const corkSize = 128;
  const corkData = new Uint8Array(corkSize * corkSize * 4);
  const baseColor = { r: 210, g: 180, b: 140 }; // Tan
  for (let i = 0; i < corkSize * corkSize; i++) {
    // Deterministic pseudo-noise using sine waves
    const x = i % corkSize;
    const y = Math.floor(i / corkSize);
    const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.15)) * 20;
    const speckle = (Math.sin(x * 0.5 + y * 0.3) > 0.8) ? -30 : 0;
    
    const r = Math.max(0, Math.min(255, baseColor.r + noise + speckle));
    const g = Math.max(0, Math.min(255, baseColor.g + noise + speckle));
    const b = Math.max(0, Math.min(255, baseColor.b + noise + speckle));
    
    corkData[i * 4] = r;
    corkData[i * 4 + 1] = g;
    corkData[i * 4 + 2] = b;
    corkData[i * 4 + 3] = 255;
  }
  const corkTexture = new THREE.DataTexture(corkData, corkSize, corkSize, THREE.RGBAFormat);
  corkTexture.colorSpace = THREE.SRGBColorSpace;
  corkTexture.needsUpdate = true;
  corkTexture.wrapS = THREE.RepeatWrapping;
  corkTexture.wrapT = THREE.RepeatWrapping;

  const corkMat = new THREE.MeshStandardMaterial({
    map: corkTexture,
    color: 0xffffff, // Multiply by white to let texture dominate
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Geometry: Bottle Body (Lathe) ---
  // Profile points [radius, height] from bottom center up to top center
  const bottleProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.32, 0.00), // Bottom edge
    new THREE.Vector2(0.32, 0.02), // Slight base bevel
    new THREE.Vector2(0.30, 0.65), // Main body side
    new THREE.Vector2(0.28, 0.72), // Shoulder start
    new THREE.Vector2(0.22, 0.78), // Shoulder curve
    new THREE.Vector2(0.16, 0.82), // Neck start
    new THREE.Vector2(0.16, 0.92), // Neck top
    new THREE.Vector2(0.18, 0.94), // Lip flare
    new THREE.Vector2(0.16, 0.96), // Lip top inner
    new THREE.Vector2(0.00, 0.96), // Top center
  ];

  const bottleGeom = new THREE.LatheGeometry(bottleProfile, 32);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle);

  // --- Geometry: Cork Stopper ---
  // Tapered cylinder: radiusTop, radiusBottom, height
  // Positioned to sit inside the neck, protruding slightly
  const corkHeight = 0.28;
  const corkTopR = 0.17;
  const corkBotR = 0.14;
  const corkGeom = new THREE.CylinderGeometry(corkTopR, corkBotR, corkHeight, 16);
  
  const cork = new THREE.Mesh(corkGeom, corkMat);
  // Position: Neck top is at y=0.92 (inner) to 0.96 (lip). 
  // We want cork to go down into the neck.
  // Center of cork should be around y = 0.92 - (corkHeight * 0.6)
  cork.position.y = 0.92 - (corkHeight * 0.65); 
  root.add(cork);

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