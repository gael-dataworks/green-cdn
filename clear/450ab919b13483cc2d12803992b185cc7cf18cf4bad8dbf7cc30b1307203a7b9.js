export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed aluminum/silver for the body and markers.
  // Metalness capped at 0.6 to prevent blackness without env map.
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Dark gunmetal for the hands to create contrast.
  const handMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    metalness: 0.5,
    roughness: 0.3,
  });

  // --- Dimensions ---
  const width = 0.60;
  const height = 0.45;
  const depth = 0.02;
  const markerRadius = 0.18;
  const handOffset = 0.005; // Z offset for hands above markers

  // --- Body ---
  // Thin rectangular box with slightly rounded feel (simulated by smooth shading)
  const bodyGeom = new THREE.BoxGeometry(width, height, depth);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- Markers (12 Hour Indices) ---
  // Raised rectangular bars arranged in a circle.
  const markerGeom = new THREE.BoxGeometry(0.04, 0.012, 0.004);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2; // 0 at 3 o'clock, increasing CCW
    // We want 0 at 12 o'clock for clock logic, so shift by -PI/2
    const clockAngle = angle - Math.PI / 2;

    const x = Math.cos(clockAngle) * markerRadius;
    const y = Math.sin(clockAngle) * markerRadius;

    const marker = new THREE.Mesh(markerGeom, bodyMat);
    marker.position.set(x, y, depth / 2 + 0.002);
    // Rotate marker to be tangential (perpendicular to radius)
    marker.rotation.z = clockAngle - Math.PI / 2;
    root.add(marker);
  }

  // --- Hands ---
  // Helper to create a hand
  function createHand(length, widthH, thickness, material, zOffset) {
    const geom = new THREE.BoxGeometry(length, widthH, thickness);
    const mesh = new THREE.Mesh(geom, material);
    // Pivot point is at one end of the box (length/2), so shift geometry or position
    // BoxGeometry is centered. We want the pivot at the center of the clock (0,0).
    // So we translate the mesh locally so the "base" of the hand is at 0,0.
    mesh.geometry.translate(length / 2, 0, 0);
    mesh.position.z = zOffset;
    return mesh;
  }

  // Hour Hand (Short, points to 10)
  const hourHand = createHand(0.14, 0.025, 0.004, handMat, depth / 2 + handOffset);
  // 10 o'clock is 300 degrees or -60 degrees from 12 o'clock.
  // In our system (0 at 12 o'clock, CCW positive): 10 is +60 degrees (2 hours * 30 deg).
  // Wait, 12 is 0. 1 is -30. 10 is +60.
  hourHand.rotation.z = Math.PI / 3; // 60 degrees
  root.add(hourHand);

  // Minute Hand (Long, points to 2)
  const minuteHand = createHand(0.22, 0.020, 0.004, handMat, depth / 2 + handOffset + 0.001);
  // 2 o'clock is -60 degrees (or 300 degrees).
  minuteHand.rotation.z = -Math.PI / 3;
  root.add(minuteHand);

  // Second Hand (Very thin, points to 12)
  const secondHand = createHand(0.24, 0.008, 0.002, handMat, depth / 2 + handOffset + 0.002);
  // 12 o'clock is 0 degrees.
  secondHand.rotation.z = 0;
  root.add(secondHand);

  // --- Central Pivot ---
  // Small cap covering the hand axes
  const pivotGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16);
  const pivot = new THREE.Mesh(pivotGeom, handMat);
  pivot.rotation.x = Math.PI / 2; // Cylinder is Y-up, we need Z-up
  pivot.position.z = depth / 2 + handOffset + 0.004;
  root.add(pivot);

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