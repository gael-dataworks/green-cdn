export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Weathered wood: medium brown, high roughness, no metalness.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x967E65,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Darker wood for knots/pegs/details to add contrast.
  const detailMat = new THREE.MeshStandardMaterial({
    color: 0x3e3228,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const tableSize = 0.80;      // Width/Depth of top
  const topThickness = 0.05;   // Thickness of top planks
  const legHeight = 0.40;      // Length of legs
  const legSize = 0.09;        // Width/Depth of legs
  const apronHeight = 0.08;    // Height of the frame under top
  const apronThickness = 0.04; // Thickness of apron beams
  const overhang = 0.06;       // How much top sticks out past legs

  // --- 1. Table Top (3 Planks) ---
  // The top is made of 3 distinct planks to show seams.
  const plankWidth = tableSize / 3;
  const plankLength = tableSize;
  
  const topGroup = new THREE.Group();
  
  for (let i = -1; i <= 1; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(plankWidth - 0.002, topThickness, plankLength), 
      woodMat
    );
    // Position planks side by side along X axis
    plank.position.set(i * (plankWidth / 2), legHeight / 2 + topThickness / 2, 0);
    topGroup.add(plank);
    
    // Add subtle "knot" details on top surface for realism
    if (i === 0) {
      const knot = new THREE.Mesh(new THREE.CircleGeometry(0.015, 8), detailMat);
      knot.rotation.x = -Math.PI / 2;
      knot.position.set(0, topThickness / 2 + 0.001, -0.15);
      topGroup.add(knot);
    } else if (i === -1) {
      const knot = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), detailMat);
      knot.rotation.x = -Math.PI / 2;
      knot.position.set(-0.1, topThickness / 2 + 0.001, 0.2);
      topGroup.add(knot);
    }
  }
  root.add(topGroup);

  // --- 2. Legs (4 Corners) ---
  const legGeom = new THREE.BoxGeometry(legSize, legHeight, legSize);
  const legPositions = [
    [1, 1], [-1, 1], [1, -1], [-1, -1] // x, z signs
  ];

  const legGroup = new THREE.Group();
  for (const [sx, sz] of legPositions) {
    const leg = new THREE.Mesh(legGeom, woodMat);
    // Position legs inset from the edge
    const offset = (tableSize / 2) - (legSize / 2) - overhang + 0.02;
    leg.position.set(sx * offset, 0, sz * offset);
    legGroup.add(leg);
    
    // Add peg/bolt detail on the inner side of the leg (facing center)
    // Visible in reference as dark spots near the top of the leg
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8), detailMat);
    peg.rotation.z = Math.PI / 2; // Point towards center
    // Place on the face facing the center
    const pegOffset = legSize / 2 + 0.005;
    peg.position.set(sx * -pegOffset, legHeight / 2 - 0.05, sz * -pegOffset); 
    legGroup.add(peg);
  }
  root.add(legGroup);

  // --- 3. Apron (Frame under top) ---
  // Connects the legs. Two long beams (Z-axis), two short beams (X-axis).
  const apronGroup = new THREE.Group();
  
  // Long beams (Front and Back)
  const longBeamLen = tableSize - (legSize + 0.04) * 2 + (legSize); // Span between leg centers roughly
  const longBeamZ = (tableSize / 2) - (legSize / 2) - overhang + 0.04;
  
  const longBeamGeom = new THREE.BoxGeometry(legSize, apronHeight, longBeamLen);
  for (const sz of [-1, 1]) {
    const beam = new THREE.Mesh(longBeamGeom, woodMat);
    beam.position.set(0, legHeight / 2 - apronHeight / 2, sz * longBeamZ);
    apronGroup.add(beam);
    
    // Add pegs on the beam facing out
    for (const sx of [-1, 1]) {
       const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.015, 6), detailMat);
       peg.rotation.z = Math.PI / 2;
       peg.position.set(sx * (legSize/2 + 0.005), 0, sz * longBeamZ);
       apronGroup.add(peg);
    }
  }

  // Short beams (Left and Right) - fit between the long beams
  const shortBeamLen = tableSize - (legSize + 0.04) * 2 + (legSize) - apronThickness * 2;
  const shortBeamX = (tableSize / 2) - (legSize / 2) - overhang + 0.04;

  const shortBeamGeom = new THREE.BoxGeometry(shortBeamLen, apronHeight, apronThickness);
  for (const sx of [-1, 1]) {
    const beam = new THREE.Mesh(shortBeamGeom, woodMat);
    beam.position.set(sx * shortBeamX, legHeight / 2 - apronHeight / 2, 0);
    apronGroup.add(beam);
  }
  
  root.add(apronGroup);

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