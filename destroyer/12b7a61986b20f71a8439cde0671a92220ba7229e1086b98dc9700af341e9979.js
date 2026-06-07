export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Dark gunmetal for blade, guard, pommel. 
  // Metalness capped at 0.6 to avoid blackness without env map.
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Darker material for engravings/grooves to simulate depth/shadow
  const grooveMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.5,
    roughness: 0.5,
  });

  // Grip material - dark leather/wrap
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- 1. BLADE ---
  // Profile in XY plane, extruded along Z
  const bladeShape = new THREE.Shape();
  const bladeLength = 0.65;
  const bladeWidthBase = 0.14;
  const bladeWidthTip = 0.0;
  
  // Draw blade profile (pointing +Y for shape, we will rotate later)
  // Actually, let's draw it pointing +X for easier extrusion along Z? 
  // Standard: Shape in XY, extrude to Z.
  // Let's make the blade lie along X axis in the shape, then rotate to Z.
  bladeShape.moveTo(0, 0); 
  bladeShape.lineTo(bladeLength, 0); // Tip
  bladeShape.lineTo(0, bladeWidthBase / 2); // Base top corner
  bladeShape.lineTo(0, -bladeWidthBase / 2); // Base bottom corner
  bladeShape.closePath();

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.015, // Thickness
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 1,
  });

  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Center the geometry roughly
  blade.position.set(-bladeLength / 2, 0, 0);
  // Rotate to align with Z axis (tip at +Z)
  // Currently shape is in XY plane, extruded Z. 
  // We want blade flat in XZ plane? Or vertical? 
  // Image shows blade flat. So Y is thickness.
  // Current extrusion is along Z. Shape is in XY.
  // So flat face is XY. We want flat face to be XZ (horizontal) or YZ (vertical)?
  // Let's assume the sword lies flat on a table (XZ plane).
  // So we need to rotate 90 deg around X.
  blade.rotation.x = Math.PI / 2;
  blade.position.z = 0.15; // Offset so guard is at 0
  root.add(blade);

  // --- 2. FULLER (Groove) ---
  // Thin box inset into the blade
  const fullerLength = bladeLength * 0.7;
  const fullerGeom = new THREE.BoxGeometry(fullerLength, 0.04, 0.005);
  const fuller = new THREE.Mesh(fullerGeom, grooveMat);
  fuller.position.set(-bladeLength / 2 + fullerLength / 2 + 0.02, 0, 0.008); // Slightly raised to simulate inset visually or just same plane
  fuller.rotation.x = Math.PI / 2;
  fuller.position.z = 0.15;
  root.add(fuller);

  // --- 3. BLADE ENGRAVINGS (Ricasso) ---
  // Diamond pattern near the guard
  const engravingGroup = new THREE.Group();
  const diamondShape = new THREE.Shape();
  const dSize = 0.03;
  diamondShape.moveTo(0, dSize);
  diamondShape.lineTo(dSize, 0);
  diamondShape.lineTo(0, -dSize);
  diamondShape.lineTo(-dSize, 0);
  diamondShape.closePath();
  
  const diamondGeom = new THREE.ExtrudeGeometry(diamondShape, { depth: 0.002, bevelEnabled: false });
  const diamondMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.4 });
  
  // Place a few diamonds near the guard (z ~ 0.1)
  const engravePositions = [
    { x: 0, y: 0.04, z: 0.12 },
    { x: 0, y: -0.04, z: 0.12 },
    { x: 0, y: 0, z: 0.16 }
  ];
  
  engravePositions.forEach(pos => {
    const d = new THREE.Mesh(diamondGeom, diamondMat);
    d.position.set(pos.x, pos.y, pos.z);
    d.rotation.x = Math.PI / 2; // Lay flat
    engravingGroup.add(d);
  });
  root.add(engravingGroup);

  // --- 4. GUARD (Crossguard) ---
  // Simple bar with beveled edges
  const guardWidth = 0.22;
  const guardHeight = 0.04;
  const guardDepth = 0.03;
  const guardGeom = new THREE.BoxGeometry(guardWidth, guardHeight, guardDepth);
  const guard = new THREE.Mesh(guardGeom, bladeMat);
  guard.position.set(0, 0, 0);
  root.add(guard);

  // Guard Engravings (Diamond on the face)
  const guardDecal = new THREE.Mesh(diamondGeom, diamondMat);
  guardDecal.position.set(0, 0, guardDepth / 2 + 0.001);
  guardDecal.scale.set(1.5, 1.5, 1);
  root.add(guardDecal);

  // --- 5. GRIP (Handle) ---
  // Core cylinder
  const gripLength = 0.14;
  const gripRadius = 0.025;
  const gripGeom = new THREE.CylinderGeometry(gripRadius, gripRadius, gripLength, 16);
  const grip = new THREE.Mesh(gripGeom, gripMat);
  grip.rotation.z = Math.PI / 2;
  grip.position.set(-gripLength / 2 - 0.01, 0, 0); // Start just behind guard
  root.add(grip);

  // Grip Wraps (Ridges)
  const wrapCount = 6;
  const wrapGeom = new THREE.TorusGeometry(gripRadius + 0.002, 0.003, 8, 16);
  for (let i = 0; i < wrapCount; i++) {
    const wrap = new THREE.Mesh(wrapGeom, gripMat);
    // Distribute along grip length
    const zOffset = -gripLength / 2 + (i + 1) * (gripLength / (wrapCount + 1));
    wrap.position.set(zOffset - 0.01, 0, 0);
    wrap.rotation.y = Math.PI / 2; // Torus is XY, rotate to YZ to wrap around Z-axis cylinder
    // Wait, cylinder is along Z (rotated X 90). 
    // My grip cylinder: rotation.z = PI/2 -> Axis is Z.
    // Torus default: XY plane. To wrap around Z axis, we need Torus in XY plane? No.
    // Cylinder axis is Z. We need ring in XY plane.
    // Torus is in XY plane by default. So no rotation needed for the ring plane, just position.
    wrap.rotation.x = 0; 
    wrap.rotation.y = 0;
    wrap.rotation.z = 0;
    // Correction: Grip is rotated Z=90. So its local axis is Z.
    // A ring around Z axis lies in XY plane.
    // TorusGeometry is in XY plane. So we just place it.
    wrap.position.set(zOffset - 0.01, 0, 0);
    root.add(wrap);
  }

  // --- 6. POMMEL ---
  // Bulbous end cap
  const pommelRadius = 0.045;
  const pommelGeom = new THREE.SphereGeometry(pommelRadius, 16, 16);
  // Flatten it slightly
  pommelGeom.scale(1, 1, 0.6); 
  const pommel = new THREE.Mesh(pommelGeom, bladeMat);
  pommel.position.set(-gripLength - 0.02, 0, 0);
  root.add(pommel);

  // Pommel Emblem (Star/Flower on the flat end)
  // The end is at -X. The face is roughly YZ plane.
  const emblemShape = new THREE.Shape();
  const petals = 6;
  const outerR = 0.025;
  const innerR = 0.012;
  for (let i = 0; i < petals * 2; i++) {
    const r = (i % 2 === 0) ? outerR : innerR;
    const a = (i / (petals * 2)) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) emblemShape.moveTo(x, y);
    else emblemShape.lineTo(x, y);
  }
  emblemShape.closePath();
  
  const emblemGeom = new THREE.ExtrudeGeometry(emblemShape, { depth: 0.003, bevelEnabled: false });
  const emblem = new THREE.Mesh(emblemGeom, grooveMat);
  // Position on the flat face of the pommel (which is at -X)
  // Pommel is scaled Z 0.6, so face is roughly at -X.
  // Emblem needs to face -X. Default extrusion is +Z.
  // Rotate Y 90, then X 90? 
  // Default: Face +Z. We want Face -X.
  // Rotate Y 90 -> Face +X. Rotate Z 180 -> Face -X.
  emblem.rotation.y = Math.PI / 2;
  emblem.rotation.z = Math.PI;
  emblem.position.set(-gripLength - 0.02 - pommelRadius * 0.6 - 0.002, 0, 0);
  root.add(emblem);

  // Final normalization
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