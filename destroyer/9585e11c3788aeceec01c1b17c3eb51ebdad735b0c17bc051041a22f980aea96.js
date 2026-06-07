export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Bright, reflective, with emissive boost per metal brightness rules.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd4af37,
    emissiveIntensity: 0.4,
  });

  // Emerald: Green, translucent, glossy.
  const emeraldMat = new THREE.MeshPhysicalMaterial({
    color: 0x00aa55,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.57,
    transparent: true,
    thickness: 0.5,
  });

  // Ruby: Red, translucent, glossy.
  const rubyMat = new THREE.MeshPhysicalMaterial({
    color: 0xdd0000,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.76,
    transparent: true,
    thickness: 0.5,
  });

  // --- Dimensions ---
  const barLength = 1.2;
  const barWidth = 0.38;
  const barThickness = 0.06;
  const stoneHeight = 0.08;
  
  const emeraldLength = 0.32;
  const emeraldWidth = 0.14;
  const rubyRadius = 0.055;
  const paveRadius = 0.022;

  // --- Base Plate (Gold) ---
  // Rounded rectangle shape for extrusion
  const shape = new THREE.Shape();
  const w = barWidth / 2;
  const h = barLength / 2;
  const r = 0.06; // corner radius
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const baseGeom = new THREE.ExtrudeGeometry(shape, {
    depth: barThickness,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1,
  });
  // Center the extrusion
  baseGeom.translate(0, barThickness / 2, 0);
  
  const basePlate = new THREE.Mesh(baseGeom, goldMat);
  root.add(basePlate);

  // --- Helper: Add Rectangular Stone with Bezel ---
  function addEmerald(zPos) {
    // Gold Bezel (Frame)
    const bezelGeom = new THREE.BoxGeometry(emeraldWidth + 0.012, barThickness + 0.01, emeraldLength + 0.012);
    // Cut out the center visually by making the stone sit on top, or use a frame mesh.
    // Let's make a frame using a slightly larger box and a slightly smaller box subtracted? 
    // No CSG. Let's just make a thin frame mesh.
    const frame = new THREE.Mesh(new THREE.BoxGeometry(emeraldWidth + 0.012, 0.015, emeraldLength + 0.012), goldMat);
    frame.position.set(0, barThickness + 0.005, zPos);
    root.add(frame);

    // Inner Gold floor (optional, makes it look set)
    const floor = new THREE.Mesh(new THREE.BoxGeometry(emeraldWidth - 0.005, 0.005, emeraldLength - 0.005), goldMat);
    floor.position.set(0, barThickness + 0.002, zPos);
    root.add(floor);

    // The Stone
    // Use BoxGeometry for emerald cut look
    const stoneGeom = new THREE.BoxGeometry(emeraldWidth - 0.01, stoneHeight, emeraldLength - 0.01);
    const stone = new THREE.Mesh(stoneGeom, emeraldMat);
    stone.position.set(0, barThickness + stoneHeight / 2, zPos);
    root.add(stone);
  }

  // --- Helper: Add Round Stone with Bezel ---
  function addRuby() {
    // Gold Bezel (Torus)
    const bezelGeom = new THREE.TorusGeometry(rubyRadius + 0.012, 0.012, 8, 24);
    const bezel = new THREE.Mesh(bezelGeom, goldMat);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(0, barThickness + 0.01, 0);
    root.add(bezel);

    // The Stone (Sphere for round brilliant)
    const stoneGeom = new THREE.SphereGeometry(rubyRadius, 16, 16);
    // Flatten it slightly to look like a set gem
    stoneGeom.scale(1, 0.8, 1); 
    const stone = new THREE.Mesh(stoneGeom, rubyMat);
    stone.position.set(0, barThickness + rubyRadius * 0.8, 0);
    root.add(stone);
  }

  // --- Helper: Add Pavé Stone ---
  function addPave(x, z) {
    const geom = new THREE.SphereGeometry(paveRadius, 8, 8);
    // Flatten slightly
    geom.scale(1, 0.8, 1);
    const stone = new THREE.Mesh(geom, emeraldMat);
    stone.position.set(x, barThickness + paveRadius * 0.8, z);
    root.add(stone);

    // Tiny gold bead setting (optional, adds realism)
    // const bead = new THREE.Mesh(new THREE.TorusGeometry(paveRadius + 0.005, 0.004, 4, 8), goldMat);
    // bead.rotation.x = Math.PI / 2;
    // bead.position.copy(stone.position);
    // root.add(bead);
  }

  // --- Place Main Stones ---
  // Two emeralds separated by the ruby
  const emeraldOffset = 0.26;
  addEmerald(-emeraldOffset);
  addEmerald(emeraldOffset);
  addRuby();

  // --- Place Pavé Stones ---
  // We need to fill the gaps between the main stones and line the edges.
  
  // 1. Top and Bottom Edges
  const edgeZStart = -barLength / 2 + 0.08;
  const edgeZEnd = barLength / 2 - 0.08;
  const edgeX = barWidth / 2 - 0.035;
  const paveSpacing = 0.055;
  
  for (let z = edgeZStart; z <= edgeZEnd; z += paveSpacing) {
    // Skip the very center where the ruby is
    if (Math.abs(z) < 0.08) continue;
    addPave(-edgeX, z);
    addPave(edgeX, z);
  }

  // 2. Ends (Left and Right caps)
  const endZ = barLength / 2 - 0.06;
  addPave(0, -endZ); // Left end
  addPave(0, endZ);  // Right end
  // Add corners to round off the ends
  addPave(-edgeX * 0.6, -endZ + 0.04);
  addPave(edgeX * 0.6, -endZ + 0.04);
  addPave(-edgeX * 0.6, endZ - 0.04);
  addPave(edgeX * 0.6, endZ - 0.04);

  // 3. Inner Fillers (Between Emeralds and Ruby)
  // Gap is roughly from z=0.15 to z=0.26 (and negative side)
  // Place 2-3 stones in the gap on top and bottom
  const innerGapStart = 0.16;
  const innerGapEnd = 0.24;
  const innerX = 0.08; // Closer to center
  
  // Top inner
  addPave(-innerX, -innerGapStart);
  addPave(innerX, -innerGapStart);
  addPave(-innerX, innerGapStart);
  addPave(innerX, innerGapStart);
  
  // Maybe a second row closer to ruby?
  addPave(-innerX * 0.5, -0.09);
  addPave(innerX * 0.5, -0.09);
  addPave(-innerX * 0.5, 0.09);
  addPave(innerX * 0.5, 0.09);

  // --- Back Clasp (Simple hint) ---
  // A small gold loop or box at the bottom center back
  const claspGeom = new THREE.BoxGeometry(0.08, 0.02, 0.15);
  const clasp = new THREE.Mesh(claspGeom, goldMat);
  clasp.position.set(0, -0.02, 0.2); // Slightly offset
  clasp.rotation.x = 0.2;
  root.add(clasp);

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