export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Red painted wood for the keys/bars
  const redWoodMat = new THREE.MeshStandardMaterial({
    color: 0xc92a2a,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Natural light wood for the support dowels
  const naturalWoodMat = new THREE.MeshStandardMaterial({
    color: 0xd4b483,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Dark material for the holes (shadow inside)
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x2a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const numBars = 11;
  const minBarLen = 0.14;
  const maxBarLen = 0.42;
  const barWidth = 0.055; // Thickness in X (spacing direction)
  const barHeight = 0.035; // Thickness in Y
  const gap = 0.012;
  const dowelRadius = 0.016;
  const dowelOverhang = 0.04; // How much dowel sticks out past the outer bars

  // Calculate total width of the instrument
  const totalBarWidth = numBars * barWidth + (numBars - 1) * gap;
  const startX = -totalBarWidth / 2;

  // Dowel positions (Z coordinates relative to bar center)
  // Dowels run along X axis, bars run along Z axis.
  // Holes are at fixed Z positions on the bars.
  const dowelZOffset = 0.12; // Distance from center of bar to dowel center

  // --- Dowels ---
  // Two long cylinders running along the X axis
  const dowelLength = totalBarWidth + (barWidth) + (dowelOverhang * 2);
  const dowelGeom = new THREE.CylinderGeometry(dowelRadius, dowelRadius, dowelLength, 16);
  dowelGeom.rotateZ(Math.PI / 2); // Rotate to align with X axis

  const dowelLeft = new THREE.Mesh(dowelGeom, naturalWoodMat);
  dowelLeft.position.set(0, -barHeight / 2, -dowelZOffset);
  root.add(dowelLeft);

  const dowelRight = new THREE.Mesh(dowelGeom, naturalWoodMat);
  dowelRight.position.set(0, -barHeight / 2, dowelZOffset);
  root.add(dowelRight);

  // --- Bars ---
  const barGeomBase = new THREE.BoxGeometry(barWidth, barHeight, 1); // Depth 1, scaled per bar
  
  // Hole geometry (small cylinder to simulate hole on top surface)
  const holeGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.01, 12);
  holeGeom.rotateZ(Math.PI / 2); // Align with X axis (dowel direction)

  for (let i = 0; i < numBars; i++) {
    // Interpolate length
    const t = i / (numBars - 1);
    const barLen = minBarLen + (maxBarLen - minBarLen) * t;

    const bar = new THREE.Mesh(barGeomBase, redWoodMat);
    bar.scale.set(1, 1, barLen); // Scale Z for length
    
    // Position along X
    const barX = startX + i * (barWidth + gap);
    bar.position.set(barX, 0, 0);

    root.add(bar);

    // Add hole markers on top of the bar where dowels pass through
    // Left dowel hole
    const holeL = new THREE.Mesh(holeGeom, holeMat);
    holeL.position.set(0, barHeight / 2 + 0.001, -dowelZOffset);
    bar.add(holeL);

    // Right dowel hole
    const holeR = new THREE.Mesh(holeGeom, holeMat);
    holeR.position.set(0, barHeight / 2 + 0.001, dowelZOffset);
    bar.add(holeR);
  }

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