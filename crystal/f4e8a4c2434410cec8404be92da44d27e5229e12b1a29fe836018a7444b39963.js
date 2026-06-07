export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Translucent blue plastic (capsule/gumball style)
  // Using MeshPhysicalMaterial for transmission/glass-like effect but plastic roughness
  const plasticMat = new THREE.MeshPhysicalMaterial({
    color: 0x0088ff,
    metalness: 0.1,
    roughness: 0.15,
    transmission: 0.6,
    thickness: 0.5,
    ior: 1.5,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });

  // Slightly darker material for seams to make them visible
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x0066cc,
    metalness: 0.2,
    roughness: 0.4,
  });

  // 1. Main Sphere Body
  // Radius 0.5 to fit well in unit cube after normalization
  const sphereGeom = new THREE.SphereGeometry(0.5, 64, 64);
  const sphere = new THREE.Mesh(sphereGeom, plasticMat);
  root.add(sphere);

  // 2. Horizontal Seam (Equator)
  // Torus lies in XY plane by default, so we rotate it to lie in XZ plane (flat)
  const seamRadius = 0.501; // Slightly larger than sphere to sit on surface
  const seamTube = 0.005;
  const equatorGeom = new THREE.TorusGeometry(seamRadius, seamTube, 16, 64);
  const equator = new THREE.Mesh(equatorGeom, seamMat);
  equator.rotation.x = Math.PI / 2;
  root.add(equator);

  // 3. Vertical Seams (Meridians)
  // The image shows vertical lines meeting at poles. Let's create 3 vertical seams (120 deg apart)
  // Torus in XY plane needs rotation to become a vertical ring.
  // Rotate Z by 90 deg makes it stand up in YZ plane. Then rotate Y to distribute.
  const verticalSeamGeom = new THREE.TorusGeometry(seamRadius, seamTube, 16, 64);
  
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const seam = new THREE.Mesh(verticalSeamGeom, seamMat);
    // Rotate to stand vertically (around Z axis first to stand up, then Y to position)
    seam.rotation.z = Math.PI / 2;
    seam.rotation.y = angle;
    root.add(seam);
  }

  // 4. Top Cap / Indentation detail
  // A small flat circle or shallow cylinder at the north pole
  const capRadius = 0.08;
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, 0.005, 32);
  const cap = new THREE.Mesh(capGeom, seamMat);
  cap.position.y = 0.502; // Sit on top
  root.add(cap);

  // Small hole in the center of the cap
  const holeGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.006, 16);
  const hole = new THREE.Mesh(holeGeom, seamMat);
  hole.position.y = 0.503;
  root.add(hole);

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