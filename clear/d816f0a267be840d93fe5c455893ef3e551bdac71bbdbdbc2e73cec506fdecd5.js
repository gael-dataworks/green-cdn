export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glossy ceramic material base
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.2,
  });

  // Inner dark blue material
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x000033,
    metalness: 0.0,
    roughness: 0.2,
  });

  // Left handle (Purple)
  const handleLeftMat = new THREE.MeshStandardMaterial({
    color: 0x6a0dad,
    metalness: 0.0,
    roughness: 0.2,
  });

  // Right handle (Red)
  const handleRightMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    metalness: 0.0,
    roughness: 0.2,
  });

  // --- Procedural Stripe Texture ---
  // Rainbow stripes: Red, Orange, Yellow, Green, Blue, Purple (top to bottom)
  const W = 256, H = 256;
  const data = new Uint8Array(W * H * 4);
  const colors = [
    { r: 255, g: 0, b: 0 },    // Red (Top)
    { r: 255, g: 165, b: 0 },  // Orange
    { r: 255, g: 255, b: 0 },  // Yellow
    { r: 0, g: 128, b: 0 },    // Green
    { r: 0, g: 191, b: 255 },  // Blue
    { r: 128, g: 0, b: 128 }   // Purple (Bottom)
  ];
  
  const bands = colors.length;
  const bandHeight = H / bands;

  for (let y = 0; y < H; y++) {
    // Calculate which band this row belongs to (inverted Y because texture coords often start top-left)
    // But for LatheGeometry, V usually goes 0..1 from bottom to top or vice versa depending on profile.
    // Let's map y=0 (bottom of texture) to Purple, y=H (top) to Red.
    const bandIndex = Math.floor((y / H) * bands);
    const c = colors[bandIndex] || colors[bands - 1];
    
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      data[idx] = c.r;
      data[idx + 1] = c.g;
      data[idx + 2] = c.b;
      data[idx + 3] = 255;
    }
  }

  const stripeTexture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  stripeTexture.colorSpace = THREE.SRGBColorSpace;
  stripeTexture.needsUpdate = true;
  // Wrap vertically to ensure full coverage if UVs stretch
  stripeTexture.wrapS = THREE.RepeatWrapping;
  stripeTexture.wrapT = THREE.ClampToEdgeWrapping;

  ceramicMat.map = stripeTexture;

  // --- Geometry: Outer Body ---
  // Profile points [radius, y]
  const outerProfile = [
    new THREE.Vector2(0.00, 0.00),  // Bottom center
    new THREE.Vector2(0.32, 0.00),  // Bottom edge
    new THREE.Vector2(0.32, 0.04),  // Base lip start
    new THREE.Vector2(0.30, 0.05),  // Base lip end / body start
    new THREE.Vector2(0.31, 0.45),  // Mid body (slight taper in)
    new THREE.Vector2(0.33, 0.85),  // Upper body (flare out)
    new THREE.Vector2(0.36, 0.92),  // Rim outer edge
    new THREE.Vector2(0.33, 0.95),  // Rim top inner edge
    new THREE.Vector2(0.00, 0.95),  // Top center
  ];
  
  const bodyOuterGeom = new THREE.LatheGeometry(outerProfile, 32);
  const bodyOuter = new THREE.Mesh(bodyOuterGeom, ceramicMat);
  root.add(bodyOuter);

  // --- Geometry: Inner Cavity ---
  // Slightly smaller to create wall thickness, dark blue
  const innerProfile = [
    new THREE.Vector2(0.00, 0.06),  // Bottom center (floating above absolute bottom)
    new THREE.Vector2(0.28, 0.06),  // Inner bottom edge
    new THREE.Vector2(0.28, 0.05),  // Inner base transition
    new THREE.Vector2(0.29, 0.10),  // Inner wall start
    new THREE.Vector2(0.29, 0.85),  // Inner wall top
    new THREE.Vector2(0.32, 0.92),  // Inner rim lip
    new THREE.Vector2(0.00, 0.92),  // Top center
  ];

  const bodyInnerGeom = new THREE.LatheGeometry(innerProfile, 32);
  const bodyInner = new THREE.Mesh(bodyInnerGeom, innerMat);
  root.add(bodyInner);

  // --- Geometry: Handles ---
  // TorusGeometry(radius, tube, radialSegments, tubularSegments, arc)
  // Arc = Math.PI for a C-shape (180 degrees)
  const handleRadius = 0.22;
  const handleTube = 0.035;
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 16, 32, Math.PI);
  
  // Left Handle (Purple)
  // Torus is in XY plane by default. We need it in YZ plane to wrap around X axis.
  // Rotate 90 deg around Y.
  const handleLeft = new THREE.Mesh(handleGeom, handleLeftMat);
  handleLeft.rotation.y = Math.PI / 2;
  handleLeft.position.set(-0.34, 0.48, 0); 
  // The torus center is at 0,0,0 relative to mesh. 
  // We need to shift it so the open part faces the mug.
  // Default Torus starts at angle 0. Arc Math.PI goes 0 to 180.
  // We want the opening to face +X (for left handle) and -X (for right handle).
  // Default Torus (arc Math.PI) opens along the X axis? 
  // Torus points: x = (R + r cos v) cos u, y = (R + r cos v) sin u.
  // With arc Math.PI, u goes 0 to PI. It's a half donut.
  // Let's adjust rotation to make it look like a C-handle.
  handleLeft.rotation.z = Math.PI / 2; // Now it's in XZ plane? No.
  // Let's reset and think.
  // Default Torus: Ring in XY plane.
  // We want Ring in YZ plane (standing up). Rotate X by 90 (PI/2).
  handleLeft.rotation.x = Math.PI / 2;
  // Now it's a vertical ring in YZ plane.
  // Arc Math.PI makes it a half-ring.
  // We need to rotate around Z to orient the opening.
  handleLeft.rotation.z = Math.PI; // Open side faces +X
  
  // Position: Left side is -X. Handle should be at -X.
  // Center of handle arc should be around x = -0.35 - handleRadius.
  handleLeft.position.set(-0.35 - handleRadius * 0.8, 0.48, 0);
  
  // Right Handle (Red)
  const handleRight = new THREE.Mesh(handleGeom, handleRightMat);
  handleRight.rotation.x = Math.PI / 2;
  handleRight.rotation.z = 0; // Open side faces -X
  handleRight.position.set(0.35 + handleRadius * 0.8, 0.48, 0);

  root.add(handleLeft);
  root.add(handleRight);

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