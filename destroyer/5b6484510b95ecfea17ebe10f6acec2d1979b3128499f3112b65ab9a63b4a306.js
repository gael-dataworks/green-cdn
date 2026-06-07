export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const redWoodMat = new THREE.MeshStandardMaterial({
    color: 0xd92b4e,
    metalness: 0.0,
    roughness: 0.65,
  });

  const naturalWoodMat = new THREE.MeshStandardMaterial({
    color: 0xc4a574,
    metalness: 0.0,
    roughness: 0.75,
  });

  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Dimensions
  const numBars = 11;
  const barWidth = 0.055;
  const barThickness = 0.035;
  const gap = 0.015;
  const totalWidth = numBars * barWidth + (numBars - 1) * gap;
  const startX = -totalWidth / 2;
  
  const minLength = 0.06;
  const maxLength = 0.14;
  
  const dowelRadius = 0.012;
  const dowelLength = totalWidth + 0.04; // Extend slightly beyond bars
  const dowelY = -barThickness / 2 - dowelRadius + 0.005; // Sit just below bars
  const dowelZOffset = 0.02; // Distance between front and back dowel

  // Dowels
  const dowelGeom = new THREE.CylinderGeometry(dowelRadius, dowelRadius, dowelLength, 16);
  dowelGeom.rotateZ(Math.PI / 2); // Align along X

  const frontDowel = new THREE.Mesh(dowelGeom, naturalWoodMat);
  frontDowel.position.set(0, dowelY, dowelZOffset);
  root.add(frontDowel);

  const backDowel = new THREE.Mesh(dowelGeom, naturalWoodMat);
  backDowel.position.set(0, dowelY, -dowelZOffset);
  root.add(backDowel);

  // Bars
  const barGeomBase = new THREE.BoxGeometry(1, barThickness, barWidth);
  
  for (let i = 0; i < numBars; i++) {
    // Interpolate length: longest on left (i=0), shortest on right (i=10)
    const t = i / (numBars - 1);
    const length = maxLength - (maxLength - minLength) * t;
    
    const bar = new THREE.Mesh(barGeomBase, redWoodMat);
    bar.scale.set(length, 1, 1);
    
    // Position: centered in X for this bar's slot
    const barX = startX + (i * (barWidth + gap)) + (barWidth / 2);
    // Center the bar geometry itself
    bar.position.set(barX, 0, 0);
    
    root.add(bar);

    // Holes (visual only, small black cylinders on top)
    // Positioned where dowels pass through
    const holeRadius = 0.014;
    const holeDepth = 0.01;
    const holeGeom = new THREE.CylinderGeometry(holeRadius, holeRadius, holeDepth, 8);
    
    // Front hole
    const frontHole = new THREE.Mesh(holeGeom, holeMat);
    frontHole.position.set(barX, barThickness / 2 + 0.001, dowelZOffset);
    root.add(frontHole);

    // Back hole
    const backHole = new THREE.Mesh(holeGeom, holeMat);
    backHole.position.set(barX, barThickness / 2 + 0.001, -dowelZOffset);
    root.add(backHole);
  }

  // Slight rotation to match reference angle
  root.rotation.x = -0.3;
  root.rotation.y = 0.4;

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