export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Ceramic is glossy but not metallic.
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.3,
  });

  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a2a, // Dark navy blue interior
    metalness: 0.0,
    roughness: 0.3,
  });

  const handleLeftMat = new THREE.MeshStandardMaterial({
    color: 0x800080, // Purple
    metalness: 0.0,
    roughness: 0.3,
  });

  const handleRightMat = new THREE.MeshStandardMaterial({
    color: 0xff0000, // Red
    metalness: 0.0,
    roughness: 0.3,
  });

  // --- Procedural Rainbow Texture ---
  // Stripe order (top to bottom): Red, Yellow, Green, Blue, Yellow, Purple
  const W = 256, H = 256;
  const data = new Uint8Array(W * H * 4);
  
  // Define stripe boundaries in UV space (0.0 = bottom, 1.0 = top)
  // Approximate proportions based on reference:
  // Top Red: 1.0 -> 0.82
  // Yellow 1: 0.82 -> 0.78
  // Green: 0.78 -> 0.58
  // Blue: 0.58 -> 0.38
  // Yellow 2: 0.38 -> 0.34
  // Bottom Purple: 0.34 -> 0.0
  
  const colors = [
    { r: 128, g: 0, b: 128, max: 0.34 },   // Purple
    { r: 0, g: 0, b: 255, max: 0.38 },     // Blue
    { r: 255, g: 255, b: 0, max: 0.40 },   // Yellow (thin) - adjusted for visual balance
    { r: 0, g: 255, b: 0, max: 0.60 },     // Green
    { r: 255, g: 255, b: 0, max: 0.64 },   // Yellow (thin)
    { r: 255, g: 0, b: 0, max: 1.00 }      // Red
  ];

  // Helper to find color at v (0 to 1)
  function getColorAt(v) {
    for (let i = 0; i < colors.length; i++) {
      if (v <= colors[i].max) {
        return colors[i];
      }
    }
    return colors[colors.length - 1];
  }

  for (let y = 0; y < H; y++) {
    const v = y / H;
    const c = getColorAt(v);
    const offset = y * W * 4;
    for (let x = 0; x < W; x++) {
      data[offset + x * 4 + 0] = c.r;
      data[offset + x * 4 + 1] = c.g;
      data[offset + x * 4 + 2] = c.b;
      data[offset + x * 4 + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  // Wrap vertically just in case, though we map 0-1
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  
  ceramicMat.map = texture;

  // --- Geometry: Outer Body (Lathe) ---
  // Profile points (radius, y)
  const outerProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.34, 0.00), // Bottom edge
    new THREE.Vector2(0.34, 0.02), // Foot start
    new THREE.Vector2(0.32, 0.90), // Side wall (tapered in)
    new THREE.Vector2(0.36, 0.94), // Rim outer flare
    new THREE.Vector2(0.36, 1.00), // Rim top
    new THREE.Vector2(0.00, 1.00), // Close top (solid for now, we add inner piece)
  ];
  
  const bodyOuterGeom = new THREE.LatheGeometry(outerProfile, 32);
  const body_outer = new THREE.Mesh(bodyOuterGeom, ceramicMat);
  root.add(body_outer);

  // --- Geometry: Inner Cavity (Solid Dark Blue Cylinder/Lathe) ---
  // Sits inside the top, representing the liquid-holding volume
  const innerProfile = [
    new THREE.Vector2(0.00, 0.05), // Inner bottom center
    new THREE.Vector2(0.28, 0.05), // Inner bottom edge
    new THREE.Vector2(0.28, 0.92), // Inner wall top
    new THREE.Vector2(0.00, 0.92), // Close top
  ];
  
  const bodyInnerGeom = new THREE.LatheGeometry(innerProfile, 32);
  const body_inner = new THREE.Mesh(bodyInnerGeom, interiorMat);
  // Lift slightly so it sits flush with rim
  body_inner.position.y = 0.0; 
  root.add(body_inner);

  // --- Geometry: Handles ---
  // Torus defaults to XY plane. We want them vertical on the sides (YZ plane orientation).
  // Rotate X by 90 deg (Math.PI/2) to stand them up.
  
  const handleRadius = 0.18;
  const handleTube = 0.045;
  const handleY = 0.55; // Center height
  const handleZ = 0.0;
  
  // Left Handle (Purple)
  const handleLeftGeom = new THREE.TorusGeometry(handleRadius, handleTube, 16, 32);
  const handle_left = new THREE.Mesh(handleLeftGeom, handleLeftMat);
  handle_left.position.set(-0.34, handleY, handleZ);
  handle_left.rotation.x = Math.PI / 2;
  // Rotate slightly so it attaches cleanly to the side
  handle_left.rotation.y = 0; 
  root.add(handle_left);

  // Right Handle (Red)
  const handleRightGeom = new THREE.TorusGeometry(handleRadius, handleTube, 16, 32);
  const handle_right = new THREE.Mesh(handleRightGeom, handleRightMat);
  handle_right.position.set(0.34, handleY, handleZ);
  handle_right.rotation.x = Math.PI / 2;
  root.add(handle_right);

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