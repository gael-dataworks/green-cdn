export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Polished metal. Cap metalness at 0.6 to avoid blackness without env map.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Emerald: Green gem. Physical material for transmission/refraction.
  const emeraldMat = new THREE.MeshPhysicalMaterial({
    color: 0x006633,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.57,
    transparent: true,
    opacity: 1.0,
  });

  // --- Geometries ---
  // Ray: Tapered cylinder. 8 segments for a faceted/cut look.
  // Length 0.9, Base radius 0.06, Tip radius 0.015.
  const rayGeom = new THREE.CylinderGeometry(0.015, 0.06, 0.9, 8);
  // Default cylinder is Y-up. We want it to lie in XY plane pointing outward.
  // We will handle orientation in the instance matrix.

  // Center Medallion Base: Flat cylinder.
  const medallionGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 32);

  // Medallion Rim: Thin torus to define the edge of the stone setting area.
  const rimGeom = new THREE.TorusGeometry(0.23, 0.015, 16, 32);

  // Small Stone Setting (Bezel): Tiny torus to hold the small stones.
  const bezelGeom = new THREE.TorusGeometry(0.045, 0.012, 16, 32);

  // Small Stone: Icosahedron for faceting.
  const smallStoneGeom = new THREE.IcosahedronGeometry(0.038, 0);

  // Large Center Stone: Larger icosahedron.
  const largeStoneGeom = new THREE.IcosahedronGeometry(0.085, 1);

  // Pin Back: Simple tube behind the brooch.
  const pinGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 12);

  // --- Meshes ---

  // 1. Rays (Instanced for performance and uniformity)
  // 20 rays radiating from center.
  const rayCount = 20;
  const rays = new THREE.InstancedMesh(rayGeom, goldMat, rayCount);
  const dummy = new THREE.Object3D();
  
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    
    // Orientation: 
    // Start with cylinder pointing +Y (default).
    // Rotate -90 deg around X to point +Z? No, we want XY plane.
    // If we want the ray to point radially in XY plane:
    // 1. Start pointing +X (rotate Z by -90 deg from Y-up).
    // 2. Rotate around Z by `angle`.
    // 3. Translate X by offset so base is at medallion edge.
    
    dummy.rotation.set(0, 0, angle - Math.PI / 2);
    // Offset: Ray length is 0.9. Base is at -0.45 local Y. 
    // We want base at radius 0.24. 
    // So translate X by 0.24 + (0.9/2) = 0.69? 
    // Wait, CylinderGeometry is centered. 
    // If we rotate to point +X, the center is at 0. The base is at -0.45 X.
    // We want base at 0.24 X. So center should be at 0.24 + 0.45 = 0.69.
    dummy.position.set(0.69, 0, 0);
    
    dummy.updateMatrix();
    rays.setMatrixAt(i, dummy.matrix);
  }
  root.add(rays);

  // 2. Center Medallion
  const medallion = new THREE.Mesh(medallionGeom, goldMat);
  root.add(medallion);

  // 3. Medallion Rim (Inner ring for stones)
  const rim = new THREE.Mesh(rimGeom, goldMat);
  rim.rotation.x = Math.PI / 2; // Lie flat in XY
  rim.position.z = 0.04; // Slightly above base
  root.add(rim);

  // 4. Small Stones (8 around the center)
  const stoneCount = 8;
  const stoneRadius = 0.135; // Distance from center
  
  for (let i = 0; i < stoneCount; i++) {
    const angle = (i / stoneCount) * Math.PI * 2 + (Math.PI / 8); // Offset by half-step
    
    // Bezel
    const bezel = new THREE.Mesh(bezelGeom, goldMat);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.set(Math.cos(angle) * stoneRadius, Math.sin(angle) * stoneRadius, 0.04);
    root.add(bezel);

    // Stone
    const stone = new THREE.Mesh(smallStoneGeom, emeraldMat);
    stone.position.set(Math.cos(angle) * stoneRadius, Math.sin(angle) * stoneRadius, 0.05);
    root.add(stone);
  }

  // 5. Large Center Stone
  const centerStone = new THREE.Mesh(largeStoneGeom, emeraldMat);
  centerStone.position.z = 0.06;
  root.add(centerStone);

  // 6. Pin Back (Structural detail)
  // A horizontal bar behind the rays on the right side (approx 3 o'clock)
  const pinBack = new THREE.Mesh(pinGeom, goldMat);
  pinBack.rotation.z = Math.PI / 2; // Horizontal
  pinBack.position.set(0.5, 0, -0.1); // Behind the rays
  root.add(pinBack);
  
  // Clasp catch (small loop at the other end of the pin)
  const catchGeom = new THREE.TorusGeometry(0.03, 0.01, 8, 16);
  const catchMesh = new THREE.Mesh(catchGeom, goldMat);
  catchMesh.rotation.y = Math.PI / 2;
  catchMesh.position.set(0.8, 0, -0.1);
  root.add(catchMesh);

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