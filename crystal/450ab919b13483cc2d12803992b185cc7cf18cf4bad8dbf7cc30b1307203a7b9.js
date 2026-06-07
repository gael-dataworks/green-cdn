export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Brushed metal face: Silver-grey, moderate roughness for brushed look.
  const faceMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Hands and markers: Darker gunmetal for contrast.
  const handMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.6,
    roughness: 0.35,
  });

  // 1. Case Body
  // Thin square box.
  const caseWidth = 0.80;
  const caseHeight = 0.80;
  const caseDepth = 0.04;
  const caseGeom = new THREE.BoxGeometry(caseWidth, caseHeight, caseDepth);
  const case_body = new THREE.Mesh(caseGeom, faceMat);
  root.add(case_body);

  // 2. Hour Markers
  // 12 small rectangular bars arranged radially.
  const markerRadius = 0.32;
  const markerWidth = 0.025;
  const markerLength = 0.06;
  const markerDepth = 0.005;
  const markerGeom = new THREE.BoxGeometry(markerWidth, markerLength, markerDepth);

  for (let i = 0; i < 12; i++) {
    // Angle: 0 is 3 o'clock (+X). We want 0 to be 12 o'clock (+Y) for logic,
    // but standard circle math starts at +X.
    // Let's map i=0 (12 o'clock) to PI/2.
    // Angle in radians for position:
    const angle = (Math.PI / 2) - (i / 12) * Math.PI * 2;
    
    const marker = new THREE.Mesh(markerGeom, handMat);
    
    // Position on the circle
    marker.position.x = Math.cos(angle) * markerRadius;
    marker.position.y = Math.sin(angle) * markerRadius;
    marker.position.z = caseDepth / 2 + markerDepth / 2 + 0.002; // Slightly above face

    // Rotate to point towards center
    // A vertical marker (12 o'clock) has rotation 0 (or PI). 
    // A horizontal marker (3 o'clock) has rotation -PI/2.
    // The box is vertical by default (long axis Y).
    // So we rotate by the angle + PI/2 to align tangent? 
    // Actually, we want the long axis (Y of box) to align with the radial vector.
    // Radial vector angle is `angle`. Box default long axis is Y (PI/2).
    // So rotation.z = angle - PI/2.
    marker.rotation.z = angle - Math.PI / 2;

    root.add(marker);
  }

  // 3. Hands
  // Helper to create a hand mesh pivoted at the bottom (0,0)
  function createHand(width, length, zOffset) {
    const geom = new THREE.BoxGeometry(width, length, 0.005);
    const mesh = new THREE.Mesh(geom, handMat);
    // Shift mesh so its bottom center is at local origin (0,0,0)
    // Default box center is (0,0,0). Move it up by half length.
    mesh.position.y = length / 2;
    mesh.position.z = zOffset;
    return mesh;
  }

  // Time: 10:10:00 roughly
  // 12 o'clock is PI/2. Clockwise is negative rotation in standard math (Y up, Z out).
  // 10 o'clock: 2 hours before 12. 2/12 * 360 = 60 degrees. PI/2 + 60deg = PI/2 + PI/3 = 5PI/6.
  // 2 o'clock: 2 hours after 12. 60 degrees. PI/2 - 60deg = PI/2 - PI/3 = PI/6.

  // Hour Hand (Short, thicker)
  const hourHandLength = 0.22;
  const hourHandWidth = 0.035;
  const hour_hand = createHand(hourHandWidth, hourHandLength, 0.025);
  hour_hand.rotation.z = (5 * Math.PI) / 6; // 10 o'clock
  root.add(hour_hand);

  // Minute Hand (Long, thinner)
  const minuteHandLength = 0.34;
  const minuteHandWidth = 0.025;
  const minute_hand = createHand(minuteHandWidth, minuteHandLength, 0.030);
  minute_hand.rotation.z = Math.PI / 6; // 2 o'clock
  root.add(minute_hand);

  // Second Hand (Very thin, needle)
  const secondHandLength = 0.36;
  const secondHandWidth = 0.006;
  const second_hand = createHand(secondHandWidth, secondHandLength, 0.035);
  // Counterweight tail for realism
  const tailGeom = new THREE.BoxGeometry(secondHandWidth * 0.5, 0.08, 0.005);
  const tail = new THREE.Mesh(tailGeom, handMat);
  tail.position.y = -0.04; // Below pivot
  second_hand.add(tail);
  
  second_hand.rotation.z = Math.PI / 2; // 12 o'clock
  root.add(second_hand);

  // 4. Center Cap
  const capRadius = 0.025;
  const capHeight = 0.015;
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16);
  const center_cap = new THREE.Mesh(capGeom, handMat);
  center_cap.rotation.x = Math.PI / 2; // Cylinder is Y-up, need Z-axis cap
  center_cap.position.z = 0.040;
  root.add(center_cap);

  // Normalization
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