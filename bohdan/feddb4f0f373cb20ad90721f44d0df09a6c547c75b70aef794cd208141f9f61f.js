export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Copper: Warm reddish-orange, high metalness (capped at 0.6 for this renderer), low roughness.
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.25,
  });

  // --- Procedural Texture for Engravings ---
  // The cup has dark etched patterns (scrolls and floral motifs).
  // We generate a DataTexture to represent this surface pattern efficiently.
  const texWidth = 256;
  const texHeight = 256;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  const baseR = 184, baseG = 115, baseB = 51;   // Copper #b87333
  const darkR = 62,  darkG = 39,  darkB = 35;   // Dark oxidized copper #3e2723

  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      const u = x / texWidth;
      const v = y / texHeight;
      
      let isPattern = false;

      // Top and Bottom Bands (Scrollwork)
      // Bands occupy roughly top 15% and bottom 15%
      const bandHeight = 0.12;
      const inTopBand = v > (1.0 - bandHeight);
      const inBottomBand = v < bandHeight;

      if (inTopBand || inBottomBand) {
        // Create a scroll pattern using sine waves
        // Shift phase based on band to vary it slightly
        const phase = inTopBand ? 0 : Math.PI;
        const wave = Math.sin(u * Math.PI * 12 + phase);
        const wave2 = Math.sin(u * Math.PI * 24);
        
        // Threshold to create lines
        if (Math.abs(wave) > 0.6 || Math.abs(wave2) > 0.8) {
          isPattern = true;
        }
        // Add some dots
        if (Math.sin(u * Math.PI * 40) > 0.9 && Math.sin(v * Math.PI * 40) > 0.9) {
           isPattern = true;
        }
      }

      // Center Motifs (Vertical floral/wheat shapes)
      // Place 3 motifs around the cup (at u = 0, 0.33, 0.66)
      const motifWidth = 0.08;
      const motifCenterV = 0.5;
      const motifHeight = 0.4;
      
      // Check if we are near one of the 3 motif centers
      const centers = [0.0, 0.333, 0.666];
      for (const cx of centers) {
        let du = Math.abs(u - cx);
        if (du > 0.5) du = 1.0 - du; // Wrap around
        
        if (du < motifWidth && Math.abs(v - motifCenterV) < motifHeight / 2) {
          // Draw a stylized vertical shape
          // Narrow waist, wider top and bottom
          const localV = (v - motifCenterV) / (motifHeight / 2); // -1 to 1
          const shapeWidth = motifWidth * (0.3 + 0.7 * (1.0 - Math.abs(localV)));
          
          if (du < shapeWidth) {
            isPattern = true;
            // Add a central line
            if (du < shapeWidth * 0.2) isPattern = true;
          }
          
          // Decorative curls at top/bottom of motif
          if (Math.abs(Math.abs(localV) - 0.9) < 0.1) {
             if (Math.sin(u * 100) > 0.5) isPattern = true;
          }
        }
      }

      const idx = (y * texWidth + x) * 4;
      if (isPattern) {
        data[idx] = darkR;
        data[idx + 1] = darkG;
        data[idx + 2] = darkB;
        data[idx + 3] = 255;
      } else {
        data[idx] = baseR;
        data[idx + 1] = baseG;
        data[idx + 2] = baseB;
        data[idx + 3] = 255;
      }
    }
  }

  const patternTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  patternTexture.colorSpace = THREE.SRGBColorSpace;
  patternTexture.needsUpdate = true;
  // LatheGeometry UVs: U wraps around, V goes up. 
  // We want the pattern to wrap once.
  patternTexture.wrapS = THREE.RepeatWrapping;
  patternTexture.wrapT = THREE.ClampToEdgeWrapping;
  patternTexture.repeat.set(1, 1);

  // Apply texture to copper material for the body
  const bodyMat = copperMat.clone();
  bodyMat.map = patternTexture;
  // Slightly reduce metalness for the painted/etched parts visually, 
  // but since it's one material, we rely on the color map for contrast.
  bodyMat.roughness = 0.3; 

  // --- Body Geometry (Lathe) ---
  // Profile defines the cross-section of the cup (C-shape for thickness)
  // Coordinates: (radius, height)
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center (inner)
    new THREE.Vector2(0.14, 0.00), // Rounded inner bottom start
    new THREE.Vector2(0.16, 0.02), // Inner wall start
    new THREE.Vector2(0.16, 0.55), // Inner wall up
    
    new THREE.Vector2(0.17, 0.56), // Inner rim lip
    new THREE.Vector2(0.19, 0.56), // Outer rim lip
    new THREE.Vector2(0.19, 0.54), // Outer rim down
    
    new THREE.Vector2(0.18, 0.02), // Outer wall down
    new THREE.Vector2(0.16, 0.00), // Outer bottom corner
    new THREE.Vector2(0.00, 0.00), // Close at bottom center (outer)
  ];
  
  // Adjusted profile for a more realistic Moscow Mule mug shape
  // Tapered cylinder, rounded bottom, rolled rim.
  const mugProfile = [
    new THREE.Vector2(0.00, 0.00),   // Center bottom
    new THREE.Vector2(0.15, 0.00),   // Bottom edge
    new THREE.Vector2(0.16, 0.05),   // Lower side
    new THREE.Vector2(0.17, 0.50),   // Upper side (taper out slightly)
    new THREE.Vector2(0.19, 0.52),   // Rim outer
    new THREE.Vector2(0.17, 0.52),   // Rim inner
    new THREE.Vector2(0.17, 0.05),   // Inner wall
    new THREE.Vector2(0.15, 0.05),   // Inner bottom curve
    new THREE.Vector2(0.00, 0.05),   // Close inner bottom
  ];

  const bodyGeom = new THREE.LatheGeometry(mugProfile, 32);
  // Fix UV mapping for Lathe to ensure texture wraps correctly
  // Three.js LatheGeometry usually handles this, but we ensure repeat is 1.
  
  const mugBody = new THREE.Mesh(bodyGeom, bodyMat);
  // Shift body up so bottom is at y=0
  mugBody.position.y = 0; 
  root.add(mugBody);

  // --- Handle Geometry (Tube) ---
  // D-shaped handle attached to the side
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.17, 0.15, 0), // Attach point lower
    new THREE.Vector3(0.28, 0.15, 0), // Curve out
    new THREE.Vector3(0.28, 0.45, 0), // Go up
    new THREE.Vector3(0.17, 0.45, 0), // Attach point upper
  ]);

  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.018, 8, false);
  const mugHandle = new THREE.Mesh(handleGeom, copperMat);
  
  // Rotate handle to align with the side of the cup
  // The path is in XY plane, we want it on the side (X axis)
  // Actually, the path defined above is already in the correct orientation relative to the cup
  // if the cup is centered at 0,0,0. The attach points are at x=0.17 (cup radius).
  // We need to rotate the whole handle mesh 90 deg around Y? 
  // No, the path points are (x, y, z). 
  // Cup is rotationally symmetric. Handle attaches at +X.
  // The path goes from y=0.15 to y=0.45. X goes out to 0.28. Z is 0.
  // This places the handle on the +X side, in the XY plane.
  // This is correct.
  
  root.add(mugHandle);

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