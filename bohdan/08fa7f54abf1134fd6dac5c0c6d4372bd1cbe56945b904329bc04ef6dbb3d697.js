export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glass: High transmission, low roughness, slight thickness for refraction volume
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.05,
    side: THREE.DoubleSide,
  });

  // Lid: Matte plastic, light blue
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x89cff0,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Label Base: Yellow plastic/paper
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Base color white, texture provides yellow
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Procedural Label Texture (Sun Graphic) ---
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const cx = texSize / 2;
  const cy = texSize / 2;

  // Helper to set pixel
  function setPixel(x, y, r, g, b) {
    if (x < 0 || x >= texSize || y < 0 || y >= texSize) return;
    const idx = (y * texSize + x) * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }

  // Fill background yellow (#ffeb3b)
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      setPixel(x, y, 255, 235, 59);
    }
  }

  // Draw Sun Rays (12 triangles)
  const rayColor = { r: 255, g: 235, b: 59 }; // Same as bg for now, let's make them slightly darker yellow or just outline
  // Actually, let's draw the sun outline and face on the yellow background.
  // Sun Outline Color: Brown #5d4037
  const brown = { r: 93, g: 64, b: 55 };
  const black = { r: 0, g: 0, b: 0 };
  const pink = { r: 255, g: 171, b: 145 };

  const sunRadius = 50;
  const rayLength = 75;
  const numRays = 12;

  for (let i = 0; i < numRays; i++) {
    const angle = (i / numRays) * Math.PI * 2;
    // Draw a triangle from center to outer edge
    // Simplified: Draw lines for rays
    for (let r = sunRadius; r < rayLength; r++) {
      const x = Math.round(cx + Math.cos(angle) * r);
      const y = Math.round(cy + Math.sin(angle) * r);
      // Draw a thick line for the ray
      for (let w = -2; w <= 2; w++) {
         // Perpendicular offset
         const px = Math.round(x + Math.cos(angle + Math.PI/2) * w);
         const py = Math.round(y + Math.sin(angle + Math.PI/2) * w);
         setPixel(px, py, 255, 200, 0); // Darker yellow ray
      }
    }
  }

  // Draw Sun Face Circle (Outline)
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    const x = Math.round(cx + Math.cos(a) * sunRadius);
    const y = Math.round(cy + Math.sin(a) * sunRadius);
    // Thicken outline
    for (let t = -1; t <= 1; t++) {
      setPixel(x + t, y, brown.r, brown.g, brown.b);
      setPixel(x, y + t, brown.r, brown.g, brown.b);
    }
  }

  // Draw Eyes (Black dots)
  function drawCircle(centerX, centerY, radius, color) {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x*x + y*y <= radius*radius) {
          setPixel(centerX + x, centerY + y, color.r, color.g, color.b);
        }
      }
    }
  }
  drawCircle(cx - 18, cy - 10, 5, black);
  drawCircle(cx + 18, cy - 10, 5, black);

  // Draw Mouth (Smile arc)
  for (let a = 0.1; a < Math.PI - 0.1; a += 0.05) {
    const mx = Math.round(cx + Math.cos(a) * 25);
    const my = Math.round(cy + 10 + Math.sin(a) * 15);
    for (let t = -1; t <= 1; t++) {
      setPixel(mx + t, my, brown.r, brown.g, brown.b);
      setPixel(mx, my + t, brown.r, brown.g, brown.b);
    }
  }

  // Draw Cheeks (Pink circles)
  drawCircle(cx - 30, cy + 10, 6, pink);
  drawCircle(cx + 30, cy + 10, 6, pink);

  const labelTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  labelTexture.needsUpdate = true;
  labelTexture.wrapS = THREE.RepeatWrapping;
  labelTexture.wrapT = THREE.ClampToEdgeWrapping;
  labelMat.map = labelTexture;

  // --- Geometry Construction ---

  // 1. Jar Body (Lathe)
  // Profile: Bottom-Left -> Bottom-Right -> Side -> Shoulder -> Neck -> Rim
  const jarProfile = [
    new THREE.Vector2(0.00, 0.00),   // Bottom Center
    new THREE.Vector2(0.32, 0.00),   // Bottom Edge
    new THREE.Vector2(0.32, 0.55),   // Straight Side
    new THREE.Vector2(0.32, 0.65),   // Shoulder Start
    new THREE.Vector2(0.28, 0.75),   // Neck Taper
    new THREE.Vector2(0.28, 0.82),   // Neck Top
    new THREE.Vector2(0.30, 0.85),   // Rim Lip
    new THREE.Vector2(0.00, 0.85),   // Top Center (Close hole for now, lid covers it)
  ];
  // To make it a container, we ideally need thickness. 
  // Using MeshPhysicalMaterial.thickness handles the refraction volume visually.
  // We leave the top open in the profile? Lathe closes it if we go to 0,0.
  // Let's keep it closed at the top (0, 0.85) so it looks like a solid glass block, 
  // but the lid sits on top. The 'thickness' param makes it look like glass.
  // Actually, for a jar, the top should be open to accept the lid, but visually 
  // with transmission, a closed top cap is often fine if the lid covers it.
  // Let's make the profile stop at the neck inner radius to simulate opening?
  // Simpler: Just lathe the outer shell.
  
  const jarGeom = new THREE.LatheGeometry(jarProfile, 32);
  const jar = new THREE.Mesh(jarGeom, glassMat);
  root.add(jar);

  // 2. Lid (Cylinder)
  // Slightly wider than jar rim (0.30)
  const lidGeom = new THREE.CylinderGeometry(0.34, 0.34, 0.08, 32);
  const lid = new THREE.Mesh(lidGeom, lidMat);
  lid.position.y = 0.85 + 0.04; // Sit on top of rim
  root.add(lid);

  // 3. Label (Cylinder Segment)
  // Radius slightly larger than jar body (0.32)
  const labelRadius = 0.325;
  const labelHeight = 0.35;
  const labelY = 0.25; // Mid-height of body
  
  // We use a full cylinder but with transparent sides? No, just a cylinder mesh.
  // To make it look like a label, we can use a cylinder with openEnded=true? 
  // No, standard cylinder is a tube.
  // We want the texture on the outside.
  const labelGeom = new THREE.CylinderGeometry(labelRadius, labelRadius, labelHeight, 32, 1, true);
  const label = new THREE.Mesh(labelGeom, labelMat);
  label.position.y = labelY;
  
  // Rotate so the texture seam is at the back and the sun (center of texture) is at front (+Z)
  // Cylinder UVs: U=0 is at +X. Texture center is U=0.5.
  // We want U=0.5 at +Z (angle PI/2).
  // Current U=0 is at angle 0 (+X). U=0.5 is at angle PI (-X).
  // So we need to rotate the mesh so that -X faces +Z.
  // Rotation of -90 deg (PI/2) around Y moves +X to +Z.
  // Wait. If I rotate -90, +X becomes +Z. The seam (U=0) moves to +Z.
  // I want the center (U=0.5) at +Z.
  // So I want the seam at -Z (back).
  // Seam is at +X initially. Rotate +90 (PI/2) -> Seam at +Z. No.
  // Rotate 180 (PI) -> Seam at -X.
  // Rotate -90 (-PI/2) -> Seam at +Z.
  // I want Center (opposite seam) at +Z. So Seam at -Z.
  // Seam starts at +X. To get to -Z, rotate +90 (PI/2).
  // +X (0 rad) + PI/2 = +Y? No.
  // Angle 0 is +X. Angle PI/2 is +Z.
  // If I rotate mesh by -PI/2, the point at +X moves to +Z.
  // So Seam moves to +Z.
  // I want Center (PI away from seam) at +Z. So Seam at -Z (Angle -PI/2 or 3PI/2).
  // Start Seam at +X (0). Target Seam at -Z (-PI/2).
  // Rotation = -PI/2.
  // Let's just try `label.rotation.y = -Math.PI / 2`.
  label.rotation.y = -Math.PI / 2;
  
  root.add(label);

  // Normalize
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