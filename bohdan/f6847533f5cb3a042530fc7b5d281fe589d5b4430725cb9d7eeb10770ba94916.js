export default function generate(THREE) {
  const group = new THREE.Group();

  // Material: Matte blue plastic
  // Reference shows a non-glossy, slightly rough blue surface.
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x4b66cd,
    metalness: 0.0,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });

  // Dimensions for the spacer/bushing
  // Modeled upright along Y-axis.
  const height = 1.0;
  const outerRadius = 0.4;
  const innerRadius = 0.32; // Wall thickness ~0.08

  // Profile for LatheGeometry (cross-section of the wall)
  // Points define the loop: InnerBottom -> OuterBottom -> OuterTop -> InnerTop
  // x = radius from Y axis, y = height
  const profile = [
    new THREE.Vector2(innerRadius, -height / 2), // 1. Inner Bottom
    new THREE.Vector2(outerRadius, -height / 2), // 2. Outer Bottom
    new THREE.Vector2(outerRadius, height / 2),  // 3. Outer Top
    new THREE.Vector2(innerRadius, height / 2),  // 4. Inner Top
  ];

  // LatheGeometry creates the hollow cylinder from the profile
  // 32 segments for smoothness
  const tubeGeom = new THREE.LatheGeometry(profile, 32);
  const tube = new THREE.Mesh(tubeGeom, bluePlasticMat);
  
  group.add(tube);

  fitToUnitCube(THREE, group);
  return group;
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