export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear Glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Cork (with procedural speckle texture)
  const corkColor = 0xd2b48c;
  const corkSize = 128;
  const corkData = new Uint8Array(corkSize * corkSize * 4);
  for (let y = 0; y < corkSize; y++) {
    for (let x = 0; x < corkSize; x++) {
      // Deterministic pseudo-random noise
      const n = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453);
      const grain = (n % 1) * 40 - 20; // Variation +/- 20
      const r = Math.min(255, Math.max(0, 210 + grain));
      const g = Math.min(255, Math.max(0, 180 + grain));
      const b = Math.min(255, Math.max(0, 140 + grain));
      const idx = (y * corkSize + x) * 4;
      corkData[idx] = r;
      corkData[idx + 1] = g;
      corkData[idx + 2] = b;
      corkData[idx + 3] = 255;
    }
  }
  const corkTexture = new THREE.DataTexture(corkData, corkSize, corkSize, THREE.RGBAFormat);
  corkTexture.colorSpace = THREE.SRGBColorSpace;
  corkTexture.needsUpdate = true;
  corkTexture.wrapS = THREE.RepeatWrapping;
  corkTexture.wrapT = THREE.RepeatWrapping;

  const corkMat = new THREE.MeshStandardMaterial({
    color: corkColor,
    metalness: 0.0,
    roughness: 0.85,
    map: corkTexture,
  });

  // Metal Ring/Seal
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.25,
  });

  // --- Geometry Construction ---

  // 1. Bottle Body (Hollow via thick profile)
  // Profile defines the cross-section of the glass material itself.
  // Coordinates: (radius, height)
  const profilePoints = [
    // Inner Bottom (Punt)
    new THREE.Vector2(0.00, 0.015),
    // Inner Base Curve
    new THREE.Vector2(0.08, 0.015),
    new THREE.Vector2(0.18, 0.025),
    // Inner Wall Start
    new THREE.Vector2(0.19, 0.05),
    // Inner Wall Up
    new THREE.Vector2(0.19, 0.55),
    // Inner Shoulder Curve
    new THREE.Vector2(0.19, 0.55),
    new THREE.Vector2(0.15, 0.65),
    new THREE.Vector2(0.10, 0.70),
    // Inner Neck
    new THREE.Vector2(0.09, 0.85),
    // Inner Lip Top
    new THREE.Vector2(0.09, 0.88),
    // Outer Lip Top
    new THREE.Vector2(0.11, 0.88),
    // Outer Lip Flare
    new THREE.Vector2(0.12, 0.87),
    // Outer Neck
    new THREE.Vector2(0.11, 0.70),
    // Outer Shoulder Curve
    new THREE.Vector2(0.15, 0.60),
    new THREE.Vector2(0.21, 0.55),
    // Outer Wall
    new THREE.Vector2(0.21, 0.05),
    // Outer Base Curve
    new THREE.Vector2(0.21, 0.025),
    new THREE.Vector2(0.15, 0.015),
    // Outer Bottom Center
    new THREE.Vector2(0.00, 0.00),
    // Close loop to Inner Bottom
    new THREE.Vector2(0.00, 0.015),
  ];

  const bottleGeom = new THREE.LatheGeometry(profilePoints, 32);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle);

  // 2. Cork Stopper
  // Tapered cylinder: radiusTop > radiusBottom
  const corkHeight = 0.18;
  const corkBottomRadius = 0.095; // Slightly larger than neck inner radius for fit
  const corkTopRadius = 0.125;
  const corkGeom = new THREE.CylinderGeometry(corkTopRadius, corkBottomRadius, corkHeight, 16);
  const cork = new THREE.Mesh(corkGeom, corkMat);
  // Position: Sit on top of neck, partially inserted
  // Neck top is at 0.88. Cork height 0.18.
  // Let's put cork bottom at 0.82 (inside neck) and top at 1.00
  cork.position.y = 0.82 + corkHeight / 2;
  root.add(cork);

  // 3. Metal Ring/Seal at Neck
  // Thin torus or cylinder at the lip
  const ringRadius = 0.115;
  const ringTube = 0.008;
  const ringGeom = new THREE.TorusGeometry(ringRadius, ringTube, 16, 32);
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = Math.PI / 2; // Lay flat in XZ plane
  ring.position.y = 0.875; // Just below the lip top
  root.add(ring);

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