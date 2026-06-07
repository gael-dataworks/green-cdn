export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Balloon material: Latex is shiny but dielectric.
  // We use a DataTexture for the vertical gradient seen in the reference.
  const balloonMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.15,
    transmission: 0.1, // Slight subsurface feel
    ior: 1.4,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
  });

  // Knot material: Darker, more opaque green rubber
  const knotMat = new THREE.MeshStandardMaterial({
    color: 0x388e3c,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Stick material: White plastic/paper
  const stickMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Procedural Gradient Texture ---
  // Top: Pale Mint (#e0fff0) -> Mid: Lime (#ccff66) -> Bottom: Green (#4caf50)
  const texWidth = 4;
  const texHeight = 256;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  const colorTop = new THREE.Color(0xe0fff0);
  const colorMid = new THREE.Color(0xccff66);
  const colorBot = new THREE.Color(0x4caf50);

  for (let y = 0; y < texHeight; y++) {
    const v = y / (texHeight - 1); // 0 at bottom, 1 at top
    let c;
    if (v < 0.5) {
      // Interpolate Bottom to Mid
      const t = v * 2;
      c = new THREE.Color().lerpColors(colorBot, colorMid, t);
    } else {
      // Interpolate Mid to Top
      const t = (v - 0.5) * 2;
      c = new THREE.Color().lerpColors(colorMid, colorTop, t);
    }
    
    const offset = y * texWidth * 4;
    for (let x = 0; x < texWidth; x++) {
      data[offset + x * 4 + 0] = Math.floor(c.r * 255);
      data[offset + x * 4 + 1] = Math.floor(c.g * 255);
      data[offset + x * 4 + 2] = Math.floor(c.b * 255);
      data[offset + x * 4 + 3] = 255;
    }
  }

  const gradientTex = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  gradientTex.colorSpace = THREE.SRGBColorSpace;
  gradientTex.needsUpdate = true;
  // Lathe UVs: v goes from 0 (bottom) to 1 (top). We want top=light, bottom=dark.
  // Our loop did y=0 (bottom) to y=height (top).
  // So v=0 is bottom color, v=1 is top color. This matches Lathe default UVs.
  balloonMat.map = gradientTex;

  // --- Geometry: Balloon Body (Lathe) ---
  // Profile from bottom neck to top tip
  const profilePoints = [
    new THREE.Vector2(0.09, 0.00), // Neck base
    new THREE.Vector2(0.14, 0.10), // Start curve out
    new THREE.Vector2(0.28, 0.35), // Lower belly
    new THREE.Vector2(0.38, 0.60), // Max width
    new THREE.Vector2(0.36, 0.85), // Shoulder
    new THREE.Vector2(0.25, 1.05), // Top curve
    new THREE.Vector2(0.10, 1.18), // Near tip
    new THREE.Vector2(0.00, 1.22)  // Top tip
  ];

  const balloonGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Rotate lathe to stand up if needed, but default Y-axis rotation is correct for profile in XY plane
  const balloon = new THREE.Mesh(balloonGeom, balloonMat);
  // Shift up so the neck is at y=0
  balloon.position.y = 0.15; 
  root.add(balloon);

  // --- Geometry: Knot ---
  // A twisted sphere/blob at the bottom
  const knotGeom = new THREE.SphereGeometry(0.06, 16, 16);
  const knot = new THREE.Mesh(knotGeom, knotMat);
  knot.position.set(0, 0.05, 0);
  knot.scale.set(1.2, 0.8, 1.0); // Flatten slightly
  knot.rotation.z = Math.PI / 8; // Tilt to look tied
  root.add(knot);

  // Add a little twisted tail to the knot
  const tailGeom = new THREE.CylinderGeometry(0.02, 0.01, 0.08, 8);
  const tail = new THREE.Mesh(tailGeom, knotMat);
  tail.position.set(0.03, 0.02, 0);
  tail.rotation.z = -Math.PI / 3;
  root.add(tail);

  // --- Geometry: Stick ---
  const stickGeom = new THREE.CylinderGeometry(0.012, 0.012, 1.8, 8);
  const stick = new THREE.Mesh(stickGeom, stickMat);
  // Position stick to start just below the knot
  stick.position.set(0, -0.85, 0);
  root.add(stick);

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