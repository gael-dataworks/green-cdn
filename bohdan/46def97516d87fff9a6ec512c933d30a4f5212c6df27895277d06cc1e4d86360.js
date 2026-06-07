export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Balloon material: Latex-like, slightly shiny, low metalness.
  // We will apply a gradient texture to capture the light-to-dark green transition.
  const balloonMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Base white, tinted by map
    metalness: 0.0,
    roughness: 0.35, // Rubber sheen
  });

  // Stick material: Matte white plastic/paper
  const stickMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Procedural Gradient Texture for Balloon ---
  // Top: Pale Mint (#b8ffc4), Mid: Lime (#88ff55), Bot: Dark Green (#22aa22)
  const texWidth = 2;
  const texHeight = 256;
  const size = texWidth * texHeight * 4;
  const data = new Uint8Array(size);
  
  const colorTop = new THREE.Color(0xb8ffc4);
  const colorMid = new THREE.Color(0x88ff55);
  const colorBot = new THREE.Color(0x22aa22);

  for (let y = 0; y < texHeight; y++) {
    const v = y / (texHeight - 1); // 0 at bottom, 1 at top
    let c = new THREE.Color();
    
    if (v < 0.5) {
      // Interpolate Bottom -> Mid
      const t = v * 2;
      c.lerpColors(colorBot, colorMid, t);
    } else {
      // Interpolate Mid -> Top
      const t = (v - 0.5) * 2;
      c.lerpColors(colorMid, colorTop, t);
    }

    for (let x = 0; x < texWidth; x++) {
      const i = (y * texWidth + x) * 4;
      data[i] = Math.floor(c.r * 255);
      data[i + 1] = Math.floor(c.g * 255);
      data[i + 2] = Math.floor(c.b * 255);
      data[i + 3] = 255;
    }
  }

  const gradientTex = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  gradientTex.colorSpace = THREE.SRGBColorSpace;
  gradientTex.needsUpdate = true;
  // Wrap vertically to ensure coverage, though lathe UVs usually map 0-1
  gradientTex.wrapS = THREE.ClampToEdgeWrapping;
  gradientTex.wrapT = THREE.ClampToEdgeWrapping;
  
  balloonMat.map = gradientTex;

  // --- Geometry Construction ---

  // 1. Balloon Body (Lathe)
  // Profile from bottom (knot area) to top center
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center (start of inflation)
    new THREE.Vector2(0.08, 0.05), // Start of curve up
    new THREE.Vector2(0.25, 0.20), // Lower belly
    new THREE.Vector2(0.42, 0.55), // Widest point
    new THREE.Vector2(0.45, 0.85), // Upper belly
    new THREE.Vector2(0.35, 1.15), // Tapering to top
    new THREE.Vector2(0.15, 1.35), // Near top
    new THREE.Vector2(0.00, 1.45)  // Top center
  ];
  
  // Use a curve for smoother profile
  const curve = new THREE.SplineCurve(profilePoints);
  const smoothPoints = curve.getSpacedPoints(40);
  
  const balloonGeom = new THREE.LatheGeometry(smoothPoints, 32);
  const balloonBody = new THREE.Mesh(balloonGeom, balloonMat);
  // Shift up so bottom is at 0
  balloonBody.position.y = 0.05; 
  root.add(balloonBody);

  // 2. Balloon Knot
  // A small twisted shape at the bottom
  const knotGeom = new THREE.SphereGeometry(0.06, 16, 16);
  const knot = new THREE.Mesh(knotGeom, balloonMat);
  knot.position.set(0, 0.02, 0);
  knot.scale.set(1.2, 0.7, 1.2); // Squash it
  knot.rotation.set(0.5, 0.5, 0); // Twist it
  root.add(knot);

  // 3. Stick
  // Thin cylinder extending down
  const stickHeight = 1.2;
  const stickGeom = new THREE.CylinderGeometry(0.015, 0.015, stickHeight, 12);
  const stick = new THREE.Mesh(stickGeom, stickMat);
  // Position stick so top touches the knot
  stick.position.set(0, -stickHeight / 2 + 0.02, 0);
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