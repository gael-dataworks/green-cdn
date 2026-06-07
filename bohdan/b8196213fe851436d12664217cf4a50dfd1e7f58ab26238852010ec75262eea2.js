export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Copper/bronze metal for the blade/shaft
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Light wood for the handle
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Dark shadow for the handle slot and hole
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Metal Blade (Lathe Geometry) ---
  // Constructing a profile that includes the sharp tip, screw threads, and smooth shank
  const profilePoints = [];
  
  // Tip
  profilePoints.push(new THREE.Vector2(0.0, 0.0));
  
  // Threads section (zig-zag profile)
  const threadStartY = 0.02;
  const threadEndY = 0.22;
  const threadCount = 8;
  const threadDepth = 0.015;
  const coreRadius = 0.01;
  
  for (let i = 0; i <= threadCount; i++) {
    const t = i / threadCount;
    const y = threadStartY + t * (threadEndY - threadStartY);
    // Outer radius for peak, inner for valley
    const r = (i % 2 === 0) ? coreRadius + threadDepth : coreRadius;
    profilePoints.push(new THREE.Vector2(r, y));
  }
  
  // Smooth shank tapering up to the collar
  profilePoints.push(new THREE.Vector2(coreRadius, threadEndY + 0.01));
  profilePoints.push(new THREE.Vector2(0.012, 0.30));
  profilePoints.push(new THREE.Vector2(0.012, 0.35));
  
  // Collar/Shoulder
  profilePoints.push(new THREE.Vector2(0.025, 0.38));
  profilePoints.push(new THREE.Vector2(0.025, 0.42));
  
  // Top of metal part (flat for wood to sit on)
  profilePoints.push(new THREE.Vector2(0.0, 0.42));

  const bladeGeom = new THREE.LatheGeometry(profilePoints, 32);
  const blade = new THREE.Mesh(bladeGeom, metalMat);
  // Tip points down in local space if we build profile upwards, but let's keep tip at 0,0 and handle above.
  // Actually, let's keep the object upright: Tip at bottom (y=0), Handle at top.
  root.add(blade);

  // --- Hole on the smooth shank ---
  // A small dark cylinder to simulate the setscrew hole or mark
  const holeGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.015, 8);
  const hole = new THREE.Mesh(holeGeom, darkMat);
  hole.rotation.z = Math.PI / 2; // Face outward along X
  hole.position.set(0.012, 0.32, 0.0); // On the surface of the shank
  root.add(hole);

  // --- Wood Handle ---
  // Slightly tapered cylinder
  const handleHeight = 0.55;
  const handleGeom = new THREE.CylinderGeometry(0.05, 0.06, handleHeight, 24);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  handle.position.y = 0.42 + handleHeight / 2;
  root.add(handle);

  // --- Handle Slot ---
  // The split in the wooden handle
  const slotWidth = 0.004;
  const slotHeight = 0.004;
  const slotLength = 0.45;
  const slotGeom = new THREE.BoxGeometry(slotWidth, slotLength, slotHeight);
  const slot = new THREE.Mesh(slotGeom, darkMat);
  // Position slightly inside the surface of the handle
  // Handle radius at slot position (midway) is approx 0.055
  slot.position.set(0.055, 0.42 + handleHeight / 2, 0.0);
  root.add(slot);
  
  // Add a second slot on the opposite side if visible, or just one deep one. 
  // The image shows one clear slot. Let's add a matching one on the back for symmetry/volume.
  const slotBack = slot.clone();
  slotBack.position.set(-0.055, 0.42 + handleHeight / 2, 0.0);
  root.add(slotBack);

  // --- Ferrule/Collar Detail ---
  // A thin ring to emphasize the transition between wood and metal
  const ferruleGeom = new THREE.TorusGeometry(0.025, 0.003, 8, 32);
  const ferrule = new THREE.Mesh(ferruleGeom, metalMat);
  ferrule.rotation.x = Math.PI / 2;
  ferrule.position.y = 0.42;
  root.add(ferrule);

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