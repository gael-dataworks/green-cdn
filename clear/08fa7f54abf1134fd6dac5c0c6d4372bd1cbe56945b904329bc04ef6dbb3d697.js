export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glass: High transmission, low roughness, slight green/white tint
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Lid: Matte plastic/painted metal, baby blue
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x89cff0,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Label: Bright yellow paper
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffdd00,
    metalness: 0.0,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });

  // --- Procedural Label Texture (Smiling Sun) ---
  const texWidth = 512;
  const texHeight = 256;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Fill background yellow
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;     // R
    data[i + 1] = 221; // G
    data[i + 2] = 0;   // B
    data[i + 3] = 255; // A
  }

  const cx = texWidth / 2;
  const cy = texHeight / 2;
  const sunRadius = 60;
  const rayLength = 25;

  // Helper to set pixel
  function setPixel(x, y, r, g, b) {
    if (x >= 0 && x < texWidth && y >= 0 && y < texHeight) {
      const idx = (y * texWidth + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  // Draw Sun Rays (16 rays)
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const x1 = cx + Math.cos(angle) * sunRadius;
    const y1 = cy + Math.sin(angle) * sunRadius;
    const x2 = cx + Math.cos(angle) * (sunRadius + rayLength);
    const y2 = cy + Math.sin(angle) * (sunRadius + rayLength);
    
    // Simple line drawing for rays
    const steps = 20;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const lx = Math.floor(x1 + (x2 - x1) * t);
      const ly = Math.floor(y1 + (y2 - y1) * t);
      // Make rays triangular by varying width
      const width = 4 * (1 - t) + 2; 
      for (let w = -width; w <= width; w++) {
         // Perpendicular offset approx
         const px = lx - Math.sin(angle) * w;
         const py = ly + Math.cos(angle) * w;
         setPixel(Math.floor(px), Math.floor(py), 0, 0, 0);
      }
    }
  }

  // Draw Sun Face Circle
  for (let y = -sunRadius; y <= sunRadius; y++) {
    for (let x = -sunRadius; x <= sunRadius; x++) {
      if (x * x + y * y <= sunRadius * sunRadius) {
        // Draw outline only for the main circle to let yellow show through? 
        // Reference shows outline sun. Let's do outline.
        if (x * x + y * y >= (sunRadius - 3) * (sunRadius - 3)) {
           setPixel(cx + x, cy + y, 0, 0, 0);
        }
      }
    }
  }

  // Draw Eyes
  function drawCircle(centerX, centerY, r, colorR, colorG, colorB) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) {
          setPixel(centerX + x, centerY + y, colorR, colorG, colorB);
        }
      }
    }
  }
  
  // Eyes (black)
  drawCircle(cx - 20, cy - 10, 6, 0, 0, 0);
  drawCircle(cx + 20, cy - 10, 6, 0, 0, 0);

  // Cheeks (pink)
  drawCircle(cx - 30, cy + 10, 8, 255, 150, 150);
  drawCircle(cx + 30, cy + 10, 8, 255, 150, 150);

  // Mouth (smile arc)
  for (let angle = Math.PI; angle <= 2 * Math.PI; angle += 0.05) {
    const mx = cx + Math.cos(angle) * 25;
    const my = cy + 15 + Math.sin(angle) * 15;
    drawCircle(Math.floor(mx), Math.floor(my), 2, 0, 0, 0);
  }

  const labelTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  labelTexture.needsUpdate = true;
  labelTexture.wrapS = THREE.RepeatWrapping;
  labelMat.map = labelTexture;

  // --- Geometry: Jar Body (Lathe) ---
  // Profile traces the cross-section of the glass wall (thick bottom, hollow inside)
  // Order: Bottom Center -> Bottom Outer -> Side Outer -> Rim Outer -> Rim Inner -> Side Inner -> Bottom Inner -> Close
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),   // Bottom Center
    new THREE.Vector2(0.42, 0.00),   // Bottom Outer Edge
    new THREE.Vector2(0.42, 0.10),   // Base Side Outer
    new THREE.Vector2(0.42, 0.75),   // Body Side Outer
    new THREE.Vector2(0.38, 0.88),   // Shoulder Outer
    new THREE.Vector2(0.40, 0.94),   // Rim Top Outer
    new THREE.Vector2(0.36, 0.94),   // Rim Top Inner (Opening)
    new THREE.Vector2(0.36, 0.88),   // Neck Inner
    new THREE.Vector2(0.38, 0.75),   // Body Side Inner
    new THREE.Vector2(0.38, 0.10),   // Base Side Inner
    new THREE.Vector2(0.38, 0.05),   // Bottom Inner (Thick base)
    new THREE.Vector2(0.00, 0.05),   // Bottom Center Inner
  ];

  const jarGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Fix normals for glass transparency
  jarGeom.computeVertexNormals();
  
  const jar_body = new THREE.Mesh(jarGeom, glassMat);
  root.add(jar_body);

  // --- Geometry: Lid ---
  // Flat cylinder slightly wider than rim
  const lidGeom = new THREE.CylinderGeometry(0.44, 0.44, 0.08, 32);
  const jar_lid = new THREE.Mesh(lidGeom, lidMat);
  jar_lid.position.y = 0.98; // Sit on top of rim
  root.add(jar_lid);

  // --- Geometry: Label ---
  // Thin cylinder wrapping the body, slightly larger radius to avoid z-fighting
  const labelRadius = 0.425;
  const labelHeight = 0.35;
  const labelY = 0.35; // Centered on the lower body section
  
  const labelGeom = new THREE.CylinderGeometry(labelRadius, labelRadius, labelHeight, 32, 1, true);
  const jar_label = new THREE.Mesh(labelGeom, labelMat);
  jar_label.position.y = labelY;
  // Rotate to align texture seam to back
  jar_label.rotation.y = Math.PI / 32; 
  root.add(jar_label);

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