export default function generate(THREE) {
  // Materials
  // Polished dark wood (rosewood/mahogany)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Polished gold/brass metal
  // Using emissive to ensure brightness in this render environment
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4af37,
    emissiveIntensity: 0.35,
  });

  const root = new THREE.Group();

  // --- Dimensions ---
  const baseLength = 1.0;
  const baseWidth = 0.28;
  const baseHeight = 0.12;
  const railHeight = 0.025;
  const railWidth = 0.035;
  
  const barCount = 8;
  const barWidth = 0.032;
  const barThickness = 0.012;
  const barGap = 0.018;
  const minBarLength = 0.14;
  const maxBarLength = 0.23;
  
  const screwRadius = 0.005;
  const screwHeight = 0.015;

  // --- Base Structure ---
  // Main block
  const baseGeom = new THREE.BoxGeometry(baseWidth, baseHeight, baseLength);
  const base = new THREE.Mesh(baseGeom, woodMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // Side rails (create the channel)
  const railGeom = new THREE.BoxGeometry(railWidth, railHeight, baseLength);
  const railLeft = new THREE.Mesh(railGeom, woodMat);
  railLeft.position.set(-(baseWidth / 2) + (railWidth / 2), baseHeight + (railHeight / 2), 0);
  root.add(railLeft);

  const railRight = new THREE.Mesh(railGeom, woodMat);
  railRight.position.set((baseWidth / 2) - (railWidth / 2), baseHeight + (railHeight / 2), 0);
  root.add(railRight);

  // Feet (small blocks at ends for elevation)
  const footDepth = 0.08;
  const footHeight = 0.02;
  const footGeom = new THREE.BoxGeometry(baseWidth - 0.04, footHeight, footDepth);
  
  const footFront = new THREE.Mesh(footGeom, woodMat);
  footFront.position.set(0, footHeight / 2, baseLength / 2 - footDepth / 2);
  root.add(footFront);

  const footBack = new THREE.Mesh(footGeom, woodMat);
  footBack.position.set(0, footHeight / 2, -baseLength / 2 + footDepth / 2);
  root.add(footBack);

  // --- Bars ---
  // Using InstancedMesh for efficiency and consistency
  const barGeom = new THREE.BoxGeometry(barWidth, barThickness, 1.0); // Unit length, scaled per instance
  const barsMesh = new THREE.InstancedMesh(barGeom, metalMat, barCount);
  const dummy = new THREE.Object3D();

  const totalBarSpan = (barCount - 1) * barGap + (barCount * barWidth);
  const startZ = -totalBarSpan / 2 + barWidth / 2;
  const barY = baseHeight + railHeight + 0.005; // Slightly above rails

  for (let i = 0; i < barCount; i++) {
    // Calculate length (linear progression)
    const t = i / (barCount - 1);
    const length = minBarLength + (maxBarLength - minBarLength) * t;
    
    // Position
    const z = startZ + i * (barWidth + barGap);
    
    dummy.position.set(0, barY, z);
    dummy.scale.set(1, 1, length);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    
    barsMesh.setMatrixAt(i, dummy.matrix);
  }
  root.add(barsMesh);

  // --- Screws ---
  // 2 screws per bar = 16 screws
  const screwGeom = new THREE.CylinderGeometry(screwRadius, screwRadius, screwHeight, 12);
  const screwsMesh = new THREE.InstancedMesh(screwGeom, metalMat, barCount * 2);
  
  let screwIndex = 0;
  const screwOffsetZ = 0.015; // Distance from bar end

  for (let i = 0; i < barCount; i++) {
    const t = i / (barCount - 1);
    const length = minBarLength + (maxBarLength - minBarLength) * t;
    const z = startZ + i * (barWidth + barGap);
    
    // Screw positions relative to bar center
    const leftScrewZ = z - (length / 2) + screwOffsetZ;
    const rightScrewZ = z + (length / 2) - screwOffsetZ;
    
    // Left screw
    dummy.position.set(-barWidth / 3, barY + barThickness / 2 + screwHeight / 2, leftScrewZ);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    screwsMesh.setMatrixAt(screwIndex++, dummy.matrix);
    
    // Right screw
    dummy.position.set(barWidth / 3, barY + barThickness / 2 + screwHeight / 2, rightScrewZ);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    screwsMesh.setMatrixAt(screwIndex++, dummy.matrix);
  }
  root.add(screwsMesh);

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