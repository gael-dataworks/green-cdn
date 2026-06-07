export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear glass for the jar body
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Light blue plastic/matte metal for the lid
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x87CEEB,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Yellow label material (texture assigned below)
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  // --- Procedural Label Texture ---
  // Draws a yellow background with a smiling sun graphic
  const texWidth = 512;
  const texHeight = 256;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Helper to set pixel
  function setPixel(x, y, r, g, b, a = 255) {
    const idx = (y * texWidth + x) * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = a;
  }

  // Colors
  const cYellow = [255, 235, 59];
  const cBlack = [40, 40, 40];
  const cPink = [255, 180, 180];
  const cWhite = [255, 255, 255];

  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      // Normalize coordinates to center (0,0)
      const u = (x / texWidth) * 2 - 1;
      const v = ((y / texHeight) * 2 - 1) * (texHeight / texWidth); // Aspect correction for drawing
      
      // Base yellow background
      let r = cYellow[0], g = cYellow[1], b = cYellow[2];

      const cx = 0, cy = 0;
      const dist = Math.sqrt(u * u + v * v);
      
      // Sun parameters
      const faceR = 0.35;
      const rayInnerR = 0.45;
      const rayOuterR = 0.65;
      const numRays = 16;

      // Draw Rays
      if (dist > faceR && dist < rayOuterR) {
        const angle = Math.atan2(v, u);
        // Rotate angle to align rays nicely
        const rayAngle = (angle + Math.PI / numRays) % (Math.PI * 2 / numRays);
        const normalizedRayAngle = rayAngle / (Math.PI * 2 / numRays);
        
        // Simple triangular ray mask
        if (normalizedRayAngle < 0.5) {
           // Inside a ray sector
           // Taper width based on distance from center to make them pointy
           const maxW = 0.15 * (dist - faceR) / (rayOuterR - faceR);
           const localAngle = Math.abs(angle % (Math.PI * 2 / numRays) - Math.PI / numRays);
           if (localAngle < maxW) {
             r = cBlack[0]; g = cBlack[1]; b = cBlack[2];
           }
        }
      }

      // Draw Face Circle Outline
      if (Math.abs(dist - faceR) < 0.02) {
        r = cBlack[0]; g = cBlack[1]; b = cBlack[2];
      }

      // Draw Face Interior (optional, keeps yellow but clears rays inside)
      if (dist < faceR - 0.02) {
         // Keep yellow, maybe slightly lighter
         r = 255; g = 245; b = 100;
      }

      // Draw Eyes
      const eyeY = 0.12;
      const eyeXOffset = 0.12;
      const eyeR = 0.04;
      
      // Left Eye
      if (Math.sqrt((u + eyeXOffset)**2 + (v - eyeY)**2) < eyeR) {
        r = cBlack[0]; g = cBlack[1]; b = cBlack[2];
      }
      // Right Eye
      if (Math.sqrt((u - eyeXOffset)**2 + (v - eyeY)**2) < eyeR) {
        r = cBlack[0]; g = cBlack[1]; b = cBlack[2];
      }

      // Draw Smile (Arc)
      const smileY = -0.15;
      const smileR = 0.15;
      const smileDist = Math.sqrt(u**2 + (v - smileY)**2);
      // Check if on arc
      if (Math.abs(smileDist - smileR) < 0.015 && v > smileY) {
        // Limit smile width
        if (Math.abs(u) < 0.15) {
          r = cBlack[0]; g = cBlack[1]; b = cBlack[2];
        }
      }

      // Draw Cheeks
      const cheekY = -0.05;
      const cheekXOffset = 0.22;
      const cheekR = 0.06;
      
      // Left Cheek
      if (Math.sqrt((u + cheekXOffset)**2 + (v - cheekY)**2) < cheekR) {
        // Blend pink
        r = cPink[0]; g = cPink[1]; b = cPink[2];
      }
      // Right Cheek
      if (Math.sqrt((u - cheekXOffset)**2 + (v - cheekY)**2) < cheekR) {
        r = cPink[0]; g = cPink[1]; b = cPink[2];
      }

      setPixel(x, y, r, g, b);
    }
  }

  const labelTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  labelTexture.wrapS = THREE.RepeatWrapping;
  labelTexture.wrapT = THREE.ClampToEdgeWrapping;
  labelTexture.needsUpdate = true;
  labelMat.map = labelTexture;

  // --- Geometry Construction ---

  // 1. Jar Body (Lathe)
  // Profile from bottom-center up to the rim
  const jarProfile = [
    new THREE.Vector2(0, 0),          // Bottom center
    new THREE.Vector2(0.32, 0),       // Bottom edge
    new THREE.Vector2(0.32, 0.05),    // Bottom curve start
    new THREE.Vector2(0.34, 0.15),    // Belly
    new THREE.Vector2(0.34, 0.55),    // Shoulder start
    new THREE.Vector2(0.30, 0.70),    // Neck start
    new THREE.Vector2(0.30, 0.75),    // Neck top
    new THREE.Vector2(0.33, 0.78),    // Lip
    new THREE.Vector2(0.30, 0.80),    // Rim top inner
  ];
  
  const jarGeom = new THREE.LatheGeometry(jarProfile, 32);
  const jar = new THREE.Mesh(jarGeom, glassMat);
  root.add(jar);

  // 2. Lid
  // Slightly wider than the neck, sits on top
  const lidGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.12, 32);
  const lid = new THREE.Mesh(lidGeom, lidMat);
  lid.position.y = 0.80 + 0.06; // Top of rim + half lid height
  root.add(lid);

  // Lid top detail (flat circle to cap the cylinder nicely)
  const lidTopGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.02, 32);
  const lidTop = new THREE.Mesh(lidTopGeom, lidMat);
  lidTop.position.y = 0.80 + 0.12;
  root.add(lidTop);

  // 3. Label
  // A cylinder slightly larger than the jar belly, mapped with the sun texture
  const labelRadius = 0.345; // Just outside the jar surface
  const labelHeight = 0.35;
  const labelY = 0.35; // Centered on the lower body
  
  const labelGeom = new THREE.CylinderGeometry(labelRadius, labelRadius, labelHeight, 48, 1, true);
  const labelMesh = new THREE.Mesh(labelGeom, labelMat);
  labelMesh.position.y = labelY;
  
  // Adjust texture mapping to center the sun
  // The texture is 2:1 aspect ratio (512x256). 
  // Cylinder UVs map 0..1 around circumference.
  // We want the sun centered, so offset X by 0.5 (start at back) or adjust repeat/offset.
  labelTexture.repeat.set(1, 1);
  labelTexture.offset.set(0, 0);
  
  root.add(labelMesh);

  // 4. Glass Thickness / Inner Volume hint (Optional but helps realism)
  // A slightly smaller lathe inside to simulate glass thickness at the bottom
  const innerProfile = [
    new THREE.Vector2(0, 0.05),
    new THREE.Vector2(0.28, 0.05),
    new THREE.Vector2(0.28, 0.15),
    new THREE.Vector2(0.30, 0.55),
    new THREE.Vector2(0.27, 0.70),
    new THREE.Vector2(0.27, 0.75),
  ];
  // Only use if needed for refraction depth, but simple transmission often suffices.
  // Skipping inner mesh to keep draw calls low and rely on transmission thickness.

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