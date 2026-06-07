export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Bamboo body: light tan/yellow, matte/semi-gloss, with grain texture
  const bambooColor = 0xe3c888;
  const bambooMat = new THREE.MeshStandardMaterial({
    color: bambooColor,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Hole interior: dark, matte
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1510,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Node markings: dark brown, rough
  const nodeMarkMat = new THREE.MeshStandardMaterial({
    color: 0x3a2f20,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Procedural Bamboo Grain Texture ---
  // Bamboo has longitudinal striations. We generate a DataTexture for this.
  const texWidth = 256;
  const texHeight = 256;
  const data = new Uint8Array(texWidth * texHeight * 4);
  const baseR = 227, baseG = 200, baseB = 136; // #e3c888
  
  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      const i = (y * texWidth + x) * 4;
      
      // Base color with slight noise
      let r = baseR;
      let g = baseG;
      let b = baseB;

      // Add longitudinal grain streaks (varying along X, constant along Y for vertical grain in UV space)
      // Since cylinder UVs wrap U around circumference and V along length, 
      // we want streaks along V (height). So we vary based on U (x).
      // However, standard cylinder mapping: U is around, V is along length.
      // To get grain along the length of the flute, we need variation along V? 
      // No, grain runs parallel to the axis. If axis is Y in UV space (V), then grain is vertical lines.
      // So we vary color based on X (U) to create vertical stripes.
      
      const stripeFreq = 0.15;
      const stripeVal = Math.sin(x * stripeFreq * Math.PI * 2) * 0.5 + 0.5;
      const darken = 1.0 - stripeVal * 0.15; // Subtle darkening for grain
      
      // Add some random-looking speckles using deterministic math
      const noise = Math.sin(x * 13.0 + y * 27.0) * 0.5 + 0.5;
      const speckle = noise > 0.95 ? 0.85 : 1.0;

      data[i] = Math.floor(r * darken * speckle);
      data[i + 1] = Math.floor(g * darken * speckle);
      data[i + 2] = Math.floor(b * darken * speckle);
      data[i + 3] = 255;
    }
  }

  const grainTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  grainTexture.colorSpace = THREE.SRGBColorSpace;
  grainTexture.wrapS = THREE.RepeatWrapping;
  grainTexture.wrapT = THREE.RepeatWrapping;
  grainTexture.repeat.set(4, 1); // Repeat grain around the circumference
  grainTexture.needsUpdate = true;
  bambooMat.map = grainTexture;

  // --- Geometry: Bamboo Body ---
  // Use LatheGeometry to create the segmented profile with nodes
  const length = 1.2;
  const radius = 0.09;
  const nodeRadius = 0.105;
  const nodeWidth = 0.04;

  // Profile points (radius, y) from bottom (z=-length/2) to top (z=length/2)
  // We map Z to Y in Lathe profile logic, then rotate the mesh 90 deg to lie on Z axis
  const halfL = length / 2;
  const node1Z = -0.25;
  const node2Z = 0.25;

  const profilePoints = [
    new THREE.Vector2(radius, -halfL), // Start bottom cap
    new THREE.Vector2(radius, node1Z - nodeWidth), 
    new THREE.Vector2(nodeRadius, node1Z), // Node 1 bulge
    new THREE.Vector2(radius, node1Z + nodeWidth),
    
    new THREE.Vector2(radius, node2Z - nodeWidth),
    new THREE.Vector2(nodeRadius, node2Z), // Node 2 bulge
    new THREE.Vector2(radius, node2Z + nodeWidth),
    
    new THREE.Vector2(radius, halfL), // End top cap
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, bambooMat);
  // Lathe creates object along Y axis. Rotate to lie along Z axis.
  body.rotation.x = Math.PI / 2;
  root.add(body);

  // --- Holes ---
  // Positions relative to center (Z axis)
  // Image: Large hole near left, then node, then 3 small, then node, then 2 small
  const holeDepth = 0.025;
  const holeRadiusLarge = 0.035;
  const holeRadiusSmall = 0.018;

  const holePositions = [
    { z: -0.45, r: holeRadiusLarge }, // Embouchure
    { z: -0.10, r: holeRadiusSmall },
    { z: -0.02, r: holeRadiusSmall },
    { z: 0.06, r: holeRadiusSmall },
    { z: 0.35, r: holeRadiusSmall },
    { z: 0.45, r: holeRadiusSmall },
  ];

  for (const h of holePositions) {
    const holeGeom = new THREE.CylinderGeometry(h.r, h.r, holeDepth, 16);
    const hole = new THREE.Mesh(holeGeom, holeMat);
    // Cylinder is Y-up. Rotate to face outwards from top of flute (+Y in local space before body rotation)
    // Since body is rotated X=90, its "top" is +Y world. 
    // Wait, body rotation.x = 90 makes local Y point to World Z. Local Z points to World -Y.
    // Let's keep it simple: Place holes in World space relative to the rotated body.
    // Body lies on Z axis. Top surface is +Y.
    hole.rotation.x = Math.PI / 2; // Face up
    hole.position.set(0, radius - 0.005, h.z); // Slightly inset
    root.add(hole);
  }

  // --- Node Markings ---
  // Dark rings at the nodes to simulate the rough joint texture
  const nodeRingGeom = new THREE.TorusGeometry(nodeRadius, 0.008, 8, 24);
  
  const node1Ring = new THREE.Mesh(nodeRingGeom, nodeMarkMat);
  node1Ring.rotation.y = Math.PI / 2; // Torus is XY, rotate to YZ plane (perpendicular to Z axis)
  node1Ring.position.z = node1Z;
  // Adjust for body rotation: Body is rotated X=90. 
  // Actually, if I add rings to root, they need to match body orientation.
  // Body is rotated X=90. So Z axis is horizontal. Y axis is up.
  // Torus default is XY plane. To wrap around Z axis, we need it in XY plane? No, Z axis passes through center.
  // A ring around Z axis lies in XY plane. So default Torus orientation is correct for Z-axis object.
  // But the body is rotated. So the "Z axis" of the body is now World Z.
  // So the rings should be in World XY plane.
  node1Ring.rotation.x = 0; 
  node1Ring.rotation.y = 0;
  node1Ring.rotation.z = 0;
  node1Ring.position.set(0, 0, node1Z);
  root.add(node1Ring);

  const node2Ring = new THREE.Mesh(nodeRingGeom, nodeMarkMat);
  node2Ring.position.set(0, 0, node2Z);
  root.add(node2Ring);

  // Add some dark smudges near nodes for realism (simple flattened spheres or discs)
  function addNodeSmudge(z, side) {
    const smudgeGeom = new THREE.CircleGeometry(0.03, 16);
    const smudge = new THREE.Mesh(smudgeGeom, nodeMarkMat);
    smudge.position.set(0, radius + 0.001, z);
    smudge.rotation.x = Math.PI / 2;
    smudge.scale.set(1, 0.3, 1); // Flatten
    root.add(smudge);
  }
  addNodeSmudge(node1Z - 0.02, 1);
  addNodeSmudge(node2Z + 0.02, 1);

  // --- Hollow Ends ---
  // Dark discs inside the ends to show it's hollow
  const endCapGeom = new THREE.CircleGeometry(radius - 0.01, 32);
  const endCapLeft = new THREE.Mesh(endCapGeom, holeMat);
  endCapLeft.rotation.y = Math.PI / 2;
  endCapLeft.position.z = -halfL + 0.01;
  root.add(endCapLeft);

  const endCapRight = new THREE.Mesh(endCapGeom, holeMat);
  endCapRight.rotation.y = Math.PI / 2;
  endCapRight.position.z = halfL - 0.01;
  root.add(endCapRight);

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