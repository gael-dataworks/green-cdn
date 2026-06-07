export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold body: Polished metal look. Metalness capped at 0.6 to avoid blackness without env map.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Wick: Dark, matte, charred look.
  const wickMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Flame: Glowing, warm light.
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFE0,
    emissive: 0xFFA500,
    emissiveIntensity: 1.5,
    metalness: 0.0,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  // --- Geometry & Meshes ---

  // Candle Body: Tapered cone shape.
  const bodyHeight = 0.8;
  const bodyRadiusBottom = 0.35;
  const bodyRadiusTop = 0.03; // Small flat top for the wick
  const candle_body_geom = new THREE.CylinderGeometry(bodyRadiusTop, bodyRadiusBottom, bodyHeight, 32);
  const candle_body = new THREE.Mesh(candle_body_geom, goldMat);
  candle_body.position.y = 0;
  root.add(candle_body);

  // Wick: Small cylinder at the apex.
  const wickHeight = 0.04;
  const wickRadius = 0.012;
  const wick_geom = new THREE.CylinderGeometry(wickRadius, wickRadius, wickHeight, 8);
  const wick = new THREE.Mesh(wick_geom, wickMat);
  // Position on top of the body
  wick.position.y = bodyHeight / 2 + wickHeight / 2;
  root.add(wick);

  // Flame: Teardrop shape using LatheGeometry.
  // Profile points define the right half of the flame silhouette (x, y).
  const flamePoints = [];
  flamePoints.push(new THREE.Vector2(0, 0));       // Base center
  flamePoints.push(new THREE.Vector2(0.05, 0.08)); // Base swell
  flamePoints.push(new THREE.Vector2(0.09, 0.25)); // Widest part
  flamePoints.push(new THREE.Vector2(0.04, 0.45)); // Tapering up
  flamePoints.push(new THREE.Vector2(0, 0.55));    // Tip

  const flame_geom = new THREE.LatheGeometry(flamePoints, 24);
  const flame = new THREE.Mesh(flame_geom, flameMat);
  
  // Calculate flame height to position it correctly on the wick
  // LatheGeometry centers the object, so bounds are -h/2 to +h/2 relative to mesh position.
  // Max Y in points is 0.55, Min Y is 0. Center is 0.275.
  const flameHeight = 0.55;
  const flameCenterOffset = flameHeight / 2;
  
  // Place bottom of flame at top of wick
  flame.position.y = (bodyHeight / 2 + wickHeight) + flameCenterOffset;
  root.add(flame);

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