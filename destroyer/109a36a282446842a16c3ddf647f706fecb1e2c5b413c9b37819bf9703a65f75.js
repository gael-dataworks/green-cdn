export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    metalness: 0.0,
    roughness: 0.35,
  });

  const yogurtMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.65,
  });

  const honeyMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4a017,
    metalness: 0.0,
    roughness: 0.15,
    transmission: 0.6,
    ior: 1.45,
    transparent: true,
    opacity: 0.9,
  });

  const seedDarkMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.0,
    roughness: 0.8,
  });

  const seedLightMat = new THREE.MeshStandardMaterial({
    color: 0xc4a484,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- 1. Bowl (Lathe) ---
  // Profile from bottom center, out to base, up side, flare rim, in to inner rim
  const bowlProfile = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.08, 0.00),
    new THREE.Vector2(0.09, 0.02),
    new THREE.Vector2(0.14, 0.18),
    new THREE.Vector2(0.19, 0.26), // Outer rim edge
    new THREE.Vector2(0.20, 0.27), // Rim top
    new THREE.Vector2(0.18, 0.26), // Inner rim edge
    new THREE.Vector2(0.17, 0.18), // Inner wall
    new THREE.Vector2(0.10, 0.02), // Inner base curve
    new THREE.Vector2(0.00, 0.02), // Close inner bottom
  ];
  const bowlGeom = new THREE.LatheGeometry(bowlProfile, 48);
  const bowl = new THREE.Mesh(bowlGeom, ceramicMat);
  root.add(bowl);

  // --- 2. Yogurt (Inside Bowl) ---
  // A slightly mounded cylinder filling the bowl
  const yogurtGeom = new THREE.LatheGeometry([
    new THREE.Vector2(0.00, 0.03),
    new THREE.Vector2(0.16, 0.03),
    new THREE.Vector2(0.16, 0.24),
    new THREE.Vector2(0.14, 0.26), // Slight meniscus/mound at edge
    new THREE.Vector2(0.00, 0.265), // Center peak
  ], 48);
  const yogurt = new THREE.Mesh(yogurtGeom, yogurtMat);
  yogurt.position.y = 0.01; // Sit slightly above bowl bottom
  root.add(yogurt);

  // --- 3. Honey Drizzles & Pools ---
  // Helper to create a drizzle curve
  function createHoneyDrizzle(points, radius) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geom = new THREE.TubeGeometry(curve, 20, radius, 8, false);
    return new THREE.Mesh(geom, honeyMat);
  }

  // Main pool/mound of honey in center
  const honeyPoolGeom = new THREE.SphereGeometry(0.09, 32, 16);
  const honeyPool = new THREE.Mesh(honeyPoolGeom, honeyMat);
  honeyPool.scale.set(1.2, 0.4, 1.0); // Flatten it
  honeyPool.position.set(0.01, 0.26, -0.02);
  root.add(honeyPool);

  // Drizzle 1
  const d1 = createHoneyDrizzle([
    new THREE.Vector3(0.05, 0.28, 0.05),
    new THREE.Vector3(0.08, 0.27, 0.02),
    new THREE.Vector3(0.10, 0.26, -0.02),
    new THREE.Vector3(0.12, 0.25, -0.05),
  ], 0.006);
  root.add(d1);

  // Drizzle 2
  const d2 = createHoneyDrizzle([
    new THREE.Vector3(-0.05, 0.28, -0.05),
    new THREE.Vector3(-0.02, 0.27, -0.02),
    new THREE.Vector3(0.02, 0.26, 0.02),
  ], 0.005);
  root.add(d2);

  // Drizzle 3
  const d3 = createHoneyDrizzle([
    new THREE.Vector3(0.0, 0.29, 0.08),
    new THREE.Vector3(0.02, 0.27, 0.05),
    new THREE.Vector3(0.05, 0.26, 0.02),
  ], 0.004);
  root.add(d3);

  // --- 4. Chia Seeds (InstancedMesh) ---
  // We need a deterministic distribution.
  const seedCount = 450;
  const seedGeom = new THREE.DodecahedronGeometry(0.004, 0); // Low poly seed shape
  
  // Two instanced meshes for color variation
  const darkSeeds = new THREE.InstancedMesh(seedGeom, seedDarkMat, seedCount);
  const lightSeeds = new THREE.InstancedMesh(seedGeom, seedLightMat, seedCount);
  
  const dummy = new THREE.Object3D();
  let darkIdx = 0;
  let lightIdx = 0;

  for (let i = 0; i < seedCount; i++) {
    // Deterministic pseudo-random using sin
    const angle = i * 2.45; 
    const radius = 0.01 + Math.abs(Math.sin(i * 0.3)) * 0.13; // Concentrate in center
    const heightOffset = Math.sin(i * 0.7) * 0.02 + Math.cos(i * 1.3) * 0.01;
    
    // Mound shape: higher in center, lower at edges
    const moundHeight = Math.max(0, 0.06 - radius * 0.4);
    
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.26 + moundHeight + heightOffset;

    dummy.position.set(x, y, z);
    
    // Random rotation
    dummy.rotation.set(
      Math.sin(i * 5.1) * Math.PI,
      Math.cos(i * 3.7) * Math.PI,
      Math.sin(i * 9.2) * Math.PI
    );
    
    // Random scale variation
    const s = 0.8 + Math.abs(Math.sin(i * 7.3)) * 0.6;
    dummy.scale.set(s, s * 0.8, s);
    
    dummy.updateMatrix();

    // Assign to dark or light based on index pattern
    if (i % 7 === 0) {
      if (lightIdx < seedCount) {
        lightSeeds.setMatrixAt(lightIdx++, dummy.matrix);
      }
    } else {
      if (darkIdx < seedCount) {
        darkSeeds.setMatrixAt(darkIdx++, dummy.matrix);
      }
    }
  }

  root.add(darkSeeds);
  root.add(lightSeeds);

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