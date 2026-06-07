export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.6,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.5,
    roughness: 0.3,
  });

  // Geometries
  // Beam: 1.0 length, 0.1 thickness.
  const beamGeom = new THREE.BoxGeometry(0.1, 1.0, 0.1);
  
  // Wire: 1.28 length (diagonal of 0.9x0.9 square), 0.01 thickness.
  // 0.9 * sqrt(2) ≈ 1.272
  const wireGeom = new THREE.CylinderGeometry(0.008, 0.008, 1.28, 8);

  // --- Build Wooden Frame (12 beams) ---
  // Cube outer bounds approx ±0.5. Beam centers at ±0.45.
  
  const beamPositions = [
    // 4 Vertical beams (along Y)
    { x: -0.45, y: 0, z: -0.45, rx: 0, ry: 0, rz: 0 },
    { x:  0.45, y: 0, z: -0.45, rx: 0, ry: 0, rz: 0 },
    { x: -0.45, y: 0, z:  0.45, rx: 0, ry: 0, rz: 0 },
    { x:  0.45, y: 0, z:  0.45, rx: 0, ry: 0, rz: 0 },
    
    // 4 Top/Bottom beams along X (rotate Z 90)
    { x: 0, y: -0.45, z: -0.45, rx: 0, ry: 0, rz: Math.PI / 2 },
    { x: 0, y:  0.45, z: -0.45, rx: 0, ry: 0, rz: Math.PI / 2 },
    { x: 0, y: -0.45, z:  0.45, rx: 0, ry: 0, rz: Math.PI / 2 },
    { x: 0, y:  0.45, z:  0.45, rx: 0, ry: 0, rz: Math.PI / 2 },
    
    // 4 Top/Bottom beams along Z (rotate X 90)
    { x: -0.45, y: -0.45, z: 0, rx: Math.PI / 2, ry: 0, rz: 0 },
    { x:  0.45, y: -0.45, z: 0, rx: Math.PI / 2, ry: 0, rz: 0 },
    { x: -0.45, y:  0.45, z: 0, rx: Math.PI / 2, ry: 0, rz: 0 },
    { x:  0.45, y:  0.45, z: 0, rx: Math.PI / 2, ry: 0, rz: 0 },
  ];

  for (const p of beamPositions) {
    const beam = new THREE.Mesh(beamGeom, woodMat);
    beam.position.set(p.x, p.y, p.z);
    beam.rotation.set(p.rx, p.ry, p.rz);
    root.add(beam);
  }

  // --- Build Wire Bracing (12 wires, 2 per face) ---
  // Wires span the inner opening. Inner bounds approx ±0.40 (0.45 - 0.05 half-thickness).
  // Diagonal length for 0.8 span: 0.8 * sqrt(2) ≈ 1.13. 
  // But let's use the 1.28 geom and scale/position to fit corners at ±0.42.
  // Distance between -0.42 and 0.42 is 0.84. Diagonal = 0.84 * 1.414 = 1.188.
  // We'll scale the wire geometry slightly or just position carefully.
  // Let's scale wireGeom to match the diagonal of the inner square (0.84 width).
  // Target length = 1.188. Current geom = 1.28. Scale Y = 1.188 / 1.28 ≈ 0.928.
  
  const wireScaleY = 0.93;
  const wireOffset = 0.42; // Slightly inside the beam center (0.45)

  // Helper to add crossed wires on a face
  function addFaceWires(normalAxis, offset, rotBaseX, rotBaseY, rotBaseZ) {
    // Wire 1: Diagonal /
    const w1 = new THREE.Mesh(wireGeom, metalMat);
    w1.scale.set(1, wireScaleY, 1);
    w1.rotation.set(rotBaseX, rotBaseY, rotBaseZ + Math.PI / 4);
    
    // Wire 2: Diagonal \
    const w2 = new THREE.Mesh(wireGeom, metalMat);
    w2.scale.set(1, wireScaleY, 1);
    w2.rotation.set(rotBaseX, rotBaseY, rotBaseZ - Math.PI / 4);

    // Position based on axis
    if (normalAxis === 'z') {
      w1.position.set(0, 0, offset);
      w2.position.set(0, 0, offset);
    } else if (normalAxis === 'y') {
      w1.position.set(0, offset, 0);
      w2.position.set(0, offset, 0);
    } else if (normalAxis === 'x') {
      w1.position.set(offset, 0, 0);
      w2.position.set(offset, 0, 0);
    }
    root.add(w1);
    root.add(w2);
  }

  // Front (Z+) and Back (Z-)
  // Base rotation for Z-face wires (lying in XY plane): Cylinder is Y-up, so rotate X 90 to lie flat? 
  // No, Cylinder is Y-up. To lie in XY plane, rotate Z 90.
  // Wait, standard cylinder is vertical (Y). 
  // To make it diagonal in XY plane: Rotate Z by 45.
  addFaceWires('z', wireOffset, 0, 0, Math.PI / 2); // Front
  addFaceWires('z', -wireOffset, 0, 0, Math.PI / 2); // Back

  // Top (Y+) and Bottom (Y-)
  // Lying in XZ plane. Rotate X 90 to lie flat on XZ. Then rotate Y 45 for diagonal.
  addFaceWires('y', wireOffset, Math.PI / 2, Math.PI / 4, 0); // Top
  addFaceWires('y', -wireOffset, Math.PI / 2, Math.PI / 4, 0); // Bottom

  // Right (X+) and Left (X-)
  // Lying in YZ plane. Rotate Z 90 to lie on XY? No.
  // Start Y-up. Rotate Z 90 -> X-up (lies in YZ plane). Then Rotate X 45 for diagonal in YZ.
  addFaceWires('x', wireOffset, Math.PI / 4, 0, Math.PI / 2); // Right
  addFaceWires('x', -wireOffset, Math.PI / 4, 0, Math.PI / 2); // Left

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