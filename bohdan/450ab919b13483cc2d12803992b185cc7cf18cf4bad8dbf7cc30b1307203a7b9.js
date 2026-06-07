export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Brushed metal for face and markers (silver/light gray)
  const faceMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Dark metal for hands (gunmetal/dark gray)
  const handMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.5,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const faceW = 1.2;
  const faceH = 0.85;
  const faceD = 0.025;
  const markerRadius = 0.38;
  const markerLen = 0.06;
  const markerW = 0.015;
  const markerH = 0.012; // raised height

  // --- Clock Face ---
  const faceGeom = new THREE.BoxGeometry(faceW, faceH, faceD);
  const face = new THREE.Mesh(faceGeom, faceMat);
  face.position.z = -faceD / 2; // Back face at z=0, front at z=faceD
  root.add(face);

  // --- Hour Markers ---
  const markerGeom = new THREE.BoxGeometry(markerW, markerLen, markerH);
  // Markers are radial. We create them rotated and positioned.
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2; // Start at 12 o'clock (+Y)
    const x = Math.cos(angle) * markerRadius;
    const y = Math.sin(angle) * markerRadius;

    const marker = new THREE.Mesh(markerGeom, faceMat);
    marker.position.set(x, y, faceD / 2 + markerH / 2);
    marker.rotation.z = angle;
    root.add(marker);
  }

  // --- Hands ---
  // Minute Hand (Longer)
  const minHandLen = 0.32;
  const minHandW = 0.018;
  const minHandH = 0.01;
  const minHandGeom = new THREE.BoxGeometry(minHandW, minHandLen, minHandH);
  const minuteHand = new THREE.Mesh(minHandGeom, handMat);
  // Pivot at bottom of hand geometry (center is at 0,0,0 by default for Box)
  // We want to rotate around the center of the clock, so we offset the geometry or position.
  // Easier: Position the mesh so its local origin is at the rotation point.
  // BoxGeometry is centered. So we shift position Y by half length.
  minuteHand.position.y = minHandLen / 2;
  minuteHand.position.z = faceD + minHandH + 0.005; // Slightly above markers
  // Time: 10 minutes past (2 o'clock position) -> 30 degrees from +Y (clockwise)
  // Three.js rotation is counter-clockwise. +Y is 90 deg.
  // Target angle in standard polar: 60 deg (PI/3).
  // In Three.js (0 is +X), 60 deg is PI/3.
  minuteHand.rotation.z = Math.PI / 3;
  
  const minuteHandGroup = new THREE.Group();
  minuteHandGroup.add(minuteHand);
  root.add(minuteHandGroup);

  // Hour Hand (Shorter)
  const hrHandLen = 0.22;
  const hrHandW = 0.022;
  const hrHandH = 0.01;
  const hrHandGeom = new THREE.BoxGeometry(hrHandW, hrHandLen, hrHandH);
  const hourHand = new THREE.Mesh(hrHandGeom, handMat);
  hourHand.position.y = hrHandLen / 2;
  hourHand.position.z = faceD + minHandH + hrHandH + 0.005; // Above minute hand
  // Time: 10 o'clock -> 150 degrees from +X (5PI/6)
  hourHand.rotation.z = (5 * Math.PI) / 6;

  const hourHandGroup = new THREE.Group();
  hourHandGroup.add(hourHand);
  root.add(hourHandGroup);

  // --- Center Cap ---
  const capRadius = 0.025;
  const capH = 0.015;
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capH, 16);
  const cap = new THREE.Mesh(capGeom, handMat);
  cap.rotation.x = Math.PI / 2; // Cylinder is Y-up, we want Z-up
  cap.position.z = faceD + minHandH + hrHandH + capH / 2 + 0.01;
  root.add(cap);

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