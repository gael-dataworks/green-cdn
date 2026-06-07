export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: High metalness but capped at 0.6 per rules. Slight emissive for brightness.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xD4AF37,
    emissiveIntensity: 0.15
  });

  // Emerald: Green, transparent, refractive.
  const emeraldMat = new THREE.MeshPhysicalMaterial({
    color: 0x009966,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.57,
    transparent: true,
    thickness: 0.5
  });

  // Ruby: Red, transparent, refractive.
  const rubyMat = new THREE.MeshPhysicalMaterial({
    color: 0xE0115F,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.76,
    transparent: true,
    thickness: 0.5
  });

  // --- Dimensions ---
  const barLength = 1.0;
  const barWidth = 0.26;
  const barHeight = 0.05;
  const stoneBorderOffset = 0.02;
  const smallStoneRadius = 0.022;

  // --- 1. Gold Bar Base ---
  // Using a box with slightly rounded corners via scale or just a clean box.
  // To get rounded corners procedurally without heavy geometry, we use a BoxGeometry
  // and rely on the stones to cover edges, or a simple Extrude for the profile.
  // Let's use a BoxGeometry for the main structural block.
  const barGeom = new THREE.BoxGeometry(barLength, barHeight, barWidth);
  const bar = new THREE.Mesh(barGeom, goldMat);
  // Slight convex curvature simulation by scaling Y slightly or just keeping it flat for simplicity
  // The reference shows a slight arch. We can approximate with a scaled cylinder or just flat box.
  // Flat box is safer for stone placement.
  root.add(bar);

  // --- 2. Large Emeralds (Baguette Cut) ---
  const emeraldLength = 0.32;
  const emeraldWidth = 0.14;
  const emeraldDepth = 0.04;
  const emeraldGeom = new THREE.BoxGeometry(emeraldLength, emeraldDepth, emeraldWidth);
  
  // Left Emerald
  const emeraldLeft = new THREE.Mesh(emeraldGeom, emeraldMat);
  emeraldLeft.position.set(-0.20, barHeight / 2 + emeraldDepth / 2 - 0.005, 0);
  root.add(emeraldLeft);

  // Right Emerald
  const emeraldRight = new THREE.Mesh(emeraldGeom, emeraldMat);
  emeraldRight.position.set(0.20, barHeight / 2 + emeraldDepth / 2 - 0.005, 0);
  root.add(emeraldRight);

  // --- 3. Central Ruby ---
  const rubyRadius = 0.055;
  const rubyGeom = new THREE.SphereGeometry(rubyRadius, 16, 16);
  const ruby = new THREE.Mesh(rubyGeom, rubyMat);
  ruby.position.set(0, barHeight / 2 + rubyRadius * 0.8, 0);
  root.add(ruby);

  // Ruby Bezel (Gold ring around ruby)
  const bezelGeom = new THREE.TorusGeometry(rubyRadius + 0.015, 0.012, 8, 24);
  const bezel = new THREE.Mesh(bezelGeom, goldMat);
  bezel.rotation.x = Math.PI / 2;
  bezel.position.copy(ruby.position);
  bezel.position.y -= 0.01; // Sit slightly lower
  root.add(bezel);

  // --- 4. Border Stones (Small Emeralds) ---
  const smallStoneGeom = new THREE.SphereGeometry(smallStoneRadius, 8, 8);
  const borderGroup = new THREE.Group();
  
  // Calculate perimeter positions
  // Top and Bottom rows (along Z axis, constant X)
  // Left and Right rows (along X axis, constant Z)
  // Actually, looking at image, they frame the rectangle.
  
  const positions = [];
  const halfL = barLength / 2 - stoneBorderOffset;
  const halfW = barWidth / 2 - stoneBorderOffset;
  const spacing = smallStoneRadius * 2.1;

  // Top edge (positive Z)
  for (let x = -halfL; x <= halfL; x += spacing) {
    positions.push(new THREE.Vector3(x, 0, halfW));
  }
  // Bottom edge (negative Z)
  for (let x = -halfL; x <= halfL; x += spacing) {
    positions.push(new THREE.Vector3(x, 0, -halfW));
  }
  // Left edge (negative X) - avoid corners duplicate
  for (let z = -halfW + spacing; z < halfW; z += spacing) {
    positions.push(new THREE.Vector3(-halfL, 0, z));
  }
  // Right edge (positive X) - avoid corners duplicate
  for (let z = -halfW + spacing; z < halfW; z += spacing) {
    positions.push(new THREE.Vector3(halfL, 0, z));
  }

  // Filter out positions too close to center ruby or large emeralds if needed, 
  // but simple perimeter logic usually works.
  // Let's refine: The border goes around the large emeralds too.
  // The large emeralds are in the middle. The border is on the gold frame.
  
  // Clear previous naive loop and do specific placement based on visual reference:
  // The border stones are on the gold rim surrounding the two emeralds and the ruby.
  borderGroup.clear();
  
  function addBorderStone(x, z) {
    const stone = new THREE.Mesh(smallStoneGeom, emeraldMat);
    stone.position.set(x, barHeight / 2 + smallStoneRadius * 0.8, z);
    borderGroup.add(stone);
  }

  // Top Row (Z = halfW)
  for (let i = 0; i < 11; i++) {
    const x = -halfL + (i * (barLength - 0.04) / 10);
    // Skip center area roughly where ruby is
    if (Math.abs(x) < 0.08) continue; 
    addBorderStone(x, halfW);
  }
  // Bottom Row (Z = -halfW)
  for (let i = 0; i < 11; i++) {
    const x = -halfL + (i * (barLength - 0.04) / 10);
    if (Math.abs(x) < 0.08) continue;
    addBorderStone(x, -halfW);
  }
  // Left Short Side
  for (let i = 1; i < 4; i++) {
     const z = -halfW + (i * barWidth / 4);
     addBorderStone(-halfL, z);
  }
  // Right Short Side
  for (let i = 1; i < 4; i++) {
     const z = -halfW + (i * barWidth / 4);
     addBorderStone(halfL, z);
  }

  root.add(borderGroup);

  // --- 5. Clip Mechanism (Back) ---
  // A curved gold piece underneath.
  // Use a Torus segment or Tube.
  const clipRadius = barLength * 0.35;
  const clipTubeRadius = 0.025;
  const clipGeom = new THREE.TorusGeometry(clipRadius, clipTubeRadius, 8, 20, Math.PI * 0.6);
  const clip = new THREE.Mesh(clipGeom, goldMat);
  clip.rotation.x = Math.PI / 2; // Lay flat in XZ
  clip.rotation.y = Math.PI / 2; // Orient along length
  clip.position.set(0, -barHeight / 2 - clipTubeRadius, 0);
  // Shift back so it's centered under the bar
  clip.position.z = -0.05; 
  root.add(clip);
  
  // Clip base plate (flat part attaching to bar)
  const clipBaseGeom = new THREE.BoxGeometry(barLength * 0.6, 0.01, barWidth * 0.6);
  const clipBase = new THREE.Mesh(clipBaseGeom, goldMat);
  clipBase.position.set(0, -barHeight / 2 - 0.005, 0);
  root.add(clipBase);

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