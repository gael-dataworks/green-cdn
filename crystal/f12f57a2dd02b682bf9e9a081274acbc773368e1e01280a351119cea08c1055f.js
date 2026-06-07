export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Blade: Polished metal (silver), capped metalness per rules.
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Handle: Green plastic/rubber, matte.
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x4caf50,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Procedural Texture for Blade Logo ---
  // The reference shows "LEWIS" text on the blade. We generate a DataTexture.
  const texWidth = 256;
  const texHeight = 128;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Fill with base steel color (light grey)
  for (let i = 0; i < texWidth * texHeight; i++) {
    const base = 200; 
    data[i * 4 + 0] = base;     // R
    data[i * 4 + 1] = base;     // G
    data[i * 4 + 2] = base;     // B
    data[i * 4 + 3] = 255;      // A
  }

  // Draw a dark rectangular logo block to represent the text area
  // Position it roughly where text would be (middle of blade, near spine)
  const logoX = Math.floor(texWidth * 0.3);
  const logoY = Math.floor(texHeight * 0.3);
  const logoW = Math.floor(texWidth * 0.3);
  const logoH = Math.floor(texHeight * 0.25);

  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      // Simple geometric logo representation
      if (x >= logoX && x <= logoX + logoW && y >= logoY && y <= logoY + logoH) {
        const idx = (y * texWidth + x) * 4;
        // Dark grey text simulation
        data[idx + 0] = 80;
        data[idx + 1] = 80;
        data[idx + 2] = 80;
        // Add some "lines" to simulate text strokes
        if ((y - logoY) % 4 < 2) {
           data[idx + 0] = 50;
           data[idx + 1] = 50;
           data[idx + 2] = 50;
        }
      }
      // Add some noise/scratch variation for realism
      if (Math.sin(x * 0.1) * Math.cos(y * 0.1) > 0.8) {
         const idx = (y * texWidth + x) * 4;
         data[idx + 0] += 10;
         data[idx + 1] += 10;
         data[idx + 2] += 10;
      }
    }
  }

  const bladeTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  bladeTexture.colorSpace = THREE.SRGBColorSpace;
  bladeTexture.needsUpdate = true;
  bladeMat.map = bladeTexture;

  // --- Blade Geometry ---
  // Define the 2D profile of the blade in the XY plane.
  // We will extrude this along Z to give it thickness, then rotate to lie flat.
  const bladeShape = new THREE.Shape();
  const bladeLength = 0.5;
  const bladeHeight = 0.14;
  
  // Start at heel (near handle)
  bladeShape.moveTo(0, 0); 
  // Spine (top edge), slightly curved down towards tip
  bladeShape.quadraticCurveTo(bladeLength * 0.5, 0.01, bladeLength, -0.02);
  // Tip
  bladeShape.lineTo(bladeLength, -0.05);
  // Belly (cutting edge), curved up towards heel
  bladeShape.quadraticCurveTo(bladeLength * 0.5, -bladeHeight, 0, -bladeHeight * 0.8);
  // Heel bottom
  bladeShape.lineTo(0, -0.02);
  // Close
  bladeShape.lineTo(0, 0);

  const bladeExtrudeSettings = {
    steps: 1,
    depth: 0.004, // Thin blade
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  };

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, bladeExtrudeSettings);
  // Center the geometry roughly
  bladeGeom.center();

  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Rotate to lie flat in XZ plane (blade face up)
  // Extrude comes out of XY plane along Z. We want it in XZ plane.
  // Rotate -90 deg around X.
  blade.rotation.x = -Math.PI / 2;
  // Position so heel is at origin
  blade.position.set(0, 0, 0); 
  root.add(blade);

  // --- Handle Geometry ---
  // Use LatheGeometry for the ergonomic rounded shape.
  // Profile in XY plane, will be rotated to align with Z axis.
  const handlePoints = [];
  const handleLen = 0.45;
  
  // Define profile from butt (bottom Y) to neck (top Y)
  // Y goes from 0 to handleLen
  handlePoints.push(new THREE.Vector2(0, 0)); // Center axis bottom
  handlePoints.push(new THREE.Vector2(0.065, 0)); // Butt radius
  handlePoints.push(new THREE.Vector2(0.075, 0.1)); // Ergonomic bulge
  handlePoints.push(new THREE.Vector2(0.07, 0.25)); // Grip
  handlePoints.push(new THREE.Vector2(0.055, 0.38)); // Taper to neck
  handlePoints.push(new THREE.Vector2(0.045, handleLen)); // Neck radius
  handlePoints.push(new THREE.Vector2(0, handleLen)); // Center axis top

  const handleGeom = new THREE.LatheGeometry(handlePoints, 24);
  
  const handle = new THREE.Mesh(handleGeom, handleMat);
  
  // The Lathe creates a shape around Y axis. We need it along Z axis.
  // Rotate -90 deg around X.
  handle.rotation.x = -Math.PI / 2;
  
  // Scale to make it oval (wider than tall) for ergonomic grip
  handle.scale.set(1.4, 1, 1);
  
  // Position: The neck of the handle should meet the heel of the blade.
  // Blade heel is at (0,0,0). Handle neck is at local Z = handleLen (before rotation/scale).
  // After rotation -90 X, local Y becomes local Z. So top of lathe (handleLen) is at +Z.
  // We want the handle to extend to -Z.
  // So we need to flip it or position it.
  // Let's position it so the neck is at 0,0,0 and it extends -Z.
  handle.position.z = handleLen; 
  
  // Overlap slightly to cover the tang
  handle.position.z += 0.02;

  root.add(handle);

  // --- Bolster / Tang Cap ---
  // Small green piece where handle meets blade to smooth the transition
  const bolsterGeom = new THREE.CylinderGeometry(0.05, 0.055, 0.03, 16);
  const bolster = new THREE.Mesh(bolsterGeom, handleMat);
  bolster.rotation.x = Math.PI / 2;
  bolster.position.z = 0.015; // Slightly on the blade side
  root.add(bolster);

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