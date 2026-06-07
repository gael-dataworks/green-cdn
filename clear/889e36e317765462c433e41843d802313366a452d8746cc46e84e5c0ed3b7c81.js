export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Steel blade: Polished metal. Cap metalness at 0.6 per rules.
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Brass bolster/pommel: Yellowish metal.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Handle: Matte black plastic/composite.
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Logo Texture (Procedural DataTexture) ---
  // Simulate the "HAI" logo mark on the blade.
  // Since we can't use Canvas API, we draw a dark rectangular patch to represent the logo area.
  const texWidth = 256;
  const texHeight = 64;
  const texData = new Uint8Array(texWidth * texHeight * 4);
  
  for (let i = 0; i < texWidth * texHeight; i++) {
    // Base: transparent/silver (white with alpha 0 for modulation, or light gray)
    // We want the logo to be dark. Let's make the background white (no change to metal color)
    // and the logo area dark gray.
    // Actually, for MeshStandardMaterial map, white = full color, black = no color.
    // So background should be white (255), logo should be dark (50).
    
    const x = i % texWidth;
    const y = Math.floor(i / texWidth);
    
    // Define logo area: centered horizontally, middle vertically
    const inLogoX = x > 80 && x < 180;
    const inLogoY = y > 20 && y < 45;
    
    let val = 220; // Light silver background
    if (inLogoX && inLogoY) {
      // Draw a simple blocky shape for the logo
      // A dark rectangle
      val = 40; 
      
      // Add some internal detail to look like text "HAI" roughly
      // Vertical bars
      if ((x > 90 && x < 100) || (x > 130 && x < 140) || (x > 170 && x < 180)) {
         val = 30;
      }
      // Horizontal bar for A
      if (y > 30 && y < 34 && x > 130 && x < 140) {
         val = 30;
      }
    }
    
    const idx = i * 4;
    texData[idx] = val;
    texData[idx + 1] = val;
    texData[idx + 2] = val;
    texData[idx + 3] = 255;
  }

  const logoTexture = new THREE.DataTexture(texData, texWidth, texHeight, THREE.RGBAFormat);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.needsUpdate = true;
  bladeMat.map = logoTexture;

  // --- Geometry & Meshes ---

  // 1. Blade
  // Shape for extrusion (side profile in XY plane, extruded along Z)
  const bladeShape = new THREE.Shape();
  // Heel bottom
  bladeShape.moveTo(0, -0.01);
  // Tip bottom (edge)
  bladeShape.lineTo(0.55, -0.01);
  // Tip top
  bladeShape.lineTo(0.55, 0.01);
  // Spine curve (approximated with lines for simplicity or bezier)
  bladeShape.quadraticCurveTo(0.3, 0.12, 0.0, 0.06);
  // Heel top
  bladeShape.lineTo(0, 0.06);
  bladeShape.lineTo(0, -0.01);

  const bladeExtrudeSettings = {
    depth: 0.004, // Thin blade
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
    steps: 1,
  };

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, bladeExtrudeSettings);
  // Center the geometry so pivot is at the heel/bolster junction
  bladeGeom.translate(-0.002, -0.025, 0); 

  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Rotate to face +Z. Extrude is along Z by default in Three.js? 
  // ExtrudeGeometry extrudes along Z. Shape is in XY.
  // So the flat face is in XY. We want the flat face to be in XZ (horizontal) or YZ (vertical)?
  // Knife is usually held with blade vertical or horizontal. In the image, it's flat.
  // Let's make the blade lie in the XZ plane.
  // Extrude creates geometry in XY, extruded to Z.
  // We want the profile in XZ, extruded to Y (thickness).
  // So rotate 90 deg around X.
  blade.rotation.x = Math.PI / 2;
  blade.position.z = 0.0; // Start of blade
  root.add(blade);

  // 2. Bolster (Brass collar)
  // Cylinder between handle and blade
  const bolsterGeom = new THREE.CylinderGeometry(0.032, 0.035, 0.04, 32);
  const bolster = new THREE.Mesh(bolsterGeom, brassMat);
  bolster.rotation.x = Math.PI / 2; // Align with Z axis
  bolster.position.z = -0.02; // Slightly overlapping handle and blade
  root.add(bolster);

  // 3. Handle
  // Lathe profile for ergonomic shape
  // Points in XY plane (radius, height). Height runs along Z in local space after rotation.
  const handlePoints = [];
  // Start at pommel end (Z = -0.45 relative to bolster)
  // We build profile from bottom (pommel) to top (bolster)
  handlePoints.push(new THREE.Vector2(0.028, 0.0)); // Pommel start radius
  handlePoints.push(new THREE.Vector2(0.028, 0.05)); // Pommel cylinder
  handlePoints.push(new THREE.Vector2(0.045, 0.15)); // Grip swell
  handlePoints.push(new THREE.Vector2(0.042, 0.25)); // Mid grip
  handlePoints.push(new THREE.Vector2(0.035, 0.35)); // Taper to bolster
  handlePoints.push(new THREE.Vector2(0.032, 0.40)); // Neck
  handlePoints.push(new THREE.Vector2(0.032, 0.45)); // End at bolster

  const handleGeom = new THREE.LatheGeometry(handlePoints, 32);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  // Lathe creates geometry around Y axis. We want it along Z.
  // Rotate -90 X to put Y axis along Z.
  handle.rotation.x = -Math.PI / 2;
  handle.position.z = -0.45; // Position so top of lathe (0.45) meets bolster at 0
  root.add(handle);

  // 4. Pommel (Brass end cap)
  const pommelGeom = new THREE.CylinderGeometry(0.028, 0.028, 0.015, 32);
  const pommel = new THREE.Mesh(pommelGeom, brassMat);
  pommel.rotation.x = Math.PI / 2;
  pommel.position.z = -0.45; // At the very end of the handle
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