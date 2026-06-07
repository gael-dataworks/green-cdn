export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark green leather: matte, soft highlights, no metalness.
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a4d3a,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Paper pages: cream/off-white, very matte.
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xf0e6d2,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Gold tooling: moderate metalness (capped at 0.6), slight emissive to pop.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd4af37,
    emissiveIntensity: 0.3,
  });

  // --- Dimensions (local units before normalization) ---
  const bookH = 1.0;      // Height (Y)
  const bookW = 0.70;     // Width (Z)
  const bookD = 0.22;     // Thickness (X)
  const spineR = 0.04;    // Radius of the rounded spine
  const coverThick = 0.015; // Thickness of the leather cover shell

  // --- 1. Leather Cover Body (Extruded Profile) ---
  // Profile in XY plane: Height (Y) vs Thickness (X).
  // Spine is on the left (-X), Fore-edge on the right (+X).
  const coverShape = new THREE.Shape();
  const halfH = bookH / 2;
  const flatSpineX = -bookD / 2 + spineR;
  const foreEdgeX = bookD / 2;

  // Start at bottom fore-edge
  coverShape.moveTo(foreEdgeX, -halfH);
  // Bottom edge to spine start
  coverShape.lineTo(flatSpineX, -halfH);
  // Rounded spine (quarter circle arc approximated by bezier or lineTo for simplicity in extrude)
  // Using a quadratic curve for the spine roundness
  coverShape.quadraticCurveTo(flatSpineX, 0, flatSpineX, halfH); 
  // Actually, let's do a proper arc approximation or just lineTo for the vertical spine part if radius is small.
  // Let's use lineTo for the vertical spine part and round the corners manually if needed, 
  // but the reference shows a distinct rounded spine.
  // Better profile:
  coverShape.moveTo(foreEdgeX, -halfH);
  coverShape.lineTo(flatSpineX, -halfH);
  // Spine curve: from bottom-left to top-left
  coverShape.quadraticCurveTo(flatSpineX - spineR, 0, flatSpineX, halfH);
  // Top edge
  coverShape.lineTo(foreEdgeX, halfH);
  // Close
  coverShape.lineTo(foreEdgeX, -halfH);

  const coverGeom = new THREE.ExtrudeGeometry(coverShape, {
    depth: bookW,
    steps: 1,
    bevelEnabled: false,
  });
  // Center the geometry
  coverGeom.center();
  const cover = new THREE.Mesh(coverGeom, leatherMat);
  root.add(cover);

  // --- 2. Paper Pages Block ---
  // Slightly smaller than the cover, shifted towards the fore-edge.
  const pagesW = bookW - 0.04;
  const pagesH = bookH - 0.04;
  const pagesD = bookD - 0.03; // Thinner than cover
  const pagesGeom = new THREE.BoxGeometry(pagesD, pagesH, pagesW);
  const pages = new THREE.Mesh(pagesGeom, paperMat);
  // Position pages: shift slightly to the right (fore-edge side) so spine leather is visible
  pages.position.set(0.02, 0, 0);
  root.add(pages);

  // --- 3. Gold Tooling Helpers ---
  
  // Helper to add a thin gold strip
  function addGoldStrip(w, h, d, x, y, z, rotX, rotY, rotZ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), goldMat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rotX, rotY, rotZ);
    root.add(mesh);
  }

  // Helper to add a gold corner motif (simplified floral cluster)
  function addGoldCorner(cornerX, cornerY, cornerZ, flipX, flipY) {
    const group = new THREE.Group();
    group.position.set(cornerX, cornerY, cornerZ);
    if (flipX) group.scale.x = -1;
    if (flipY) group.scale.y = -1;

    // Central flower
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), goldMat);
    group.add(center);

    // Petals/Leaves (small flattened spheres or boxes)
    const leafGeom = new THREE.BoxGeometry(0.025, 0.005, 0.01);
    const positions = [
      [0, 0.025, 0, 0], [0, -0.025, 0, 0],
      [0.025, 0, 0, Math.PI/2], [-0.025, 0, 0, Math.PI/2]
    ];
    for (const [lx, ly, lz, lr] of positions) {
      const leaf = new THREE.Mesh(leafGeom, goldMat);
      leaf.position.set(lx, ly, lz);
      leaf.rotation.z = lr;
      group.add(leaf);
    }
    
    // Outer flourishes
    const flourishGeom = new THREE.BoxGeometry(0.035, 0.004, 0.01);
    const f1 = new THREE.Mesh(flourishGeom, goldMat);
    f1.position.set(0.02, 0.02, 0);
    f1.rotation.z = Math.PI / 4;
    group.add(f1);
    
    const f2 = new THREE.Mesh(flourishGeom, goldMat);
    f2.position.set(-0.02, 0.02, 0);
    f2.rotation.z = -Math.PI / 4;
    group.add(f2);

    root.add(group);
  }

  // --- 4. Front Cover Gold Frame ---
  const frameOffset = 0.04;
  const frameZ = bookW / 2 + 0.002; // Slightly in front of cover
  const innerW = bookW - frameOffset * 2;
  const innerH = bookH - frameOffset * 2;
  
  // Top & Bottom bars
  addGoldStrip(innerW, 0.004, 0.002, 0, innerH / 2, frameZ, 0, 0, 0);
  addGoldStrip(innerW, 0.004, 0.002, 0, -innerH / 2, frameZ, 0, 0, 0);
  // Left & Right bars
  addGoldStrip(0.004, innerH, 0.002, innerW / 2, 0, frameZ, 0, 0, 0);
  addGoldStrip(0.004, innerH, 0.002, -innerW / 2, 0, frameZ, 0, 0, 0);

  // --- 5. Front Cover Corner Motifs ---
  // Positions relative to center, on the front face (Z+)
  const cornerZ = bookW / 2 + 0.003;
  const cornerOffset = 0.06;
  addGoldCorner(innerW/2 - cornerOffset, innerH/2 - cornerOffset, cornerZ, false, false); // Top Right
  addGoldCorner(-innerW/2 + cornerOffset, innerH/2 - cornerOffset, cornerZ, true, false);  // Top Left
  addGoldCorner(innerW/2 - cornerOffset, -innerH/2 + cornerOffset, cornerZ, false, true);  // Bottom Right
  addGoldCorner(-innerW/2 + cornerOffset, -innerH/2 + cornerOffset, cornerZ, true, true);  // Bottom Left

  // Small center motifs (simplified)
  const smallLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.004, 0.002), goldMat);
  smallLeaf.rotation.z = Math.PI / 4;
  smallLeaf.position.set(0, innerH/2 - 0.15, cornerZ);
  root.add(smallLeaf);
  
  const smallLeaf2 = smallLeaf.clone();
  smallLeaf2.position.set(0, -innerH/2 + 0.15, cornerZ);
  smallLeaf2.rotation.z = -Math.PI / 4;
  root.add(smallLeaf2);

  // --- 6. Spine Details ---
  // Spine is on the -X side (after centering extrude, spine is roughly at -bookD/2)
  // We need to find the exact spine surface position. 
  // The extrude was centered, so the spine curve is at local X = -bookD/2.
  const spineX = -bookD / 2 - 0.002; // Slightly offset from surface

  // Spine Bands (Horizontal lines)
  const bandW = 0.004;
  const bandH = bookW - 0.04;
  addGoldStrip(bandW, bandH, 0.002, spineX, bookH/2 - 0.15, 0, 0, 0, Math.PI/2); // Top band
  addGoldStrip(bandW, bandH, 0.002, spineX, -bookH/2 + 0.15, 0, 0, 0, Math.PI/2); // Bottom band
  
  // Spine Title "Daniel" approximation (3 gold bars)
  const titleY = 0;
  const titleX = spineX - 0.002;
  addGoldStrip(0.015, 0.003, 0.002, titleX, titleY + 0.015, 0, 0, 0, Math.PI/2);
  addGoldStrip(0.015, 0.003, 0.002, titleX, titleY, 0, 0, 0, Math.PI/2);
  addGoldStrip(0.015, 0.003, 0.002, titleX, titleY - 0.015, 0, 0, 0, Math.PI/2);

  // Spine Corner Flourishes (Top and Bottom centers of spine)
  const spineFlowerTop = new THREE.Group();
  spineFlowerTop.position.set(spineX, bookH/2 - 0.06, 0);
  spineFlowerTop.rotation.y = Math.PI / 2; // Face outwards
  const sfCenter = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), goldMat);
  spineFlowerTop.add(sfCenter);
  const sfLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.003, 0.002), goldMat);
  sfLeaf.rotation.z = Math.PI / 2;
  spineFlowerTop.add(sfLeaf);
  root.add(spineFlowerTop);

  const spineFlowerBot = spineFlowerTop.clone();
  spineFlowerBot.position.set(spineX, -bookH/2 + 0.06, 0);
  root.add(spineFlowerBot);

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