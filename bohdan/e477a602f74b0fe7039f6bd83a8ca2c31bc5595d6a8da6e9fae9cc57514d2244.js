export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  
  // Feather material: matte, off-white
  const featherMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    metalness: 0.0,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });

  // Brass material: shiny metal, gold/bronze tone
  // Using emissive to ensure brightness in dim render as per metal handbook
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xc5a059,
    emissiveIntensity: 0.2
  });

  // Downy fibers material
  const downMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- 1. Feather Vane ---
  // Create a custom shape for the feather outline
  const featherShape = new THREE.Shape();
  // Start at bottom center (relative to vane local coords)
  featherShape.moveTo(0, -1.2); 
  // Left curve out to widest point
  featherShape.quadraticCurveTo(-0.1, -0.5, -0.35, 0.2);
  // Curve to tip
  featherShape.quadraticCurveTo(-0.1, 0.8, 0, 1.4);
  // Right curve from tip
  featherShape.quadraticCurveTo(0.1, 0.8, 0.45, 0.2);
  // Curve back to bottom
  featherShape.quadraticCurveTo(0.15, -0.5, 0, -1.2);

  // Extrude slightly for thickness
  const vaneGeom = new THREE.ExtrudeGeometry(featherShape, {
    depth: 0.008,
    bevelEnabled: false,
  });
  
  // Center the geometry
  vaneGeom.center();
  
  const vane = new THREE.Mesh(vaneGeom, featherMat);
  // Rotate to lie flat in XZ plane initially, then we will orient the whole group
  vane.rotation.x = Math.PI / 2; 
  root.add(vane);

  // Procedural Texture for Feather Veins
  // We need to paint a central rachis line and some barbs
  const texWidth = 128;
  const texHeight = 256;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  for (let i = 0; i < texWidth; i++) {
    for (let j = 0; j < texHeight; j++) {
      const idx = (i + j * texWidth) * 4;
      
      // Base color: off-white
      let r = 240, g = 240, b = 240;
      
      // Central rachis (darker line down the middle)
      const centerX = texWidth / 2;
      const distFromCenter = Math.abs(i - centerX);
      if (distFromCenter < 3) {
        r = 180; g = 160; b = 140; // Brownish shaft color
      } else if (distFromCenter < 6) {
        // Soft edge of shaft
        const t = (distFromCenter - 3) / 3;
        r = 180 + (60 * t);
        g = 160 + (80 * t);
        b = 140 + (100 * t);
      }

      // Faint barbs (radiating lines)
      // Simple noise/lines logic
      if (j % 8 === 0 && distFromCenter > 8) {
         const alpha = 0.1;
         r = r * (1-alpha) + 200 * alpha;
         g = g * (1-alpha) + 200 * alpha;
         b = b * (1-alpha) + 200 * alpha;
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  const featherTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  featherTexture.colorSpace = THREE.SRGBColorSpace;
  featherTexture.needsUpdate = true;
  featherTexture.wrapS = THREE.ClampToEdgeWrapping;
  featherTexture.wrapT = THREE.ClampToEdgeWrapping;
  
  featherMat.map = featherTexture;
  featherMat.roughnessMap = featherTexture; // Use alpha/brightness for roughness variation if needed, but color map is enough for now.


  // --- 2. Rachis (Shaft inside the vane) ---
  // Visible part of the shaft extending below the vane and through it
  const rachisGeom = new THREE.CylinderGeometry(0.015, 0.025, 2.8, 12);
  const rachis = new THREE.Mesh(rachisGeom, brassMat); // Actually the shaft inside is often horn/keratin, but here it looks integrated with the brass dip or dark. 
  // Looking closely at reference: The shaft continues down into the brass. The part inside the feather is dark/brown.
  // Let's make a separate dark shaft for the feather part.
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.7 });
  const featherShaft = new THREE.Mesh(rachisGeom, shaftMat);
  // Position so it aligns with vane center
  featherShaft.position.y = 0.2; 
  featherShaft.rotation.x = Math.PI / 2;
  root.add(featherShaft);


  // --- 3. Brass Dip / Holder ---
  // Profile for LatheGeometry (radius, y)
  // Starts from the nib tip (bottom) and goes up to where feather enters
  const profilePoints = [
    new THREE.Vector2(0, 0),             // Tip of nib
    new THREE.Vector2(0.02, 0.15),       // Start of nib widening
    new THREE.Vector2(0.04, 0.3),        // Base of nib
    new THREE.Vector2(0.045, 0.4),       // Start of handle taper
    new THREE.Vector2(0.06, 0.8),        // Widest part of bulb
    new THREE.Vector2(0.05, 1.2),        // Narrowing of bulb
    new THREE.Vector2(0.055, 1.3),       // Slight flare at top rim
    new THREE.Vector2(0.058, 1.35),      // Top edge
    new THREE.Vector2(0, 1.35)           // Center top
  ];

  const brassGeom = new THREE.LatheGeometry(profilePoints, 32);
  const brassDip = new THREE.Mesh(brassGeom, brassMat);
  // The lathe creates it upright. We need to align it with the shaft.
  // The shaft is along X axis (due to rotation.x = PI/2 on vane group logic? No, let's keep root simple).
  // Let's orient the brass dip to match the feather shaft.
  // Feather shaft is along X axis (rotation.x = PI/2 on vane makes it lie in XZ? No.)
  // Let's restart orientation logic for clarity.
  
  // Reset orientations to standard Y-up for construction, then rotate group at end.
  vane.rotation.x = 0; 
  vane.rotation.y = 0;
  vane.position.set(0, 1.5, 0); // Move up so bottom is near 0
  
  featherShaft.rotation.x = 0;
  featherShaft.position.set(0, 0.5, 0); // Center of shaft

  brassDip.rotation.x = 0;
  brassDip.position.set(0, -0.6, 0); // Below the shaft

  // Re-add to root
  root.add(vane);
  root.add(featherShaft);
  root.add(brassDip);


  // --- 4. Downy Barbs (Fuzzy base) ---
  // Create a few thin lines/cylinders at the base of the vane
  const downGroup = new THREE.Group();
  const downGeom = new THREE.CylinderGeometry(0.002, 0.001, 0.4, 6);
  
  for (let i = 0; i < 12; i++) {
    const down = new THREE.Mesh(downGeom, downMat);
    const angle = (i / 12) * Math.PI * 2;
    const radius = 0.03;
    down.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    down.lookAt(0, 0.5, 0); // Point upwards/outwards
    down.rotateX(Math.PI / 2); // Correct orientation for cylinder
    downGroup.add(down);
  }
  downGroup.position.set(0, 0.2, 0); // Base of vane
  root.add(downGroup);


  // --- 5. Final Orientation ---
  // The reference shows the pen diagonal, tip pointing down-left.
  // Rotate the whole group.
  root.rotation.z = Math.PI / 4; // Tilt right
  root.rotation.x = -Math.PI / 6; // Tilt forward slightly
  
  // Center the object roughly before fitting
  root.position.set(0, 0, 0);

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