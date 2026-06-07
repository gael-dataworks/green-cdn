export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Wood: Warm brown, satin finish.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B,
    metalness: 0.1,
    roughness: 0.65,
  });

  // Dark Wood: For recessed areas behind the carving to simulate depth.
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x3E2723,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Hinge Metal: Dark bronze/iron.
  const hingeMat = new THREE.MeshStandardMaterial({
    color: 0x2A2A2A,
    metalness: 0.4,
    roughness: 0.6,
  });

  // --- Dimensions ---
  const size = 1.0;
  const half = size / 2;
  const frameThick = 0.08;
  const panelDepth = 0.04;
  
  // --- Helper: Create a carved filigree panel ---
  function createFiligreePanel(w, h, isTop = false) {
    const panelGroup = new THREE.Group();

    // 1. The Recessed Background (Shadow)
    const bgGeom = new THREE.BoxGeometry(w - frameThick * 2.2, h - frameThick * 2.2, 0.02);
    const bg = new THREE.Mesh(bgGeom, darkWoodMat);
    bg.position.z = -0.02; // Push back slightly
    panelGroup.add(bg);

    // 2. The Frame Border
    const frameMat = woodMat;
    const stripW = frameThick;
    const stripD = 0.05; // Thickness of the carving
    
    // Top/Bottom strips
    const hStripGeom = new THREE.BoxGeometry(w, stripW, stripD);
    const topFrame = new THREE.Mesh(hStripGeom, frameMat);
    topFrame.position.y = h / 2 - stripW / 2;
    panelGroup.add(topFrame);
    
    const botFrame = new THREE.Mesh(hStripGeom, frameMat);
    botFrame.position.y = -h / 2 + stripW / 2;
    panelGroup.add(botFrame);

    // Left/Right strips
    const vStripGeom = new THREE.BoxGeometry(stripW, h - stripW * 2, stripD);
    const leftFrame = new THREE.Mesh(vStripGeom, frameMat);
    leftFrame.position.x = -w / 2 + stripW / 2;
    panelGroup.add(leftFrame);

    const rightFrame = new THREE.Mesh(vStripGeom, frameMat);
    rightFrame.position.x = w / 2 - stripW / 2;
    panelGroup.add(rightFrame);

    // 3. The Filigree (Procedural Swirls using TubeGeometry)
    // We create a symmetrical pattern of curves.
    const tubeRadius = 0.015;
    const segments = 16;
    
    // Function to add a curve
    function addCurve(points) {
      const curve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.TubeGeometry(curve, segments, tubeRadius, 8, false);
      const mesh = new THREE.Mesh(geom, frameMat);
      // Shift forward slightly to sit on top of background
      mesh.position.z = 0.01; 
      panelGroup.add(mesh);
    }

    // Center Motif (Diamond/Cross shape)
    const centerSize = Math.min(w, h) * 0.25;
    const cPoints = [
      new THREE.Vector3(0, centerSize, 0),
      new THREE.Vector3(centerSize * 0.5, 0, 0),
      new THREE.Vector3(0, -centerSize, 0),
      new THREE.Vector3(-centerSize * 0.5, 0, 0),
      new THREE.Vector3(0, centerSize, 0)
    ];
    addCurve(cPoints);
    
    // Inner Diamond
    const innerSize = centerSize * 0.6;
    const iPoints = [
      new THREE.Vector3(0, innerSize, 0.005), // Slightly raised
      new THREE.Vector3(innerSize, 0, 0.005),
      new THREE.Vector3(0, -innerSize, 0.005),
      new THREE.Vector3(-innerSize, 0, 0.005),
      new THREE.Vector3(0, innerSize, 0.005)
    ];
    addCurve(iPoints);

    // Corner Scrolls (Approximated with curves)
    // We only define one quadrant and could mirror, but for simplicity 
    // and robustness in a single function, we'll define 4 corner sets roughly.
    const inset = Math.min(w, h) * 0.35;
    
    // Top-Right Scroll
    addCurve([
      new THREE.Vector3(inset, inset, 0),
      new THREE.Vector3(inset + 0.05, inset - 0.05, 0),
      new THREE.Vector3(inset + 0.02, inset - 0.1, 0),
      new THREE.Vector3(inset - 0.05, inset - 0.05, 0)
    ]);

    // Top-Left Scroll
    addCurve([
      new THREE.Vector3(-inset, inset, 0),
      new THREE.Vector3(-inset - 0.05, inset - 0.05, 0),
      new THREE.Vector3(-inset - 0.02, inset - 0.1, 0),
      new THREE.Vector3(-inset + 0.05, inset - 0.05, 0)
    ]);

    // Bottom-Right Scroll
    addCurve([
      new THREE.Vector3(inset, -inset, 0),
      new THREE.Vector3(inset + 0.05, -inset + 0.05, 0),
      new THREE.Vector3(inset + 0.02, -inset + 0.1, 0),
      new THREE.Vector3(inset - 0.05, -inset + 0.05, 0)
    ]);

    // Bottom-Left Scroll
    addCurve([
      new THREE.Vector3(-inset, -inset, 0),
      new THREE.Vector3(-inset - 0.05, -inset + 0.05, 0),
      new THREE.Vector3(-inset - 0.02, -inset + 0.1, 0),
      new THREE.Vector3(-inset + 0.05, -inset + 0.05, 0)
    ]);

    return panelGroup;
  }

  // --- Main Box Structure ---

  // 1. Base Body (Solid block to hold everything)
  // We make it slightly smaller than total size to allow frame to protrude
  const baseH = size * 0.55;
  const baseGeom = new THREE.BoxGeometry(size - 0.02, baseH, size - 0.02);
  const baseMesh = new THREE.Mesh(baseGeom, woodMat);
  baseMesh.position.y = -size * 0.25; // Sit lower
  root.add(baseMesh);

  // 2. Lid Body
  const lidH = size * 0.45;
  const lidGeom = new THREE.BoxGeometry(size - 0.02, lidH, size - 0.02);
  const lidMesh = new THREE.Mesh(lidGeom, woodMat);
  lidMesh.position.y = size * 0.25; // Sit on top
  root.add(lidMesh);

  // 3. Corner Posts (Visual reinforcement of the cube shape)
  const postW = 0.12;
  const postGeom = new THREE.BoxGeometry(postW, size, postW);
  const postPositions = [
    [-size/2 + postW/2, 0, -size/2 + postW/2], // Back Left
    [ size/2 - postW/2, 0, -size/2 + postW/2], // Back Right
    [-size/2 + postW/2, 0,  size/2 - postW/2], // Front Left
    [ size/2 - postW/2, 0,  size/2 - postW/2]  // Front Right
  ];
  
  for (const pos of postPositions) {
    const post = new THREE.Mesh(postGeom, woodMat);
    post.position.set(...pos);
    root.add(post);
  }

  // 4. Panels (Front, Right, Left, Top)
  const panelW = size - postW * 2 + 0.02; // Fit between posts
  const panelH = baseH - 0.05; // Base panel height
  const lidPanelH = lidH - 0.05; // Lid panel height

  // Front Base Panel
  const frontPanel = createFiligreePanel(panelW, panelH);
  frontPanel.position.set(0, -size * 0.25, size / 2 - 0.02);
  root.add(frontPanel);

  // Right Base Panel (Rotate 90 deg Y)
  const rightPanel = createFiligreePanel(panelW, panelH);
  rightPanel.rotation.y = Math.PI / 2;
  rightPanel.position.set(size / 2 - 0.02, -size * 0.25, 0);
  root.add(rightPanel);

  // Left Base Panel (Rotate -90 deg Y)
  const leftPanel = createFiligreePanel(panelW, panelH);
  leftPanel.rotation.y = -Math.PI / 2;
  leftPanel.position.set(-size / 2 + 0.02, -size * 0.25, 0);
  root.add(leftPanel);

  // Top Lid Panel (Rotate -90 deg X to face up)
  const topPanel = createFiligreePanel(panelW, panelW, true);
  topPanel.rotation.x = -Math.PI / 2;
  topPanel.position.set(0, size / 2 - 0.02, 0);
  root.add(topPanel);

  // 5. Hinges (On the Front-Left corner as per image)
  // Image shows hinges on the vertical edge between Front and Left faces.
  const hingeW = 0.04;
  const hingeH = 0.06;
  const hingeD = 0.03;
  const hingeGeom = new THREE.BoxGeometry(hingeW, hingeH, hingeD);
  
  // Hinge 1 (Top)
  const hinge1 = new THREE.Mesh(hingeGeom, hingeMat);
  hinge1.position.set(-size/2 + 0.02, size * 0.15, size/2 - 0.02);
  // Orient to wrap the corner slightly
  hinge1.rotation.y = Math.PI / 4; 
  root.add(hinge1);

  // Hinge 2 (Bottom)
  const hinge2 = new THREE.Mesh(hingeGeom, hingeMat);
  hinge2.position.set(-size/2 + 0.02, -size * 0.15, size/2 - 0.02);
  hinge2.rotation.y = Math.PI / 4;
  root.add(hinge2);

  // 6. Lock Hole (Small dark circle on front face, near top of base)
  const lockGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16);
  const lock = new THREE.Mesh(lockGeom, darkWoodMat);
  lock.rotation.x = Math.PI / 2;
  lock.position.set(0, size * 0.22, size / 2 + 0.01);
  root.add(lock);


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