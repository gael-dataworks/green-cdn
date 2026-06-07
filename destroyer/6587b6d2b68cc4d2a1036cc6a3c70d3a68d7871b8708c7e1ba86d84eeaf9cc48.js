export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Galvanized / Stamped Steel
  // Rules: metalness <= 0.6, use emissive for brightness in dim render
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xbcc6cc,
    metalness: 0.6,
    roughness: 0.45,
    emissive: 0xbcc6cc,
    emissiveIntensity: 0.15,
  });

  // --- 1. Base Plate with Cutouts ---
  // Define the 2D shape of the flange
  const shape = new THREE.Shape();
  const w = 0.55; // half-width
  const h = 0.55; // half-height
  const r = 0.08; // corner radius
  
  // Start bottom-left ear
  shape.moveTo(-w, -h + r);
  shape.lineTo(-w, h - r); // Left side up
  // Top-left ear arc
  shape.quadraticCurveTo(-w, h, -w + r, h);
  shape.lineTo(w - r, h); // Top side right
  // Top-right ear arc
  shape.quadraticCurveTo(w, h, w, h - r);
  shape.lineTo(w, -h + r); // Right side down
  // Bottom-right ear arc
  shape.quadraticCurveTo(w, -h, w - r, -h);
  shape.lineTo(-w + r, -h); // Bottom side left
  // Bottom-left ear arc
  shape.quadraticCurveTo(-w, -h, -w, -h + r);

  // Add the elongated slot on the left side (negative X)
  // The slot cuts into the left edge
  const slotW = 0.12;
  const slotH = 0.25;
  const slotX = -w + 0.05;
  const slotShape = new THREE.Path();
  slotShape.moveTo(slotX, -slotH / 2);
  slotShape.lineTo(slotX, slotH / 2);
  slotShape.lineTo(slotX + slotW, slotH / 2);
  slotShape.lineTo(slotX + slotW, -slotH / 2);
  slotShape.lineTo(slotX, -slotH / 2);
  shape.holes.push(slotShape);

  // Add 4 mounting holes
  const holeR = 0.045;
  const holeDist = 0.42;
  const holePositions = [
    [holeDist, holeDist],
    [-holeDist, holeDist],
    [-holeDist, -holeDist],
    [holeDist, -holeDist]
  ];

  for (const [hx, hy] of holePositions) {
    const holePath = new THREE.Path();
    holePath.absarc(hx, hy, holeR, 0, Math.PI * 2, true);
    shape.holes.push(holePath);
  }

  const extrudeSettings = {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12
  };

  const baseGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // ExtrudeGeometry creates geometry facing +Z by default in local space, 
  // but we want it flat on XZ plane (Y up). Rotate -90 deg around X.
  baseGeom.rotateX(-Math.PI / 2);
  
  const basePlate = new THREE.Mesh(baseGeom, steelMat);
  root.add(basePlate);

  // --- 2. Central Raised Collar ---
  // Looks like a pressed ring. TorusGeometry works well for a ring.
  // Torus lies in XY plane by default. Rotate X -90 to lie on XZ.
  const ringRadius = 0.16;
  const ringTube = 0.035;
  const ringGeom = new THREE.TorusGeometry(ringRadius, ringTube, 16, 32);
  ringGeom.rotateX(-Math.PI / 2);
  
  const centerRing = new THREE.Mesh(ringGeom, steelMat);
  // Lift it slightly so it sits on top of the base plate thickness
  centerRing.position.y = 0.025; 
  root.add(centerRing);

  // Inner lip of the collar (optional detail to make it look like a pressed hub)
  const innerRingRadius = 0.11;
  const innerRingTube = 0.02;
  const innerRingGeom = new THREE.TorusGeometry(innerRingRadius, innerRingTube, 16, 32);
  innerRingGeom.rotateX(-Math.PI / 2);
  const innerRing = new THREE.Mesh(innerRingGeom, steelMat);
  innerRing.position.y = 0.025;
  root.add(innerRing);

  // --- 3. Embossed Logo / Text Mark ---
  // Small raised rectangle on the bottom-right ear
  const logoW = 0.06;
  const logoH = 0.03;
  const logoD = 0.004; // very shallow emboss
  const logoGeom = new THREE.BoxGeometry(logoW, logoD, logoH);
  const logo = new THREE.Mesh(logoGeom, steelMat);
  // Position on the bottom-right ear
  logo.position.set(0.35, 0.025, -0.35);
  root.add(logo);

  // --- 4. Surface Imperfections / Texture (Optional but good for realism) ---
  // Stamped metal often has slight unevenness. We can skip complex noise 
  // to keep it clean, but the material roughness handles the look.

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