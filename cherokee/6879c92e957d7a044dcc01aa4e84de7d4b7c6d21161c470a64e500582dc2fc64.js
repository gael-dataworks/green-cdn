export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const radius = 0.45;
  const heightTotal = 0.14;
  const crustHeight = 0.025;
  const cakeHeight = heightTotal - crustHeight;
  const thetaLength = Math.PI / 3.5; // ~51 degrees, a generous slice
  const thetaStart = -thetaLength / 2;
  const radialSegments = 24;

  // --- Materials ---
  // Crust: Crumbly, matte, golden brown
  const crustMat = new THREE.MeshStandardMaterial({
    color: 0xc49a6c,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Cake Body: Creamy, porous, slight subsurface feel (simulated with color)
  const cakeMat = new THREE.MeshStandardMaterial({
    color: 0xfdfbd5,
    roughness: 0.7,
    metalness: 0.0,
  });

  // Glaze: Glossy, translucent red
  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0xd60036,
    roughness: 0.15,
    metalness: 0.0,
    transmission: 0.6,
    thickness: 0.5,
    ior: 1.4,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // Cherries: Deep red, shiny, slightly fleshy
  const cherryMat = new THREE.MeshPhysicalMaterial({
    color: 0x8a0018,
    roughness: 0.2,
    metalness: 0.0,
    transmission: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // Internal Cherry Piece: Darker, embedded
  const internalCherryMat = new THREE.MeshStandardMaterial({
    color: 0x6a0010,
    roughness: 0.6,
    metalness: 0.0,
  });

  // --- Geometry Helpers ---

  // 1. Crust Base
  const crustGeom = new THREE.CylinderGeometry(
    radius, radius, crustHeight, radialSegments, 1, false,
    thetaStart, thetaLength
  );
  // Shift geometry so top is at y=0 for easier stacking
  crustGeom.translate(0, crustHeight / 2, 0);
  const crust = new THREE.Mesh(crustGeom, crustMat);
  root.add(crust);

  // 2. Cake Body
  const cakeGeom = new THREE.CylinderGeometry(
    radius * 0.98, radius * 0.98, cakeHeight, radialSegments, 1, false,
    thetaStart, thetaLength
  );
  cakeGeom.translate(0, cakeHeight / 2 + crustHeight, 0);
  const cakeBody = new THREE.Mesh(cakeGeom, cakeMat);
  root.add(cakeBody);

  // 3. Glaze Layer (Top + Drips)
  // Main top layer
  const glazeGeom = new THREE.CylinderGeometry(
    radius * 1.02, radius * 1.02, 0.015, radialSegments, 1, false,
    thetaStart, thetaLength
  );
  glazeGeom.translate(0, heightTotal - 0.0075, 0);
  const glazeTop = new THREE.Mesh(glazeGeom, glazeMat);
  root.add(glazeTop);

  // Drips on the curved back side
  const dripPositions = [
    { angle: -0.2, y: heightTotal - 0.03, scale: [0.025, 0.04, 0.025] },
    { angle: 0.0, y: heightTotal - 0.04, scale: [0.03, 0.05, 0.03] },
    { angle: 0.2, y: heightTotal - 0.035, scale: [0.02, 0.035, 0.02] },
  ];

  const dripGeom = new THREE.SphereGeometry(1, 16, 16);
  // Scale sphere to look like a drip
  dripGeom.scale(0.03, 0.05, 0.03);

  dripPositions.forEach(pos => {
    const drip = new THREE.Mesh(dripGeom, glazeMat);
    const x = Math.cos(pos.angle) * radius;
    const z = Math.sin(pos.angle) * radius;
    drip.position.set(x, pos.y, z);
    // Orient drip to follow surface normal roughly
    drip.lookAt(0, pos.y, 0);
    drip.rotateX(Math.PI / 2);
    root.add(drip);
  });

  // 4. Cherries on Top
  const cherryGeom = new THREE.SphereGeometry(0.055, 32, 32);
  const cherryPositions = [
    { x: 0.15, z: 0.05 },
    { x: 0.05, z: 0.15 },
    { x: -0.1, z: 0.1 }
  ];

  cherryPositions.forEach((pos, i) => {
    const cherry = new THREE.Mesh(cherryGeom, cherryMat);
    // Place on top of glaze
    cherry.position.set(pos.x, heightTotal + 0.04, pos.z);
    // Slight random rotation for natural look (deterministic based on index)
    cherry.rotation.set(i * 0.2, i * 0.5, 0);
    // Scale slightly irregular
    cherry.scale.set(1 + i * 0.05, 0.9, 1 - i * 0.05);
    root.add(cherry);
  });

  // 5. Internal Cherry Piece (Visible on the cut face)
  // Positioned on one of the flat cut sides
  const internalCherryGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const internalCherry = new THREE.Mesh(internalCherryGeom, internalCherryMat);
  // Place on the side cut face (angle ~ thetaStart/2 + thetaLength/2 ? No, flat face is at angle)
  // The flat faces are at thetaStart and thetaStart + thetaLength.
  // Let's put it on the right cut face.
  const cutAngle = thetaStart + thetaLength;
  const cutDist = radius * 0.6;
  const ix = Math.cos(cutAngle) * cutDist;
  const iz = Math.sin(cutAngle) * cutDist;
  internalCherry.position.set(ix, crustHeight + cakeHeight * 0.6, iz);
  // Rotate to align with the cut plane normal
  internalCherry.lookAt(0, crustHeight + cakeHeight * 0.6, 0);
  root.add(internalCherry);

  // 6. Crumbs at the base
  const crumbGeom = new THREE.BoxGeometry(0.015, 0.01, 0.015);
  const crumbMat = new THREE.MeshStandardMaterial({ color: 0xb08555, roughness: 1.0 });
  
  const crumbPositions = [
    [0.2, 0.005, 0.1], [-0.2, 0.005, 0.15], [0.0, 0.005, 0.25],
    [0.3, 0.005, -0.1], [-0.1, 0.005, -0.2], [0.15, 0.005, -0.15]
  ];

  crumbPositions.forEach((pos, i) => {
    const crumb = new THREE.Mesh(crumbGeom, crumbMat);
    crumb.position.set(pos[0], pos[1], pos[2]);
    crumb.rotation.set(i * 0.5, i * 0.3, i * 0.7);
    root.add(crumb);
  });

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