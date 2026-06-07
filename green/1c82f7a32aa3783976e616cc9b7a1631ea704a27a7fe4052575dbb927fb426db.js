export default function generate(THREE) {
  // --- Materials ---
  // Wood frame and relief (lighter)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9c6b3f,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Recessed panel background (darker for contrast)
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x5e4030,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Metal hinges
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.6,
    roughness: 0.4,
  });

  const root = new THREE.Group();

  // --- Dimensions ---
  const size = 0.8;
  const half = size / 2;
  const wallThick = 0.05;
  const panelSize = size - wallThick * 2;
  const lidHeight = size * 0.35; // Lid is top 35%
  const baseHeight = size - lidHeight;

  // --- Base Structure ---
  // Base box (bottom part)
  const baseGeom = new THREE.BoxGeometry(size, baseHeight, size);
  const boxBase = new THREE.Mesh(baseGeom, woodMat);
  boxBase.position.y = -half + baseHeight / 2;
  root.add(boxBase);

  // Lid box (top part) - slightly separated to show seam
  const lidGeom = new THREE.BoxGeometry(size, lidHeight, size);
  const boxLid = new THREE.Mesh(lidGeom, woodMat);
  boxLid.position.y = half - lidHeight / 2 + 0.002; // Tiny gap
  root.add(boxLid);

  // --- Helper: Create a decorative panel on a face ---
  function createPanel(x, y, z, rotX, rotY, rotZ, isLid) {
    const panelGroup = new THREE.Group();
    panelGroup.position.set(x, y, z);
    panelGroup.rotation.set(rotX, rotY, rotZ);

    // 1. Recessed Background
    const bgGeom = new THREE.PlaneGeometry(panelSize, panelSize);
    const bg = new THREE.Mesh(bgGeom, darkWoodMat);
    bg.position.z = -0.01; // Recessed
    panelGroup.add(bg);

    // 2. Frame Border (4 strips)
    const frameMat = woodMat;
    const stripLen = panelSize;
    const stripW = wallThick;
    const stripH = 0.015; // Thickness of relief

    // Top/Bottom strips
    const hStripGeom = new THREE.BoxGeometry(stripLen, stripW, stripH);
    const topStrip = new THREE.Mesh(hStripGeom, frameMat);
    topStrip.position.y = panelSize / 2 - stripW / 2;
    panelGroup.add(topStrip);
    const botStrip = new THREE.Mesh(hStripGeom, frameMat);
    botStrip.position.y = -panelSize / 2 + stripW / 2;
    panelGroup.add(botStrip);

    // Left/Right strips
    const vStripGeom = new THREE.BoxGeometry(stripW, stripLen, stripH);
    const leftStrip = new THREE.Mesh(vStripGeom, frameMat);
    leftStrip.position.x = -panelSize / 2 + stripW / 2;
    panelGroup.add(leftStrip);
    const rightStrip = new THREE.Mesh(vStripGeom, frameMat);
    rightStrip.position.x = panelSize / 2 - stripW / 2;
    panelGroup.add(rightStrip);

    // 3. Filigree / Carved Pattern (Procedural Tubes)
    // We simulate the intricate carving with a symmetrical pattern of tubes
    const scrollMat = woodMat;
    const tubeRadius = 0.012;
    const tubeSegs = 8;
    const radialSegs = 6;

    function addScrollCurve(points, offsetX, offsetY) {
      const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0] + offsetX, p[1] + offsetY, 0)));
      const geo = new THREE.TubeGeometry(curve, 16, tubeRadius, radialSegs, false);
      const mesh = new THREE.Mesh(geo, scrollMat);
      mesh.position.z = 0.005; // Slightly above background
      panelGroup.add(mesh);
    }

    function addCircle(r, ox, oy) {
      const geo = new THREE.TorusGeometry(r, tubeRadius, radialSegs, 16);
      const mesh = new THREE.Mesh(geo, scrollMat);
      mesh.position.set(ox, oy, 0.005);
      panelGroup.add(mesh);
    }

    function addDiamond(ox, oy, w, h) {
        // Diamond made of 4 lines
        const pts = [
            [0, h/2], [w/2, 0], [0, -h/2], [-w/2, 0], [0, h/2]
        ].map(p => new THREE.Vector3(p[0] + ox, p[1] + oy, 0));
        const curve = new THREE.CatmullRomCurve3(pts);
        const geo = new THREE.TubeGeometry(curve, 4, tubeRadius, radialSegs, false);
        const mesh = new THREE.Mesh(geo, scrollMat);
        mesh.position.z = 0.005;
        panelGroup.add(mesh);
    }

    // Central Motif
    addDiamond(0, 0, panelSize * 0.5, panelSize * 0.5);
    addCircle(panelSize * 0.15, 0, 0);

    // Corner Scrolls (Symmetrical)
    const cornerOffset = panelSize * 0.35;
    const scrollShape = [
      [0, 0], [0.05, 0.05], [0.05, 0.15], [0, 0.2], [-0.05, 0.15], [-0.05, 0.05], [0, 0]
    ];
    
    // We place simplified scrolls in corners
    // Top-Left
    addScrollCurve([[-0.1, 0], [-0.15, 0.1], [-0.1, 0.2]], -cornerOffset, cornerOffset);
    addCircle(0.04, -cornerOffset + 0.1, cornerOffset - 0.1);
    
    // Top-Right
    addScrollCurve([[0.1, 0], [0.15, 0.1], [0.1, 0.2]], cornerOffset, cornerOffset);
    addCircle(0.04, cornerOffset - 0.1, cornerOffset - 0.1);

    // Bottom-Left
    addScrollCurve([[-0.1, 0], [-0.15, -0.1], [-0.1, -0.2]], -cornerOffset, -cornerOffset);
    addCircle(0.04, -cornerOffset + 0.1, -cornerOffset + 0.1);

    // Bottom-Right
    addScrollCurve([[0.1, 0], [0.15, -0.1], [0.1, -0.2]], cornerOffset, -cornerOffset);
    addCircle(0.04, cornerOffset - 0.1, -cornerOffset + 0.1);

    root.add(panelGroup);
  }

  // --- Apply Panels ---
  
  // Front Face (Z+)
  // Position: x=0, y=0, z=half
  // The panel group is centered on the face. 
  // Note: boxBase and boxLid are separate, but the panel spans across the seam visually.
  // We attach the panel to the root but position it at the front surface.
  createPanel(0, 0, half, 0, 0, 0, false);

  // Right Face (X+)
  // Position: x=half, y=0, z=0. Rotate 90 deg around Y.
  createPanel(half, 0, 0, 0, Math.PI / 2, 0, false);

  // Top Face (Y+) - Lid
  // Position: x=0, y=half, z=0. Rotate -90 deg around X.
  createPanel(0, half, 0, -Math.PI / 2, 0, 0, true);

  // --- Hinges ---
  // Located on the corner between Front and Right (X+, Z+)
  // Two hinges, one upper, one lower.
  const hingeW = 0.03;
  const hingeH = 0.06;
  const hingeD = 0.02;
  const hingeGeom = new THREE.BoxGeometry(hingeD, hingeH, hingeW);
  
  // Hinge positions (approximate based on image)
  const hingeX = half - 0.01;
  const hingeZ = half - 0.01;
  
  const hingeTopY = half - lidHeight * 0.4;
  const hingeBotY = -half + baseHeight * 0.4;

  const hinge1 = new THREE.Mesh(hingeGeom, metalMat);
  hinge1.position.set(hingeX, hingeTopY, hingeZ);
  hinge1.rotation.y = Math.PI / 4; // Aligned with corner
  root.add(hinge1);

  const hinge2 = new THREE.Mesh(hingeGeom, metalMat);
  hinge2.position.set(hingeX, hingeBotY, hingeZ);
  hinge2.rotation.y = Math.PI / 4;
  root.add(hinge2);

  // --- Lock / Keyhole ---
  // Small hole on the front edge of the lid
  const lockGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8);
  const lock = new THREE.Mesh(lockGeom, darkWoodMat);
  lock.rotation.x = Math.PI / 2;
  lock.position.set(0, half - lidHeight * 0.5, half - 0.02);
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