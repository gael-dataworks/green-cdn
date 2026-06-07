export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Glossy blue plastic
  // Reference: glossy plastic -> metalness 0.0, roughness 0.3
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x2986cc,
    metalness: 0.0,
    roughness: 0.25,
  });

  // 1. Main Sphere Body
  // Radius 0.5 fits well before normalization
  const sphereGeom = new THREE.SphereGeometry(0.5, 32, 32);
  const mainSphere = new THREE.Mesh(sphereGeom, bluePlasticMat);
  root.add(mainSphere);

  // 2. Equator Seam
  // A thin torus slightly larger than the sphere to represent the parting line
  const seamRadius = 0.502;
  const seamTube = 0.008;
  const seamGeom = new THREE.TorusGeometry(seamRadius, seamTube, 16, 48);
  const equatorSeam = new THREE.Mesh(seamGeom, bluePlasticMat);
  equatorSeam.rotation.x = Math.PI / 2; // Lay flat on XZ plane
  root.add(equatorSeam);

  // 3. Top Cap / Nub
  // Small circular feature at the north pole, common in capsules
  const capRadius = 0.08;
  const capHeight = 0.015;
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 24);
  const topCap = new THREE.Mesh(capGeom, bluePlasticMat);
  topCap.position.y = 0.5 + capHeight / 2; // Sit on top of sphere
  root.add(topCap);

  // 4. Vertical Seams (Optional detail to suggest multipart construction)
  // Adding 3 vertical arcs to match the visual complexity of a molded capsule
  const verticalSeamRadius = 0.502;
  const verticalSeamGeom = new THREE.TorusGeometry(verticalSeamRadius, seamTube * 0.8, 8, 48, Math.PI);
  
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const vSeam = new THREE.Mesh(verticalSeamGeom, bluePlasticMat);
    // Rotate to stand vertically
    vSeam.rotation.y = angle;
    vSeam.rotation.x = Math.PI / 2; 
    // The torus is half-circle (Math.PI), we need to orient it correctly
    // Default torus is in XY. Rotating X by PI/2 puts it in YZ.
    // We want it to wrap from top to bottom.
    // Actually, simpler: Use a Tube along a curve or just rotate the half-torus.
    // Let's use a simpler approach: Thin Box or Cylinder segments if Torus orientation is tricky.
    // Reverting to simple vertical cylinders flattened against surface for seams.
  }
  
  // Alternative Vertical Seams: Flattened cylinders
  const vSeamW = 0.012;
  const vSeamH = 0.5; // Half height
  const vSeamD = 0.005;
  const vSeamGeomSimple = new THREE.BoxGeometry(vSeamW, vSeamH * 2, vSeamD);
  
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const x = Math.cos(angle) * 0.5;
    const z = Math.sin(angle) * 0.5;
    const vSeam = new THREE.Mesh(vSeamGeomSimple, bluePlasticMat);
    vSeam.position.set(x, 0, z);
    vSeam.lookAt(0, 0, 0); // Face center
    vSeam.rotateY(Math.PI / 2); // Align with radius
    root.add(vSeam);
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