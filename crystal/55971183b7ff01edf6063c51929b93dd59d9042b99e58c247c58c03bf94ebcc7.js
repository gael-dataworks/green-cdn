export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear glass material
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Cork material with procedural texture
  const corkTexture = createCorkTexture(THREE);
  const corkMat = new THREE.MeshStandardMaterial({
    map: corkTexture,
    color: 0xffffff, // Modulate base
    metalness: 0.0,
    roughness: 0.9,
  });

  // Silver metal rim
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Bottle Body (Lathe) ---
  // Profile points (radius, height) from bottom center up
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),   // Bottom center
    new THREE.Vector2(0.32, 0.00),   // Bottom edge
    new THREE.Vector2(0.32, 0.05),   // Base thickness start
    new THREE.Vector2(0.28, 0.05),   // Base indent
    new THREE.Vector2(0.28, 0.60),   // Straight body side
    new THREE.Vector2(0.30, 0.70),   // Shoulder start (slight flare)
    new THREE.Vector2(0.22, 0.80),   // Shoulder slope
    new THREE.Vector2(0.14, 0.88),   // Neck transition
    new THREE.Vector2(0.13, 0.95),   // Neck straight
    new THREE.Vector2(0.15, 1.00),   // Lip flare
    new THREE.Vector2(0.13, 1.02),   // Top rim inner
    new THREE.Vector2(0.00, 1.02),   // Top center (close top for solid look or leave open)
  ];

  // We want the bottle to be hollow-ish visually, but for simple procedural,
  // a solid lathe with transmission works well.
  // Let's refine the profile to match the "apothecary" shape better.
  // Bottom flat, straight sides, sloping shoulders, narrow neck, flared lip.
  
  const bottleProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.31, 0.0),    // Outer bottom radius
    new THREE.Vector2(0.31, 0.62),   // Body height
    new THREE.Vector2(0.28, 0.78),   // Shoulder curve start
    new THREE.Vector2(0.15, 0.88),   // Neck start
    new THREE.Vector2(0.15, 0.96),   // Neck height
    new THREE.Vector2(0.17, 0.99),   // Lip outer
    new THREE.Vector2(0.15, 1.00),   // Lip top inner
    new THREE.Vector2(0.0, 1.00),    // Center
  ];

  const bottleGeom = new THREE.LatheGeometry(bottleProfile, 32);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle);

  // --- Cork Stopper ---
  // Tapered cylinder. 
  // Top radius ~0.16, Bottom radius ~0.13, Height ~0.25
  // Positioned so bottom is inside the neck (y ~ 0.88) and top sticks out.
  const corkHeight = 0.24;
  const corkTopR = 0.165;
  const corkBotR = 0.135;
  const corkGeom = new THREE.CylinderGeometry(corkBotR, corkTopR, corkHeight, 16);
  const cork = new THREE.Mesh(corkGeom, corkMat);
  // Position: Neck top is at y=0.96 (approx). Cork sits on top.
  // Let's say cork bottom is at y=0.92 (inside neck) and top at y=1.16.
  cork.position.y = 0.92 + corkHeight / 2;
  root.add(cork);

  // --- Metal Rim / Collar ---
  // A torus around the neck, just below the lip.
  // Neck radius ~0.15. Torus radius ~0.15 + thickness/2.
  const rimRadius = 0.155;
  const rimTube = 0.015;
  const rimGeom = new THREE.TorusGeometry(rimRadius, rimTube, 16, 32);
  const rim = new THREE.Mesh(rimGeom, metalMat);
  rim.rotation.x = Math.PI / 2; // Lay flat in XZ plane
  rim.position.y = 0.91; // Just below the cork top, around the neck
  root.add(rim);

  // --- Normalization ---
  fitToUnitCube(THREE, root);
  return root;
}

// Helper: Procedural Cork Texture
function createCorkTexture(THREE) {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  
  // Base cork color: #d2a679 approx (210, 166, 121)
  const baseR = 210;
  const baseG = 166;
  const baseB = 121;

  for (let i = 0; i < size * size; i++) {
    // Deterministic pseudo-random noise based on index
    // Simple hash-like function
    const x = i % size;
    const y = Math.floor(i / size);
    const seed = x * 12.9898 + y * 78.233;
    const sinVal = Math.sin(seed) * 43758.5453;
    const rand = sinVal - Math.floor(sinVal);

    // Speckle logic: mostly base color, some darker/lighter spots
    let r = baseR;
    let g = baseG;
    let b = baseB;

    if (rand > 0.7) {
      // Darker speckle
      const factor = 0.6 + (rand - 0.7) * 2; // 0.6 to 0.8
      r *= factor;
      g *= factor;
      b *= factor;
    } else if (rand < 0.1) {
      // Lighter speckle
      const factor = 1.1 + rand * 0.5;
      r = Math.min(255, r * factor);
      g = Math.min(255, g * factor);
      b = Math.min(255, b * factor);
    }

    const idx = i * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
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