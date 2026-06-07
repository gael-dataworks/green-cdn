export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Polished metal. Rules: metalness <= 0.6, add emissive for brightness.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xD4AF37,
    emissiveIntensity: 0.35,
  });

  // Emerald: Green physical material with transmission for gem look.
  const emeraldMat = new THREE.MeshPhysicalMaterial({
    color: 0x009944,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.7,
    ior: 1.57,
    transparent: true,
  });

  // Ruby: Red physical material.
  const rubyMat = new THREE.MeshPhysicalMaterial({
    color: 0xCC0000,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.54,
    transparent: true,
  });

  // --- Dimensions ---
  const totalLength = 1.0;
  const totalWidth = 0.34;
  const baseThickness = 0.04;
  const stoneHeight = 0.05;
  
  const largeStoneLength = 0.32;
  const largeStoneWidth = 0.11;
  const centerRubyRadius = 0.045;
  const smallStoneRadius = 0.022;
  const smallStoneSpacing = 0.048;

  // --- Base Plate ---
  // Rounded rectangle approximation using BoxGeometry with slight scale
  const baseGeom = new THREE.BoxGeometry(totalLength, baseThickness, totalWidth);
  const gold_base = new THREE.Mesh(baseGeom, goldMat);
  // Slightly round the corners by scaling or just keep it boxy for low-poly style
  // To make it look like a brooch, let's add a subtle rim on the base
  gold_base.position.y = 0;
  root.add(gold_base);

  // Base Rim (slightly smaller box on top to create a ledge)
  const rimGeom = new THREE.BoxGeometry(totalLength * 0.96, baseThickness * 0.8, totalWidth * 0.96);
  const gold_rim_base = new THREE.Mesh(rimGeom, goldMat);
  gold_rim_base.position.y = baseThickness * 0.1;
  root.add(gold_rim_base);

  // --- Large Emeralds (Baguette Cut) ---
  // Using BoxGeometry scaled to look like a cut gem
  const largeEmeraldGeom = new THREE.BoxGeometry(largeStoneLength, stoneHeight, largeStoneWidth);
  
  const left_emerald = new THREE.Mesh(largeEmeraldGeom, emeraldMat);
  left_emerald.position.set(-largeStoneLength / 2 - 0.02, baseThickness + stoneHeight / 2, 0);
  root.add(left_emerald);

  const right_emerald = new THREE.Mesh(largeEmeraldGeom, emeraldMat);
  right_emerald.position.set(largeStoneLength / 2 + 0.02, baseThickness + stoneHeight / 2, 0);
  root.add(right_emerald);

  // Bezels for Large Emeralds (Thin gold frames)
  const bezelThickness = 0.008;
  const largeBezelGeom = new THREE.BoxGeometry(largeStoneLength + bezelThickness * 2, stoneHeight * 0.6, largeStoneWidth + bezelThickness * 2);
  // We need a frame, so we can use a thin box or just rely on the base. 
  // Let's add a thin gold plate underneath the stones to act as the setting floor
  const settingFloorGeom = new THREE.BoxGeometry(largeStoneLength + 0.01, 0.005, largeStoneWidth + 0.01);
  const left_setting = new THREE.Mesh(settingFloorGeom, goldMat);
  left_setting.position.copy(left_emerald.position);
  left_setting.position.y = baseThickness + 0.002;
  root.add(left_setting);

  const right_setting = new THREE.Mesh(settingFloorGeom, goldMat);
  right_setting.position.copy(right_emerald.position);
  right_setting.position.y = baseThickness + 0.002;
  root.add(right_setting);

  // --- Center Ruby ---
  const rubyGeom = new THREE.SphereGeometry(centerRubyRadius, 16, 16);
  const center_ruby = new THREE.Mesh(rubyGeom, rubyMat);
  center_ruby.position.set(0, baseThickness + centerRubyRadius, 0);
  root.add(center_ruby);

  // Ruby Bezel (Torus or Cylinder ring)
  const rubyBezelGeom = new THREE.TorusGeometry(centerRubyRadius + 0.008, 0.006, 8, 24);
  const ruby_bezel = new THREE.Mesh(rubyBezelGeom, goldMat);
  ruby_bezel.rotation.x = Math.PI / 2;
  ruby_bezel.position.set(0, baseThickness + 0.005, 0);
  root.add(ruby_bezel);

  // --- Small Emeralds (Pave Border) ---
  // We will use InstancedMesh for performance and cleanliness
  // Calculate positions for a border around the rectangle
  const smallEmeraldGeom = new THREE.SphereGeometry(smallStoneRadius, 8, 8);
  const smallEmeraldMat = emeraldMat; // Reuse material
  
  // Estimate count: Perimeter ~ 2*(1.0 + 0.34) = 2.68. Spacing 0.05 -> ~54 stones?
  // Image shows roughly 2 rows on sides, 1 on ends. Let's aim for ~40 instances.
  const maxSmallStones = 60;
  const smallEmeralds = new THREE.InstancedMesh(smallEmeraldGeom, smallEmeraldMat, maxSmallStones);
  
  const dummy = new THREE.Object3D();
  let index = 0;

  // Helper to add a small stone
  function addSmallStone(x, z) {
    if (index >= maxSmallStones) return;
    dummy.position.set(x, baseThickness + smallStoneRadius, z);
    dummy.updateMatrix();
    smallEmeralds.setMatrixAt(index, dummy.matrix);
    index++;
  }

  // Generate border positions
  // Top and Bottom rows
  const borderZ = totalWidth / 2 - 0.02;
  const startX = -totalLength / 2 + 0.03;
  const endX = totalLength / 2 - 0.03;
  const stepX = smallStoneSpacing;

  for (let x = startX; x <= endX; x += stepX) {
    // Skip the center area where the ruby is to avoid overlap, or let them cluster
    // The ruby is at 0. The emeralds are at +/- 0.17.
    // We want stones along the perimeter.
    addSmallStone(x, borderZ);
    addSmallStone(x, -borderZ);
  }

  // Left and Right ends (caps)
  const capZStart = -borderZ + stepX;
  const capZEnd = borderZ - stepX;
  for (let z = capZStart; z <= capZEnd; z += stepX) {
    addSmallStone(-totalLength / 2 + 0.02, z);
    addSmallStone(totalLength / 2 - 0.02, z);
  }

  // Inner border between large emeralds and ruby? 
  // The image shows small stones separating the large emeralds from the rim, 
  // and also between the emeralds and the ruby.
  // Let's add a row between the two large emeralds (above and below the ruby)
  const gapXStart = -largeStoneLength / 2 + 0.05;
  const gapXEnd = largeStoneLength / 2 - 0.05;
  // Only fill if not overlapping ruby
  // Ruby radius 0.045. 
  for (let x = gapXStart; x <= -0.06; x += stepX) {
     addSmallStone(x, 0.16); // Above gap
     addSmallStone(x, -0.16); // Below gap
  }
  for (let x = 0.06; x <= gapXEnd; x += stepX) {
     addSmallStone(x, 0.16);
     addSmallStone(x, -0.16);
  }
  
  // Add stones immediately next to the ruby on X axis
  addSmallStone(-0.06, 0);
  addSmallStone(0.06, 0);

  smallEmeralds.instanceMatrix.needsUpdate = true;
  root.add(smallEmeralds);

  // --- Small Stone Bezels (Instanced) ---
  // Tiny gold rings under each small stone
  const smallBezelGeom = new THREE.TorusGeometry(smallStoneRadius + 0.004, 0.003, 6, 12);
  const smallBezels = new THREE.InstancedMesh(smallBezelGeom, goldMat, index); // Use actual count
  const bezelDummy = new THREE.Object3D();
  
  // We need to re-iterate or store positions. To keep code compact, 
  // we can just re-calculate the loop logic or assume the matrix data is consistent.
  // Since I can't easily retrieve the matrix from InstancedMesh without overhead in this generator context,
  // I will re-run the logic briefly for the bezels using the same index count.
  
  let bIndex = 0;
  function addSmallBezel(x, z) {
    if (bIndex >= index) return;
    bezelDummy.position.set(x, baseThickness + 0.002, z);
    bezelDummy.rotation.x = Math.PI / 2;
    bezelDummy.updateMatrix();
    smallBezels.setMatrixAt(bIndex, bezelDummy.matrix);
    bIndex++;
  }

  // Repeat logic for bezels
  for (let x = startX; x <= endX; x += stepX) {
    addSmallBezel(x, borderZ);
    addSmallBezel(x, -borderZ);
  }
  for (let z = capZStart; z <= capZEnd; z += stepX) {
    addSmallBezel(-totalLength / 2 + 0.02, z);
    addSmallBezel(totalLength / 2 - 0.02, z);
  }
  for (let x = gapXStart; x <= -0.06; x += stepX) {
     addSmallBezel(x, 0.16);
     addSmallBezel(x, -0.16);
  }
  for (let x = 0.06; x <= gapXEnd; x += stepX) {
     addSmallBezel(x, 0.16);
     addSmallBezel(x, -0.16);
  }
  addSmallBezel(-0.06, 0);
  addSmallBezel(0.06, 0);

  smallBezels.instanceMatrix.needsUpdate = true;
  root.add(smallBezels);

  // --- Clip Mechanism (Back) ---
  // Simple hinge and pin approximation
  const clipBaseGeom = new THREE.BoxGeometry(0.6, 0.02, 0.05);
  const clip_base = new THREE.Mesh(clipBaseGeom, goldMat);
  clip_base.position.set(0, -baseThickness * 0.5, 0.1);
  clip_base.rotation.x = 0.2; // Angled slightly
  root.add(clip_base);

  const hingeGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 12);
  const hinge = new THREE.Mesh(hingeGeom, goldMat);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, -baseThickness * 0.5, -0.12);
  root.add(hinge);

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