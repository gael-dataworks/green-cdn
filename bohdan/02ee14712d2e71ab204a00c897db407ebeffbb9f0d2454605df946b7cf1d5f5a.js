export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Bamboo body: Light tan, satin finish, low metalness.
  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xdcb356,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Hole interior: Dark, matte.
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1510,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Node rings: Slightly darker, rougher.
  const nodeMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Procedural Bamboo Texture ---
  // Generate vertical grain streaks to simulate bamboo fibers.
  const texWidth = 256;
  const texHeight = 256;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      const i = (y * texWidth + x) * 4;
      
      // Base bamboo color
      let r = 220, g = 195, b = 130;
      
      // Vertical grain noise (varying x columns)
      const grain = Math.sin(x * 0.1) * Math.cos(y * 0.05) * 20;
      r += grain; g += grain * 0.8; b += grain * 0.5;
      
      // Occasional dark spots/knots
      if (Math.sin(x * 0.2 + y * 0.1) > 0.95) {
        r -= 40; g -= 30; b -= 20;
      }
      
      // Clamp
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
      data[i + 3] = 255;
    }
  }
  
  const bambooTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  bambooTexture.colorSpace = THREE.SRGBColorSpace;
  bambooTexture.wrapS = THREE.RepeatWrapping;
  bambooTexture.wrapT = THREE.RepeatWrapping;
  bambooTexture.repeat.set(4, 1); // Repeat grain along the length
  bambooTexture.needsUpdate = true;
  
  bambooMat.map = bambooTexture;

  // --- Geometry: Body (Lathe) ---
  // Profile defined from Bottom (Y=0) to Top (Y=1).
  // We will rotate the final object so Y becomes Z (length).
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom Center (Closed End)
    new THREE.Vector2(0.08, 0.00), // Bottom Edge
    new THREE.Vector2(0.08, 0.20), // Section 1
    new THREE.Vector2(0.10, 0.25), // Node 1 Bulge
    new THREE.Vector2(0.08, 0.30), // Section 2 Start
    new THREE.Vector2(0.08, 0.65), // Section 2 Long
    new THREE.Vector2(0.10, 0.70), // Node 2 Bulge
    new THREE.Vector2(0.08, 0.75), // Section 3 Start
    new THREE.Vector2(0.08, 0.95), // Section 3 End
    new THREE.Vector2(0.08, 1.00), // Top Edge (Mouth End)
    new THREE.Vector2(0.00, 1.00), // Top Center (Open)
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Adjust UVs for the texture to run along the length
  // Lathe UVs are automatic but might need scaling.
  
  const body = new THREE.Mesh(bodyGeom, bambooMat);
  root.add(body);

  // --- Helper: Get Radius at Height ---
  function getRadiusAtHeight(h) {
    // Clamp h
    if (h <= 0) return profilePoints[0].x;
    if (h >= 1) return profilePoints[profilePoints.length - 1].x;
    
    for (let i = 0; i < profilePoints.length - 1; i++) {
      const p1 = profilePoints[i];
      const p2 = profilePoints[i + 1];
      if (h >= p1.y && h <= p2.y) {
        const t = (h - p1.y) / (p2.y - p1.y);
        return p1.x + (p2.x - p1.x) * t;
      }
    }
    return 0.08;
  }

  // --- Helper: Add Hole ---
  // Places a dark cylinder tangent to the surface at (0, h, radius)
  function addHole(h, radius, depth) {
    const r = getRadiusAtHeight(h);
    const holeGeom = new THREE.CylinderGeometry(radius, radius, depth, 16);
    const hole = new THREE.Mesh(holeGeom, holeMat);
    
    // Position: On the +Z face of the vertical flute
    // Push slightly inward to intersect body
    hole.position.set(0, h, r - depth * 0.4);
    
    // Rotate to face +Z (Default cylinder is Y-up)
    hole.rotation.x = Math.PI / 2;
    
    root.add(hole);
  }

  // --- Helper: Add Node Ring Detail ---
  // Adds a rough textured ring at the node location
  function addNodeRing(h, width) {
    const r = getRadiusAtHeight(h);
    const ringGeom = new THREE.CylinderGeometry(r + 0.005, r + 0.005, width, 32);
    const ring = new THREE.Mesh(ringGeom, nodeMat);
    ring.position.set(0, h, 0);
    root.add(ring);
  }

  // --- Place Features ---
  // Coordinate system: Y is along the flute length (0 to 1).
  // Holes are on the +Z side.
  
  // Nodes
  addNodeRing(0.25, 0.06);
  addNodeRing(0.70, 0.06);

  // Holes
  // Blow hole (Large) near mouth end (Y=1.0)
  addHole(0.90, 0.025, 0.04);
  
  // Finger holes
  // Group 1 (Between Node 2 and Mouth)
  addHole(0.82, 0.012, 0.03);
  
  // Group 2 (Between Nodes)
  addHole(0.55, 0.012, 0.03);
  addHole(0.50, 0.012, 0.03);
  addHole(0.45, 0.012, 0.03);
  
  // Group 3 (Below Node 1)
  addHole(0.15, 0.012, 0.03);

  // --- Orientation ---
  // Currently the flute is Vertical (Y-up).
  // We want it Horizontal, lying on a surface, facing +Z.
  // 1. Rotate X -90 deg: Y (up) -> Z (forward). Flute lies on Z axis.
  //    The +Z face (holes) becomes -Y (down).
  // 2. We want holes facing +Y (Up).
  //    So we need the original +Z face to end up at +Y.
  //    Rotate X -90: +Z -> +Y. Correct.
  //    Wait, Rotate X -90 (counter-clockwise):
  //    Y -> Z. Z -> -Y. X -> X.
  //    So original +Z face becomes -Y (Down).
  //    We want +Y. So Rotate X +90.
  //    Rotate X +90: Y -> -Z. Z -> Y.
  //    So Flute lies on -Z. Holes face +Y.
  //    To make it face +Z, rotate Y 180.
  
  root.rotation.x = Math.PI / 2; // Holes face +Y, Flute along -Z
  root.rotation.y = Math.PI;     // Flip to face +Z

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