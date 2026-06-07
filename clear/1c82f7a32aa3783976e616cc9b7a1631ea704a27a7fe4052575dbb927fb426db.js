export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Wood: Medium brown, satin finish
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Dark Wood: For recessed backgrounds and hinges
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x3E2723,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Metal: Dark iron for hinges
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.6,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const boxSize = 0.5;
  const baseHeight = 0.32;
  const lidHeight = 0.18;
  const totalHeight = baseHeight + lidHeight;
  const frameThickness = 0.04;
  const panelSize = boxSize - 2 * frameThickness; // Size of the inner decorative area
  const panelDepth = 0.015; // How deep the pattern sits

  // --- Base Body ---
  // Main container box
  const baseGeom = new THREE.BoxGeometry(boxSize, baseHeight, boxSize);
  const baseBox = new THREE.Mesh(baseGeom, woodMat);
  baseBox.position.y = -totalHeight / 2 + baseHeight / 2;
  root.add(baseBox);

  // --- Lid Body ---
  // Slightly larger to sit on top
  const lidGeom = new THREE.BoxGeometry(boxSize + 0.01, lidHeight, boxSize + 0.01);
  const lidBox = new THREE.Mesh(lidGeom, woodMat);
  lidBox.position.y = -totalHeight / 2 + baseHeight + lidHeight / 2;
  root.add(lidBox);

  // --- Hinges ---
  // Two hinges on the left side (negative X)
  const hingeGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 12);
  hingeGeom.rotateZ(Math.PI / 2); // Align cylinder along X axis? No, hinges are vertical cylinders usually, or horizontal pins.
  // Looking at image: Hinges are on the vertical edge. The pin is vertical (Y-axis).
  // So standard Cylinder (Y-up) is correct.
  const hingeGeomVertical = new THREE.CylinderGeometry(0.012, 0.012, 0.05, 12);
  
  const hinge1 = new THREE.Mesh(hingeGeomVertical, metalMat);
  hinge1.position.set(-boxSize / 2 - 0.005, -totalHeight / 2 + baseHeight - 0.04, 0);
  root.add(hinge1);

  const hinge2 = new THREE.Mesh(hingeGeomVertical, metalMat);
  hinge2.position.set(-boxSize / 2 - 0.005, -totalHeight / 2 + baseHeight - 0.12, 0);
  root.add(hinge2);

  // --- Latch Hole ---
  // Small dark circle on the front face, near the seam
  const latchGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.01, 16);
  latchGeom.rotateX(Math.PI / 2); // Face forward (Z)
  const latch = new THREE.Mesh(latchGeom, darkWoodMat);
  latch.position.set(0, -totalHeight / 2 + baseHeight - 0.02, boxSize / 2 + 0.005);
  root.add(latch);

  // --- Decorative Panel Generator ---
  // Creates the intricate fretwork pattern for one face
  function createDecorativePanel() {
    const panelGroup = new THREE.Group();

    // 1. Background Plate (Dark recessed area)
    const bgGeom = new THREE.BoxGeometry(panelSize, panelSize, 0.01);
    const bgMesh = new THREE.Mesh(bgGeom, darkWoodMat);
    bgMesh.position.z = -0.01; // Push back slightly
    panelGroup.add(bgMesh);

    // 2. Fretwork Pattern (Lighter wood on top)
    const fretworkGroup = new THREE.Group();

    // Helper to add a torus segment (curved bar)
    function addTorusSegment(r, tube, arc, rotX, rotY, rotZ, x, y, z) {
      const geom = new THREE.TorusGeometry(r, tube, 8, 16, arc);
      const mesh = new THREE.Mesh(geom, woodMat);
      mesh.rotation.set(rotX, rotY, rotZ);
      mesh.position.set(x, y, z);
      fretworkGroup.add(mesh);
    }

    // Helper to add a straight bar
    function addBar(w, h, d, x, y, z, rotZ = 0) {
      const geom = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geom, woodMat);
      mesh.position.set(x, y, z);
      mesh.rotation.z = rotZ;
      fretworkGroup.add(mesh);
    }

    // Center Diamond Motif
    // 4 bars meeting in the center, rotated 45 degrees
    const barLen = panelSize * 0.35;
    const barW = 0.015;
    const offset = barLen / 2 * 0.8; // Overlap slightly
    
    // We'll make a diamond shape using 4 rotated boxes
    // Top-Left to Center
    addBar(barLen, barW, 0.02, -offset/1.4, offset/1.4, 0.02, -Math.PI / 4);
    // Top-Right to Center
    addBar(barLen, barW, 0.02, offset/1.4, offset/1.4, 0.02, Math.PI / 4);
    // Bottom-Left to Center
    addBar(barLen, barW, 0.02, -offset/1.4, -offset/1.4, 0.02, Math.PI / 4);
    // Bottom-Right to Center
    addBar(barLen, barW, 0.02, offset/1.4, -offset/1.4, 0.02, -Math.PI / 4);

    // Corner Scrolls (Approximated with Torus segments)
    const cornerOffset = panelSize / 2 - 0.06;
    const scrollR = 0.05;
    const scrollTube = 0.012;

    // Top-Left Corner
    addTorusSegment(scrollR, scrollTube, Math.PI / 2, 0, 0, 0, -cornerOffset, cornerOffset, 0.02);
    addTorusSegment(scrollR * 0.6, scrollTube, Math.PI / 2, 0, 0, 0, -cornerOffset + 0.02, cornerOffset - 0.02, 0.02);
    
    // Top-Right Corner
    addTorusSegment(scrollR, scrollTube, Math.PI / 2, 0, 0, Math.PI / 2, cornerOffset, cornerOffset, 0.02);
    addTorusSegment(scrollR * 0.6, scrollTube, Math.PI / 2, 0, 0, Math.PI / 2, cornerOffset - 0.02, cornerOffset - 0.02, 0.02);

    // Bottom-Left Corner
    addTorusSegment(scrollR, scrollTube, Math.PI / 2, 0, 0, -Math.PI / 2, -cornerOffset, -cornerOffset, 0.02);
    addTorusSegment(scrollR * 0.6, scrollTube, Math.PI / 2, 0, 0, -Math.PI / 2, -cornerOffset + 0.02, -cornerOffset + 0.02, 0.02);

    // Bottom-Right Corner
    addTorusSegment(scrollR, scrollTube, Math.PI / 2, 0, 0, Math.PI, cornerOffset, -cornerOffset, 0.02);
    addTorusSegment(scrollR * 0.6, scrollTube, Math.PI / 2, 0, 0, Math.PI, cornerOffset - 0.02, -cornerOffset + 0.02, 0.02);

    // Connecting straight bars along the frame inner edge
    const frameInner = panelSize / 2 - 0.02;
    addBar(panelSize - 0.1, barW, 0.02, 0, frameInner, 0.02); // Top
    addBar(panelSize - 0.1, barW, 0.02, 0, -frameInner, 0.02); // Bottom
    addBar(barW, panelSize - 0.1, 0.02, frameInner, 0, 0.02, Math.PI/2); // Right
    addBar(barW, panelSize - 0.1, 0.02, -frameInner, 0, 0.02, Math.PI/2); // Left

    panelGroup.add(fretworkGroup);
    return panelGroup;
  }

  const panelTemplate = createDecorativePanel();

  // --- Place Panels on Faces ---
  
  // Function to clone and position a panel
  function placePanel(x, y, z, rotX, rotY, rotZ) {
    const panel = panelTemplate.clone();
    panel.position.set(x, y, z);
    panel.rotation.set(rotX, rotY, rotZ);
    root.add(panel);
  }

  const zFront = boxSize / 2 + 0.005;
  const zBack = -boxSize / 2 - 0.005;
  const yTop = -totalHeight / 2 + baseHeight + lidHeight - 0.02; // On lid top
  const yBaseFront = -totalHeight / 2 + baseHeight / 2; // On base front
  const yBaseBack = -totalHeight / 2 + baseHeight / 2; // On base back

  // Front Face (Base + Lid split visually, but we place one big panel or two?)
  // The image shows the pattern continues across the seam. 
  // To simplify and ensure alignment, we place one large panel on the front and back 
  // that spans both base and lid, slightly floating in front of the geometry.
  
  // Front Panel
  placePanel(0, -totalHeight / 2 + totalHeight / 2, zFront, 0, 0, 0);
  
  // Back Panel
  placePanel(0, -totalHeight / 2 + totalHeight / 2, zBack, 0, Math.PI, 0);

  // Left Panel (Hinge side) - Need to avoid hinges. 
  // The image shows pattern on the side too. We'll place it, hinges will clip or sit on top.
  // Actually hinges are on the edge, panel is inset. It should be fine.
  const xLeft = -boxSize / 2 - 0.005;
  placePanel(xLeft, -totalHeight / 2 + totalHeight / 2, 0, 0, -Math.PI / 2, 0);

  // Right Panel
  const xRight = boxSize / 2 + 0.005;
  placePanel(xRight, -totalHeight / 2 + totalHeight / 2, 0, 0, Math.PI / 2, 0);

  // Top Panel (Lid)
  // The top panel should be smaller or same size? Image shows it fills the lid top.
  // Our template is sized for the side faces (height ~0.5). The lid top is 0.5x0.5.
  // So the same template works perfectly.
  placePanel(0, yTop, 0, -Math.PI / 2, 0, 0);

  // Bottom Panel (Optional, usually solid, but let's add one for completeness if viewed from below)
  // Actually, boxes usually have a solid bottom. Let's skip or make solid.
  // Let's skip to save vertices and because it's not visible in reference.

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