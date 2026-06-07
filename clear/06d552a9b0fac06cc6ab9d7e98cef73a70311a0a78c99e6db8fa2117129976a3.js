export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Porcelain: Glossy ceramic, low metalness, low-mid roughness
  const porcelainMat = new THREE.MeshStandardMaterial({
    color: 0xf8f8f8,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Gold: Polished metal, capped metalness per rules
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Floral colors
  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xff69b4,
    metalness: 0.0,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  const darkPinkMat = new THREE.MeshStandardMaterial({
    color: 0xc71585,
    metalness: 0.0,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2e8b57,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  const vineMat = new THREE.MeshStandardMaterial({
    color: 0x556b2f,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Cup Body (Lathe) ---
  // Profile defines the cross-section. We trace outer then inner to make a hollow solid.
  // Coordinates: (radius, height)
  const profilePoints = [
    new THREE.Vector2(0.0, 0.0),      // Center bottom
    new THREE.Vector2(0.13, 0.0),     // Foot outer edge
    new THREE.Vector2(0.12, 0.04),    // Foot top outer
    new THREE.Vector2(0.13, 0.15),    // Body mid outer
    new THREE.Vector2(0.22, 0.32),    // Rim outer lip
    new THREE.Vector2(0.20, 0.32),    // Rim inner lip
    new THREE.Vector2(0.14, 0.15),    // Body mid inner
    new THREE.Vector2(0.06, 0.04),    // Foot inner top
    new THREE.Vector2(0.05, 0.0),     // Bottom inner
    new THREE.Vector2(0.0, 0.0),      // Close center
  ];

  const cupGeom = new THREE.LatheGeometry(profilePoints, 48);
  // Smooth normals for glossy look
  cupGeom.computeVertexNormals();
  const cup = new THREE.Mesh(cupGeom, porcelainMat);
  root.add(cup);

  // --- Gold Rims ---
  // Top Rim: Thin torus at the lip
  const topRimGeom = new THREE.TorusGeometry(0.215, 0.008, 16, 64);
  const topRim = new THREE.Mesh(topRimGeom, goldMat);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = 0.32;
  root.add(topRim);

  // Bottom Rim: Thin torus at the foot base
  const botRimGeom = new THREE.TorusGeometry(0.125, 0.006, 16, 64);
  const botRim = new THREE.Mesh(botRimGeom, goldMat);
  botRim.rotation.x = Math.PI / 2;
  botRim.position.y = 0.005;
  root.add(botRim);

  // --- Handle ---
  // A torus segment rotated to form a C-shape on the side
  // Radius ~0.1, Tube ~0.015
  const handleGeom = new THREE.TorusGeometry(0.09, 0.014, 16, 32, Math.PI * 0.85);
  const handle = new THREE.Mesh(handleGeom, goldMat);
  // Position: Attach to right side (+X)
  // The torus lies in XY plane by default. We need it in XZ plane roughly, curving out.
  // Actually, a standard torus is in XY. If we rotate Z by 90, it's in YZ.
  // Let's orient it manually.
  handle.position.set(0.22, 0.16, 0);
  handle.rotation.z = Math.PI / 2; // Stand it up
  handle.rotation.y = -Math.PI / 2; // Face outward
  // Adjust position to connect to cup body
  handle.position.set(0.18, 0.18, 0);
  root.add(handle);

  // Handle connection pads (small spheres/cylinders to smooth join)
  const padGeom = new THREE.SphereGeometry(0.018, 16, 16);
  const padTop = new THREE.Mesh(padGeom, goldMat);
  padTop.position.set(0.215, 0.28, 0);
  root.add(padTop);

  const padBot = new THREE.Mesh(padGeom, goldMat);
  padBot.position.set(0.215, 0.08, 0);
  root.add(padBot);

  // --- Floral Decals ---
  // Helper to place flat motifs on the curved surface
  function getCupSurfacePoint(angle, y) {
    // Interpolate radius based on height y to place decals ON the surface
    // Approximate profile radii:
    // y=0 -> r=0.13
    // y=0.15 -> r=0.13
    // y=0.32 -> r=0.22
    let r;
    if (y < 0.05) r = 0.13;
    else if (y < 0.15) r = 0.13 + (y - 0.05) * 0.0; // Straightish
    else if (y < 0.32) r = 0.13 + (y - 0.15) * ((0.22 - 0.13) / (0.32 - 0.15));
    else r = 0.22;

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    return new THREE.Vector3(x, y, z);
  }

  function addPetal(angle, y, localX, localY, scale, rotZ, material) {
    const pos = getCupSurfacePoint(angle, y);
    // Normal at this point points radially outward
    const normal = new THREE.Vector3(pos.x, 0, pos.z).normalize();
    
    const petal = new THREE.Mesh(new THREE.CircleGeometry(0.025 * scale, 16), material);
    
    // Orient petal to face outward
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal
    );
    petal.quaternion.copy(quaternion);
    
    // Rotate around normal (Z in local space after orientation) to align petal
    petal.rotateZ(rotZ);
    
    // Offset slightly to prevent z-fighting
    const offset = normal.clone().multiplyScalar(0.002);
    // Apply local translation in the tangent plane
    const tangentX = new THREE.Vector3(-normal.z, 0, normal.x); // Perpendicular to normal
    const tangentY = new THREE.Vector3(0, 1, 0); // Up
    
    const localPos = tangentX.clone().multiplyScalar(localX).add(tangentY.clone().multiplyScalar(localY));
    petal.position.copy(pos).add(localPos).add(offset);
    
    root.add(petal);
  }

  function addLeaf(angle, y, localX, localY, scale, rotZ) {
    // Leaf is an elongated circle
    const pos = getCupSurfacePoint(angle, y);
    const normal = new THREE.Vector3(pos.x, 0, pos.z).normalize();
    
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.02 * scale, 16), leafMat);
    leaf.scale.set(1, 2.5, 1); // Elongate
    
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal
    );
    leaf.quaternion.copy(quaternion);
    leaf.rotateZ(rotZ);
    
    const offset = normal.clone().multiplyScalar(0.002);
    const tangentX = new THREE.Vector3(-normal.z, 0, normal.x);
    const tangentY = new THREE.Vector3(0, 1, 0);
    const localPos = tangentX.clone().multiplyScalar(localX).add(tangentY.clone().multiplyScalar(localY));
    
    leaf.position.copy(pos).add(localPos).add(offset);
    root.add(leaf);
  }

  function addVineSegment(p1, p2) {
    const curve = new THREE.LineCurve3(p1, p2);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.004, 6, false), vineMat);
    root.add(tube);
  }

  // Flower Cluster 1 (Front)
  const f1Angle = 0;
  const f1Y = 0.18;
  const f1Pos = getCupSurfacePoint(f1Angle, f1Y);
  
  // Rose center
  addPetal(f1Angle, f1Y, 0, 0, 0.6, 0, darkPinkMat);
  // Petals around
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const dist = 0.035;
    addPetal(f1Angle, f1Y, Math.cos(a) * dist, Math.sin(a) * dist, 0.8, a, pinkMat);
  }
  // Outer petals
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const dist = 0.06;
    addPetal(f1Angle, f1Y, Math.cos(a) * dist, Math.sin(a) * dist, 1.0, a, pinkMat);
  }

  // Leaves around flower 1
  addLeaf(f1Angle, f1Y, 0.08, 0.05, 0.8, 0.5);
  addLeaf(f1Angle, f1Y, -0.08, 0.05, 0.8, -0.5);
  addLeaf(f1Angle, f1Y, 0, -0.09, 0.9, Math.PI);

  // Vine trailing from flower 1
  const v1End = getCupSurfacePoint(f1Angle + 0.5, f1Y + 0.08);
  addVineSegment(f1Pos, v1End);
  addLeaf(f1Angle + 0.2, f1Y + 0.04, 0.02, 0.02, 0.6, 0.5);

  // Flower Cluster 2 (Side Left)
  const f2Angle = -2.0;
  const f2Y = 0.22;
  const f2Pos = getCupSurfacePoint(f2Angle, f2Y);
  
  // Smaller rose
  addPetal(f2Angle, f2Y, 0, 0, 0.5, 0, darkPinkMat);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    addPetal(f2Angle, f2Y, Math.cos(a) * 0.025, Math.sin(a) * 0.025, 0.6, a, pinkMat);
  }
  
  // Buds
  addPetal(f2Angle, f2Y, 0.04, 0.04, 0.4, 0.5, darkPinkMat);
  addLeaf(f2Angle, f2Y, 0.05, 0.03, 0.5, 0.2);

  // Vine connecting to rim
  const v2End = getCupSurfacePoint(f2Angle - 0.3, f2Y + 0.08);
  addVineSegment(f2Pos, v2End);

  // Flower Cluster 3 (Side Right, near handle base)
  const f3Angle = 1.5;
  const f3Y = 0.12;
  const f3Pos = getCupSurfacePoint(f3Angle, f3Y);
  
  addPetal(f3Angle, f3Y, 0, 0, 0.5, 0, darkPinkMat);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    addPetal(f3Angle, f3Y, Math.cos(a) * 0.025, Math.sin(a) * 0.025, 0.6, a, pinkMat);
  }
  addLeaf(f3Angle, f3Y, 0, -0.05, 0.7, Math.PI);
  
  // Vine going down
  const v3End = getCupSurfacePoint(f3Angle + 0.2, f3Y - 0.06);
  addVineSegment(f3Pos, v3End);

  // Scattered leaves
  addLeaf(0.5, 0.25, 0, 0, 0.6, 1.0);
  addLeaf(-1.0, 0.15, 0, 0, 0.5, -0.5);
  addLeaf(2.5, 0.20, 0, 0, 0.5, 2.0);

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