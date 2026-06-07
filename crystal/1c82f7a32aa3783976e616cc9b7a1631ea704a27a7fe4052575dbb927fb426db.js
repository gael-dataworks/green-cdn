export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.7,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    metalness: 0.0,
    roughness: 0.8,
  });

  const hingeMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.6,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const boxSize = 0.6;
  const halfSize = boxSize / 2;
  const frameThick = 0.04;
  const panelDepth = 0.015;
  const lidHeight = 0.15; // Height of the lid section
  const baseHeight = boxSize - lidHeight;

  // --- Helpers ---

  // Creates a procedural filigree shape (simplified scrollwork)
  function createFiligreeShape() {
    const shape = new THREE.Shape();
    const inset = 0.35; // Relative to unit square
    
    // Outer frame border
    shape.moveTo(-0.5, -0.5);
    shape.lineTo(0.5, -0.5);
    shape.lineTo(0.5, 0.5);
    shape.lineTo(-0.5, 0.5);
    shape.lineTo(-0.5, -0.5);
    
    // Cut out the inner area (we will add islands of geometry)
    // Actually, for extrusion, we draw the solid parts.
    // Let's draw a central diamond and corner scrolls.
    
    const innerShape = new THREE.Path();
    // Central diamond
    innerShape.moveTo(0, -0.25);
    innerShape.lineTo(0.25, 0);
    innerShape.lineTo(0, 0.25);
    innerShape.lineTo(-0.25, 0);
    innerShape.lineTo(0, -0.25);
    
    // Add holes to the main shape? 
    // Easier: Draw the frame, then draw the pattern as separate extruded meshes 
    // placed on a backing, OR use shape.holes.
    // Let's use holes for the "carved out" look.
    
    const mainShape = new THREE.Shape();
    // Full square
    mainShape.moveTo(-0.45, -0.45);
    mainShape.lineTo(0.45, -0.45);
    mainShape.lineTo(0.45, 0.45);
    mainShape.lineTo(-0.45, 0.45);
    mainShape.lineTo(-0.45, -0.45);

    // Hole 1: Central Diamond
    const hole1 = new THREE.Path();
    hole1.moveTo(0, -0.2);
    hole1.lineTo(0.2, 0);
    hole1.lineTo(0, 0.2);
    hole1.lineTo(-0.2, 0);
    hole1.lineTo(0, -0.2);
    mainShape.holes.push(hole1);

    // Hole 2,3,4,5: Corner circles/scrolls approximation
    const corners = [
      [-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]
    ];
    
    corners.forEach(([cx, cy]) => {
      const hole = new THREE.Path();
      hole.absarc(cx, cy, 0.12, 0, Math.PI * 2, false);
      mainShape.holes.push(hole);
      
      // Connecting lines to center (creating the cross shape)
      const lineHole = new THREE.Path();
      lineHole.moveTo(cx * 0.5, cy * 0.5);
      lineHole.lineTo(cx, cy); 
      // Make it a thin rect hole
      const angle = Math.atan2(cy, cx);
      const lx = Math.cos(angle) * 0.15;
      const ly = Math.sin(angle) * 0.15;
      
      // Simplified: Just small rects connecting center to corners
      const rectHole = new THREE.Path();
      rectHole.moveTo(0,0); // relative to center? No, absolute.
      // Let's just rely on the diamond and circles for the "filigree" look 
      // to keep vertex count low and code clean.
    });
    
    // Add some decorative curves between corners
    // Top edge curve
    const topCurve = new THREE.Path();
    topCurve.moveTo(-0.2, 0.35);
    topCurve.quadraticCurveTo(0, 0.45, 0.2, 0.35);
    topCurve.quadraticCurveTo(0, 0.25, -0.2, 0.35);
    mainShape.holes.push(topCurve);
    
    // Repeat for other sides
    const sides = [
      { c1: [0.35, 0.2], c2: [0.45, 0], c3: [0.35, -0.2] }, // Right
      { c1: [0.2, -0.35], c2: [0, -0.45], c3: [-0.2, -0.35] }, // Bottom
      { c1: [-0.35, -0.2], c2: [-0.45, 0], c3: [-0.35, 0.2] } // Left
    ];
    
    sides.forEach(s => {
       const h = new THREE.Path();
       h.moveTo(s.c1[0], s.c1[1]);
       h.quadraticCurveTo(s.c2[0], s.c2[1], s.c3[0], s.c3[1]);
       h.quadraticCurveTo(s.c2[0]*0.8, s.c2[1]*0.8, s.c1[0], s.c1[1]);
       mainShape.holes.push(h);
    });

    return mainShape;
  }

  const filigreeShape = createFiligreeShape();
  const filigreeGeom = new THREE.ExtrudeGeometry(filigreeShape, {
    depth: panelDepth,
    bevelEnabled: false,
  });

  // Helper to create a side panel (Frame + Filigree)
  function createSidePanel(width, height, isLid = false) {
    const group = new THREE.Group();

    // 1. The solid wooden frame
    // We construct a frame by 4 boxes or a box with a hole. 
    // 4 boxes is easier for mitered look.
    const frameMat = woodMat;
    
    // Top bar
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(width, frameThick, frameThick), frameMat);
    topBar.position.set(0, height/2 - frameThick/2, 0);
    group.add(topBar);

    // Bottom bar
    const botBar = new THREE.Mesh(new THREE.BoxGeometry(width, frameThick, frameThick), frameMat);
    botBar.position.set(0, -height/2 + frameThick/2, 0);
    group.add(botBar);

    // Left bar
    const leftBar = new THREE.Mesh(new THREE.BoxGeometry(frameThick, height - 2*frameThick, frameThick), frameMat);
    leftBar.position.set(-width/2 + frameThick/2, 0, 0);
    group.add(leftBar);

    // Right bar
    const rightBar = new THREE.Mesh(new THREE.BoxGeometry(frameThick, height - 2*frameThick, frameThick), frameMat);
    rightBar.position.set(width/2 - frameThick/2, 0, 0);
    group.add(rightBar);

    // 2. The filigree inset
    // Scale the extruded geometry to fit the inner hole
    const innerW = width - 2 * frameThick;
    const innerH = height - 2 * frameThick;
    
    const filigree = new THREE.Mesh(filigreeGeom, woodMat);
    filigree.scale.set(innerW, innerH, 1);
    // Position slightly back to look inset
    filigree.position.set(0, 0, -frameThick/2 - 0.001); 
    group.add(filigree);

    return group;
  }

  // --- Base Construction ---
  const baseGroup = new THREE.Group();
  
  // Bottom plate
  const bottomPlate = new THREE.Mesh(new THREE.BoxGeometry(boxSize, frameThick, boxSize), woodMat);
  bottomPlate.position.y = -boxSize/2 + frameThick/2;
  baseGroup.add(bottomPlate);

  // 4 Sides for Base
  const sideW = boxSize - 2 * frameThick; // Inner width for side panels to fit between corners? 
  // Let's make corners distinct.
  // Strategy: 4 Corner posts + 4 Side Panels between them.
  
  const cornerPostGeom = new THREE.BoxGeometry(frameThick, baseHeight, frameThick);
  const cornerPositions = [
    [-boxSize/2 + frameThick/2, -boxSize/2 + baseHeight/2 + frameThick/2, -boxSize/2 + frameThick/2], // Front-Left
    [ boxSize/2 - frameThick/2, -boxSize/2 + baseHeight/2 + frameThick/2, -boxSize/2 + frameThick/2], // Front-Right
    [ boxSize/2 - frameThick/2, -boxSize/2 + baseHeight/2 + frameThick/2,  boxSize/2 - frameThick/2], // Back-Right
    [-boxSize/2 + frameThick/2, -boxSize/2 + baseHeight/2 + frameThick/2,  boxSize/2 - frameThick/2], // Back-Left
  ];

  cornerPositions.forEach(pos => {
    const post = new THREE.Mesh(cornerPostGeom, woodMat);
    post.position.set(...pos);
    baseGroup.add(post);
  });

  // Side Panels (Front, Back, Left, Right)
  const panelW = boxSize - 2 * frameThick;
  const panelH = baseHeight;
  
  // Front Panel (+Z)
  const frontPanel = createSidePanel(panelW, panelH);
  frontPanel.position.set(0, -boxSize/2 + baseHeight/2 + frameThick/2, boxSize/2 - frameThick/2);
  baseGroup.add(frontPanel);

  // Back Panel (-Z)
  const backPanel = createSidePanel(panelW, panelH);
  backPanel.rotation.y = Math.PI;
  backPanel.position.set(0, -boxSize/2 + baseHeight/2 + frameThick/2, -boxSize/2 + frameThick/2);
  baseGroup.add(backPanel);

  // Left Panel (-X)
  const leftPanel = createSidePanel(panelW, panelH);
  leftPanel.rotation.y = -Math.PI/2;
  leftPanel.position.set(-boxSize/2 + frameThick/2, -boxSize/2 + baseHeight/2 + frameThick/2, 0);
  baseGroup.add(leftPanel);

  // Right Panel (+X)
  const rightPanel = createSidePanel(panelW, panelH);
  rightPanel.rotation.y = Math.PI/2;
  rightPanel.position.set(boxSize/2 - frameThick/2, -boxSize/2 + baseHeight/2 + frameThick/2, 0);
  baseGroup.add(rightPanel);

  root.add(baseGroup);

  // --- Lid Construction ---
  const lidGroup = new THREE.Group();
  
  // Top Plate (with filigree)
  // The top is similar to a side panel but horizontal
  const topFrameGroup = new THREE.Group();
  
  // Top Frame Bars
  const tBar1 = new THREE.Mesh(new THREE.BoxGeometry(boxSize, frameThick, frameThick), woodMat);
  tBar1.position.set(0, lidHeight/2 - frameThick/2, -boxSize/2 + frameThick/2); // Back
  topFrameGroup.add(tBar1);
  
  const tBar2 = new THREE.Mesh(new THREE.BoxGeometry(boxSize, frameThick, frameThick), woodMat);
  tBar2.position.set(0, lidHeight/2 - frameThick/2, boxSize/2 - frameThick/2); // Front
  topFrameGroup.add(tBar2);
  
  const tBar3 = new THREE.Mesh(new THREE.BoxGeometry(frameThick, frameThick, boxSize - 2*frameThick), woodMat);
  tBar3.position.set(-boxSize/2 + frameThick/2, lidHeight/2 - frameThick/2, 0); // Left
  topFrameGroup.add(tBar3);
  
  const tBar4 = new THREE.Mesh(new THREE.BoxGeometry(frameThick, frameThick, boxSize - 2*frameThick), woodMat);
  tBar4.position.set(boxSize/2 - frameThick/2, lidHeight/2 - frameThick/2, 0); // Right
  topFrameGroup.add(tBar4);

  // Top Filigree
  const topFiligree = new THREE.Mesh(filigreeGeom, woodMat);
  topFiligree.scale.set(boxSize - 2*frameThick, boxSize - 2*frameThick, 1);
  topFiligree.rotation.x = -Math.PI/2; // Lay flat
  topFiligree.position.set(0, lidHeight/2 - frameThick/2 - 0.001, 0);
  topFrameGroup.add(topFiligree);
  
  lidGroup.add(topFrameGroup);

  // Lid Sides (short skirts)
  const skirtH = lidHeight - frameThick;
  const skirtPanel = createSidePanel(panelW, skirtH);
  
  // Front Skirt
  const fSkirt = skirtPanel.clone();
  fSkirt.position.set(0, -boxSize/2 + lidHeight/2 + frameThick/2, boxSize/2 - frameThick/2);
  lidGroup.add(fSkirt);

  // Back Skirt
  const bSkirt = skirtPanel.clone();
  bSkirt.rotation.y = Math.PI;
  bSkirt.position.set(0, -boxSize/2 + lidHeight/2 + frameThick/2, -boxSize/2 + frameThick/2);
  lidGroup.add(bSkirt);

  // Left Skirt
  const lSkirt = skirtPanel.clone();
  lSkirt.rotation.y = -Math.PI/2;
  lSkirt.position.set(-boxSize/2 + frameThick/2, -boxSize/2 + lidHeight/2 + frameThick/2, 0);
  lidGroup.add(lSkirt);

  // Right Skirt
  const rSkirt = skirtPanel.clone();
  rSkirt.rotation.y = Math.PI/2;
  rSkirt.position.set(boxSize/2 - frameThick/2, -boxSize/2 + lidHeight/2 + frameThick/2, 0);
  lidGroup.add(rSkirt);

  // Position Lid on top of Base
  lidGroup.position.y = baseHeight;
  root.add(lidGroup);

  // --- Hinges ---
  // Placed on the Back-Left corner edge as seen in reference (or Back edge)
  // Let's put them on the Back edge (-Z), spanning Lid and Base.
  const hingeW = 0.04;
  const hingeH = 0.06;
  const hingeD = 0.02;
  const hingeGeom = new THREE.BoxGeometry(hingeW, hingeH, hingeD);
  
  const hingeY = baseHeight; // At the seam
  const hingeZ = -boxSize/2 + frameThick/2; // Back face
  
  // Left Hinge
  const hinge1 = new THREE.Mesh(hingeGeom, hingeMat);
  hinge1.position.set(-boxSize/2 + frameThick, hingeY, hingeZ - 0.01);
  root.add(hinge1);

  // Right Hinge
  const hinge2 = new THREE.Mesh(hingeGeom, hingeMat);
  hinge2.position.set(boxSize/2 - frameThick, hingeY, hingeZ - 0.01);
  root.add(hinge2);
  
  // Hinge pins (cylinders)
  const pinGeom = new THREE.CylinderGeometry(0.005, 0.005, hingeH + 0.01, 8);
  const pin1 = new THREE.Mesh(pinGeom, hingeMat);
  pin1.rotation.x = Math.PI/2;
  pin1.position.copy(hinge1.position);
  pin1.z -= 0.015;
  root.add(pin1);
  
  const pin2 = new THREE.Mesh(pinGeom, hingeMat);
  pin2.rotation.x = Math.PI/2;
  pin2.position.copy(hinge2.position);
  pin2.z -= 0.015;
  root.add(pin2);

  // --- Keyhole / Latch ---
  // Small dark circle on the Front face of the Lid
  const holeGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16);
  const hole = new THREE.Mesh(holeGeom, darkWoodMat);
  hole.rotation.x = Math.PI/2;
  hole.position.set(0, -boxSize/2 + lidHeight/2 + frameThick/2, boxSize/2 - frameThick/2 - 0.01);
  lidGroup.add(hole);

  // Normalize
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