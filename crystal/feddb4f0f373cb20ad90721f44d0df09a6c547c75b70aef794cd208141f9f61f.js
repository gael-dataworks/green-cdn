export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Copper material following the "METAL BRIGHTNESS via EMISSIVE" guide.
  // Metalness capped at 0.4 to avoid blackness, emissive used to lift brightness.
  const copperColor = 0xd08a5a;
  const copperMatPlain = new THREE.MeshStandardMaterial({
    color: copperColor,
    metalness: 0.4,
    roughness: 0.3,
    emissive: copperColor,
    emissiveIntensity: 0.35,
  });

  // Patterned material for the body (bands + central motif)
  const patternTexture = createCopperPatternTexture(THREE);
  const copperMatPatterned = new THREE.MeshStandardMaterial({
    color: copperColor,
    metalness: 0.4,
    roughness: 0.3,
    emissive: copperColor,
    emissiveIntensity: 0.35,
    map: patternTexture,
  });

  // --- Dimensions ---
  const cupRadius = 0.35;
  const cupHeight = 0.75;
  const rimThickness = 0.04;
  const wallThickness = 0.02;

  // --- Body (Lathe) ---
  // Profile points for a Moscow Mule style mug (straight sides, rounded bottom, rolled rim)
  // Coordinates are (radius, height). Y is up.
  const profilePoints = [
    new THREE.Vector2(0, 0),                   // Bottom center
    new THREE.Vector2(cupRadius - wallThickness, 0), // Bottom inner edge
    new THREE.Vector2(cupRadius - wallThickness, cupHeight - rimThickness), // Inner wall top
    new THREE.Vector2(cupRadius, cupHeight - rimThickness), // Rim inner lip
    new THREE.Vector2(cupRadius + rimThickness * 0.5, cupHeight), // Rim roll outer
    new THREE.Vector2(cupRadius, cupHeight),   // Rim top edge
    new THREE.Vector2(cupRadius, cupHeight * 0.15), // Outer wall down to rounded bottom start
    new THREE.Vector2(cupRadius * 0.8, cupHeight * 0.05), // Bottom curve
    new THREE.Vector2(0, 0),                   // Close profile at bottom center (solid base)
  ];

  // We need a clean profile for Lathe. The above is a bit messy for a single lathe if we want thickness.
  // Simpler approach: Solid outer shell lathe.
  const outerProfile = [
    new THREE.Vector2(0, 0),                   // Bottom center
    new THREE.Vector2(cupRadius, 0),           // Bottom outer edge
    new THREE.Vector2(cupRadius, cupHeight * 0.1), // Start of straight wall (rounded bottom corner)
    new THREE.Vector2(cupRadius, cupHeight - rimThickness), // Top of straight wall
    new THREE.Vector2(cupRadius + rimThickness * 0.8, cupHeight - rimThickness * 0.5), // Rim roll
    new THREE.Vector2(cupRadius, cupHeight),   // Top lip
    new THREE.Vector2(0, cupHeight)            // Top center (closes the top? No, we want open)
  ];
  // To make it open, we stop at the inner lip.
  // Actually, let's just make a solid thick-walled cup using two lathes or a thick extrusion?
  // Lathe with thickness is hard without inner profile.
  // Strategy: One Lathe for the main body shape (solid), then we rely on the material.
  // To simulate thickness at the rim, we shape the profile carefully.
  
  const bodyProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(cupRadius, 0),
    new THREE.Vector2(cupRadius, cupHeight * 0.15),
    new THREE.Vector2(cupRadius, cupHeight - rimThickness),
    new THREE.Vector2(cupRadius + 0.05, cupHeight - rimThickness * 0.5), // Rolled rim
    new THREE.Vector2(cupRadius - wallThickness, cupHeight - rimThickness), // Inner lip
    new THREE.Vector2(cupRadius - wallThickness, 0.05), // Inner wall
    new THREE.Vector2(cupRadius * 0.6, 0.05), // Inner bottom curve
    new THREE.Vector2(0, 0.05) // Inner bottom center
  ];
  
  // Wait, Lathe closes the shape if start/end X is 0. 
  // If I go 0->R->...->0, it's a solid vase.
  // If I go R_inner->R_outer->... it's a shell? No.
  // Let's make a solid cup shape (like a thick ceramic mug) which is visually fine for metal too.
  const solidProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(cupRadius, 0),
    new THREE.Vector2(cupRadius, cupHeight * 0.1),
    new THREE.Vector2(cupRadius, cupHeight - rimThickness),
    new THREE.Vector2(cupRadius + 0.06, cupHeight - rimThickness * 0.5), // Rim
    new THREE.Vector2(cupRadius, cupHeight),
    new THREE.Vector2(0, cupHeight)
  ];
  
  const bodyGeom = new THREE.LatheGeometry(solidProfile, 32);
  const body = new THREE.Mesh(bodyGeom, copperMatPatterned);
  root.add(body);

  // --- Handle ---
  // TubeGeometry for an organic handle shape
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(cupRadius, cupHeight * 0.75, 0), // Top attach
    new THREE.Vector3(cupRadius + 0.1, cupHeight * 0.8, 0),
    new THREE.Vector3(cupRadius + 0.35, cupHeight * 0.55, 0), // Outer loop
    new THREE.Vector3(cupRadius + 0.1, cupHeight * 0.3, 0),
    new THREE.Vector3(cupRadius, cupHeight * 0.25, 0)  // Bottom attach
  ]);

  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.045, 12, false);
  const handle = new THREE.Mesh(handleGeom, copperMatPlain);
  // Rotate to align with cup side (Curve is in XY plane, Cup is Y-up, Handle extends in X)
  // The curve points are already in local space relative to cup center.
  // Default Tube is along the curve.
  // We need to ensure the handle is on the side. The points use X for radius, Y for height.
  // This places the handle in the XY plane. The cup is rotationally symmetric around Y.
  // So the handle is correctly positioned on the +X side.
  root.add(handle);

  // --- Decoration: Central Motif (Geometry Decal) ---
  // The reference shows a raised or engraved central flower. 
  // To ensure it's visible and 3D, I'll add a shallow ExtrudeGeometry mesh on the surface.
  // Shape: A simplified Fleur-de-lis / vertical leaf pattern.
  const motifShape = new THREE.Shape();
  const mW = 0.08;
  const mH = 0.15;
  // Draw a vertical symmetric shape
  motifShape.moveTo(0, -mH/2);
  motifShape.bezierCurveTo(mW/2, -mH/4, mW, 0, 0, mH/2); // Right half top
  motifShape.bezierCurveTo(-mW, 0, -mW/2, -mH/4, 0, -mH/2); // Left half top
  // Add side loops
  motifShape.moveTo(0, 0);
  motifShape.bezierCurveTo(mW, -mH/4, mW*1.2, -mH/2, 0, -mH/2);
  motifShape.moveTo(0, 0);
  motifShape.bezierCurveTo(-mW, -mH/4, -mW*1.2, -mH/2, 0, -mH/2);
  
  const motifExtrudeSettings = { depth: 0.005, bevelEnabled: false };
  const motifGeom = new THREE.ExtrudeGeometry(motifShape, motifExtrudeSettings);
  // Center the geometry
  motifGeom.translate(0, 0, 0); 
  
  const motifMesh = new THREE.Mesh(motifGeom, copperMatPlain); // Plain copper for relief
  
  // Position on the surface of the cup
  // Cup radius is ~0.35. Motif should be at front (+Z).
  const motifRadius = cupRadius + 0.006; // Slightly above surface
  motifMesh.position.set(0, cupHeight * 0.5, motifRadius);
  
  // Orient to face outward (Z axis points out from cup surface at +Z)
  // Extrude is in XY plane facing +Z by default. This is correct.
  root.add(motifMesh);

  fitToUnitCube(THREE, root);
  return root;
}

function createCopperPatternTexture(THREE) {
  const width = 512;
  const height = 512;
  const data = new Uint8Array(width * height * 4);
  
  // Colors
  const baseR = 208, baseG = 138, baseB = 90; // Copper #d08a5a
  const darkR = 100, darkG = 60, darkB = 40;  // Dark engraved copper
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Default to base copper
      let r = baseR, g = baseG, b = baseB;
      
      const u = x / width;
      const v = y / height;
      
      // Bands (Top and Bottom 15%)
      const inTopBand = v > 0.85;
      const inBottomBand = v < 0.15;
      
      if (inTopBand || inBottomBand) {
        // Scrolling vine pattern using sine waves
        const freq = 20;
        const wave = Math.sin(u * Math.PI * freq) * Math.cos(v * Math.PI * 10);
        // Threshold to create lines
        if (Math.abs(wave) > 0.6) {
           r = darkR; g = darkG; b = darkB;
        }
        // Add a border line
        if (v > 0.88 && v < 0.89 || v < 0.12 && v > 0.11) {
           r = darkR; g = darkG; b = darkB;
        }
      }
      
      // Central Motif (Vertical strip in middle)
      // Only draw if not in bands to avoid overlap mess
      if (!inTopBand && !inBottomBand) {
        const centerX = 0.5;
        const distX = Math.abs(u - centerX);
        const centerY = 0.5;
        const distY = Math.abs(v - centerY);
        
        // Simple vertical diamond/leaf shape
        // Leaf shape: |x| < width(y)
        // Width is max at center, 0 at top/bottom of motif area
        const motifHeight = 0.25;
        if (distY < motifHeight / 2) {
           // Normalized Y within motif (-1 to 1)
           const localY = distY / (motifHeight / 2); 
           // Leaf width function: parabola
           const leafWidth = 0.08 * (1 - localY * localY);
           
           if (distX < leafWidth) {
             r = darkR; g = darkG; b = darkB;
           }
           
           // Side loops (simplified)
           const loopY = 0.1;
           if (Math.abs(distY - loopY) < 0.05) {
             const loopWidth = 0.05;
             if (distX > leafWidth && distX < leafWidth + loopWidth) {
                r = darkR; g = darkG; b = darkB;
             }
           }
        }
      }
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  // Adjust repeat to match the cup circumference if needed, 
  // but for a single motif, 1 repeat is fine.
  return texture;
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