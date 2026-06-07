export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Clear bottle material (Glass/Plastic)
  const bottleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Orange Juice (Opaque liquid)
  const juiceMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Green Cap (Plastic)
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x2e8b57,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Geometry Construction ---

  // 1. Bottle Body Profile (Lathe)
  // Points define the OUTER silhouette from bottom (y=0) to top of neck
  const bottleProfilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.18, 0.00), // Bottom rim
    new THREE.Vector2(0.19, 0.15), // Lower bulge
    new THREE.Vector2(0.16, 0.45), // Waist (narrowest)
    new THREE.Vector2(0.20, 0.75), // Shoulder (widest)
    new THREE.Vector2(0.13, 0.90), // Neck base
    new THREE.Vector2(0.13, 1.00), // Neck top (under cap)
    new THREE.Vector2(0.00, 1.00), // Close top
  ];
  
  // Use a curve to smooth the profile for organic bottle shape
  const bottleCurve = new THREE.CatmullRomCurve3(
    bottleProfilePoints.map(p => new THREE.Vector3(p.x, p.y, 0))
  );
  // Sample points for LatheGeometry (Vector2)
  const bottleLathePoints = bottleCurve.getSpacedPoints(50).map(p => new THREE.Vector2(p.x, p.y));
  
  const bottleGeom = new THREE.LatheGeometry(bottleLathePoints, 32);
  const bottle = new THREE.Mesh(bottleGeom, bottleMat);
  root.add(bottle);

  // 2. Orange Juice (Inner Volume)
  // Profile matches the bottle but stops lower and has slightly smaller radius to sit inside
  const juiceProfilePoints = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.17, 0.00), // Slightly smaller than bottle bottom
    new THREE.Vector2(0.18, 0.15),
    new THREE.Vector2(0.15, 0.45),
    new THREE.Vector2(0.19, 0.75),
    new THREE.Vector2(0.12, 0.85), // Liquid level (below neck)
    new THREE.Vector2(0.00, 0.85), // Flat top surface
  ];

  const juiceCurve = new THREE.CatmullRomCurve3(
    juiceProfilePoints.map(p => new THREE.Vector3(p.x, p.y, 0))
  );
  const juiceLathePoints = juiceCurve.getSpacedPoints(40).map(p => new THREE.Vector2(p.x, p.y));

  const juiceGeom = new THREE.LatheGeometry(juiceLathePoints, 32);
  const juice = new THREE.Mesh(juiceGeom, juiceMat);
  // Juice sits slightly above bottom to account for glass thickness visually, 
  // but geometrically it starts at 0. Let's shift it up slightly to avoid z-fighting at base
  juice.position.y = 0.005; 
  root.add(juice);

  // 3. Green Cap
  const capGroup = new THREE.Group();
  
  // Cap dimensions
  const capRadius = 0.145;
  const capHeight = 0.08;
  const capY = 1.00; // Sits on top of neck

  // Cap Skirt (with ridges)
  // We create a cylinder and modify vertices to create vertical ridges
  const ridgeSegments = 40; // Number of ridges
  const capSkirtGeom = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, ridgeSegments * 2, 1, true);
  
  const positions = capSkirtGeom.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    const angle = Math.atan2(z, x);
    // Create ridges: modulate radius based on angle
    // We want flat tops and valleys. 
    // Simple sine wave for ridges:
    const ridgeFactor = Math.sin(angle * ridgeSegments) * 0.008; 
    // Only push out, don't pull in too much to maintain structural look
    const scale = 1.0 + Math.max(0, ridgeFactor) * 0.5; 
    
    positions[i] = x * scale;
    positions[i + 2] = z * scale;
  }
  capSkirtGeom.computeVertexNormals();

  const capSkirt = new THREE.Mesh(capSkirtGeom, capMat);
  capSkirt.position.y = capY + capHeight / 2;
  capGroup.add(capSkirt);

  // Cap Top (Flat disc)
  const capTopGeom = new THREE.CylinderGeometry(capRadius, capRadius, 0.015, 32);
  const capTop = new THREE.Mesh(capTopGeom, capMat);
  capTop.position.y = capY + capHeight;
  capGroup.add(capTop);

  // Tamper-evident ring (small lip at bottom of cap)
  const ringGeom = new THREE.TorusGeometry(capRadius + 0.005, 0.004, 8, 40);
  const ring = new THREE.Mesh(ringGeom, capMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = capY + 0.01;
  capGroup.add(ring);

  root.add(capGroup);

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