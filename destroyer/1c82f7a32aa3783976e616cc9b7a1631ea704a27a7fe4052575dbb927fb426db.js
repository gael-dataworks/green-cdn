export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B,
    metalness: 0.0,
    roughness: 0.65,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x5C3A1E,
    metalness: 0.0,
    roughness: 0.7,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.5,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const size = 1.0;
  const frameW = 0.08;
  const panelThickness = 0.025;
  const innerSize = size - frameW * 2;
  
  // --- Helpers ---
  function addBox(w, h, d, mat, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  }

  function createScrollworkShape() {
    const shape = new THREE.Shape();
    const w = innerSize / 2;
    const h = innerSize / 2;
    
    // Start center bottom
    shape.moveTo(0, -h + 0.1);
    
    // Central diamond motif
    shape.lineTo(0.15, -0.15);
    shape.lineTo(w - 0.1, -0.15);
    
    // Corner scroll (bottom right)
    shape.quadraticCurveTo(w, -0.15, w, 0);
    shape.quadraticCurveTo(w, 0.15, w - 0.1, 0.15);
    shape.lineTo(0.15, 0.15);
    shape.lineTo(0, h - 0.1);
    
    // Corner scroll (top right)
    shape.quadraticCurveTo(0.1, h, 0.25, h);
    shape.quadraticCurveTo(0.4, h, 0.4, h - 0.15);
    shape.lineTo(0.15, 0.15); // Back to center
    
    // We will mirror this shape manually to create symmetry
    return shape;
  }

  function createFullPanelShape() {
    const shape = new THREE.Shape();
    const w = innerSize / 2;
    const h = innerSize / 2;
    const d = 0.15; // offset for curves

    // Define a symmetric pattern manually for better control than mirroring a complex path
    // Outer border inset
    const inset = 0.05;
    
    // Center motif (Star/Diamond)
    shape.moveTo(0, -h + inset + 0.2);
    shape.lineTo(0.2, -0.2);
    shape.lineTo(w - inset - 0.2, -0.2);
    shape.quadraticCurveTo(w - inset, -0.2, w - inset, 0);
    shape.quadraticCurveTo(w - inset, 0.2, w - inset - 0.2, 0.2);
    shape.lineTo(0.2, 0.2);
    shape.lineTo(0, h - inset - 0.2);
    
    // Top motif
    shape.quadraticCurveTo(0.1, h - inset, 0.25, h - inset);
    shape.quadraticCurveTo(0.4, h - inset, 0.4, h - inset - 0.15);
    shape.lineTo(0.15, 0.15);
    
    // This is getting complex to draw perfectly procedurally without points.
    // Let's use a simpler geometric approximation: A frame with a central cross and corner curls.
    
    const s = new THREE.Shape();
    const margin = 0.08;
    const cx = 0, cy = 0;
    const hw = innerSize/2 - margin;
    const hh = innerSize/2 - margin;
    
    // Central Cross
    const crossW = 0.15;
    const crossH = 0.15;
    
    // Draw a simplified "filigree" pattern using lines and curves
    // Bottom arm
    s.moveTo(-crossW/2, -hh);
    s.lineTo(-crossW/2, -crossH/2);
    s.lineTo(-hw, -crossH/2);
    s.quadraticCurveTo(-hw, 0, -hw, crossH/2);
    s.lineTo(-crossW/2, crossH/2);
    s.lineTo(-crossW/2, hh);
    s.lineTo(crossW/2, hh);
    s.lineTo(crossW/2, crossH/2);
    s.lineTo(hw, crossH/2);
    s.quadraticCurveTo(hw, 0, hw, -crossH/2);
    s.lineTo(crossW/2, -crossH/2);
    s.lineTo(crossW/2, -hh);
    s.closePath();
    
    return s;
  }

  // Better approach for the panel: Use a set of Tubes or Extruded Shapes for the "vines"
  function buildDecorativePanel(isTop) {
    const panelGroup = new THREE.Group();
    const depth = isTop ? 0.03 : 0.02;
    const bevel = { enabled: true, depth: 0.01, size: 0.01, segments: 2 };
    const extrudeSettings = { depth: depth, bevelEnabled: true, ...bevel };
    
    const mat = isTop ? woodMat : woodMat;

    // 1. Central Diamond/Star
    const starShape = new THREE.Shape();
    const r1 = 0.15, r2 = 0.08;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = (i % 2 === 0) ? r1 : r2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const starGeom = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    const star = new THREE.Mesh(starGeom, mat);
    // Rotate star to align with box axes (diamond orientation)
    star.rotation.z = Math.PI / 8; 
    panelGroup.add(star);

    // 2. Corner Scrolls (4x)
    const scrollShape = new THREE.Shape();
    // Draw a simple curl
    scrollShape.moveTo(0.05, 0.05);
    scrollShape.quadraticCurveTo(0.2, 0.2, 0.35, 0.05);
    scrollShape.quadraticCurveTo(0.4, 0.1, 0.35, 0.2);
    scrollShape.quadraticCurveTo(0.2, 0.35, 0.05, 0.35);
    scrollShape.quadraticCurveTo(-0.1, 0.35, -0.1, 0.2);
    scrollShape.quadraticCurveTo(-0.1, 0.05, 0.05, 0.05);
    
    const scrollGeom = new THREE.ExtrudeGeometry(scrollShape, { depth: 0.02, bevelEnabled: false });
    
    const positions = [
      { x: innerSize/2 - 0.2, y: innerSize/2 - 0.2, rot: 0 },
      { x: -innerSize/2 + 0.2, y: innerSize/2 - 0.2, rot: Math.PI/2 },
      { x: -innerSize/2 + 0.2, y: -innerSize/2 + 0.2, rot: Math.PI },
      { x: innerSize/2 - 0.2, y: -innerSize/2 + 0.2, rot: -Math.PI/2 },
    ];

    positions.forEach(pos => {
      const scroll = new THREE.Mesh(scrollGeom, mat);
      scroll.position.set(pos.x, pos.y, 0);
      scroll.rotation.z = pos.rot;
      panelGroup.add(scroll);
    });

    // 3. Connecting Vines (4x) - Simple tubes connecting star to corners
    // Using TubeGeometry for smoother curves
    const pathPoints = [
      new THREE.Vector3(0.1, 0, 0),
      new THREE.Vector3(0.25, 0.1, 0),
      new THREE.Vector3(innerSize/2 - 0.2, 0, 0)
    ];
    // We need 4 paths rotated
    for(let i=0; i<4; i++) {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.12, 0, 0),
            new THREE.Vector3(0.25, 0.08, 0),
            new THREE.Vector3(innerSize/2 - 0.15, 0, 0)
        ]);
        // Rotate points for each quadrant
        const angle = i * Math.PI / 2;
        curve.points.forEach(p => {
            const x = p.x * Math.cos(angle) - p.y * Math.sin(angle);
            const y = p.x * Math.sin(angle) + p.y * Math.cos(angle);
            p.set(x, y, 0);
        });

        const tubeGeom = new THREE.TubeGeometry(curve, 16, 0.025, 8, false);
        const vine = new THREE.Mesh(tubeGeom, mat);
        panelGroup.add(vine);
    }

    return panelGroup;
  }

  // --- Base Construction ---
  
  // Bottom Plate
  addBox(size, 0.05, size, woodMat, 0, -size/2 + 0.025, 0);

  // Corner Posts (4)
  const postSize = frameW;
  const postH = size - 0.05; // Sit on bottom plate
  const postY = -size/2 + 0.05 + postH/2;
  const offset = size/2 - frameW/2;
  
  [[-1,-1], [1,-1], [1,1], [-1,1]].forEach(([sx, sz]) => {
    addBox(postSize, postH, postSize, woodMat, sx * offset, postY, sz * offset);
  });

  // Rails (Top and Bottom of sides)
  const railH = 0.06;
  const bottomRailY = -size/2 + 0.05 + railH/2;
  const topRailY = size/2 - 0.05 - railH/2; // Leave space for lid
  
  // Bottom Rails
  [[1,0], [0,1]].forEach(([isX, isZ]) => {
      const w = isX ? size - frameW*2 : frameW;
      const d = isX ? frameW : size - frameW*2;
      const x = isX ? 0 : offset;
      const z = isX ? offset : 0;
      // Front/Back
      addBox(size - frameW*2, railH, frameW, woodMat, 0, bottomRailY, offset);
      addBox(size - frameW*2, railH, frameW, woodMat, 0, bottomRailY, -offset);
      // Left/Right
      addBox(frameW, railH, size - frameW*2, woodMat, offset, bottomRailY, 0);
      addBox(frameW, railH, size - frameW*2, woodMat, -offset, bottomRailY, 0);
  });
  
  // Top Rails (Base part)
  addBox(size - frameW*2, railH, frameW, woodMat, 0, topRailY, offset);
  addBox(size - frameW*2, railH, frameW, woodMat, 0, topRailY, -offset);
  addBox(frameW, railH, size - frameW*2, woodMat, offset, topRailY, 0);
  addBox(frameW, railH, size - frameW*2, woodMat, -offset, topRailY, 0);

  // Side Panels (Decorative) - 4 sides
  const panelY = 0; // Centered vertically between rails
  const panelZ_front = offset - frameW/2 - panelThickness/2;
  const panelZ_back = -offset + frameW/2 + panelThickness/2;
  const panelX_right = offset - frameW/2 - panelThickness/2;
  const panelX_left = -offset + frameW/2 + panelThickness/2;

  const sidePanel = buildDecorativePanel(false);
  
  // Front
  const pFront = sidePanel.clone();
  pFront.position.set(0, panelY, panelZ_front);
  root.add(pFront);
  
  // Back
  const pBack = sidePanel.clone();
  pBack.position.set(0, panelY, panelZ_back);
  pBack.rotation.y = Math.PI;
  root.add(pBack);
  
  // Right
  const pRight = sidePanel.clone();
  pRight.position.set(panelX_right, panelY, 0);
  pRight.rotation.y = -Math.PI/2;
  root.add(pRight);
  
  // Left
  const pLeft = sidePanel.clone();
  pLeft.position.set(panelX_left, panelY, 0);
  pLeft.rotation.y = Math.PI/2;
  root.add(pLeft);

  // --- Lid Construction ---
  const lidY = size/2 + 0.02; // Slightly above base
  const lidThickness = 0.15;
  
  // Lid Frame (Rim)
  addBox(size, lidThickness, size, woodMat, 0, lidY + lidThickness/2, 0);
  // Cutout visual (just a darker box inside to simulate depth if needed, 
  // but we are placing a panel on top, so let's make the lid a frame)
  // Actually, simpler: Lid is a solid block with a recess.
  // Let's do a frame:
  const rimW = frameW;
  // Top Rim
  addBox(size, 0.04, size, woodMat, 0, lidY + lidThickness - 0.02, 0);
  // Inner walls of lid
  addBox(size - rimW*2, 0.1, rimW, woodMat, 0, lidY + 0.05, offset);
  addBox(size - rimW*2, 0.1, rimW, woodMat, 0, lidY + 0.05, -offset);
  addBox(rimW, 0.1, size - rimW*2, woodMat, offset, lidY + 0.05, 0);
  addBox(rimW, 0.1, size - rimW*2, woodMat, -offset, lidY + 0.05, 0);

  // Lid Top Panel
  const topPanel = buildDecorativePanel(true);
  topPanel.position.set(0, lidY + lidThickness - 0.02, 0);
  // Lift slightly to sit on rim
  topPanel.position.y += 0.02; 
  root.add(topPanel);

  // --- Hardware ---
  
  // Hinges (Back Left corner usually, or Back Center. Image shows side hinges)
  // Image shows hinges on the LEFT side (from this angle, back-left corner).
  // Let's put them on the back-left edge.
  const hingeX = -offset + frameW/2 + 0.01;
  const hingeZ = -offset + frameW/2 + 0.01;
  const hingeW = 0.03;
  const hingeH = 0.015;
  const hingeD = 0.06;
  
  // Hinge 1 (Top)
  addBox(hingeW, hingeH, hingeD, metalMat, hingeX, lidY + 0.05, hingeZ);
  // Hinge 2 (Bottom)
  addBox(hingeW, hingeH, hingeD, metalMat, hingeX, -size/2 + 0.15, hingeZ);
  
  // Pin/Cylinder for hinge
  const pinGeom = new THREE.CylinderGeometry(0.005, 0.005, hingeD, 8);
  const pin1 = new THREE.Mesh(pinGeom, metalMat);
  pin1.rotation.x = Math.PI/2;
  pin1.position.set(hingeX - 0.015, lidY + 0.05, hingeZ);
  root.add(pin1);
  
  const pin2 = new THREE.Mesh(pinGeom, metalMat);
  pin2.rotation.x = Math.PI/2;
  pin2.position.set(hingeX - 0.015, -size/2 + 0.15, hingeZ);
  root.add(pin2);

  // Knob/Latch (Front Center)
  const knobY = 0;
  const knobZ = offset + 0.02;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), metalMat);
  knob.position.set(0, knobY, knobZ);
  root.add(knob);
  
  // Knob Base
  addBox(0.06, 0.06, 0.01, metalMat, 0, knobY, knobZ - 0.02);

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