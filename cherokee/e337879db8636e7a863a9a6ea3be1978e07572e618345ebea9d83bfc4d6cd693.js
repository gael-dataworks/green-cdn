export default function generate(THREE) {
  // Materials
  // Dark polished wood (rosewood/mahogany style)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3b1e12,
    metalness: 0.0,
    roughness: 0.45,
  });

  // Polished brass/gold metal
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.6,
    roughness: 0.2,
  });

  const root = new THREE.Group();

  // --- Dimensions ---
  const baseLength = 1.0;
  const baseWidth = 0.28;
  const baseHeight = 0.10;
  const railHeight = 0.025;
  const railWidth = 0.035;
  const barGap = 0.18; // Gap between rails
  const barWidth = 0.20; // Bars span slightly over rails
  const barThickness = 0.012;
  
  const numBars = 8;
  const maxBarLength = 0.15;
  const minBarLength = 0.07;
  const barStartZ = -0.40;
  const barEndZ = 0.40;

  // --- Base Structure ---
  
  // Main bottom block
  const baseGeom = new THREE.BoxGeometry(baseWidth, baseHeight, baseLength);
  const base = new THREE.Mesh(baseGeom, woodMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // Side rails (create the channel)
  const railGeom = new THREE.BoxGeometry(railWidth, railHeight, baseLength);
  
  const leftRail = new THREE.Mesh(railGeom, woodMat);
  leftRail.position.set(-(barGap / 2 + railWidth / 2), baseHeight + railHeight / 2, 0);
  root.add(leftRail);

  const rightRail = new THREE.Mesh(railGeom, woodMat);
  rightRail.position.set((barGap / 2 + railWidth / 2), baseHeight + railHeight / 2, 0);
  root.add(rightRail);

  // End blocks (slightly thicker ends for stability/aesthetics)
  const endBlockDepth = 0.08;
  const endBlockGeom = new THREE.BoxGeometry(baseWidth, baseHeight + railHeight, endBlockDepth);
  
  const frontEnd = new THREE.Mesh(endBlockGeom, woodMat);
  frontEnd.position.set(0, (baseHeight + railHeight) / 2, -baseLength / 2 + endBlockDepth / 2);
  root.add(frontEnd);

  const backEnd = new THREE.Mesh(endBlockGeom, woodMat);
  backEnd.position.set(0, (baseHeight + railHeight) / 2, baseLength / 2 - endBlockDepth / 2);
  root.add(backEnd);

  // --- Bars & Screws ---
  
  // Shared geometry for screws to save draw calls (optional but good practice)
  const screwGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.008, 8);
  screwGeom.rotateX(Math.PI / 2); // Lay flat

  const barSpacing = (barEndZ - barStartZ) / (numBars - 1);
  const barY = baseHeight + railHeight + barThickness / 2 + 0.001; // Sit on rails

  for (let i = 0; i < numBars; i++) {
    // Calculate length (linear interpolation)
    const t = i / (numBars - 1);
    const length = maxBarLength - (maxBarLength - minBarLength) * t;
    const zPos = barStartZ + t * (barEndZ - barStartZ);

    // Bar Mesh
    const barGeom = new THREE.BoxGeometry(barWidth, barThickness, length);
    const bar = new THREE.Mesh(barGeom, goldMat);
    bar.position.set(0, barY, zPos);
    root.add(bar);

    // Screws (4 per bar: 2 on each side)
    const screwZOffset = length / 2 - 0.015;
    const screwXOffset = 0.07; // Position on the bar surface

    // Front-Left
    const s1 = new THREE.Mesh(screwGeom, goldMat);
    s1.position.set(-screwXOffset, barY + 0.004, zPos - screwZOffset);
    root.add(s1);

    // Front-Right
    const s2 = new THREE.Mesh(screwGeom, goldMat);
    s2.position.set(screwXOffset, barY + 0.004, zPos - screwZOffset);
    root.add(s2);

    // Back-Left
    const s3 = new THREE.Mesh(screwGeom, goldMat);
    s3.position.set(-screwXOffset, barY + 0.004, zPos + screwZOffset);
    root.add(s3);

    // Back-Right
    const s4 = new THREE.Mesh(screwGeom, goldMat);
    s4.position.set(screwXOffset, barY + 0.004, zPos + screwZOffset);
    root.add(s4);
  }

  // Normalize to fit unit cube
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