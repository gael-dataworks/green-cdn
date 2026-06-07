export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Bamboo body: warm tan, satin finish
  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xdcb375,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Node rings: darker, slightly rougher
  const nodeMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Binding/wrapping: dark thread
  const bindingMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Holes: deep dark interior
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Geometry: Main Body (Lathe) ---
  // Profile defines the radius at specific Z heights (mapped to Y in Lathe, but we rotate later)
  // Actually Lathe rotates around Y. So profile points are (x=radius, y=height).
  // We want the flute along Z. So we will rotate the resulting mesh 90 deg around X.
  const profilePoints = [
    new THREE.Vector2(0.0, -1.0),      // Center left cap
    new THREE.Vector2(0.048, -1.0),    // Left rim
    new THREE.Vector2(0.048, -0.65),   // Segment 1 start
    new THREE.Vector2(0.052, -0.60),   // Node 1 bulge
    new THREE.Vector2(0.048, -0.55),   // Node 1 end
    new THREE.Vector2(0.048, -0.10),   // Segment 2 start
    new THREE.Vector2(0.052, -0.05),   // Node 2 bulge
    new THREE.Vector2(0.048, 0.00),    // Node 2 end
    new THREE.Vector2(0.048, 0.45),    // Segment 3 start
    new THREE.Vector2(0.052, 0.50),    // Node 3 bulge
    new THREE.Vector2(0.048, 0.55),    // Node 3 end
    new THREE.Vector2(0.048, 0.95),    // Segment 4 end
    new THREE.Vector2(0.048, 1.0),     // Right rim
    new THREE.Vector2(0.0, 1.0),       // Center right cap
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Rotate so the lathe axis (Y) becomes Z
  bodyGeom.rotateX(Math.PI / 2);
  
  const bambooBody = new THREE.Mesh(bodyGeom, bambooMat);
  root.add(bambooBody);

  // --- Helper: Add Ring/Node ---
  function addNodeRing(zPos, radius, tubeRadius, material) {
    const ringGeom = new THREE.TorusGeometry(radius, tubeRadius, 16, 32);
    const ring = new THREE.Mesh(ringGeom, material);
    // Torus is in XY plane by default, which wraps around Z axis perfectly
    ring.position.set(0, 0, zPos);
    root.add(ring);
    return ring;
  }

  // --- Node Rings (Dark lines at joints) ---
  // Positioned to match the bulges in the lathe profile
  addNodeRing(-0.60, 0.052, 0.003, nodeMat);
  addNodeRing(-0.05, 0.052, 0.003, nodeMat);
  addNodeRing(0.50, 0.052, 0.003, nodeMat);

  // --- Binding (Thread wrapping near mouthpiece) ---
  // Located between the large blow hole and the first node
  const binding = addNodeRing(-0.85, 0.049, 0.002, bindingMat);
  // Make it slightly wider to look like wrapping
  binding.scale.set(1, 1, 4); 

  // --- Helper: Add Hole ---
  function addHole(zPos, radius, isLarge) {
    // Cylinder geometry for the hole depth
    // Default cylinder is Y-up. We want it to point towards +Y (top of flute)
    // So no rotation needed if we position it at y=bodyRadius
    const depth = isLarge ? 0.025 : 0.015;
    const holeGeom = new THREE.CylinderGeometry(radius, radius * 0.9, depth, 16);
    const hole = new THREE.Mesh(holeGeom, holeMat);
    
    // Position on the surface (+Y side)
    // We push it slightly inside so it doesn't z-fight or float
    const surfaceY = 0.048; 
    hole.position.set(0, surfaceY - 0.005, zPos);
    
    root.add(hole);
    return hole;
  }

  // --- Holes ---
  // Blow hole (large, near left end)
  addHole(-0.75, 0.012, true);

  // Finger holes (smaller, spaced along the body)
  // Group 1 (between node 1 and 2)
  addHole(-0.40, 0.006, false);
  addHole(-0.30, 0.006, false);
  
  // Group 2 (between node 2 and 3)
  addHole(0.15, 0.006, false);
  addHole(0.25, 0.006, false);
  addHole(0.35, 0.006, false);

  // One more near the end
  addHole(0.70, 0.006, false);

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