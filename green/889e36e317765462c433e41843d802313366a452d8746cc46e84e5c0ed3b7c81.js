export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Steel blade: bright, slightly rough metal.
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Brass bolster and pommel: warm gold metal.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc5a059,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Black handle: matte synthetic/wood.
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Procedural Logo Texture ---
  // Create a simple data texture for the "HAI" logo on the blade.
  const texWidth = 256;
  const texHeight = 128;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Fill white background
  for (let i = 0; i < texWidth * texHeight; i++) {
    data[i * 4] = 240;
    data[i * 4 + 1] = 240;
    data[i * 4 + 2] = 240;
    data[i * 4 + 3] = 255;
  }

  // Draw simple black blocks to represent text "HAI" + chars near the heel
  // Position: Right side of texture (near handle), vertically centered
  const textX = 180;
  const textY = 40;
  const textH = 30;
  
  function drawRect(x, y, w, h) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const idx = ((y + dy) * texWidth + (x + dx)) * 4;
        if (idx < data.length) {
          data[idx] = 40;
          data[idx + 1] = 40;
          data[idx + 2] = 40;
          data[idx + 3] = 255;
        }
      }
    }
  }

  // "H"
  drawRect(textX, textY, 4, textH);
  drawRect(textX + 12, textY, 4, textH);
  drawRect(textX, textY + 12, 16, 4);
  // "A"
  drawRect(textX + 24, textY, 4, textH);
  drawRect(textX + 36, textY, 4, textH);
  drawRect(textX + 24, textY + 14, 16, 4);
  // "I"
  drawRect(textX + 48, textY, 4, textH);
  
  // Some blocks for Chinese chars
  drawRect(textX + 60, textY, 10, 10);
  drawRect(textX + 75, textY, 10, 10);

  const logoTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.needsUpdate = true;
  logoTexture.flipY = true; // Adjust for UV mapping direction if needed
  bladeMat.map = logoTexture;

  // --- Blade ---
  // Profile in XY plane, extruded along Z.
  const bladeShape = new THREE.Shape();
  const bladeLength = 0.32;
  const bladeHeight = 0.055;
  
  // Start at tip
  bladeShape.moveTo(0, 0);
  // Spine (top edge)
  bladeShape.lineTo(bladeLength, bladeHeight * 0.8);
  // Heel (back of blade)
  bladeShape.lineTo(bladeLength, 0);
  // Belly (cutting edge) - slight curve
  bladeShape.quadraticCurveTo(bladeLength * 0.5, -bladeHeight * 0.1, 0, 0);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.002,
    bevelEnabled: true,
    bevelThickness: 0.0015,
    bevelSize: 0.001,
    bevelSegments: 2,
    steps: 1,
  });
  
  // Center the geometry so pivot is reasonable
  bladeGeom.translate(-bladeLength / 2, -bladeHeight / 4, 0);
  
  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Position blade so heel is at Z=0
  blade.position.z = bladeLength / 2;
  root.add(blade);

  // --- Bolster ---
  // Short brass cylinder between handle and blade
  const bolsterGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 24);
  const bolster = new THREE.Mesh(bolsterGeom, brassMat);
  bolster.rotation.x = Math.PI / 2; // Align with Z
  bolster.position.z = -0.015; // Just behind blade heel
  root.add(bolster);

  // --- Handle ---
  // Lathe geometry for ergonomic shape
  const handlePoints = [];
  const handleLen = 0.13;
  // Profile points (radius, y) where y is along handle length
  handlePoints.push(new THREE.Vector2(0.035, 0)); // End cap start
  handlePoints.push(new THREE.Vector2(0.038, 0.02));
  handlePoints.push(new THREE.Vector2(0.048, 0.06)); // Bulge
  handlePoints.push(new THREE.Vector2(0.045, 0.10));
  handlePoints.push(new THREE.Vector2(0.042, handleLen)); // Neck near bolster
  
  const handleGeom = new THREE.LatheGeometry(handlePoints, 24);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.rotation.x = Math.PI / 2; // Align with Z
  handle.position.z = -0.03 - (handleLen / 2); // Start behind bolster
  root.add(handle);

  // --- Pommel (End Cap) ---
  // Brass disc at the very end of handle
  const pommelGeom = new THREE.CylinderGeometry(0.038, 0.038, 0.015, 24);
  const pommel = new THREE.Mesh(pommelGeom, brassMat);
  pommel.rotation.x = Math.PI / 2;
  pommel.position.z = -0.03 - handleLen - 0.0075;
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