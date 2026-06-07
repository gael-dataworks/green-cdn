export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte light gray silicone/plastic
  const caseMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    metalness: 0.1,
    roughness: 0.7,
  });

  // Darker gray for recessed areas (ports, kickstand gap)
  const recessMat = new THREE.MeshStandardMaterial({
    color: 0x909090,
    metalness: 0.1,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const W = 0.70;
  const H = 1.40;
  const D = 0.12; // Thickness
  const cornerRadius = 0.08;
  const lipHeight = 0.02; // How much the lip sticks up from the back

  // --- Helper: Rounded Rectangle Shape ---
  function createRoundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    shape.moveTo(x, y + radius);
    shape.lineTo(x, y + height - radius);
    shape.quadraticCurveTo(x, y + height, x + radius, y + height);
    shape.lineTo(x + width - radius, y + height);
    shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    shape.lineTo(x + width, y + radius);
    shape.quadraticCurveTo(x + width, y, x + width - radius, y);
    shape.lineTo(x + radius, y);
    shape.quadraticCurveTo(x, y, x, y + radius);
    return shape;
  }

  // --- Main Case Body ---
  // We model the back plate and the walls as one extruded piece for simplicity,
  // then add the lip as a separate frame or just rely on the extrusion depth.
  // To get the "case" look (lip higher than back), we can extrude the back 
  // and then add a frame on top.
  
  // 1. Back Plate
  const backShape = createRoundedRectShape(W, H, cornerRadius);
  const backGeom = new THREE.ExtrudeGeometry(backShape, {
    depth: D * 0.8, // Main thickness
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3,
    steps: 1,
  });
  const backPlate = new THREE.Mesh(backGeom, caseMat);
  // Center the geometry so the back is at z=0 and it extrudes to +z
  // ExtrudeGeometry centers by default in XY, but Z starts at 0.
  // We want the case to sit nicely. Let's shift it so the center is roughly 0,0,0.
  backPlate.position.z = -D / 2; 
  root.add(backPlate);

  // 2. Front Lip (The rim that holds the phone)
  // Create a shape that is the outer rect minus the inner rect (hole)
  const lipShape = new THREE.Shape();
  // Outer path
  const hw = W / 2;
  const hh = H / 2;
  const r = cornerRadius;
  lipShape.moveTo(-hw, -hh + r);
  lipShape.lineTo(-hw, hh - r);
  lipShape.quadraticCurveTo(-hw, hh, -hw + r, hh);
  lipShape.lineTo(hw - r, hh);
  lipShape.quadraticCurveTo(hw, hh, hw, hh - r);
  lipShape.lineTo(hw, -hh + r);
  lipShape.quadraticCurveTo(hw, -hh, hw - r, -hh);
  lipShape.lineTo(-hw + r, -hh);
  lipShape.quadraticCurveTo(-hw, -hh, -hw, -hh + r);
  
  // Inner path (hole) - slightly smaller to create the wall thickness
  const wallThickness = 0.04;
  const ihw = hw - wallThickness;
  const ihh = hh - wallThickness;
  const ir = Math.max(0, r - wallThickness);
  const holePath = new THREE.Path();
  holePath.moveTo(-ihw, -ihh + ir);
  holePath.lineTo(-ihw, ihh - ir);
  holePath.quadraticCurveTo(-ihw, ihh, -ihw + ir, ihh);
  holePath.lineTo(ihw - ir, ihh);
  holePath.quadraticCurveTo(ihw, ihh, ihw, ihh - ir);
  holePath.lineTo(ihw, -ihh + ir);
  holePath.quadraticCurveTo(ihw, -ihh, ihw - ir, -ihh);
  holePath.lineTo(-ihw + ir, -ihh);
  holePath.quadraticCurveTo(-ihw, -ihh, -ihw, -ihh + ir);
  lipShape.holes.push(holePath);

  const lipGeom = new THREE.ExtrudeGeometry(lipShape, {
    depth: lipHeight,
    bevelEnabled: false,
  });
  const lip = new THREE.Mesh(lipGeom, caseMat);
  lip.position.z = -D / 2 + (D * 0.8); // Sit on top of back plate
  root.add(lip);

  // --- Kickstand ---
  // A flap attached to the back, angled out.
  const ksW = W * 0.5;
  const ksH = H * 0.45;
  const ksD = 0.025;
  
  // Kickstand geometry: A rounded box or extruded shape
  const ksShape = createRoundedRectShape(ksW, ksH, 0.05);
  const ksGeom = new THREE.ExtrudeGeometry(ksShape, {
    depth: ksD,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  });
  
  const kickstand = new THREE.Mesh(ksGeom, caseMat);
  // Position on the back of the case
  // Hinge is near the bottom of the kickstand piece, attached to the case back
  kickstand.position.set(0, -H * 0.15, -D / 2 - ksD / 2);
  // Rotate to prop it up. The hinge is at the bottom of the KS piece relative to its local coords?
  // Extrude centers at 0. So the KS piece is centered at its pivot.
  // We want the bottom edge of the KS to be the hinge.
  // Shift KS up by half its height so its bottom is at y=0 (local)
  kickstand.position.y += ksH / 2; 
  // Rotate around X axis to lean back (negative Z)
  kickstand.rotation.x = Math.PI / 4; // 45 degrees
  
  // Add a "handle" cutout or detail on the kickstand
  const handleCutout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.04, 16),
    recessMat
  );
  handleCutout.rotation.x = Math.PI / 2;
  handleCutout.position.set(0, ksH * 0.35, ksD / 2 + 0.001); // On the face of the KS
  kickstand.add(handleCutout);

  root.add(kickstand);

  // --- Buttons ---
  // On the side (let's say +X side based on typical phone orientation, 
  // but image shows buttons on the right side of the case which is +X if facing +Z)
  const btnY = H * 0.15;
  const btnZ = 0; // Centered on side wall thickness
  
  // Volume Rocker (Long)
  const volBtn = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.08, 0.04),
    caseMat
  );
  volBtn.position.set(W / 2 + 0.005, btnY + 0.04, 0);
  root.add(volBtn);

  // Power Button (Short, above volume)
  const pwrBtn = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.04, 0.04),
    caseMat
  );
  pwrBtn.position.set(W / 2 + 0.005, btnY + 0.14, 0);
  root.add(pwrBtn);

  // --- Ports (Bottom) ---
  // Recessed areas on the bottom edge (-Y)
  
  // USB-C Hole (Center)
  const usbHole = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.025, 0.06),
    recessMat
  );
  usbHole.position.set(0, -H / 2, 0);
  root.add(usbHole);

  // Speaker Grilles (Sides of USB)
  const spkHoleL = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.015, 0.04),
    recessMat
  );
  spkHoleL.position.set(-W * 0.25, -H / 2, 0);
  root.add(spkHoleL);

  const spkHoleR = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.015, 0.04),
    recessMat
  );
  spkHoleR.position.set(W * 0.25, -H / 2, 0);
  root.add(spkHoleR);
  
  // Microphone/Small hole
  const micHole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.04, 8),
    recessMat
  );
  micHole.rotation.z = Math.PI / 2;
  micHole.position.set(W * 0.42, -H / 2, 0);
  root.add(micHole);

  // --- Camera Bump (Subtle) ---
  // Top left corner on the back (-Z side relative to case front, but our case faces +Z)
  // Back is at -Z. So bump is at -Z - delta.
  const camBump = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.25, 0.02),
    caseMat
  );
  camBump.position.set(-W * 0.3, H * 0.35, -D / 2 - 0.01);
  root.add(camBump);
  
  // Camera Lens circles
  const lens1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.025, 16),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.5 })
  );
  lens1.rotation.x = Math.PI / 2;
  lens1.position.set(-W * 0.35, H * 0.40, -D / 2 - 0.02);
  root.add(lens1);

  const lens2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.025, 16),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.5 })
  );
  lens2.rotation.x = Math.PI / 2;
  lens2.position.set(-W * 0.25, H * 0.30, -D / 2 - 0.02);
  root.add(lens2);


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