export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Red painted wood with visible grain
  const redWoodMat = new THREE.MeshStandardMaterial({
    color: 0xd92b4e,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Natural light wood for dowels/frame
  const naturalWoodMat = new THREE.MeshStandardMaterial({
    color: 0xc4a57b,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Dark material for holes/knots
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Procedural Texture for Red Bars (Wood Grain Simulation) ---
  // Creates a subtle noisy texture to break up the flat red color
  const texSize = 128;
  const data = new Uint8Array(texSize * texSize * 4);
  for (let i = 0; i < texSize * texSize; i++) {
    // Simple deterministic noise based on index
    const noise = (Math.sin(i * 0.1) + Math.cos(i * 0.3)) * 20;
    const r = 217 + noise; // Base red #d9
    const g = 43 + noise * 0.5; // Base green #2b
    const b = 78 + noise * 0.5; // Base blue #4e
    const idx = i * 4;
    data[idx] = Math.max(0, Math.min(255, r));
    data[idx + 1] = Math.max(0, Math.min(255, g));
    data[idx + 2] = Math.max(0, Math.min(255, b));
    data[idx + 3] = 255;
  }
  const woodTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  woodTexture.colorSpace = THREE.SRGBColorSpace;
  woodTexture.wrapS = THREE.RepeatWrapping;
  woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(1, 4); // Stretch grain along the length of the bar
  woodTexture.needsUpdate = true;
  redWoodMat.map = woodTexture;
  redWoodMat.needsUpdate = true;

  // --- Dimensions ---
  const barCount = 11;
  const barWidth = 0.025;
  const barThickness = 0.016;
  const gap = 0.004;
  const minBarLength = 0.07;
  const maxBarLength = 0.15;
  
  // Calculate total width of the keyboard
  const totalWidth = barCount * barWidth + (barCount - 1) * gap;
  const startX = -totalWidth / 2 + barWidth / 2;

  // Dowel positions (Z-axis offset from bar center)
  // Placed roughly at the nodal points (approx 22% from ends of the longest bar)
  const dowelZOffset = maxBarLength * 0.22; 
  const dowelRadius = 0.006;
  const dowelLength = totalWidth + 0.04; // Slight overhang

  // --- Geometry Reuse ---
  // We can't reuse BoxGeometry easily because lengths vary, but we can reuse dowel geom
  const dowelGeom = new THREE.CylinderGeometry(dowelRadius, dowelRadius, dowelLength, 16);
  // Rotate dowel to lie along X axis
  dowelGeom.rotateZ(Math.PI / 2);

  const holeGeom = new THREE.CylinderGeometry(0.0035, 0.0035, 0.02, 8);
  // Hole is vertical (Y axis), default cylinder is Y-aligned, so no rotation needed

  // --- Build Dowels ---
  const dowelFront = new THREE.Mesh(dowelGeom, naturalWoodMat);
  dowelFront.position.set(0, -barThickness / 2 - dowelRadius * 0.8, dowelZOffset);
  root.add(dowelFront);

  const dowelBack = new THREE.Mesh(dowelGeom, naturalWoodMat);
  dowelBack.position.set(0, -barThickness / 2 - dowelRadius * 0.8, -dowelZOffset);
  root.add(dowelBack);

  // --- Build Bars ---
  for (let i = 0; i < barCount; i++) {
    // Interpolate length
    const t = i / (barCount - 1);
    const length = minBarLength + t * (maxBarLength - minBarLength);
    
    const barGeom = new THREE.BoxGeometry(barWidth, barThickness, length);
    const bar = new THREE.Mesh(barGeom, redWoodMat);
    
    // Position X
    const x = startX + i * (barWidth + gap);
    bar.position.set(x, 0, 0);
    
    root.add(bar);

    // --- Add Holes ---
    // Two holes per bar, aligned with dowels
    // We place small dark cylinders to simulate the hole entry on the top surface
    const holeDepth = 0.005; // Just a visual indent
    
    // Front hole
    const holeFront = new THREE.Mesh(holeGeom, holeMat);
    holeFront.position.set(x, barThickness / 2 - holeDepth / 2, dowelZOffset);
    root.add(holeFront);

    // Back hole
    const holeBack = new THREE.Mesh(holeGeom, holeMat);
    holeBack.position.set(x, barThickness / 2 - holeDepth / 2, -dowelZOffset);
    root.add(holeBack);
  }

  // --- Add End Caps / Feet (Optional detail for stability look) ---
  // Small wooden blocks at the ends of the dowels
  const capGeom = new THREE.CylinderGeometry(dowelRadius * 1.2, dowelRadius * 1.2, 0.01, 16);
  capGeom.rotateZ(Math.PI / 2);
  
  const capFL = new THREE.Mesh(capGeom, naturalWoodMat);
  capFL.position.set(dowelLength / 2 + 0.005, -barThickness / 2 - dowelRadius, dowelZOffset);
  root.add(capFL);

  const capFR = new THREE.Mesh(capGeom, naturalWoodMat);
  capFR.position.set(-dowelLength / 2 - 0.005, -barThickness / 2 - dowelRadius, dowelZOffset);
  root.add(capFR);

  const capBL = new THREE.Mesh(capGeom, naturalWoodMat);
  capBL.position.set(dowelLength / 2 + 0.005, -barThickness / 2 - dowelRadius, -dowelZOffset);
  root.add(capBL);

  const capBR = new THREE.Mesh(capGeom, naturalWoodMat);
  capBR.position.set(-dowelLength / 2 - 0.005, -barThickness / 2 - dowelRadius, -dowelZOffset);
  root.add(capBR);

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