export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Polished metal. Using emissive to ensure brightness in dim render.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd4af37,
    emissiveIntensity: 0.3,
  });

  // Emerald/Green Gem: Glassy, transmission.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x006400,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // --- Dimensions ---
  const rayCount = 20;
  const innerRadius = 0.14;
  const outerRadius = 0.48;
  const rayLength = outerRadius - innerRadius;
  const centerStoneRadius = 0.045;
  const haloStoneRadius = 0.022;
  const haloRadius = 0.075;
  const haloCount = 8;

  // --- Rays (InstancedMesh) ---
  // Tapered cylinder for each ray.
  const rayGeom = new THREE.CylinderGeometry(0.015, 0.045, rayLength, 8, 1, true);
  // Rotate geometry so it points outward from center when placed at innerRadius
  // Default cylinder is Y-up. We want it to lie in XY plane radiating from center.
  // We will rotate instances around Z axis? No, rays are in XY plane.
  // Cylinder is along Y. To make it radiate in XY plane, we rotate X by 90 deg.
  rayGeom.rotateX(Math.PI / 2);
  // Pivot adjustment: Cylinder is centered at 0,0,0. We want base at innerRadius.
  // Translate geometry so base is at 0,0,0.
  rayGeom.translate(0, rayLength / 2, 0);

  const rays = new THREE.InstancedMesh(rayGeom, goldMat, rayCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const x = Math.cos(angle) * innerRadius;
    const y = Math.sin(angle) * innerRadius;
    
    dummy.position.set(x, y, 0);
    dummy.rotation.z = angle; // Rotate around Z to face outward
    // The geometry is already rotated X=90 to lie flat. 
    // Wait, if geometry is X-rotated 90, it lies in XZ plane? 
    // Default Cylinder: Y axis. Rotate X 90 -> Z axis. Lies in XY plane? No.
    // Default Cylinder: Y axis. Rotate Z 90 -> X axis.
    // We want rays in XY plane. So cylinder axis should be in XY plane.
    // Let's restart geometry orientation logic.
    // Default Cylinder: along Y.
    // We want ray to point from (0,0) to (cos, sin).
    // So we place instance at (innerRadius, 0, 0) and rotate around Z.
    // So cylinder must be along X axis initially? Or we rotate instance.
    // If cylinder is along Y, and we rotate instance Z=angle, it stays in YZ plane? No.
    // Rotation Z rotates the Y axis towards X axis.
    // So if cylinder is along Y, rotating Z by 90 deg makes it along -X.
    // Correct.
    
    // Reset geometry to default Y-up cylinder.
    // Translate so base is at y=0.
    // Instance position: (innerRadius * cos, innerRadius * sin, 0).
    // Instance rotation: Z = angle + 90deg (to point outward).
    
    // Let's rebuild rayGeom simply.
    // Cylinder along Y. Height = rayLength.
    // Translate so bottom is at y=0.
    rayGeom.translate(0, rayLength / 2, 0);
    
    dummy.position.set(0, 0, 0); // We will rotate then translate? No, Three.js order is Scale, Rotate, Translate.
    // We want to rotate around origin then translate to ring position.
    // So: set position to (innerRadius, 0, 0), rotate Z by angle.
    // But the cylinder is at (0, rayLength/2, 0).
    // If we rotate Z, it swings around origin.
    // So we need the pivot at (0,0,0).
    // Geometry is already translated so bottom is at 0.
    
    dummy.position.set(innerRadius, 0, 0); // Start at inner radius on X axis
    dummy.rotation.z = angle; // Rotate to correct angle
    
    dummy.updateMatrix();
    rays.setMatrixAt(i, dummy.matrix);
  }
  root.add(rays);

  // --- Center Bezel (Gold Ring) ---
  const bezelGeom = new THREE.TorusGeometry(innerRadius, 0.025, 16, 32);
  const bezel = new THREE.Mesh(bezelGeom, goldMat);
  // Torus is in XY plane by default. Perfect.
  root.add(bezel);

  // --- Center Stone ---
  // Faceted gem look. Cylinder with few segments.
  const centerStoneGeom = new THREE.CylinderGeometry(centerStoneRadius, centerStoneRadius, 0.03, 8);
  const centerStone = new THREE.Mesh(centerStoneGeom, gemMat);
  centerStone.position.z = 0.02; // Slightly above bezel
  root.add(centerStone);

  // --- Halo Stones ---
  const haloStoneGeom = new THREE.CylinderGeometry(haloStoneRadius, haloStoneRadius, 0.02, 6);
  for (let i = 0; i < haloCount; i++) {
    const angle = (i / haloCount) * Math.PI * 2 + (Math.PI / haloCount); // Offset slightly
    const x = Math.cos(angle) * haloRadius;
    const y = Math.sin(angle) * haloRadius;
    const stone = new THREE.Mesh(haloStoneGeom, gemMat);
    stone.position.set(x, y, 0.02);
    // Orient stone to face normal? They are flat tops, so just Z-up is fine.
    root.add(stone);
  }

  // --- Pin Stem (Back) ---
  // Simple gold bar visible on the right side in reference.
  const pinStemGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8);
  pinStemGeom.rotateX(Math.PI / 2); // Lie flat in XY plane
  const pinStem = new THREE.Mesh(pinStemGeom, goldMat);
  pinStem.position.set(0.15, 0, -0.05); // Behind the rays
  // Add a small catch on the other end
  const pinCatchGeom = new THREE.TorusGeometry(0.02, 0.005, 8, 16);
  const pinCatch = new THREE.Mesh(pinCatchGeom, goldMat);
  pinCatch.position.set(0.15, 0.2, -0.05);
  pinCatch.rotation.x = Math.PI / 2;
  
  // Group back elements
  const backGroup = new THREE.Group();
  backGroup.add(pinStem);
  backGroup.add(pinCatch);
  root.add(backGroup);

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