export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Blade: Polished metal (silver/stainless steel)
  // Cap metalness at 0.6 to avoid black reflection in no-envmap setup.
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Handle: Matte plastic (bright green)
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x4caf50,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Procedural Logo Texture ---
  // Draws "SILVER" text on a 256x128 texture.
  function createLogoTexture(THREE) {
    const width = 256;
    const height = 128;
    const data = new Uint8Array(width * height * 4);
    
    // Fill background (transparent black)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0;     // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
      data[i + 3] = 0; // A
    }

    // Simple 5x7 bitmap font map for "SILVER"
    // 1 = pixel on, 0 = pixel off
    const font = {
      'S': [0,1,1,1,0, 1,0,0,0,0, 1,0,0,0,0, 0,1,1,1,0, 0,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
      'I': [0,1,1,1,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,1,1,1,0],
      'L': [1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,1],
      'V': [1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,0,1,0, 0,1,0,1,0, 0,0,1,0,0],
      'E': [1,1,1,1,1, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,0, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,1],
      'R': [1,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,1,1,1,0, 1,0,1,0,0, 1,0,0,1,0, 1,0,0,0,1]
    };

    const word = "SILVER";
    const charWidth = 6; // 5 pixels + 1 spacing
    const charHeight = 8; // 7 pixels + 1 spacing
    const startX = 40;
    const startY = 40;
    const pixelSize = 4; // Scale up pixels for visibility

    for (let c = 0; c < word.length; c++) {
      const char = word[c];
      const bits = font[char];
      if (!bits) continue;

      const charX = startX + c * charWidth * pixelSize;
      const charY = startY;

      for (let py = 0; py < 7; py++) {
        for (let px = 0; px < 5; px++) {
          const bit = bits[py * 5 + px];
          if (bit === 1) {
            // Draw a block of pixels
            for (let dy = 0; dy < pixelSize; dy++) {
              for (let dx = 0; dx < pixelSize; dx++) {
                const tx = charX + px * pixelSize + dx;
                const ty = charY + py * pixelSize + dy;
                if (tx < width && ty < height) {
                  const idx = (ty * width + tx) * 4;
                  data[idx] = 50;     // Dark gray text
                  data[idx + 1] = 50;
                  data[idx + 2] = 50;
                  data[idx + 3] = 255;
                }
              }
            }
          }
        }
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    // Flip Y because DataTexture coordinates often differ from UVs
    texture.flipY = true; 
    return texture;
  }

  const logoTexture = createLogoTexture(THREE);
  bladeMat.map = logoTexture;
  // Adjust UVs: The extrude geometry UVs map the shape bounds to 0-1.
  // We want the logo near the handle (left side of the blade shape).
  // Shape width is ~0.45. Handle is at x=0. Logo should be at x=0.05 to 0.25.
  // Offset X to move it left, Scale X to shrink it.
  logoTexture.offset.set(0.1, 0.3);
  logoTexture.repeat.set(0.3, 0.4);


  // --- Blade Geometry ---
  // Side profile shape for extrusion.
  // The shape defines the flat silhouette. Extrusion depth creates thickness.
  const bladeShape = new THREE.Shape();
  // Start at heel (near handle)
  bladeShape.moveTo(0.0, -0.055); 
  // Belly curve to tip
  bladeShape.quadraticCurveTo(0.25, -0.06, 0.45, 0.0);
  // Spine curve back to heel
  bladeShape.quadraticCurveTo(0.25, 0.06, 0.0, 0.055);
  // Close heel
  bladeShape.lineTo(0.0, -0.055);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.004,          // Thin blade
    bevelEnabled: true,
    bevelThickness: 0.002, // Edge grind
    bevelSize: 0.001,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12
  });

  // Center the geometry so the heel is at local origin for easier positioning
  bladeGeom.translate(0, 0, -0.002); // Center thickness
  // The shape is 0.45 long. We want the heel at Z=0 (meeting handle).
  // ExtrudeGeometry creates geometry from 0 to depth on Z.
  // We rotated the shape logic: Shape is in XY, extruded to Z.
  // Actually, let's re-orient. Standard Extrude: Shape in XY, extruded along Z.
  // My shape definition above was X=length, Y=width.
  // So the blade lies in XY plane, thickness is Z.
  // To make it point +Z, I need to rotate the mesh or the shape.
  // Let's rotate the mesh 90 deg around X to put it in YZ plane? No.
  // Let's just define the shape in XY, then rotate the mesh.
  // Shape: X is length (0 to 0.45), Y is width (-0.06 to 0.06).
  // Extruded along Z (thickness).
  // To point +Z: Rotate mesh -90 deg around X. Then X becomes Z (length), Y stays Y (width), Z becomes -Y (thickness vertical?).
  // This is getting confusing.
  
  // Simpler: Define shape in XZ plane (top down view), extrude along Y (thickness).
  const bladeShapeTop = new THREE.Shape();
  bladeShapeTop.moveTo(0.0, -0.055); // Heel Left
  bladeShapeTop.quadraticCurveTo(0.25, -0.06, 0.45, 0.0); // Tip
  bladeShapeTop.quadraticCurveTo(0.25, 0.06, 0.0, 0.055); // Heel Right
  bladeShapeTop.lineTo(0.0, -0.055);

  const bladeGeomFinal = new THREE.ExtrudeGeometry(bladeShapeTop, {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.001,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12
  });

  // Center thickness: extrude goes from 0 to 0.004. Move to -0.002.
  bladeGeomFinal.translate(0, -0.002, 0);
  // Now the blade lies in XZ plane (Y is thickness).
  // It points +X.
  // We want it to point +Z (standard forward).
  // Rotate -90 deg around Y.
  const blade = new THREE.Mesh(bladeGeomFinal, bladeMat);
  blade.rotation.y = -Math.PI / 2;
  // Position: Heel is at X=0. After rotation, Heel is at Z=0.
  // We want the handle to be at negative Z, blade at positive Z.
  // So Blade position Z = 0 (heel meets handle front).
  blade.position.set(0, 0, 0);
  root.add(blade);


  // --- Handle Geometry ---
  // LatheGeometry for rounded ergonomic handle.
  // Profile points (radius, y). Y is the handle length axis.
  // We will rotate this mesh to align with Z.
  const handleProfile = [
    new THREE.Vector2(0.0, 0.0),    // Center of rear cap
    new THREE.Vector2(0.045, 0.05), // Rear bulb
    new THREE.Vector2(0.040, 0.15), // Grip indent
    new THREE.Vector2(0.050, 0.25), // Bolster flare
    new THREE.Vector2(0.020, 0.30), // Tang insertion (narrow)
    new THREE.Vector2(0.0, 0.30)    // Close top
  ];

  const handleGeom = new THREE.LatheGeometry(handleProfile, 24);
  
  // Lathe creates geometry around Y axis.
  // We want handle along Z axis.
  // Rotate 90 deg around X.
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.rotation.x = Math.PI / 2;
  
  // Positioning:
  // The lathe profile goes from Y=0 (rear) to Y=0.30 (front/tang).
  // After rotation X=90: Rear is at Z=0, Front is at Z=0.30.
  // We want the Front (tang) to meet the Blade Heel (at Z=0).
  // So we need to shift the handle so its front is at Z=0.
  // Current front is at Z=0.30. Shift by -0.30.
  // Also, the blade heel is at Z=0. The handle tang should overlap slightly.
  // Let's put the handle front at Z = -0.02 (slight overlap).
  handle.position.set(0, 0, -0.30);
  
  root.add(handle);


  // --- Fit to Unit Cube ---
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