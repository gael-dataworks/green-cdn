export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Leather material with procedural grain
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.65,
    metalness: 0.1,
    map: createLeatherTexture(THREE),
    bumpMap: createLeatherTexture(THREE),
    bumpScale: 0.002,
  });

  // Cord/Knot material (slightly different black, more matte/fibrous)
  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.8,
    metalness: 0.0,
  });

  // Stitching material (slightly lighter thread or dark thread, let's go dark grey)
  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.7,
    metalness: 0.0,
  });

  // --- 1. Leather Body (Teardrop Pouch) ---
  // Define the 2D teardrop shape
  const shape = new THREE.Shape();
  const width = 0.55;
  const height = 1.4;
  const topY = 0.6;
  const bottomY = -0.8;

  // Start top center
  shape.moveTo(0, topY);
  // Top right corner
  shape.bezierCurveTo(width * 0.8, topY, width, topY - 0.2, width, topY - 0.4);
  // Side curve to bottom
  shape.bezierCurveTo(width, bottomY + 0.4, width * 0.4, bottomY, 0, bottomY);
  // Bottom left curve
  shape.bezierCurveTo(-width * 0.4, bottomY, -width, bottomY + 0.4, -width, topY - 0.4);
  // Left side to top
  shape.bezierCurveTo(-width, topY - 0.2, -width * 0.8, topY, 0, topY);

  // Extrude settings for thickness and rounded edges
  const extrudeSettings = {
    steps: 2,
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 4,
  };

  const bodyGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center the geometry vertically
  bodyGeom.center();
  
  const body = new THREE.Mesh(bodyGeom, leatherMat);
  root.add(body);

  // --- 2. Stitching ---
  // Create small cylinders along the perimeter of the shape
  const stitchPoints = shape.getPoints(50); // Get points along the contour
  const stitchRadius = 0.015;
  const stitchLength = 0.04;
  const stitchGap = 0.06; // Distance between stitches

  // We need to place stitches on the front and back faces roughly
  // Since the extrusion is centered, the front face is at z = depth/2 + bevel
  // Let's approximate the Z position based on the extrusion
  const zOffset = 0.06 + 0.04; // depth/2 + bevel approx

  for (let i = 0; i < stitchPoints.length; i += 3) { // Skip some points to create gaps
    const p = stitchPoints[i];
    
    // Calculate normal at this point to orient the stitch
    const nextP = stitchPoints[(i + 1) % stitchPoints.length];
    const dx = nextP.x - p.x;
    const dy = nextP.y - p.y;
    const angle = Math.atan2(dy, dx);

    // Front stitch
    const frontStitch = new THREE.Mesh(
      new THREE.CylinderGeometry(stitchRadius, stitchRadius, stitchLength, 8),
      stitchMat
    );
    frontStitch.position.set(p.x, p.y, zOffset);
    frontStitch.rotation.z = angle;
    frontStitch.rotation.y = Math.PI / 2; // Lie flat on surface
    root.add(frontStitch);

    // Back stitch (mirrored)
    const backStitch = new THREE.Mesh(
      new THREE.CylinderGeometry(stitchRadius, stitchRadius, stitchLength, 8),
      stitchMat
    );
    backStitch.position.set(p.x, p.y, -zOffset);
    backStitch.rotation.z = angle;
    backStitch.rotation.y = -Math.PI / 2;
    root.add(backStitch);
  }

  // --- 3. Knot ---
  // A torus knot to simulate a tangled cord knot
  const knotGeom = new THREE.TorusKnotGeometry(0.08, 0.025, 64, 8, 2, 3);
  const knot = new THREE.Mesh(knotGeom, cordMat);
  knot.position.set(0, 0.75, 0); // Position at top of leather body
  knot.scale.set(1, 1, 0.6); // Flatten slightly
  root.add(knot);

  // --- 4. Loop ---
  // A torus for the hanging loop
  const loopRadius = 0.15;
  const tubeRadius = 0.025;
  const loopGeom = new THREE.TorusGeometry(loopRadius, tubeRadius, 16, 32, Math.PI); // Half torus
  const loop = new THREE.Mesh(loopGeom, cordMat);
  loop.position.set(0, 0.95, 0); // Above the knot
  loop.rotation.x = Math.PI; // Orient correctly
  // We need a full loop, actually. The image shows a full loop.
  // Let's use a full torus but scaled or positioned to look like a hanging loop.
  // Actually, a simple TorusGeometry is a full ring. We want a teardrop loop or just a ring.
  // The image shows a simple loop. Let's use a full Torus and rotate it.
  
  const fullLoopGeom = new THREE.TorusGeometry(0.12, 0.022, 16, 40);
  const loopMesh = new THREE.Mesh(fullLoopGeom, cordMat);
  loopMesh.position.set(0, 1.0, 0);
  // Rotate to stand up in Y plane
  loopMesh.rotation.x = Math.PI / 2; 
  root.add(loopMesh);

  // Connect loop to knot visually (optional, but good for continuity)
  // The knot geometry usually covers the connection.

  fitToUnitCube(THREE, root);
  return root;
}

// --- Helper: Procedural Leather Texture ---
function createLeatherTexture(THREE) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  
  // Base color (dark grey/black)
  const baseR = 30;
  const baseG = 30;
  const baseB = 30;

  for (let i = 0; i < size * size; i++) {
    // Simple deterministic noise for grain
    const x = i % size;
    const y = Math.floor(i / size);
    
    // Pseudo-random noise based on coordinates
    const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 20 + 
                  Math.sin(x * 0.3 + y * 0.2) * 10;
    
    const idx = i * 4;
    data[idx] = Math.max(0, Math.min(255, baseR + noise));     // R
    data[idx + 1] = Math.max(0, Math.min(255, baseG + noise)); // G
    data[idx + 2] = Math.max(0, Math.min(255, baseB + noise)); // B
    data[idx + 3] = 255; // Alpha
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

// --- Helper: Fit to Unit Cube ---
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