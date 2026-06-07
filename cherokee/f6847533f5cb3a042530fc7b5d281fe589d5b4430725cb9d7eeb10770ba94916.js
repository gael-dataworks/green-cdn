export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Blue satin plastic
  // Reference shows a medium blue, slightly shiny but not metallic.
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x2e55cc,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Geometry: Hollow tube via LatheGeometry
  // Profile defines the cross-section in the XY plane (X=radius, Y=height).
  // We define a rectangular ring profile to create the hollow cylinder.
  // Points order: Counter-Clockwise to ensure outward normals.
  const outerRadius = 0.20;
  const innerRadius = 0.15;
  const halfHeight = 0.50;

  const profile = [
    new THREE.Vector2(outerRadius, -halfHeight), // 1. Bottom Outer
    new THREE.Vector2(outerRadius,  halfHeight), // 2. Top Outer
    new THREE.Vector2(innerRadius,  halfHeight), // 3. Top Inner
    new THREE.Vector2(innerRadius, -halfHeight), // 4. Bottom Inner
    new THREE.Vector2(outerRadius, -halfHeight), // 5. Close loop
  ];

  // 32 segments for a smooth circular appearance
  const tubeGeom = new THREE.LatheGeometry(profile, 32);
  const tube = new THREE.Mesh(tubeGeom, bluePlasticMat);
  
  // The image shows the tube lying on its side. 
  // Canonical orientation for a cylinder is Y-up, but to match the "face +Z" 
  // convention for objects (and the visual of a tube pointing forward), 
  // we rotate it 90 degrees around X so the hole axis aligns with Z.
  // However, standard practice for generic parts is often Y-up. 
  // Given the prompt "face +Z", rotating so the length is along Z or X is common for vehicles,
  // but for a symmetric part, Y-up is safest. I will keep it Y-up as it's the 
  // standard primitive orientation, and let the viewer orbit. 
  // Actually, looking at the image, it's just a part. Y-up is fine.
  
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