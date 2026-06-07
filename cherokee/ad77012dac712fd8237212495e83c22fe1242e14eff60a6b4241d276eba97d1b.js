export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Clear glass with high transmission for see-through behavior.
  // Using a very slight green tint (#f0f5f0) to mimic real glass, but keeping it bright.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5, // Helps with refraction realism
  });

  // Cork material - matte, rough, brown.
  const corkMat = new THREE.MeshStandardMaterial({
    color: 0xc4a574,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Bottle Body (Lathe) ---
  // Profile defined from bottom center up to top rim.
  // Using SplineCurve for smooth organic transitions.
  const profileCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.00, 0.00),  // Bottom center
    new THREE.Vector2(0.15, 0.00),  // Bottom edge
    new THREE.Vector2(0.15, 0.12),  // Base wall
    new THREE.Vector2(0.18, 0.25),  // Belly (widest point)
    new THREE.Vector2(0.16, 0.38),  // Shoulder start
    new THREE.Vector2(0.09, 0.48),  // Neck base
    new THREE.Vector2(0.09, 0.58),  // Neck top
    new THREE.Vector2(0.10, 0.60),  // Lip flare
    new THREE.Vector2(0.00, 0.61),  // Top center (closed for solid look, or open)
  ]);

  const profilePoints = profileCurve.getSpacedPoints(64);
  const bottleGeom = new THREE.LatheGeometry(profilePoints, 32);
  const bottle_body = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle_body);

  // --- Cork Stopper ---
  // Tapered cylinder. Top radius slightly smaller than bottom.
  // Positioned to sit in the neck.
  const corkGeom = new THREE.CylinderGeometry(0.075, 0.085, 0.12, 16);
  const cork_stop = new THREE.Mesh(corkGeom, corkMat);
  cork_stop.position.y = 0.56; // Sit on top of neck
  root.add(cork_stop);

  // --- Embossed Decoration (Geometry Decals) ---
  // To simulate embossed glass, we place thin geometry slightly outside the surface
  // using the same glass material.
  
  // Helper to get radius at a given height based on our profile approximation
  function getRadiusAtY(y) {
    if (y < 0.12) return 0.15;
    if (y < 0.25) return 0.15 + (y - 0.12) * ((0.18 - 0.15) / (0.25 - 0.12));
    if (y < 0.38) return 0.18 - (y - 0.25) * ((0.18 - 0.16) / (0.38 - 0.25));
    if (y < 0.48) return 0.16 - (y - 0.38) * ((0.16 - 0.09) / (0.48 - 0.38));
    return 0.09;
  }

  // Helper to place a decal on the surface
  function addDecal(angle, y, mesh) {
    const r = getRadiusAtY(y) + 0.004; // Slight offset to prevent z-fighting
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    mesh.position.set(x, y, z);
    
    // Orient mesh to face outward (normal follows radial vector)
    const normal = new THREE.Vector3(x, 0, z).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1), // Default forward for most flat shapes
      normal
    );
    mesh.quaternion.copy(quaternion);
    root.add(mesh);
  }

  // 1. Central Medallion (Circle/Ring)
  const medallionGeom = new THREE.RingGeometry(0.06, 0.065, 32);
  const medallion = new THREE.Mesh(medallionGeom, glassMat);
  addDecal(0, 0.25, medallion);

  // 2. Side Vertical Vines (Tubes)
  // Create a curve that follows the bottle curvature vertically
  function createVineCurve(angle, startY, endY) {
    const points = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = startY + (endY - startY) * t;
      const r = getRadiusAtY(y) + 0.004;
      points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    return new THREE.CatmullRomCurve3(points);
  }

  const vineLeftCurve = createVineCurve(-1.2, 0.15, 0.40);
  const vineRightCurve = createVineCurve(1.2, 0.15, 0.40);

  const vineGeom = new THREE.TubeGeometry(vineLeftCurve, 20, 0.003, 8, false);
  const vine_left = new THREE.Mesh(vineGeom, glassMat);
  root.add(vine_left);

  const vineRightGeom = new THREE.TubeGeometry(vineRightCurve, 20, 0.003, 8, false);
  const vine_right = new THREE.Mesh(vineRightGeom, glassMat);
  root.add(vine_right);

  // 3. Leaves (Flattened Spheres/Circles) along the vines
  function addLeaf(angle, y, scale, rotOffset) {
    const leafGeom = new THREE.CircleGeometry(0.015 * scale, 8);
    const leaf = new THREE.Mesh(leafGeom, glassMat);
    // Add some rotation variety
    leaf.rotateZ(rotOffset || 0);
    addDecal(angle, y, leaf);
  }

  // Left vine leaves
  addLeaf(-1.2, 0.20, 1.0, 0.5);
  addLeaf(-1.2, 0.28, 0.8, -0.5);
  addLeaf(-1.2, 0.35, 1.1, 0.2);

  // Right vine leaves
  addLeaf(1.2, 0.22, 0.9, -0.3);
  addLeaf(1.2, 0.30, 1.0, 0.4);
  addLeaf(1.2, 0.38, 0.8, -0.2);

  // 4. Decorative swirls around medallion (Torus segments or Tubes)
  // Simplified as small circles for procedural stability
  addDecal(0.3, 0.30, new THREE.Mesh(new THREE.CircleGeometry(0.01, 8), glassMat));
  addDecal(-0.3, 0.30, new THREE.Mesh(new THREE.CircleGeometry(0.01, 8), glassMat));
  addDecal(0, 0.35, new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), glassMat));

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