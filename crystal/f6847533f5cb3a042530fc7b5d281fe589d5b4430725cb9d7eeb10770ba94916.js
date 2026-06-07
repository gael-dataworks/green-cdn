export default function generate(THREE) {
  const root = new THREE.Group();
  
  // Blue matte plastic material
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x4169e1,
    metalness: 0.0,
    roughness: 0.7,
  });
  
  // Dimensions for the hollow tube
  const outerRadius = 0.15;
  const innerRadius = 0.11;
  const length = 0.5;
  const halfLength = length / 2;
  
  // Lathe profile - cross-section from bottom center up
  // Creates hollow tube with visible wall thickness at ends
  const profile = [
    new THREE.Vector2(0, -halfLength),
    new THREE.Vector2(outerRadius, -halfLength),
    new THREE.Vector2(outerRadius, halfLength),
    new THREE.Vector2(innerRadius, halfLength),
    new THREE.Vector2(innerRadius, -halfLength),
    new THREE.Vector2(0, -halfLength),
  ];
  
  const tubeGeom = new THREE.LatheGeometry(profile, 32);
  const tube = new THREE.Mesh(tubeGeom, plasticMat);
  tube.rotation.x = Math.PI / 2;
  
  root.add(tube);
  
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