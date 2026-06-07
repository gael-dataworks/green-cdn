export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Crust: Crumbly, matte, brown
  const crustMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Filling: Creamy, soft, off-white
  const fillingMat = new THREE.MeshStandardMaterial({
    color: 0xfffdd0,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Glaze: Shiny, translucent red jelly
  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0xcc0033,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.9,
    ior: 1.4,
  });

  // Cherries: Glossy, dark red fruit
  const cherryMat = new THREE.MeshStandardMaterial({
    color: 0x800020,
    metalness: 0.0,
    roughness: 0.1,
  });

  // Internal fruit pieces (visible in cut)
  const internalFruitMat = new THREE.MeshStandardMaterial({
    color: 0xa00030,
    metalness: 0.0,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const sliceRadius = 0.5;
  const sliceAngle = Math.PI / 2.5; // ~72 degrees wedge
  const totalHeight = 0.14;
  const crustHeight = 0.025;
  const fillingHeight = 0.10;
  const glazeHeight = 0.015;

  // --- Geometry Helpers ---
  // Wedge shape for the main body parts
  const wedgeSegments = 32;
  
  // 1. Crust Base
  const crustGeom = new THREE.CylinderGeometry(
    sliceRadius, sliceRadius, crustHeight, wedgeSegments, 1, 0, sliceAngle
  );
  // Shift geometry so top is at y=0 for easier stacking
  crustGeom.translate(0, crustHeight / 2, 0);
  const crust = new THREE.Mesh(crustGeom, crustMat);
  root.add(crust);

  // 2. Filling Body
  const fillingGeom = new THREE.CylinderGeometry(
    sliceRadius, sliceRadius, fillingHeight, wedgeSegments, 1, 0, sliceAngle
  );
  fillingGeom.translate(0, crustHeight + fillingHeight / 2, 0);
  const filling = new THREE.Mesh(fillingGeom, fillingMat);
  root.add(filling);

  // 3. Glaze Layer
  const glazeGeom = new THREE.CylinderGeometry(
    sliceRadius * 0.98, sliceRadius * 0.98, glazeHeight, wedgeSegments, 1, 0, sliceAngle
  );
  glazeGeom.translate(0, crustHeight + fillingHeight + glazeHeight / 2, 0);
  const glaze = new THREE.Mesh(glazeGeom, glazeMat);
  root.add(glaze);

  // 4. Glaze Drips (decorative spheres/cylinders on the edge)
  const dripGeom = new THREE.SphereGeometry(0.015, 8, 8);
  const dripPositions = [
    { x: 0.3, y: crustHeight + fillingHeight, z: 0.1, s: 1.2 },
    { x: 0.1, y: crustHeight + fillingHeight, z: 0.25, s: 1.0 },
    { x: -0.1, y: crustHeight + fillingHeight, z: 0.3, s: 1.1 },
  ];
  for (const pos of dripPositions) {
    const drip = new THREE.Mesh(dripGeom, glazeMat);
    drip.position.set(pos.x, pos.y, pos.z);
    drip.scale.set(pos.s, 1.5, pos.s);
    root.add(drip);
  }

  // 5. Top Cherries (3 distinct cherries)
  const cherryGeom = new THREE.SphereGeometry(0.045, 16, 16);
  // Cherry 1 (Left)
  const cherry1 = new THREE.Mesh(cherryGeom, cherryMat);
  cherry1.position.set(0.25, crustHeight + fillingHeight + glazeHeight + 0.03, 0.15);
  cherry1.scale.set(1.1, 0.9, 1.1);
  root.add(cherry1);
  
  // Cherry 2 (Center)
  const cherry2 = new THREE.Mesh(cherryGeom, cherryMat);
  cherry2.position.set(0.05, crustHeight + fillingHeight + glazeHeight + 0.04, 0.35);
  cherry2.scale.set(1.0, 1.0, 1.0);
  root.add(cherry2);

  // Cherry 3 (Right/Back)
  const cherry3 = new THREE.Mesh(cherryGeom, cherryMat);
  cherry3.position.set(-0.15, crustHeight + fillingHeight + glazeHeight + 0.035, 0.4);
  cherry3.scale.set(0.9, 0.95, 0.9);
  root.add(cherry3);

  // 6. Internal Fruit/Bubbles (visible in the cut faces)
  // We place small spheres inside the filling volume to simulate texture
  const internalGeom = new THREE.SphereGeometry(0.012, 8, 8);
  
  // Visible on the left cut face (theta = 0 plane roughly)
  const internalPositions = [
    { x: 0.15, y: crustHeight + 0.04, z: 0.05 },
    { x: 0.25, y: crustHeight + 0.06, z: 0.12 },
    { x: 0.35, y: crustHeight + 0.03, z: 0.20 },
    { x: 0.10, y: crustHeight + 0.08, z: 0.25 },
  ];

  for (const pos of internalPositions) {
    const bit = new THREE.Mesh(internalGeom, internalFruitMat);
    bit.position.set(pos.x, pos.y, pos.z);
    // Slightly embed into the surface
    bit.scale.set(1.2, 1.2, 0.8); 
    root.add(bit);
  }

  // 7. Porous Texture on Cut Faces (small cream spheres)
  const poreGeom = new THREE.SphereGeometry(0.008, 6, 6);
  const porePositions = [
    { x: 0.2, y: crustHeight + 0.05, z: 0.02 },
    { x: 0.3, y: crustHeight + 0.07, z: 0.08 },
    { x: 0.15, y: crustHeight + 0.09, z: 0.15 },
    { x: 0.4, y: crustHeight + 0.04, z: 0.18 },
    { x: 0.25, y: crustHeight + 0.02, z: 0.22 },
  ];
  for (const pos of porePositions) {
    const pore = new THREE.Mesh(poreGeom, fillingMat);
    pore.position.set(pos.x, pos.y, pos.z);
    root.add(pore);
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