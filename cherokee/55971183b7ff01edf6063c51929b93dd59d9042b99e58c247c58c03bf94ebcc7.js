export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Glass: Clear, high transmission, low roughness
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // Metal Rim: Silver, brightened with emissive to avoid looking dark
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.3,
  });

  // Cork: Brown, rough. We will apply a procedural texture for realism.
  const corkMat = new THREE.MeshStandardMaterial({
    color: 0xc49a6c,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Procedural Cork Texture ---
  // Generate a noisy texture to simulate cork pores
  const corkSize = 128;
  const corkData = new Uint8Array(corkSize * corkSize * 4);
  const baseR = 196, baseG = 154, baseB = 108; // #c49a6c
  
  for (let i = 0; i < corkSize * corkSize; i++) {
    // Deterministic pseudo-random noise based on index
    const n = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    const noise = n - Math.floor(n); 
    
    // Vary brightness slightly to create speckles
    const variation = (noise - 0.5) * 40; 
    
    const idx = i * 4;
    corkData[idx] = Math.max(0, Math.min(255, baseR + variation));
    corkData[idx + 1] = Math.max(0, Math.min(255, baseG + variation));
    corkData[idx + 2] = Math.max(0, Math.min(255, baseB + variation));
    corkData[idx + 3] = 255;
  }
  
  const corkTexture = new THREE.DataTexture(corkData, corkSize, corkSize, THREE.RGBAFormat);
  corkTexture.colorSpace = THREE.SRGBColorSpace;
  corkTexture.wrapS = THREE.RepeatWrapping;
  corkTexture.wrapT = THREE.RepeatWrapping;
  corkTexture.needsUpdate = true;
  corkMat.map = corkTexture;

  // --- Geometry: Bottle Body (Lathe) ---
  // Profile points (radius, height) defining the outer silhouette
  // Scale is arbitrary, will be normalized later.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),  // Bottom center
    new THREE.Vector2(0.18, 0.00),  // Bottom edge
    new THREE.Vector2(0.18, 0.65),  // Main body cylinder
    new THREE.Vector2(0.17, 0.70),  // Start of shoulder curve
    new THREE.Vector2(0.14, 0.78),  // Shoulder
    new THREE.Vector2(0.09, 0.88),  // Neck start
    new THREE.Vector2(0.09, 1.05),  // Neck cylinder
    new THREE.Vector2(0.10, 1.08),  // Lip flare
    new THREE.Vector2(0.00, 1.08),  // Top center (closed for solid look, glass handles volume)
  ];

  const bottleGeom = new THREE.LatheGeometry(profilePoints, 32);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle);

  // --- Geometry: Cork Stopper ---
  // Tapered cylinder (frustum). RadiusTop < RadiusBottom.
  // Height covers the neck and protrudes slightly.
  const corkHeight = 0.35;
  const corkBottomR = 0.085; // Fits inside neck
  const corkTopR = 0.075;    // Tapers slightly
  
  const corkGeom = new THREE.CylinderGeometry(corkTopR, corkBottomR, corkHeight, 16);
  const cork = new THREE.Mesh(corkGeom, corkMat);
  // Position: Sit on the shoulder/neck junction. 
  // Neck starts around y=0.88 in profile, top is 1.08.
  // Let's place cork base at y=0.90 so it sits inside the neck.
  cork.position.y = 0.90 + corkHeight / 2;
  root.add(cork);

  // --- Geometry: Metal Rim/Collar ---
  // Thin ring around the neck where the cork meets the glass.
  const rimRadius = 0.095;
  const rimTube = 0.008;
  const rimGeom = new THREE.TorusGeometry(rimRadius, rimTube, 16, 32);
  const rim = new THREE.Mesh(rimGeom, rimMat);
  // Rotate to lie flat in XZ plane (Torus is XY by default)
  rim.rotation.x = Math.PI / 2;
  // Position at the base of the cork
  rim.position.y = 0.90;
  root.add(rim);

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