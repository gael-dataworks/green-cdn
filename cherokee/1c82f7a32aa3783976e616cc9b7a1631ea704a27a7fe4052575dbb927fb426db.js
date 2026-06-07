export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Wood: Satin finish, moderate roughness, warm dark brown.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x6b4c35,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Darker wood for recessed areas/background of carvings.
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x3e2b22,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Metal hinges: Dark iron/bronze, low metalness to avoid blackness, slight emissive for visibility.
  const hingeMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.5,
    roughness: 0.4,
    emissive: 0x111111,
    emissiveIntensity: 0.2,
  });

  // --- Dimensions ---
  const boxSize = 0.5; // Overall width/depth
  const boxHeight = 0.4;
  const wallThick = 0.025;
  const panelDepth = 0.015; // Depth of the carved area
  
  // Lid dimensions
  const lidHeight = 0.12;
  const baseHeight = boxHeight - lidHeight;

  // --- Helper: Create Filigree Panel ---
  // Builds a decorative panel with a frame and a central scroll pattern.
  function createFiligreePanel(w, h, isLid = false) {
    const panelGroup = new THREE.Group();

    // 1. Backing Board (Recessed background)
    const backingGeom = new THREE.BoxGeometry(w - 0.04, h - 0.04, 0.01);
    const backing = new THREE.Mesh(backingGeom, darkWoodMat);
    backing.position.z = -panelDepth / 2 - 0.005;
    panelGroup.add(backing);

    // 2. Outer Frame (4 strips)
    const frameMat = woodMat;
    const stripW = 0.035;
    
    // Top/Bottom strips
    const hStripGeom = new THREE.BoxGeometry(w, stripW, 0.02);
    const topFrame = new THREE.Mesh(hStripGeom, frameMat);
    topFrame.position.y = (h - stripW) / 2;
    panelGroup.add(topFrame);
    
    const botFrame = new THREE.Mesh(hStripGeom, frameMat);
    botFrame.position.y = -(h - stripW) / 2;
    panelGroup.add(botFrame);

    // Left/Right strips
    const vStripH = h - 2 * stripW;
    const vStripGeom = new THREE.BoxGeometry(stripW, vStripH, 0.02);
    const leftFrame = new THREE.Mesh(vStripGeom, frameMat);
    leftFrame.position.x = -(w - stripW) / 2;
    panelGroup.add(leftFrame);

    const rightFrame = new THREE.Mesh(vStripGeom, frameMat);
    rightFrame.position.x = (w - stripW) / 2;
    panelGroup.add(rightFrame);

    // 3. Central Pattern (Procedural Scrollwork)
    const patternGroup = new THREE.Group();
    const patternMat = woodMat;
    const patternZ = 0.005; // Slightly raised from backing

    // Central Diamond/Star Motif
    const diamondSize = isLid ? 0.12 : 0.10;
    const diamondGeom = new THREE.CylinderGeometry(0, diamondSize/1.5, diamondSize, 4, 1);
    // Rotate to lie flat on XY (for front/back panels) or XZ (for lid)
    // Default cylinder is Y-up. We want it flat.
    // For side panels (XY plane face), we rotate X 90 deg.
    // For lid (XZ plane face), we keep Y up? No, lid face is XZ.
    // Let's assume this function is called for a face in the XY plane initially.
    
    // Actually, let's build the pattern using Tubes for organic look.
    const tubeRadius = 0.006;
    
    // Center Diamond made of 4 curved tubes
    const centerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -diamondSize/2, 0),
      new THREE.Vector3(-diamondSize/4, 0, 0),
      new THREE.Vector3(0, diamondSize/2, 0)
    ]);
    // We need 4 segments for a diamond.
    const makeCurve = (rot) => {
      const pts = [
        new THREE.Vector3(0, -diamondSize/2, 0),
        new THREE.Vector3(-diamondSize/4, 0, 0),
        new THREE.Vector3(0, diamondSize/2, 0)
      ];
      // Rotate points
      pts.forEach(p => p.applyAxisAngle(new THREE.Vector3(0,0,1), rot));
      return new THREE.CatmullRomCurve3(pts);
    };

    for(let i=0; i<4; i++) {
      const path = makeCurve(i * Math.PI / 2);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(path, 16, tubeRadius, 8, false), patternMat);
      tube.position.z = patternZ;
      patternGroup.add(tube);
    }

    // Corner Scrolls (Quarter Torus)
    const scrollR = 0.06;
    const scrollTubeR = 0.007;
    const corners = [
      { x: -w/2 + 0.05, y: h/2 - 0.05, rot: 0 },
      { x: w/2 - 0.05, y: h/2 - 0.05, rot: Math.PI/2 },
      { x: w/2 - 0.05, y: -h/2 + 0.05, rot: Math.PI },
      { x: -w/2 + 0.05, y: -h/2 + 0.05, rot: -Math.PI/2 }
    ];

    corners.forEach(c => {
      // Quarter torus
      const torusGeom = new THREE.TorusGeometry(scrollR, scrollTubeR, 8, 16, Math.PI/2);
      const scroll = new THREE.Mesh(torusGeom, patternMat);
      scroll.position.set(c.x, c.y, patternZ);
      scroll.rotation.z = c.rot;
      // Adjust torus orientation (default is XY plane)
      // We want the curve to hug the corner.
      // If rot=0 (top-left), we want curve from Top to Left.
      // Default torus starts at +X, goes CCW.
      // Top-Left corner: Center at (-,+). Curve should go from Top (Y+) to Left (X-).
      // That is 90deg to 180deg. Default is 0 to 360.
      // Let's just use a simpler arc approximation or rotate the torus.
      // Actually, let's just place 4 quarter-tori correctly.
      
      // Correction: TorusGeometry lies in XY. 
      // Top-Left Corner: Center (-x, +y). We want arc from 12 o'clock to 9 o'clock.
      // Standard Torus: 0 is +X (3 o'clock). PI/2 is +Y (12 o'clock).
      // So we want segment from PI/2 to PI.
      // But TorusGeometry draws full or partial. Let's use partial.
      // Wait, TorusGeometry args: radius, tube, radSeg, tubSeg, arc.
      // If arc = PI/2, it draws 0 to PI/2.
      // So for Top-Left (9 to 12), we need rotation.
      
      scroll.rotation.z = c.rot + Math.PI / 2; // Offset to align start
      patternGroup.add(scroll);
      
      // Add a small leaf/circle at the end of the scroll
      const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), patternMat);
      leaf.position.copy(scroll.position);
      // Offset leaf to the tip of the scroll
      const tipAngle = c.rot + Math.PI; 
      leaf.x += Math.cos(tipAngle) * scrollR;
      leaf.y += Math.sin(tipAngle) * scrollR;
      leaf.position.z = patternZ;
      patternGroup.add(leaf);
    });

    panelGroup.add(patternGroup);
    return panelGroup;
  }

  // --- 1. Base Body ---
  // Main block
  const baseGeom = new THREE.BoxGeometry(boxSize, baseHeight, boxSize);
  const baseBody = new THREE.Mesh(baseGeom, woodMat);
  baseBody.position.y = baseHeight / 2;
  root.add(baseBody);

  // --- 2. Lid ---
  const lidGeom = new THREE.BoxGeometry(boxSize, lidHeight, boxSize);
  const lid = new THREE.Mesh(lidGeom, woodMat);
  lid.position.y = baseHeight + lidHeight / 2;
  root.add(lid);

  // --- 3. Panels ---
  
  // Front Panel (Door)
  // Positioned at z = boxSize/2
  const frontPanelGroup = new THREE.Group();
  const frontPanel = createFiligreePanel(boxSize, baseHeight);
  frontPanel.position.z = boxSize / 2;
  frontPanelGroup.add(frontPanel);
  root.add(frontPanelGroup);

  // Right Panel
  // Positioned at x = boxSize/2, rotated 90 deg Y
  const rightPanelGroup = new THREE.Group();
  const rightPanel = createFiligreePanel(boxSize, baseHeight);
  rightPanel.rotation.y = Math.PI / 2;
  rightPanel.position.x = boxSize / 2;
  rightPanelGroup.add(rightPanel);
  root.add(rightPanelGroup);

  // Left Panel (Visible in mirror or just for completeness)
  const leftPanelGroup = new THREE.Group();
  const leftPanel = createFiligreePanel(boxSize, baseHeight);
  leftPanel.rotation.y = -Math.PI / 2;
  leftPanel.position.x = -boxSize / 2;
  leftPanelGroup.add(leftPanel);
  root.add(leftPanelGroup);

  // Back Panel
  const backPanelGroup = new THREE.Group();
  const backPanel = createFiligreePanel(boxSize, baseHeight);
  backPanel.rotation.y = Math.PI;
  backPanel.position.z = -boxSize / 2;
  backPanelGroup.add(backPanel);
  root.add(backPanelGroup);

  // Top Panel (Lid Top)
  const topPanelGroup = new THREE.Group();
  const topPanel = createFiligreePanel(boxSize, boxSize, true);
  // Rotate to lie flat on top (XY plane -> XZ plane)
  topPanel.rotation.x = Math.PI / 2;
  topPanel.position.y = baseHeight + lidHeight;
  topPanelGroup.add(topPanel);
  root.add(topPanelGroup);

  // --- 4. Hinges ---
  // Located on the vertical edge between Front and Right faces.
  // This implies the Front face is a door hinged on the Right.
  // Hinge position: x = boxSize/2, z = boxSize/2 (Corner)
  // But hinges are usually inset slightly.
  // Let's place them on the Right face edge, connecting to Front.
  
  const hingeX = boxSize / 2;
  const hingeZ = boxSize / 2;
  const hingeY_top = baseHeight - 0.08;
  const hingeY_bot = 0.08;
  const hingeW = 0.02;
  const hingeH = 0.04;
  const hingeD = 0.025;

  function createHinge(x, y, z) {
    const hingeGroup = new THREE.Group();
    // Hinge plates are small boxes
    // Plate 1 (on Front frame)
    const plate1 = new THREE.Mesh(new THREE.BoxGeometry(0.01, hingeH, hingeD), hingeMat);
    plate1.position.x = -0.005; // Slightly towards front
    plate1.position.z = hingeD / 2;
    hingeGroup.add(plate1);

    // Plate 2 (on Right frame)
    const plate2 = new THREE.Mesh(new THREE.BoxGeometry(hingeD, hingeH, 0.01), hingeMat);
    plate2.position.x = hingeD / 2;
    plate2.position.z = -0.005; // Slightly towards right
    hingeGroup.add(plate2);

    // Knuckles (Cylinders)
    const knuckleGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.025, 16);
    knuckleGeom.rotateZ(Math.PI / 2); // Align with Y axis hinge pin
    
    const k1 = new THREE.Mesh(knuckleGeom, hingeMat);
    k1.position.y = 0.01;
    hingeGroup.add(k1);
    
    const k2 = new THREE.Mesh(knuckleGeom, hingeMat);
    k2.position.y = -0.01;
    hingeGroup.add(k2);

    hingeGroup.position.set(x, y, z);
    return hingeGroup;
  }

  const hingeTop = createHinge(hingeX, hingeY_top, hingeZ);
  root.add(hingeTop);

  const hingeBottom = createHinge(hingeX, hingeY_bot, hingeZ);
  root.add(hingeBottom);

  // --- 5. Small Details ---
  // Keyhole on front panel
  const keyholeGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.01, 16);
  keyholeGeom.rotateX(Math.PI / 2);
  const keyhole = new THREE.Mesh(keyholeGeom, darkWoodMat);
  keyhole.position.set(0, baseHeight / 2, boxSize / 2 + 0.01);
  root.add(keyhole);

  // Lid Handle/Knob (Small dark wood button)
  const knobGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const knob = new THREE.Mesh(knobGeom, darkWoodMat);
  knob.position.set(0, baseHeight + lidHeight + 0.025, 0);
  root.add(knob);


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