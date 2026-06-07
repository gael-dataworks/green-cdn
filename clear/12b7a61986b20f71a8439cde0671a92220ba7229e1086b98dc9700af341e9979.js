export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark gunmetal / matte black metal for the blade and guard
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Slightly darker / rougher for the grip (leather or textured metal)
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.3,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const bladeLength = 0.65;
  const guardWidth = 0.28;
  const gripLength = 0.22;
  const pommelSize = 0.08;

  // --- 1. Blade ---
  // Profile: Tip at top (Y), base at bottom. We will rotate later.
  const bladeShape = new THREE.Shape();
  // Start at center base
  bladeShape.moveTo(0, 0);
  // Base corner
  bladeShape.lineTo(0.11, 0);
  // Taper to tip
  bladeShape.lineTo(0, bladeLength);
  // Other side tip to base corner
  bladeShape.lineTo(-0.11, 0);
  // Close
  bladeShape.lineTo(0, 0);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
  });
  // Center the geometry
  bladeGeom.translate(0, 0, -0.015 / 2);

  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Rotate to lie flat on XZ plane, pointing +Z
  blade.rotation.x = Math.PI / 2;
  blade.position.z = bladeLength / 2;
  root.add(blade);

  // --- 2. Blade Ridge / Fuller ---
  // A raised ridge down the center of the blade
  const ridgeGeom = new THREE.BoxGeometry(0.04, bladeLength * 0.7, 0.008);
  const ridge = new THREE.Mesh(ridgeGeom, bladeMat);
  ridge.rotation.x = Math.PI / 2;
  ridge.position.z = bladeLength * 0.35; // Start near guard, end before tip
  ridge.position.y = 0.008; // Sit on top of blade surface
  root.add(ridge);

  // --- 3. Blade Decorations (Relief near guard) ---
  // Geometric patterns: Diamond and zig-zags
  const decalGroup = new THREE.Group();
  
  // Helper to create a decal mesh
  function createDecal(shape, x, y, z, rotZ) {
    const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.004, bevelEnabled: false });
    const mesh = new THREE.Mesh(geom, bladeMat);
    mesh.rotation.x = Math.PI / 2; // Lie flat
    mesh.rotation.z = rotZ;
    mesh.position.set(x, y, z);
    mesh.position.y = 0.008; // Sit on surface
    return mesh;
  }

  // Central Diamond
  const diamondShape = new THREE.Shape();
  diamondShape.moveTo(0, 0.04);
  diamondShape.lineTo(0.025, 0);
  diamondShape.lineTo(0, -0.04);
  diamondShape.lineTo(-0.025, 0);
  diamondShape.lineTo(0, 0.04);
  decalGroup.add(createDecal(diamondShape, 0, 0, bladeLength * 0.15, 0));

  // Side Zig-Zags (simplified as triangles/lines)
  const zigShape = new THREE.Shape();
  zigShape.moveTo(-0.03, 0.03);
  zigShape.lineTo(0.03, 0.03);
  zigShape.lineTo(0, -0.03);
  zigShape.lineTo(-0.03, 0.03);
  
  const zigLeft = createDecal(zigShape, -0.06, 0, bladeLength * 0.15, 0);
  const zigRight = createDecal(zigShape, 0.06, 0, bladeLength * 0.15, 0);
  decalGroup.add(zigLeft);
  decalGroup.add(zigRight);

  root.add(decalGroup);

  // --- 4. Guard (Crossguard) ---
  // Profile in XY, extruded along Z (thickness)
  const guardShape = new THREE.Shape();
  // Inner bottom
  guardShape.moveTo(-0.04, -0.02);
  // Outer bottom curve
  guardShape.quadraticCurveTo(-guardWidth / 2, -0.02, -guardWidth / 2, 0.02);
  // Outer top
  guardShape.quadraticCurveTo(-guardWidth / 2, 0.06, -0.04, 0.06);
  // Inner top
  guardShape.lineTo(-0.04, 0.02);
  // Center hole (simple rect for now, handled by extrude logic or just solid block)
  // Let's make it a solid block with a profile
  guardShape.lineTo(0.04, 0.02);
  guardShape.quadraticCurveTo(guardWidth / 2, 0.06, guardWidth / 2, 0.02);
  guardShape.quadraticCurveTo(guardWidth / 2, -0.02, 0.04, -0.02);
  guardShape.lineTo(0.04, -0.02);

  const guardGeom = new THREE.ExtrudeGeometry(guardShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  });
  // Center guard
  guardGeom.translate(0, 0, -0.02);

  const guard = new THREE.Mesh(guardGeom, bladeMat);
  // Rotate to be perpendicular to blade (blade is XZ, guard needs to be XY rotated?)
  // Blade is flat on XZ. Guard should be flat on XY? No, guard is usually perpendicular to blade flat.
  // Blade flat is XY (after rotation.x=PI/2). So guard should be XZ?
  // Let's visualize: Blade lies on floor (XZ). Guard stands up (XY)?
  // Standard sword: Blade flat is vertical. Guard is horizontal.
  // My Blade: rotation.x = PI/2 -> Flat on XZ plane.
  // So Guard should be vertical (XY plane) or horizontal (XZ plane)?
  // Usually guard is perpendicular to the blade's flat. If blade is flat on XZ, guard should be on XY?
  // Let's make the guard lie flat on XZ as well for a "dagger" look, or perpendicular.
  // Image shows guard wings are in the same plane as the blade flat? No, perpendicular.
  // Wait, image shows the guard wings are parallel to the blade flat?
  // Looking at the image: The guard wings are parallel to the flat faces of the blade.
  // So if blade is on XZ, guard is on XZ.
  // But the handle is cylindrical.
  // Let's align: Blade flat faces +Y/-Y. Guard wings extend along X.
  // So Guard geometry (extruded along Z) needs to be rotated.
  // My guardShape is in XY. Extruded Z.
  // If I rotate guard by 90 deg around X, it lies on XZ.
  guard.rotation.x = Math.PI / 2;
  guard.position.z = 0; // At the base of the blade
  root.add(guard);

  // Guard Decals (Diamond on the wings)
  const guardDecalShape = new THREE.Shape();
  guardDecalShape.moveTo(0, 0.03);
  guardDecalShape.lineTo(0.02, 0);
  guardDecalShape.lineTo(0, -0.03);
  guardDecalShape.lineTo(-0.02, 0);
  guardDecalShape.lineTo(0, 0.03);

  const gDecalL = createDecal(guardDecalShape, -0.08, 0, 0.02, 0); // On left wing
  const gDecalR = createDecal(guardDecalShape, 0.08, 0, 0.02, 0); // On right wing
  // Adjust Z for guard thickness center
  gDecalL.position.z = 0.02; 
  gDecalR.position.z = 0.02;
  root.add(gDecalL);
  root.add(gDecalR);


  // --- 5. Grip (Handle) ---
  const gripGeom = new THREE.CylinderGeometry(0.035, 0.035, gripLength, 16);
  const grip = new THREE.Mesh(gripGeom, gripMat);
  grip.rotation.x = Math.PI / 2;
  grip.position.z = -gripLength / 2;
  root.add(grip);

  // Grip Rings (5 rings)
  const ringGeom = new THREE.TorusGeometry(0.036, 0.004, 8, 16);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const ringCount = 5;
  const ringSpacing = gripLength / (ringCount + 1);
  
  for (let i = 0; i < ringCount; i++) {
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2; // Face along Z
    // Position along grip
    const zPos = -ringSpacing * (i + 1);
    ring.position.z = zPos;
    root.add(ring);
  }

  // --- 6. Pommel ---
  // Bulbous end cap
  const pommelGeom = new THREE.SphereGeometry(pommelSize, 16, 16);
  // Flatten it slightly
  pommelGeom.scale(1, 1, 0.8);
  
  const pommel = new THREE.Mesh(pommelGeom, bladeMat);
  pommel.position.z = -gripLength - pommelSize * 0.5;
  root.add(pommel);

  // Pommel Symbol (Star/Cross on the end)
  const starShape = new THREE.Shape();
  const spikes = 5;
  const outerRadius = 0.025;
  const innerRadius = 0.01;
  for (let i = 0; i < spikes * 2; i++) {
    const r = (i % 2 === 0) ? outerRadius : innerRadius;
    const a = (i / (spikes * 2)) * Math.PI * 2 + Math.PI / 2; // Start at top
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }
  starShape.closePath();

  const starGeom = new THREE.ExtrudeGeometry(starShape, { depth: 0.005, bevelEnabled: false });
  const star = new THREE.Mesh(starGeom, bladeMat);
  // Place on the flat end of the pommel
  star.rotation.x = Math.PI / 2; // Face +Z
  star.position.z = -gripLength - pommelSize * 0.9 - 0.003;
  root.add(star);

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