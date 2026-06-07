export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const bowlMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    metalness: 0.0,
    roughness: 0.4,
  });

  const puddingMat = new THREE.MeshStandardMaterial({
    color: 0xfcfcfc,
    metalness: 0.0,
    roughness: 0.3,
  });

  const seedMatDark = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.1,
    roughness: 0.3,
  });

  const seedMatLight = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.1,
    roughness: 0.3,
  });

  // --- 1. Bowl (Lathe) ---
  // Profile points for a thick-walled bowl [radius, y]
  const bowlProfile = [
    new THREE.Vector2(0.00, 0.00),  // Bottom center outer
    new THREE.Vector2(0.12, 0.00),  // Bottom edge outer
    new THREE.Vector2(0.12, 0.05),  // Side start outer
    new THREE.Vector2(0.35, 0.35),  // Side top outer
    new THREE.Vector2(0.38, 0.38),  // Rim outer edge
    new THREE.Vector2(0.36, 0.38),  // Rim inner edge
    new THREE.Vector2(0.33, 0.35),  // Side top inner
    new THREE.Vector2(0.10, 0.05),  // Side bottom inner
    new THREE.Vector2(0.10, 0.05),  // Flat bottom inner start
    new THREE.Vector2(0.00, 0.05),  // Bottom center inner
  ];

  const bowlGeom = new THREE.LatheGeometry(bowlProfile, 32);
  const bowl = new THREE.Mesh(bowlGeom, bowlMat);
  root.add(bowl);

  // --- 2. Pudding Base ---
  // Cylinder that fills the bowl, with wavy top surface
  const puddingRadius = 0.32;
  const puddingHeight = 0.34;
  const puddingGeom = new THREE.CylinderGeometry(
    puddingRadius * 0.8, // Tapered bottom
    puddingRadius,       // Top radius
    puddingHeight,
    48,                  // High segments for smooth displacement
    1,
    true                 // Open bottom (hidden inside bowl)
  );

  // Displace top vertices to create uneven liquid surface
  const posAttr = puddingGeom.attributes.position;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    // Only modify top cap vertices (y > 0)
    if (vertex.y > 0.1) {
      const dist = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
      // Create a mound in the center, tapering to edges
      const moundHeight = Math.max(0, (0.04 - dist * 0.1));
      // Add deterministic noise based on angle and radius
      const noise = Math.sin(vertex.x * 20) * Math.cos(vertex.z * 20) * 0.005;
      vertex.y += moundHeight + noise;
      posAttr.setY(i, vertex.y);
    }
  }
  puddingGeom.computeVertexNormals();

  const pudding = new THREE.Mesh(puddingGeom, puddingMat);
  pudding.position.y = 0.02; // Sit slightly above bowl bottom
  root.add(pudding);

  // --- 3. Chia Seeds (InstancedMesh) ---
  const seedCount = 700;
  const seedGeom = new THREE.SphereGeometry(0.006, 6, 6);
  
  // We need two instanced meshes for two colors, or one with setColorAt.
  // Using two meshes is simpler for material assignment.
  const darkSeeds = new THREE.InstancedMesh(seedGeom, seedMatDark, seedCount);
  const lightSeeds = new THREE.InstancedMesh(seedGeom, seedMatLight, Math.floor(seedCount * 0.15));
  
  const dummy = new THREE.Object3D();
  let darkIdx = 0;
  let lightIdx = 0;

  // Deterministic distribution using spiral/golden angle logic
  // We want a dense pile in center, scattered at edges
  for (let i = 0; i < seedCount; i++) {
    // Golden angle approximation for even distribution
    const theta = i * 2.39996; 
    // Radius grows with sqrt(i) to keep density constant, but we want higher density in center
    // So we use a power law or just linear with clustering
    const maxR = 0.28;
    const r = maxR * Math.sqrt(i / seedCount);
    
    // Determine if this seed is light or dark (deterministic pattern)
    const isLight = (i % 7 === 0) || (i % 13 === 0);
    
    // Calculate position
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    
    // Calculate height based on pudding mound + seed pileup in center
    // Pudding surface height approx: 0.34 + mound
    const puddingSurfaceY = 0.36 + Math.max(0, (0.04 - r * 0.1));
    
    // Pile height: higher in center, zero at edges
    const pileHeight = Math.max(0, (0.05 - r * 0.15)) * Math.sin(i * 0.5); 
    
    const y = puddingSurfaceY + pileHeight + (Math.sin(i * 12.3) * 0.005);

    dummy.position.set(x, y, z);
    
    // Random rotation using deterministic math
    dummy.rotation.set(
      Math.sin(i) * Math.PI,
      Math.cos(i * 2.1) * Math.PI,
      Math.sin(i * 3.4) * Math.PI
    );
    dummy.scale.setScalar(0.8 + Math.sin(i * 5.6) * 0.2);
    dummy.updateMatrix();

    if (isLight && lightIdx < lightSeeds.count) {
      lightSeeds.setMatrixAt(lightIdx++, dummy.matrix);
    } else if (darkIdx < darkSeeds.count) {
      darkSeeds.setMatrixAt(darkIdx++, dummy.matrix);
    }
  }

  root.add(darkSeeds);
  root.add(lightSeeds);

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