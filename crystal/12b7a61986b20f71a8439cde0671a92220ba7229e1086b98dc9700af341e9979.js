export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black metal for blade, guard, pommel
  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.5,
    roughness: 0.6,
  });

  // Slightly darker/matter material for grip (wrapped/ribbed)
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.3,
    roughness: 0.8,
  });

  // --- Constants ---
  // Sword aligned along Z axis. Tip at +Z, Pommel at -Z.
  const bladeLength = 0.65;
  const guardZ = -bladeLength + 0.05; // Position of guard
  const gripLength = 0.20;
  const pommelZ = guardZ - gripLength - 0.05;

  // --- 1. Blade ---
  // Shape pointing along +Y in 2D space, so after rotation it points +Z
  const bladeShape = new THREE.Shape();
  const tipY = bladeLength;
  const shoulderY = 0.15;
  const maxHalfWidth = 0.12;
  const ricassoHalfWidth = 0.08;
  const tangHalfWidth = 0.04;

  bladeShape.moveTo(0, tipY);
  bladeShape.lineTo(maxHalfWidth, shoulderY);
  bladeShape.lineTo(ricassoHalfWidth, 0.05);
  bladeShape.lineTo(tangHalfWidth, 0);
  bladeShape.lineTo(-tangHalfWidth, 0);
  bladeShape.lineTo(-ricassoHalfWidth, 0.05);
  bladeShape.lineTo(-maxHalfWidth, shoulderY);
  bladeShape.lineTo(0, tipY);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.015, // Thickness
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });

  // Rotate to lie in XZ plane, pointing +Z, thickness along Y
  bladeGeom.rotateX(Math.PI / 2);
  // Center the geometry so the pivot is at the guard/tang junction
  bladeGeom.translate(0, 0, -bladeLength + 0.05); 

  const blade_base = new THREE.Mesh(bladeGeom, blackMetalMat);
  root.add(blade_base);

  // Blade Fuller (Groove) - A thin inset box to simulate the groove
  const fullerGeom = new THREE.BoxGeometry(0.04, 0.002, bladeLength * 0.7);
  const blade_fuller = new THREE.Mesh(fullerGeom, blackMetalMat);
  fullerGeom.translate(0, 0.008, -bladeLength * 0.35 + 0.05); // Position on blade surface
  // Actually, let's just position the mesh
  blade_fuller.position.set(0, 0.008, -bladeLength * 0.35 + 0.05);
  root.add(blade_fuller);

  // Blade Decor (Raised geometric patterns near guard)
  // Diamond shape
  const decorShape = new THREE.Shape();
  decorShape.moveTo(0, 0.04);
  decorShape.lineTo(0.02, 0);
  decorShape.lineTo(0, -0.04);
  decorShape.lineTo(-0.02, 0);
  decorShape.lineTo(0, 0.04);
  
  const decorGeom = new THREE.ExtrudeGeometry(decorShape, { depth: 0.003, bevelEnabled: false });
  decorGeom.rotateX(Math.PI / 2);
  
  const blade_decor_1 = new THREE.Mesh(decorGeom, blackMetalMat);
  blade_decor_1.position.set(0, 0.008, -0.15);
  root.add(blade_decor_1);

  const blade_decor_2 = new THREE.Mesh(decorGeom, blackMetalMat);
  blade_decor_2.position.set(0, 0.008, -0.25);
  root.add(blade_decor_2);

  // --- 2. Guard (Crossguard) ---
  // Straight bar with slightly curved/notched ends
  const guardShape = new THREE.Shape();
  const guardHalfWidth = 0.14;
  const guardHeight = 0.04;
  const guardThickness = 0.03;

  guardShape.moveTo(-guardHalfWidth, -guardHeight / 2);
  guardShape.lineTo(-guardHalfWidth + 0.03, -guardHeight / 2 - 0.01); // Notch
  guardShape.lineTo(-guardHalfWidth + 0.03, guardHeight / 2 + 0.01);
  guardShape.lineTo(-guardHalfWidth, guardHeight / 2);
  guardShape.lineTo(guardHalfWidth, guardHeight / 2);
  guardShape.lineTo(guardHalfWidth - 0.03, guardHeight / 2 + 0.01);
  guardShape.lineTo(guardHalfWidth - 0.03, -guardHeight / 2 - 0.01);
  guardShape.lineTo(guardHalfWidth, -guardHeight / 2);
  guardShape.lineTo(-guardHalfWidth, -guardHeight / 2);

  const guardGeom = new THREE.ExtrudeGeometry(guardShape, { depth: guardThickness, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002 });
  guardGeom.rotateX(Math.PI / 2);
  guardGeom.translate(0, 0, guardZ);

  const guard_base = new THREE.Mesh(guardGeom, blackMetalMat);
  root.add(guard_base);

  // Guard Decor (Small raised details on the guard face)
  const guardDecorGeom = new THREE.BoxGeometry(0.06, 0.003, 0.02);
  const guard_decor_1 = new THREE.Mesh(guardDecorGeom, blackMetalMat);
  guard_decor_1.position.set(-0.06, 0.016, guardZ);
  root.add(guard_decor_1);
  
  const guard_decor_2 = new THREE.Mesh(guardDecorGeom, blackMetalMat);
  guard_decor_2.position.set(0.06, 0.016, guardZ);
  root.add(guard_decor_2);

  // --- 3. Grip (Handle) ---
  // Stacked cylinders for ridges
  const gripRadius = 0.035;
  const gripSegments = 6;
  const segmentHeight = gripLength / gripSegments;
  const gripStartZ = guardZ - 0.02;

  for (let i = 0; i < gripSegments; i++) {
    const z = gripStartZ - (i * segmentHeight) - (segmentHeight / 2);
    // Taper slightly towards pommel
    const taper = 1.0 - (i / gripSegments) * 0.1; 
    const segGeom = new THREE.CylinderGeometry(gripRadius * taper, gripRadius * taper, segmentHeight * 0.9, 16);
    segGeom.rotateX(Math.PI / 2);
    const grip_segment = new THREE.Mesh(segGeom, gripMat);
    grip_segment.position.set(0, 0, z);
    root.add(grip_segment);
  }

  // --- 4. Pommel ---
  // Bulbous end cap
  const pommelRadius = 0.05;
  const pommelGeom = new THREE.SphereGeometry(pommelRadius, 24, 24);
  pommelGeom.scale(1, 1, 0.8); // Flatten slightly
  pommelGeom.translate(0, 0, pommelZ - pommelRadius * 0.8);

  const pommel_base = new THREE.Mesh(pommelGeom, blackMetalMat);
  root.add(pommel_base);

  // Pommel Emblem (Star/Flower on the end cap)
  const emblemShape = new THREE.Shape();
  const r1 = 0.025, r2 = 0.012;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const x1 = Math.cos(angle) * r1;
    const y1 = Math.sin(angle) * r1;
    const x2 = Math.cos(angle + Math.PI / 5) * r2;
    const y2 = Math.sin(angle + Math.PI / 5) * r2;
    if (i === 0) emblemShape.moveTo(x1, y1);
    else emblemShape.lineTo(x1, y1);
    emblemShape.lineTo(x2, y2);
  }
  emblemShape.closePath();

  const emblemGeom = new THREE.ExtrudeGeometry(emblemShape, { depth: 0.003, bevelEnabled: false });
  emblemGeom.rotateX(Math.PI / 2); // Face forward (towards -Z, since pommel is at -Z end)
  // Actually pommel end face is at -Z. Normal points -Z.
  // We need to rotate to face -Z.
  // Default Extrude face is XY (Normal Z).
  // Rotate X 90 -> Face XZ (Normal Y).
  // We want Normal -Z.
  // Rotate Y 180? No.
  // Let's just position it on the pommel surface.
  // Pommel center is at pommelZ - offset. Surface is further -Z.
  // We want the emblem to stick out towards -Z.
  // So the face should be in XY plane at that Z position.
  // Default Extrude is in XY. So no rotation needed for the face orientation, just position.
  
  const pommel_emblem = new THREE.Mesh(emblemGeom, blackMetalMat);
  pommel_emblem.position.set(0, 0, pommelZ - pommelRadius * 0.8 - 0.001);
  root.add(pommel_emblem);

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