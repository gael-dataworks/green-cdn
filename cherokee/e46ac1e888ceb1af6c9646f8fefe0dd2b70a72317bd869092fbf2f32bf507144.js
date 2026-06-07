export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Silver: High metalness but capped at 0.6 for this renderer. 
  // Emissive is CRITICAL to make silver look bright and not dark gray.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.35,
  });

  // Gem material: Glass-like, high transmission, low roughness.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // --- 1. Main Silver Body (Lathe) ---
  // Profile points [radius, y] from bottom center up to top center.
  // Scale is arbitrary, fitToUnitCube will normalize.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.22, 0.00), // Base edge
    new THREE.Vector2(0.23, 0.03), // Base flare start
    new THREE.Vector2(0.12, 0.15), // Stem narrow
    new THREE.Vector2(0.14, 0.22), // Stem wide (knot)
    new THREE.Vector2(0.11, 0.28), // Stem top
    new THREE.Vector2(0.13, 0.30), // Bowl bottom junction
    new THREE.Vector2(0.12, 0.32), // Bowl bottom inner
    new THREE.Vector2(0.24, 0.65), // Bowl wall (slight flare)
    new THREE.Vector2(0.26, 0.68), // Rim flare
    new THREE.Vector2(0.00, 0.68), // Top center (close hole)
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 48);
  const silverBody = new THREE.Mesh(bodyGeom, silverMat);
  root.add(silverBody);

  // --- 2. Decorative Bands (Relief Simulation) ---
  // We add geometric rings to simulate the ornate borders seen in the reference.
  
  // Top Rim Band
  const rimBandGeom = new THREE.TorusGeometry(0.255, 0.015, 16, 48);
  const rimBand = new THREE.Mesh(rimBandGeom, silverMat);
  rimBand.rotation.x = Math.PI / 2;
  rimBand.position.y = 0.66;
  root.add(rimBand);

  // Lower Bowl Band (separating figures from stem)
  const lowerBandGeom = new THREE.TorusGeometry(0.135, 0.012, 16, 48);
  const lowerBand = new THREE.Mesh(lowerBandGeom, silverMat);
  lowerBand.rotation.x = Math.PI / 2;
  lowerBand.position.y = 0.31;
  root.add(lowerBand);

  // Base Decoration (Leaf-like torus segments on the foot)
  // We place a few torus segments on the flared base to mimic the scrollwork.
  const baseDecorRadius = 0.18;
  const baseDecorY = 0.05;
  const baseDecorGeom = new THREE.TorusGeometry(baseDecorRadius, 0.008, 8, 24, Math.PI * 0.4);
  
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const decor = new THREE.Mesh(baseDecorGeom, silverMat);
    decor.position.set(0, baseDecorY, 0);
    decor.rotation.x = Math.PI / 2;
    decor.rotation.z = angle;
    // Tilt slightly to follow the flare
    decor.rotateX(Math.PI * 0.15); 
    root.add(decor);
  }

  // --- 3. Gems (InstancedMesh) ---
  // Colors: Pink, Blue, Green, Yellow/Amber
  const gemColors = [
    new THREE.Color(0xffb7c5), // Pink
    new THREE.Color(0xaaddff), // Light Blue
    new THREE.Color(0xaaffaa), // Light Green
    new THREE.Color(0xffeebb), // Amber
  ];

  const gemCount = 24;
  const gemGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const gems = new THREE.InstancedMesh(gemGeom, gemMat, gemCount);
  
  const dummy = new THREE.Object3D();
  
  // Place gems on the bowl (upper section)
  let idx = 0;
  const bowlGemY = 0.50;
  const bowlGemR = 0.245; // Slightly outside the body radius
  const bowlGemCount = 12;
  
  for (let i = 0; i < bowlGemCount; i++) {
    if (idx >= gemCount) break;
    const angle = (i / bowlGemCount) * Math.PI * 2;
    dummy.position.set(
      Math.cos(angle) * bowlGemR,
      bowlGemY,
      Math.sin(angle) * bowlGemR
    );
    dummy.updateMatrix();
    gems.setMatrixAt(idx, dummy.matrix);
    
    // Deterministic color selection
    const colorIdx = i % gemColors.length;
    gems.setColorAt(idx, gemColors[colorIdx]);
    idx++;
  }

  // Place gems on the base (lower section)
  const baseGemY = 0.04;
  const baseGemR = 0.19;
  const baseGemCount = 8;

  for (let i = 0; i < baseGemCount; i++) {
    if (idx >= gemCount) break;
    const angle = (i / baseGemCount) * Math.PI * 2 + (Math.PI / baseGemCount); // Offset
    dummy.position.set(
      Math.cos(angle) * baseGemR,
      baseGemY,
      Math.sin(angle) * baseGemR
    );
    dummy.updateMatrix();
    gems.setMatrixAt(idx, dummy.matrix);
    
    const colorIdx = (i + 2) % gemColors.length;
    gems.setColorAt(idx, gemColors[colorIdx]);
    idx++;
  }

  gems.instanceMatrix.needsUpdate = true;
  if (gems.instanceColor) gems.instanceColor.needsUpdate = true;
  
  root.add(gems);

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