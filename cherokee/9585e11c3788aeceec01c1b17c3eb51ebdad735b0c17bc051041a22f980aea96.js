export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Bright yellow metal. Using emissive to combat dim renderer.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xd4af37,
    emissiveIntensity: 0.4,
  });

  // Emerald: Green transparent gem.
  const emeraldMat = new THREE.MeshPhysicalMaterial({
    color: 0x008f56,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.57,
    transparent: true,
  });

  // Ruby: Red transparent gem.
  const rubyMat = new THREE.MeshPhysicalMaterial({
    color: 0xc41e3a,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.76,
    transparent: true,
  });

  // --- Geometries ---
  // Base Frame: Rounded rectangle extrusion
  const frameShape = new THREE.Shape();
  const frameW = 1.0;
  const frameH = 0.32;
  const frameRadius = 0.06;
  const frameDepth = 0.08;
  
  // Draw rounded rect
  frameShape.moveTo(-frameW / 2 + frameRadius, -frameH / 2);
  frameShape.lineTo(frameW / 2 - frameRadius, -frameH / 2);
  frameShape.quadraticCurveTo(frameW / 2, -frameH / 2, frameW / 2, -frameH / 2 + frameRadius);
  frameShape.lineTo(frameW / 2, frameH / 2 - frameRadius);
  frameShape.quadraticCurveTo(frameW / 2, frameH / 2, frameW / 2 - frameRadius, frameH / 2);
  frameShape.lineTo(-frameW / 2 + frameRadius, frameH / 2);
  frameShape.quadraticCurveTo(-frameW / 2, frameH / 2, -frameW / 2, frameH / 2 - frameRadius);
  frameShape.lineTo(-frameW / 2, -frameH / 2 + frameRadius);
  frameShape.quadraticCurveTo(-frameW / 2, -frameH / 2, -frameW / 2 + frameRadius, -frameH / 2);

  const frameGeom = new THREE.ExtrudeGeometry(frameShape, {
    depth: frameDepth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    steps: 1,
  });
  // Center the extrusion
  frameGeom.translate(0, 0, -frameDepth / 2);

  const gold_base = new THREE.Mesh(frameGeom, goldMat);
  root.add(gold_base);

  // Backing plate to close the back
  const backingGeom = new THREE.ShapeGeometry(frameShape);
  const gold_backing = new THREE.Mesh(backingGeom, goldMat);
  gold_backing.rotation.y = Math.PI; // Face backwards
  gold_backing.position.z = -frameDepth - 0.01;
  root.add(gold_backing);

  // Large Emeralds (Rectangular cut simulation using scaled Box)
  const emeraldW = 0.38;
  const emeraldH = 0.18;
  const emeraldD = 0.06;
  const largeEmeraldGeom = new THREE.BoxGeometry(emeraldW, emeraldH, emeraldD);
  
  const left_emerald = new THREE.Mesh(largeEmeraldGeom, emeraldMat);
  left_emerald.position.set(-0.25, 0, 0.02);
  root.add(left_emerald);

  const right_emerald = new THREE.Mesh(largeEmeraldGeom, emeraldMat);
  right_emerald.position.set(0.25, 0, 0.02);
  root.add(right_emerald);

  // Center Ruby Bezel (Torus for the rim)
  const rubyR = 0.07;
  const bezelGeom = new THREE.TorusGeometry(rubyR + 0.025, 0.015, 8, 24);
  const ruby_bezel = new THREE.Mesh(bezelGeom, goldMat);
  ruby_bezel.rotation.x = Math.PI / 2;
  ruby_bezel.position.set(0, 0, 0.03);
  root.add(ruby_bezel);

  // Center Ruby (Icosahedron for faceted look)
  const rubyGeom = new THREE.IcosahedronGeometry(rubyR, 0);
  const center_ruby = new THREE.Mesh(rubyGeom, rubyMat);
  center_ruby.position.set(0, 0, 0.04);
  center_ruby.scale.set(1, 1, 0.6); // Flatten slightly
  root.add(center_ruby);

  // Small Emeralds (Round cut simulation using Icosahedron)
  const smallEmeraldGeom = new THREE.IcosahedronGeometry(0.028, 0);
  const smallEmeraldCount = 28;
  const small_emeralds = new THREE.InstancedMesh(smallEmeraldGeom, emeraldMat, smallEmeraldCount);
  
  const dummy = new THREE.Object3D();
  let idx = 0;

  // Helper to place stone
  function placeSmallEmerald(x, y, z, rotX, rotY, rotZ) {
    if (idx >= smallEmeraldCount) return;
    dummy.position.set(x, y, z);
    dummy.rotation.set(rotX, rotY, rotZ);
    dummy.scale.set(1, 1, 0.6); // Flatten
    dummy.updateMatrix();
    small_emeralds.setMatrixAt(idx, dummy.matrix);
    idx++;
  }

  // Top Row (Y > 0)
  // Skip center area for ruby
  const topY = frameH / 2 - 0.06;
  const startX = -frameW / 2 + 0.08;
  const endX = frameW / 2 - 0.08;
  const stepX = 0.09;
  
  for (let x = startX; x <= endX; x += stepX) {
    // Skip center gap
    if (x > -0.12 && x < 0.12) continue;
    placeSmallEmerald(x, topY, 0.02, Math.PI / 2, 0, 0);
  }

  // Bottom Row (Y < 0)
  const bottomY = -frameH / 2 + 0.06;
  for (let x = startX; x <= endX; x += stepX) {
    if (x > -0.12 && x < 0.12) continue;
    placeSmallEmerald(x, bottomY, 0.02, Math.PI / 2, 0, 0);
  }

  // Left End Cap (X < 0)
  const leftEndX = -frameW / 2 + 0.08;
  for (let y = bottomY + stepX; y <= topY - stepX; y += stepX * 0.8) {
     // Fill the curve roughly
     if (idx >= smallEmeraldCount) break;
     // Simple vertical stack for the end
     placeSmallEmerald(leftEndX - 0.02, y, 0.02, Math.PI / 2, 0, 0);
  }
  // Corner stones left
  placeSmallEmerald(-frameW/2 + 0.04, topY + 0.02, 0.02, Math.PI/2, 0, 0);
  placeSmallEmerald(-frameW/2 + 0.04, bottomY - 0.02, 0.02, Math.PI/2, 0, 0);

  // Right End Cap (X > 0)
  const rightEndX = frameW / 2 - 0.08;
  for (let y = bottomY + stepX; y <= topY - stepX; y += stepX * 0.8) {
     if (idx >= smallEmeraldCount) break;
     placeSmallEmerald(rightEndX + 0.02, y, 0.02, Math.PI / 2, 0, 0);
  }
  // Corner stones right
  if (idx < smallEmeraldCount) placeSmallEmerald(frameW/2 - 0.04, topY + 0.02, 0.02, Math.PI/2, 0, 0);
  if (idx < smallEmeraldCount) placeSmallEmerald(frameW/2 - 0.04, bottomY - 0.02, 0.02, Math.PI/2, 0, 0);

  root.add(small_emeralds);

  // Clip mechanism (simple hint at the back)
  const clipGeom = new THREE.BoxGeometry(0.6, 0.04, 0.04);
  const clip = new THREE.Mesh(clipGeom, goldMat);
  clip.position.set(0, 0, -frameDepth - 0.04);
  root.add(clip);
  
  const clipHingeGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 12);
  const clipHinge = new THREE.Mesh(clipHingeGeom, goldMat);
  clipHinge.rotation.z = Math.PI / 2;
  clipHinge.position.set(0.35, 0, -frameDepth - 0.04);
  root.add(clipHinge);

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