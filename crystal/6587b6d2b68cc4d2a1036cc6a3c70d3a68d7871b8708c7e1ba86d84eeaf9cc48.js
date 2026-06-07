export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Galvanized/Stamped Steel
  // Dull silver, moderate roughness, capped metalness.
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xa8a8a8,
    metalness: 0.5,
    roughness: 0.6,
  });

  // --- 1. Base Plate ---
  // Irregular flat shape with holes.
  const plateShape = new THREE.Shape();
  const outerR = 0.42;
  const innerR = 0.18; // Central hole radius

  // Draw outer perimeter (approximate traced shape)
  // Start top-right, go CCW
  plateShape.moveTo(0.35, 0.25);
  plateShape.quadraticCurveTo(0.15, 0.42, -0.15, 0.42); // Top edge
  plateShape.quadraticCurveTo(-0.35, 0.35, -0.38, 0.15); // Top-Left corner
  plateShape.quadraticCurveTo(-0.42, 0.0, -0.38, -0.15); // Left side indentation start
  plateShape.quadraticCurveTo(-0.35, -0.35, -0.15, -0.42); // Bottom-Left corner
  plateShape.quadraticCurveTo(0.15, -0.42, 0.35, -0.25); // Bottom edge
  plateShape.quadraticCurveTo(0.42, -0.05, 0.42, 0.05); // Right edge
  plateShape.quadraticCurveTo(0.42, 0.15, 0.35, 0.25); // Top-Right corner close

  // Holes in the plate
  // 1. Top-Left
  const holeTL = new THREE.Path();
  holeTL.absarc(-0.22, 0.28, 0.045, 0, Math.PI * 2, true);
  plateShape.holes.push(holeTL);

  // 2. Bottom-Left
  const holeBL = new THREE.Path();
  holeBL.absarc(-0.22, -0.28, 0.045, 0, Math.PI * 2, true);
  plateShape.holes.push(holeBL);

  // 3. Bottom-Right
  const holeBR = new THREE.Path();
  holeBR.absarc(0.28, -0.28, 0.045, 0, Math.PI * 2, true);
  plateShape.holes.push(holeBR);

  // 4. Large Slot on Left
  const slot = new THREE.Path();
  slot.absarc(-0.32, 0.0, 0.09, 0, Math.PI * 2, true);
  plateShape.holes.push(slot);

  // 5. Central Hole (for the pipe)
  const centerHole = new THREE.Path();
  centerHole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
  plateShape.holes.push(centerHole);

  const plateGeom = new THREE.ExtrudeGeometry(plateShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
  });
  // Center the geometry vertically so top surface is at y=0 (before boss)
  plateGeom.translate(0, -0.015, 0);
  const basePlate = new THREE.Mesh(plateGeom, steelMat);
  root.add(basePlate);

  // --- 2. Central Boss (Raised Ring) ---
  // Stepped ring around the center hole
  const bossShape = new THREE.Shape();
  const bossOuterR = 0.18;
  const bossInnerR = 0.13;

  bossShape.absarc(0, 0, bossOuterR, 0, Math.PI * 2, false);
  const bossHole = new THREE.Path();
  bossHole.absarc(0, 0, bossInnerR, 0, Math.PI * 2, true);
  bossShape.holes.push(bossHole);

  const bossGeom = new THREE.ExtrudeGeometry(bossShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 3,
    steps: 1,
  });
  // Position on top of plate
  bossGeom.translate(0, 0.025, 0);
  const centralBoss = new THREE.Mesh(bossGeom, steelMat);
  root.add(centralBoss);

  // --- 3. Inner Ring Detail (Step down) ---
  // There appears to be a slight step or ridge inside the boss
  const ridgeShape = new THREE.Shape();
  ridgeShape.absarc(0, 0, bossInnerR + 0.02, 0, Math.PI * 2, false);
  const ridgeHole = new THREE.Path();
  ridgeHole.absarc(0, 0, bossInnerR - 0.01, 0, Math.PI * 2, true);
  ridgeShape.holes.push(ridgeHole);

  const ridgeGeom = new THREE.ExtrudeGeometry(ridgeShape, {
    depth: 0.04,
    bevelEnabled: false,
    steps: 1,
  });
  ridgeGeom.translate(0, 0.025 + 0.08, 0); // On top of boss
  const innerRidge = new THREE.Mesh(ridgeGeom, steelMat);
  root.add(innerRidge);

  // --- 4. Embossed Stamp/Logo ---
  // Small raised detail on the right side
  const stampShape = new THREE.Shape();
  stampShape.moveTo(-0.03, -0.01);
  stampShape.lineTo(0.03, -0.01);
  stampShape.lineTo(0.03, 0.01);
  stampShape.lineTo(-0.03, 0.01);
  stampShape.lineTo(-0.03, -0.01);

  const stampGeom = new THREE.ExtrudeGeometry(stampShape, {
    depth: 0.003,
    bevelEnabled: false,
    steps: 1,
  });
  const stamp = new THREE.Mesh(stampGeom, steelMat);
  stamp.position.set(0.28, 0.025, -0.15);
  stamp.rotation.z = -0.2;
  root.add(stamp);

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