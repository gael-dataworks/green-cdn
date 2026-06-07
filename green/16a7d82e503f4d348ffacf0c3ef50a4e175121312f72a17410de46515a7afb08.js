export default function generate(THREE) {
  // --- Helpers ---

  function fitToUnitCube(root) {
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

  function createQuiltTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    const colorBase = new THREE.Color(0x802040); // Burgundy
    const colorStitch = new THREE.Color(0x501025); // Darker stitch
    const colorHighlight = new THREE.Color(0x903050); // Lighter puff

    // Diamond grid parameters
    const gridSize = 64; // Size of one diamond in pixels
    const stitchWidth = 4;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Transform to diamond coordinates (rotate 45 degrees)
        // u, v in range [0, gridSize)
        const u = (x + y) % (gridSize * 2);
        const v = (x - y + size) % (gridSize * 2);
        
        // Distance to the nearest grid line (the stitch)
        // The lines are at u=0, u=gridSize*2, v=0, v=gridSize*2
        // Actually, simpler: distance to nearest multiple of gridSize in rotated space
        // Let's use a simpler diamond distance function
        
        const cx = x % gridSize;
        const cy = y % gridSize;
        
        // Diamond shape distance from center of cell
        // Center of cell is gridSize/2
        const dist = Math.abs(cx - gridSize / 2) + Math.abs(cy - gridSize / 2);
        const maxDist = gridSize; // Diamond reaches corners at dist = gridSize/2 + gridSize/2
        
        // Normalize 0 (center) to 1 (edges)
        const t = dist / (gridSize / 2);
        
        // Smoothstep for puffiness
        // t=0 -> center (high), t=1 -> edge (low/stitch)
        const puff = 1.0 - Math.pow(t, 1.5); 
        
        // Stitch line at the edges (t close to 1)
        const isStitch = t > 0.85 ? 1.0 : 0.0;
        const stitchSmooth = 1.0 - Math.pow(1.0 - t, 3.0); // Sharp drop at edges

        let r, g, b;
        
        if (isStitch > 0.5) {
          // Stitch color
          r = colorStitch.r * 255;
          g = colorStitch.g * 255;
          b = colorStitch.b * 255;
        } else {
          // Interpolate between base and highlight based on puff
          const mix = puff * 0.4; // Max 40% highlight
          r = (colorBase.r * (1 - mix) + colorHighlight.r * mix) * 255;
          g = (colorBase.g * (1 - mix) + colorHighlight.g * mix) * 255;
          b = (colorBase.b * (1 - mix) + colorHighlight.b * mix) * 255;
        }

        // Add subtle noise for leather grain
        const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) * 10;
        r = Math.min(255, Math.max(0, r + noise));
        g = Math.min(255, Math.max(0, g + noise));
        b = Math.min(255, Math.max(0, b + noise));

        const i = (y * size + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  // --- Scene Setup ---

  const root = new THREE.Group();

  // --- Materials ---

  const quiltTexture = createQuiltTexture();
  
  // Leather material
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x802040,
    metalness: 0.1,
    roughness: 0.45,
    bumpMap: quiltTexture,
    bumpScale: 0.015,
  });

  // Darker material for interior/shadows if needed, but we'll stick to one main material for coherence
  const darkLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x501025,
    metalness: 0.1,
    roughness: 0.6,
  });

  // --- Dimensions ---
  // Approximate clutch dimensions normalized to ~1 unit scale later
  const bagWidth = 0.70;
  const bagHeight = 0.45;
  const bagDepth = 0.12;
  const flapLength = 0.38;
  const radiusBottom = 0.04;

  // --- Geometry Construction ---

  // 1. Back Panel
  // A simple box for the back pocket
  const backPanelGeom = new THREE.BoxGeometry(bagWidth, bagHeight, bagDepth * 0.8);
  const backPanel = new THREE.Mesh(backPanelGeom, leatherMat);
  backPanel.position.set(0, bagHeight / 2 - 0.02, -bagDepth / 2);
  root.add(backPanel);

  // 2. Bottom Curve
  // Cylinder segment to connect back to front bottom
  // Radius ~ bagDepth/2 + curve
  const bottomRadius = bagDepth * 0.6;
  const bottomGeom = new THREE.CylinderGeometry(
    bottomRadius, bottomRadius, bagWidth, 32, 1, true, 
    Math.PI / 2, Math.PI / 2 // Start 90deg, span 90deg -> Quarter circle
  );
  const bottomCurve = new THREE.Mesh(bottomGeom, leatherMat);
  // Rotate to align: Cylinder is Y-up, we need it to curve in Z-Y plane
  bottomCurve.rotation.z = Math.PI / 2; 
  // Position: Center of the arc should be at (0, bottomRadius, -bagDepth/2 + bottomRadius) roughly
  // Actually, let's place the pivot at the center of the cylinder
  bottomCurve.position.set(0, bottomRadius, -bagDepth / 2 + bottomRadius);
  root.add(bottomCurve);

  // 3. Front Panel (Lower part)
  // Box sitting on top of the bottom curve
  const frontPanelHeight = bagHeight * 0.6;
  const frontPanelGeom = new THREE.BoxGeometry(bagWidth, frontPanelHeight, bagDepth * 0.9);
  const frontPanel = new THREE.Mesh(frontPanelGeom, leatherMat);
  frontPanel.position.set(0, bottomRadius + frontPanelHeight / 2, bagDepth / 2);
  root.add(frontPanel);

  // 4. Top Flap Assembly
  // The flap folds over the top. It has a rounded "roll" at the top and a hanging part.
  
  // 4a. Flap Roll (Top edge)
  // Cylinder segment for the fold
  const rollRadius = 0.035;
  const rollGeom = new THREE.CylinderGeometry(
    rollRadius, rollRadius, bagWidth, 32, 1, true,
    0, Math.PI // Half cylinder
  );
  const flapRoll = new THREE.Mesh(rollGeom, leatherMat);
  flapRoll.rotation.z = Math.PI / 2; // Curve in Z-Y
  flapRoll.rotation.x = Math.PI; // Face backwards/down
  // Position at top of front panel
  flapRoll.position.set(0, bagHeight - rollRadius, bagDepth / 2);
  root.add(flapRoll);

  // 4b. Flap Hang (The main visible quilted part)
  // Box that hangs down from the roll
  // It needs to cover the front panel partially
  const flapHangHeight = bagHeight * 0.75;
  const flapHangGeom = new THREE.BoxGeometry(bagWidth, flapHangHeight, 0.05); // Thin box
  const flapHang = new THREE.Mesh(flapHangGeom, leatherMat);
  // Position: Below the roll center, slightly forward to drape
  flapHang.position.set(0, bagHeight - rollRadius - flapHangHeight / 2, bagDepth / 2 + 0.01);
  root.add(flapHang);

  // 5. Side Gussets (Folded leather on sides)
  // Visible as vertical strips on the left and right edges
  const gussetWidth = 0.04;
  const gussetHeight = bagHeight;
  const gussetDepth = bagDepth;
  
  // Left Gusset
  const gussetLeftGeom = new THREE.BoxGeometry(gussetWidth, gussetHeight, gussetDepth);
  const gussetLeft = new THREE.Mesh(gussetLeftGeom, darkLeatherMat);
  gussetLeft.position.set(-bagWidth / 2 - gussetWidth / 2, bagHeight / 2, 0);
  root.add(gussetLeft);

  // Right Gusset
  const gussetRightGeom = new THREE.BoxGeometry(gussetWidth, gussetHeight, gussetDepth);
  const gussetRight = new THREE.Mesh(gussetRightGeom, darkLeatherMat);
  gussetRight.position.set(bagWidth / 2 + gussetWidth / 2, bagHeight / 2, 0);
  root.add(gussetRight);

  // 6. Texture Alignment
  // The quilt pattern needs to look continuous and sized correctly.
  // Adjust UVs or texture repeat.
  // Bag width is 0.7. Diamond size in texture is 64px out of 512px = 1/8 of texture.
  // We want ~10 diamonds across the width.
  // 0.7 / 10 = 0.07 per diamond.
  // Texture repeat = Width / DiamondWorldSize = 0.7 / 0.07 = 10.
  quiltTexture.repeat.set(10, 14); // 10 across, 14 down
  quiltTexture.offset.set(0, 0);

  // --- Normalization ---
  fitToUnitCube(root);

  return root;
}