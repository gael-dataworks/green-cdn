export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold band: Polished metal
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.8,
    roughness: 0.2,
  });

  // Stone core: Translucent teal crystal (Aquamarine/Amazonite style)
  // Using Physical material for transmission/glassiness
  const stoneMat = new THREE.MeshPhysicalMaterial({
    color: 0x5FBFBF,
    metalness: 0.1,
    roughness: 0.3,
    transmission: 0.6,
    ior: 1.55,
    transparent: true,
    opacity: 0.9,
  });

  // Crust: Opaque rough white/grey matrix
  const crustMat = new THREE.MeshStandardMaterial({
    color: 0xE8E8E8,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Ring Band ---
  // Torus geometry for the ring shank
  const bandRadius = 0.09;
  const bandTube = 0.018;
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 16, 32);
  const band = new THREE.Mesh(bandGeom, goldMat);
  band.rotation.x = Math.PI / 2; // Lay flat in XZ plane
  band.position.y = -0.05; // Sit below the stone
  root.add(band);

  // --- Stone Assembly ---
  const stoneGroup = new THREE.Group();
  
  // Dimensions for the rectangular stone
  const stoneW = 0.14; // Width (X)
  const stoneD = 0.08; // Depth (Z)
  const stoneH = 0.045; // Total Height (Y)
  const stepH = stoneH / 3;

  // We create a stepped "emerald cut" look by stacking 3 boxes
  // Base layer
  const baseGeom = new THREE.BoxGeometry(stoneW, stepH, stoneD);
  const stoneBase = new THREE.Mesh(baseGeom, stoneMat);
  stoneBase.position.y = stepH / 2;
  stoneGroup.add(stoneBase);

  // Middle layer (slightly smaller)
  const midW = stoneW * 0.85;
  const midD = stoneD * 0.85;
  const midGeom = new THREE.BoxGeometry(midW, stepH, midD);
  const stoneMid = new THREE.Mesh(midGeom, stoneMat);
  stoneMid.position.y = stepH + stepH / 2;
  stoneGroup.add(stoneMid);

  // Top layer (smallest, the table)
  const topW = stoneW * 0.7;
  const topD = stoneD * 0.7;
  const topGeom = new THREE.BoxGeometry(topW, stepH, topD);
  const stoneTop = new THREE.Mesh(topGeom, stoneMat);
  stoneTop.position.y = stepH * 2 + stepH / 2;
  stoneGroup.add(stoneTop);

  // --- Raw Crust Details ---
  // Add irregular chunks around the sides of the base layer to simulate raw crystal matrix
  const crustGeom = new THREE.DodecahedronGeometry(0.015, 0); // Low poly for jagged look
  
  // Deterministic positions for crust chunks around the perimeter
  // We place them at y ~ stepH/2 (middle of base layer)
  const crustPositions = [
    // Front face
    { x: -0.05, z: stoneD / 2 + 0.005 },
    { x: 0.0, z: stoneD / 2 + 0.008 },
    { x: 0.05, z: stoneD / 2 + 0.005 },
    // Back face
    { x: -0.05, z: -stoneD / 2 - 0.005 },
    { x: 0.0, z: -stoneD / 2 - 0.008 },
    { x: 0.05, z: -stoneD / 2 - 0.005 },
    // Left face
    { x: -stoneW / 2 - 0.008, z: -0.02 },
    { x: -stoneW / 2 - 0.008, z: 0.02 },
    // Right face
    { x: stoneW / 2 + 0.008, z: -0.02 },
    { x: stoneW / 2 + 0.008, z: 0.02 },
  ];

  for (let i = 0; i < crustPositions.length; i++) {
    const pos = crustPositions[i];
    const chunk = new THREE.Mesh(crustGeom, crustMat);
    chunk.position.set(pos.x, stepH / 2, pos.z);
    // Random-ish rotation using index to avoid Math.random
    chunk.rotation.set(i * 0.5, i * 0.7, i * 0.3);
    // Random-ish scale
    const s = 0.8 + (i % 3) * 0.2;
    chunk.scale.setScalar(s);
    stoneGroup.add(chunk);
  }

  root.add(stoneGroup);

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