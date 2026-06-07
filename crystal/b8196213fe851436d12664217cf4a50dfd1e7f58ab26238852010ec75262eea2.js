export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Copper/Bronze metal part
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Wooden handle
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc4a474,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Dark slot detail
  const slotMat = new THREE.MeshStandardMaterial({
    color: 0x3a2a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Metal Shaft & Tip (Lathe) ---
  // Profile points (radius, height) from tip (bottom) to collar (top)
  const metalProfile = [
    new THREE.Vector2(0.000, 0.00), // Tip point
    new THREE.Vector2(0.012, 0.08), // Taper start
    new THREE.Vector2(0.018, 0.15), // Shaft start
    new THREE.Vector2(0.018, 0.20), // Shaft mid
    new THREE.Vector2(0.015, 0.22), // Groove 1
    new THREE.Vector2(0.018, 0.24), // Groove 1 end
    new THREE.Vector2(0.018, 0.30), // Shaft
    new THREE.Vector2(0.016, 0.33), // Groove 2
    new THREE.Vector2(0.018, 0.36), // Groove 2 end
    new THREE.Vector2(0.022, 0.40), // Collar flare start
    new THREE.Vector2(0.028, 0.45), // Collar top (junction with wood)
  ];

  const metalGeom = new THREE.LatheGeometry(metalProfile, 32);
  const metalPart = new THREE.Mesh(metalGeom, copperMat);
  // Center the metal part vertically so tip is at 0 and top is at profile height
  metalPart.position.y = 0; 
  root.add(metalPart);

  // --- Wooden Handle ---
  const handleHeight = 0.55;
  const handleRadius = 0.032;
  const handleGeom = new THREE.CylinderGeometry(handleRadius, handleRadius, handleHeight, 24);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  // Position on top of the metal collar (metal top is at y=0.45)
  handle.position.y = 0.45 + handleHeight / 2;
  root.add(handle);

  // Handle End Cap (slightly rounded top)
  const capGeom = new THREE.SphereGeometry(handleRadius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const cap = new THREE.Mesh(capGeom, woodMat);
  cap.position.y = 0.45 + handleHeight;
  cap.rotation.x = Math.PI; // Flip to sit on top
  root.add(cap);

  // --- Handle Slot Detail ---
  // A thin dark box running along the handle to simulate the groove/slot
  const slotWidth = 0.008;
  const slotDepth = 0.004;
  const slotLength = 0.40;
  const slotGeom = new THREE.BoxGeometry(slotWidth, slotLength, slotDepth);
  const slot = new THREE.Mesh(slotGeom, slotMat);
  // Position slightly inset from the surface on the +X side
  slot.position.set(handleRadius - 0.002, 0.45 + handleHeight / 2, 0);
  root.add(slot);

  // --- Small Hole Detail on Metal Shaft ---
  // A small dark cylinder to represent the hole seen on the side
  const holeGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.015, 8);
  const hole = new THREE.Mesh(holeGeom, slotMat);
  hole.rotation.z = Math.PI / 2;
  // Position on the metal shaft, roughly where the taper meets the straight section
  hole.position.set(0.018, 0.18, 0); // On the surface
  root.add(hole);

  // --- Orientation ---
  // The tool in the image is diagonal.
  // Rotate around Z to lift the tip, and around Y to angle it in depth.
  root.rotation.z = -Math.PI / 4; // Tip down, handle up (relative to horizontal)
  root.rotation.y = -Math.PI / 3; // Angled in depth
  
  // Actually, let's align it better to the image: Tip is bottom-left, Handle is top-right.
  // Current local Y is the long axis.
  // Rotate X to lay it down somewhat, Rotate Y to angle it.
  root.rotation.set(0, 0, 0); // Reset
  // Point tip towards -X, -Z, -Y roughly?
  // Let's just rotate the group so the long axis (local Y) matches the image diagonal.
  // Image: Tip is lower-left-front. Handle is upper-right-back.
  // Local Y points up. We want Local Y to point to upper-right-back.
  root.rotation.x = Math.PI / 3; // Tilt back
  root.rotation.y = -Math.PI / 4; // Turn right
  root.rotation.z = Math.PI / 6; // Slight roll

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