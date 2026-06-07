export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed metal for the body and markers.
  // Using metalness 0.6 (max safe limit without env map) and light silver color.
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Darker metal for the hands to create contrast.
  const handMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.5,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const width = 1.2;
  const height = 0.9;
  const depth = 0.04;
  const markerRadius = 0.36;
  const markerLen = 0.08;
  const markerW = 0.025;
  const markerD = 0.015;

  // --- Base Plate ---
  const bodyGeom = new THREE.BoxGeometry(width, height, depth);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- Markers (12 bars) ---
  const markerGeom = new THREE.BoxGeometry(markerW, markerLen, markerD);
  // Markers sit slightly in front of the face
  const markerZ = depth / 2 + markerD / 2 + 0.005;

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2; // 0 is at 3 o'clock (+X)
    // We want 0 to be at 3 o'clock, 90deg (PI/2) at 12 o'clock (+Y).
    // Standard unit circle matches this.
    
    const x = Math.cos(angle) * markerRadius;
    const y = Math.sin(angle) * markerRadius;

    const marker = new THREE.Mesh(markerGeom, bodyMat);
    marker.position.set(x, y, markerZ);
    // Rotate marker to point radially outward.
    // At 0 rad (3 o'clock), marker is horizontal (rot 0).
    // At PI/2 rad (12 o'clock), marker is vertical (rot PI/2).
    marker.rotation.z = angle;
    root.add(marker);
  }

  // --- Hands Helper ---
  // Creates a hand mesh pivoted at one end (the clock center)
  function createHand(w, h, d, mat, zOffset) {
    const geom = new THREE.BoxGeometry(w, h, d);
    // Translate geometry so the pivot is at the bottom (local 0,0,0)
    // BoxGeometry is centered, so we shift vertices up by h/2
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const py = pos.getY(i);
      pos.setY(i, py + h / 2);
    }
    geom.computeVertexNormals();
    
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.z = zOffset;
    return mesh;
  }

  const handZBase = depth / 2 + 0.01;
  
  // Hour Hand (Short, thick)
  const hourHand = createHand(0.045, 0.25, 0.02, handMat, handZBase);
  // Time: 10 o'clock -> 150 degrees from +X (3 o'clock)
  // 10 is 2 hours left of 12. 12 is 90deg. 10 is 90+60 = 150deg.
  hourHand.rotation.z = (150 / 180) * Math.PI;
  root.add(hourHand);

  // Minute Hand (Long, medium)
  const minuteHand = createHand(0.035, 0.38, 0.02, handMat, handZBase + 0.01);
  // Time: 10 minutes -> 2 o'clock -> 30 degrees from +X
  minuteHand.rotation.z = (30 / 180) * Math.PI;
  root.add(minuteHand);

  // Second Hand (Very thin, long)
  const secondHand = createHand(0.012, 0.42, 0.015, handMat, handZBase + 0.02);
  // Time: roughly 12 o'clock (straight up) -> 90 degrees
  secondHand.rotation.z = Math.PI / 2;
  // Optional: small counterweight tail
  const tailGeom = new THREE.BoxGeometry(0.012, 0.08, 0.015);
  const tail = new THREE.Mesh(tailGeom, handMat);
  tail.position.y = -0.04; // Below pivot
  secondHand.add(tail);
  root.add(secondHand);

  // --- Center Cap ---
  const capGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.03, 16);
  // Rotate cylinder to lie flat on Z axis (default is Y up)
  capGeom.rotateX(Math.PI / 2);
  const cap = new THREE.Mesh(capGeom, handMat);
  cap.position.z = handZBase + 0.025;
  root.add(cap);

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