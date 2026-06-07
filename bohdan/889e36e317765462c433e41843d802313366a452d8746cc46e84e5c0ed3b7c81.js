export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  
  // Blade: Polished steel. Metalness capped at 0.6 per rules.
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Bolster & Pommel: Brass/Gold.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Handle: Matte black composite.
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Procedural Texture for Blade Logo ---
  // Creates a simple decal with blocky text simulation for "MIYABI" area
  const logoWidth = 256;
  const logoHeight = 64;
  const logoData = new Uint8Array(logoWidth * logoHeight * 4);
  
  // Fill background (transparent/silver)
  for (let i = 0; i < logoWidth * logoHeight; i++) {
    logoData[i * 4 + 0] = 200; // R
    logoData[i * 4 + 1] = 200; // G
    logoData[i * 4 + 2] = 200; // B
    logoData[i * 4 + 3] = 0;   // A (transparent mostly, we draw black text)
  }

  // Helper to draw a filled rect in the texture data
  function drawRect(x, y, w, h, r, g, b, a) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (px >= 0 && px < logoWidth && py >= 0 && py < logoHeight) {
          const idx = (py * logoWidth + px) * 4;
          logoData[idx + 0] = r;
          logoData[idx + 1] = g;
          logoData[idx + 2] = b;
          logoData[idx + 3] = a;
        }
      }
    }
  }

  // Draw "MIYABI" approx block letters (black)
  // Position: roughly center-left of texture
  const textY = 14;
  const textH = 30;
  const gap = 4;
  let cursor = 20;

  // M
  drawRect(cursor, textY, 2, textH, 0, 0, 0, 255);
  drawRect(cursor + 2, textY, 6, 2, 0, 0, 0, 255); // top bar
  drawRect(cursor + 4, textY + 10, 2, 20, 0, 0, 0, 255); // middle V
  drawRect(cursor + 8, textY, 2, textH, 0, 0, 0, 255);
  cursor += 14 + gap;

  // I
  drawRect(cursor, textY, 2, textH, 0, 0, 0, 255);
  cursor += 4 + gap;

  // Y
  drawRect(cursor, textY, 2, 15, 0, 0, 0, 255); // left arm
  drawRect(cursor + 6, textY, 2, 15, 0, 0, 0, 255); // right arm
  drawRect(cursor + 3, textY + 14, 2, 16, 0, 0, 0, 255); // stem
  cursor += 10 + gap;

  // A
  drawRect(cursor, textY + 15, 2, 15, 0, 0, 0, 255);
  drawRect(cursor + 6, textY + 15, 2, 15, 0, 0, 0, 255);
  drawRect(cursor, textY, 2, 16, 0, 0, 0, 255);
  drawRect(cursor + 6, textY, 2, 16, 0, 0, 0, 255);
  drawRect(cursor + 2, textY + 14, 6, 2, 0, 0, 0, 255); // crossbar
  cursor += 10 + gap;

  // B
  drawRect(cursor, textY, 2, textH, 0, 0, 0, 255);
  drawRect(cursor + 2, textY, 6, 2, 0, 0, 0, 255);
  drawRect(cursor + 2, textY + 14, 6, 2, 0, 0, 0, 255);
  drawRect(cursor + 2, textY + 28, 6, 2, 0, 0, 0, 255);
  drawRect(cursor + 8, textY, 2, 15, 0, 0, 0, 255);
  drawRect(cursor + 8, textY + 14, 2, 15, 0, 0, 0, 255);
  cursor += 12 + gap;

  // I
  drawRect(cursor, textY, 2, textH, 0, 0, 0, 255);
  
  // Smaller text "SG2" simulation below
  drawRect(20, 48, 40, 4, 0, 0, 0, 255);
  drawRect(20, 54, 30, 4, 0, 0, 0, 255);

  const logoTexture = new THREE.DataTexture(logoData, logoWidth, logoHeight, THREE.RGBAFormat);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.needsUpdate = true;
  
  // Apply texture to blade material
  bladeMat.map = logoTexture;
  bladeMat.transparent = true;
  // Adjust UVs via texture transform if needed, but default mapping on extrude is usually okay for top/bottom
  // We need to ensure the logo appears on the flat face. 
  // Extrude UVs: Side is 0, Top is 1, Bottom is 2. 
  // We want it on Top/Bottom. The texture coordinates for Top/Bottom in ExtrudeGeometry 
  // usually map the shape bounds to 0-1.
  logoTexture.repeat.set(1, 1);
  logoTexture.offset.set(0, 0);


  // --- Geometry Construction ---

  // 1. Blade
  // Define the 2D shape of the knife from a top-down view
  const bladeShape = new THREE.Shape();
  // Start at heel (tang end)
  bladeShape.moveTo(0, 0); 
  // Spine (top edge), curving slightly up then down to tip
  bladeShape.bezierCurveTo(0.15, 0.02, 0.35, 0.03, 0.50, 0.00); 
  // Tip
  bladeShape.lineTo(0.52, -0.01);
  // Edge (bottom), curving back to heel
  bladeShape.bezierCurveTo(0.35, -0.08, 0.15, -0.06, 0.0, -0.04);
  // Heel vertical line to close
  bladeShape.lineTo(0, 0);

  const bladeExtrudeSettings = {
    steps: 1,
    depth: 0.004, // Spine thickness
    bevelEnabled: true,
    bevelThickness: 0.002, // Half thickness to create edge
    bevelSize: 0.001,
    bevelSegments: 2
  };

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, bladeExtrudeSettings);
  // Center the geometry roughly
  bladeGeom.center();
  
  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Rotate to lie flat in XZ plane (Extrude creates along Z, we want it flat)
  // Actually Extrude creates along Z by default. The shape is in XY.
  // We want the knife to lie along +Z axis.
  // So we rotate -90 deg around X to put the shape in XZ plane.
  blade.rotation.x = -Math.PI / 2;
  // The shape was drawn from x=0 to x=0.52. Center() moved it to -0.26 to 0.26.
  // We want the heel at z=0 and tip at z=positive.
  // Let's adjust position manually instead of relying solely on center() for logic.
  // Re-creating logic: Shape is 0..0.52 in X. Center makes it -0.26..0.26.
  // Rotate X -90: X becomes Z. So Z is -0.26..0.26.
  // We want heel at 0. So shift Z by +0.26.
  blade.position.z += 0.26; 
  // Also shift Y so the blade sits on the "equator" of the handle/bolster assembly
  // The bolster will be centered at 0,0,0 roughly.
  blade.position.y = 0; 
  
  root.add(blade);

  // 2. Bolster (Collar)
  // Connects rectangular tang to round handle.
  // Use LatheGeometry for a smooth organic collar.
  const bolsterProfile = [
    new THREE.Vector2(0.025, -0.02), // Inner radius (matches blade tang half-width approx)
    new THREE.Vector2(0.035, -0.02), // Flare out
    new THREE.Vector2(0.045, 0.00),  // Max radius
    new THREE.Vector2(0.040, 0.02),  // Taper to handle
  ];
  const bolsterGeom = new THREE.LatheGeometry(bolsterProfile, 32);
  const bolster = new THREE.Mesh(bolsterGeom, brassMat);
  // Position at blade heel. 
  // Blade heel is now at z=0 (after shift).
  // Bolster should start at z=0 and go towards negative Z (handle direction).
  // Lathe rotates around Y. Profile X is radius, Y is height (which we map to Z in world).
  // Wait, Lathe rotates around Y axis. The profile is in XY plane.
  // So the resulting mesh is vertical (Y-up). We need it horizontal (Z-axis).
  // Rotate 90 deg around X.
  bolster.rotation.x = Math.PI / 2;
  // Position: The profile Y goes from -0.02 to 0.02. Center is 0.
  // We want the "blade side" (Y=-0.02 in profile -> Z=-0.02 in world after rot) to meet the blade.
  // Blade heel is at z=0. So shift bolster +0.02 in Z.
  bolster.position.z = 0.02;
  root.add(bolster);

  // 3. Handle
  // Ergonomic shape, tapering.
  const handleProfile = [
    new THREE.Vector2(0.040, 0.00), // Start at bolster (radius)
    new THREE.Vector2(0.038, 0.05), // Slight taper
    new THREE.Vector2(0.036, 0.10),
    new THREE.Vector2(0.035, 0.15),
    new THREE.Vector2(0.034, 0.20),
    new THREE.Vector2(0.032, 0.25),
    new THREE.Vector2(0.030, 0.30), // End before pommel
  ];
  const handleGeom = new THREE.LatheGeometry(handleProfile, 32);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  // Rotate to align with Z axis
  handle.rotation.x = Math.PI / 2;
  // Position: Start where bolster ends.
  // Bolster profile Y max was 0.02. So bolster ends at z = 0.02 + 0.02 = 0.04.
  // Handle profile Y starts at 0.00. So place handle at z = 0.04.
  handle.position.z = 0.04;
  root.add(handle);

  // 4. Pommel (End Cap)
  // Flat brass cap at the end.
  const pommelGeom = new THREE.CylinderGeometry(0.032, 0.032, 0.015, 32);
  const pommel = new THREE.Mesh(pommelGeom, brassMat);
  // Rotate to face Z axis (Cylinder is Y-up)
  pommel.rotation.x = Math.PI / 2;
  // Position at end of handle.
  // Handle length is 0.30. Start z=0.04. End z = 0.34.
  // Pommel thickness 0.015. Center at 0.34 + 0.0075.
  pommel.position.z = 0.34 + 0.0075;
  root.add(pommel);

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