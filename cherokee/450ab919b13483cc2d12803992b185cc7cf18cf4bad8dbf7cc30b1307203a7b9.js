export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed metal for body and markers.
  // Using emissive to compensate for lack of environment map, ensuring brightness.
  const brushedMetalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.4,
    emissive: 0xc0c0c0,
    emissiveIntensity: 0.25,
  });

  // Dark metal for hands.
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.5,
    roughness: 0.3,
    emissive: 0x333333,
    emissiveIntensity: 0.15,
  });

  // --- Procedural Brushed Metal Texture ---
  // Adds horizontal grain to the body to match the reference.
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseR = 192, baseG = 192, baseB = 192;
  for (let y = 0; y < texSize; y++) {
    // Create horizontal bands
    const bandIntensity = (Math.sin(y * 0.1) * 0.5 + 0.5) * 40;
    for (let x = 0; x < texSize; x++) {
      const noise = (Math.sin(x * 0.5 + y * 0.1) * 0.5 + 0.5) * 20;
      const val = baseR + bandIntensity + noise - 20;
      const idx = (y * texSize + x) * 4;
      data[idx] = val;     // R
      data[idx + 1] = val; // G
      data[idx + 2] = val; // B
      data[idx + 3] = 255; // A
    }
  }
  const brushedTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  brushedTexture.colorSpace = THREE.SRGBColorSpace;
  brushedTexture.wrapS = THREE.RepeatWrapping;
  brushedTexture.wrapT = THREE.RepeatWrapping;
  brushedTexture.repeat.set(4, 3);
  brushedTexture.needsUpdate = true;
  brushedMetalMat.map = brushedTexture;

  // --- Clock Body ---
  // Rectangular plate. Aspect ratio approx 4:3.
  const bodyWidth = 1.2;
  const bodyHeight = 0.9;
  const bodyDepth = 0.04;
  const clock_body = new THREE.Mesh(
    new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth),
    brushedMetalMat
  );
  root.add(clock_body);

  // --- Hour Markers ---
  // 12 raised bars arranged radially.
  const markerRadius = 0.38;
  const markerWidth = 0.025;
  const markerLength = 0.06;
  const markerDepth = 0.015;
  const markerGeom = new THREE.BoxGeometry(markerWidth, markerLength, markerDepth);

  for (let i = 1; i <= 12; i++) {
    const angle = (i / 12) * Math.PI * 2; // 0 at 3 o'clock, increasing CCW
    const x = Math.cos(angle) * markerRadius;
    const y = Math.sin(angle) * markerRadius;

    const hour_marker = new THREE.Mesh(markerGeom, brushedMetalMat);
    hour_marker.position.set(x, y, bodyDepth / 2 + markerDepth / 2);
    // Rotate marker to face center (tangent to circle)
    // Default box is vertical (along Y). We want it radial.
    // Angle of position vector is `angle`.
    // Marker should be aligned with radius.
    // BoxGeometry is tall in Y. So rotate Z by `angle`.
    hour_marker.rotation.z = angle;
    root.add(hour_marker);
  }

  // --- Hands Group ---
  // Container to keep hands organized and above the face.
  const handsGroup = new THREE.Group();
  handsGroup.position.z = bodyDepth / 2 + markerDepth + 0.01;
  root.add(handsGroup);

  // Helper to create a hand
  function createHand(length, width, thickness, material, rotationAngle) {
    const handGeom = new THREE.BoxGeometry(width, length, thickness);
    const handMesh = new THREE.Mesh(handGeom, material);
    // Pivot at bottom: geometry is centered, so move mesh up by half length
    // But we want to rotate around the bottom (center of clock).
    // Strategy: Put mesh in a pivot group.
    const pivot = new THREE.Group();
    pivot.rotation.z = rotationAngle;
    
    // Position the visual mesh so its bottom is at the pivot (0,0)
    handMesh.position.y = length / 2;
    
    pivot.add(handMesh);
    return pivot;
  }

  // Hour Hand (Short, points to 10)
  // 10 o'clock is 300 degrees = 5/6 * 360 = 300 deg.
  // In radians: (10/12) * 2PI = 5.23 rad.
  // Wait, standard math: 0 is +X (3 o'clock). 12 o'clock is +Y (PI/2).
  // 10 o'clock is 60 degrees left of 12. So PI/2 + PI/3 = 5PI/6.
  const hour_hand = createHand(0.25, 0.04, 0.01, darkMetalMat, 5 * Math.PI / 6);
  handsGroup.add(hour_hand);

  // Minute Hand (Long, points to 2)
  // 2 o'clock is 60 degrees right of 12. So PI/2 - PI/3 = PI/6.
  const minute_hand = createHand(0.38, 0.03, 0.01, darkMetalMat, Math.PI / 6);
  handsGroup.add(minute_hand);

  // Second Hand (Very thin, points to 12)
  // 12 o'clock is PI/2.
  const second_hand = createHand(0.42, 0.01, 0.005, darkMetalMat, Math.PI / 2);
  handsGroup.add(second_hand);

  // Center Cap
  const center_cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16),
    darkMetalMat
  );
  center_cap.rotation.x = Math.PI / 2; // Face Z
  center_cap.position.z = 0.015; // Sit on top of hands
  handsGroup.add(center_cap);

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