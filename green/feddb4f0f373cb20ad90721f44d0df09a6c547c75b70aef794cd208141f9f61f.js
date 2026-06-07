export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished copper: High metalness (capped at 0.6), low roughness, specific copper color.
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Engraving material: Darker, slightly rougher to simulate oxidized recessed metal.
  const engraveMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.5,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  // --- Dimensions ---
  const R = 0.35;          // Body radius
  const H = 0.90;          // Body height
  const RIM_H = 0.05;      // Rim height
  const RIM_R = 0.38;      // Rim outer radius
  const WALL_T = 0.02;     // Wall thickness
  const HANDLE_R = 0.12;   // Handle tube radius
  const HANDLE_DIST = 0.15;// Distance handle protrudes

  // --- Mug Body (Lathe) ---
  // Profile defines the cross-section of the mug wall and rim.
  const profilePoints = [
    new THREE.Vector2(0, 0),                 // Bottom center
    new THREE.Vector2(R, 0),                 // Bottom outer edge
    new THREE.Vector2(R, H),                 // Side top (below rim)
    new THREE.Vector2(RIM_R, H),             // Rim outer corner
    new THREE.Vector2(RIM_R, H + RIM_H),     // Rim top outer
    new THREE.Vector2(R - WALL_T, H + RIM_H),// Rim top inner
    new THREE.Vector2(R - WALL_T, WALL_T),   // Inner wall bottom
    new THREE.Vector2(0, WALL_T),            // Inner bottom center (closes the cup)
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 48);
  // Fix UVs for LatheGeometry to ensure texture/pattern mapping works if needed
  // (Default UVs are usually fine for radial objects, u=angle, v=height)
  const mugBody = new THREE.Mesh(bodyGeom, copperMat);
  root.add(mugBody);

  // --- Handle (Tube) ---
  // D-shaped curve attached to the side.
  // Points in local space (X is radius direction, Y is up, Z is depth).
  // Handle is on the +X side.
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(R, H * 0.75, 0),       // Top attach
    new THREE.Vector3(R + HANDLE_DIST, H * 0.75, 0), // Top curve out
    new THREE.Vector3(R + HANDLE_DIST, H * 0.25, 0), // Bottom curve out
    new THREE.Vector3(R, H * 0.25, 0),       // Bottom attach
  ]);

  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.025, 12, false);
  const handle = new THREE.Mesh(handleGeom, copperMat);
  root.add(handle);

  // --- Engravings (Geometry Decals) ---
  // Instead of a texture, we use shallow geometry decals slightly inset into the surface.
  // This matches the "surface decoration" handbook for relief ornament.

  const decalDepth = 0.002;
  const decalRadius = R - 0.005; // Slightly inside the body radius

  // Helper to place a decal on the curved surface
  function addDecal(shape, xAngle, yHeight, scale) {
    const geom = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geom, engraveMat);
    
    // Position on the cylinder surface
    const x = Math.cos(xAngle) * decalRadius;
    const z = Math.sin(xAngle) * decalRadius;
    
    mesh.position.set(x, yHeight, z);
    
    // Orient to face outward normal
    mesh.lookAt(Math.cos(xAngle) * (decalRadius + 1), yHeight, Math.sin(xAngle) * (decalRadius + 1));
    
    // Scale
    mesh.scale.set(scale, scale, 1);
    
    root.add(mesh);
  }

  // 1. Floral Motif (Middle Section)
  // Simple 4-petal flower shape
  const flowerShape = new THREE.Shape();
  const petalLen = 0.06;
  const petalW = 0.025;
  // Draw 4 petals around center
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const cx = Math.cos(angle) * petalLen * 0.5;
    const cy = Math.sin(angle) * petalLen * 0.5;
    // Simple petal bezier
    flowerShape.moveTo(0, 0);
    flowerShape.quadraticCurveTo(
      cx + Math.cos(angle + Math.PI/2) * petalW,
      cy + Math.sin(angle + Math.PI/2) * petalW,
      Math.cos(angle) * petalLen,
      Math.sin(angle) * petalLen
    );
    flowerShape.quadraticCurveTo(
      cx + Math.cos(angle - Math.PI/2) * petalW,
      cy + Math.sin(angle - Math.PI/2) * petalW,
      0, 0
    );
  }
  // Add a center circle
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, 0.015, 0, Math.PI * 2, true);
  flowerShape.holes.push(holePath);

  // Place 6 flowers around the middle
  const flowerY = H * 0.5;
  const flowerCount = 6;
  for (let i = 0; i < flowerCount; i++) {
    const angle = (i / flowerCount) * Math.PI * 2;
    addDecal(flowerShape, angle, flowerY, 1.0);
  }

  // 2. Scroll Bands (Top and Bottom)
  // Create a simple wave/scroll shape
  const scrollShape = new THREE.Shape();
  scrollShape.moveTo(-0.04, -0.01);
  scrollShape.bezierCurveTo(-0.02, -0.02, 0.02, -0.02, 0.04, -0.01); // Bottom wave
  scrollShape.bezierCurveTo(0.02, 0.00, -0.02, 0.00, -0.04, -0.01); // Close
  // Add a decorative dot
  const dotPath = new THREE.Path();
  dotPath.absarc(0, 0, 0.008, 0, Math.PI * 2, true);
  scrollShape.holes.push(dotPath);

  // Top Band
  const topBandY = H * 0.85;
  const topBandCount = 12;
  for (let i = 0; i < topBandCount; i++) {
    const angle = (i / topBandCount) * Math.PI * 2;
    // Alternate orientation for variety
    const scale = 0.8;
    addDecal(scrollShape, angle, topBandY, scale);
  }

  // Bottom Band
  const botBandY = H * 0.15;
  const botBandCount = 12;
  for (let i = 0; i < botBandCount; i++) {
    const angle = (i / botBandCount) * Math.PI * 2;
    addDecal(scrollShape, angle, botBandY, 0.8);
  }

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