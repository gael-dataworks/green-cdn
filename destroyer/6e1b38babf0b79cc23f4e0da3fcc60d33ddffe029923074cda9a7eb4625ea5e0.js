export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Light wood (ash/beech), matte finish.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xe8cfac,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Black foot pads.
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.5,
  });

  // --- Dimensions ---
  const seatW = 0.48;
  const seatD = 0.42;
  const seatH = 0.035;
  const legH = 0.44;
  const backrestW = 0.52;
  const backrestH = 0.28;
  const backrestThickness = 0.025;

  // --- Seat ---
  // Rounded rectangle shape for the seat.
  const seatShape = new THREE.Shape();
  const r = 0.06; // Corner radius
  const hw = seatW / 2;
  const hd = seatD / 2;
  // Draw rounded rect
  seatShape.moveTo(-hw + r, -hd);
  seatShape.lineTo(hw - r, -hd);
  seatShape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  seatShape.lineTo(hw, hd - r);
  seatShape.quadraticCurveTo(hw, hd, hw - r, hd);
  seatShape.lineTo(-hw + r, hd);
  seatShape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  seatShape.lineTo(-hw, -hd + r);
  seatShape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const seatGeom = new THREE.ExtrudeGeometry(seatShape, {
    depth: seatH,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
  });
  // Center the geometry
  seatGeom.translate(0, 0, -seatH / 2);
  
  const seat = new THREE.Mesh(seatGeom, woodMat);
  seat.position.y = legH;
  root.add(seat);

  // --- Backrest ---
  // Curved plank using TorusGeometry slice.
  // We want a wide, shallow curve.
  const backRadius = 0.65;
  const backTube = 0.025; // Thickness
  const backArc = 0.75; // Width in radians approx
  
  const backrestGeom = new THREE.TorusGeometry(backRadius, backTube, 16, 32, backArc);
  // Torus lies in XY plane by default. We need it to face forward (Z) and be vertical.
  // Rotate to stand up: X 90deg. Then we need to curve it around Y axis? 
  // Torus curves around its local Z axis (the hole). 
  // If we rotate X 90, it lies in XZ plane, curving around Y. That's a bowl.
  // We want it to curve around Y axis (horizontal curve).
  // Standard Torus: ring in XY, center at 0,0,0. Major radius in XY plane.
  // To get a horizontal curve facing Z:
  // Rotate Z by 90 deg -> Ring in YZ plane.
  // Rotate X by 90 deg -> Ring in XY plane? No.
  // Let's just use a Torus and rotate it.
  // Default Torus: Circle in XY plane, centered at (radius, 0, 0).
  // We want the arc to be horizontal (X axis) and vertical (Y axis).
  // So the torus should be in the XZ plane? No, that curves around Y.
  // Yes, we want it to curve around the Y axis (like a hug).
  // So the torus ring should be in the XZ plane.
  // Default Torus is in XY. Rotate X by 90 deg -> XZ plane.
  // Then the curve is around Y. Perfect.
  // But the Torus tube is circular. We want a flat plank. Scale Y to stretch it.
  
  const backrest = new THREE.Mesh(backrestGeom, woodMat);
  backrest.rotation.x = Math.PI / 2;
  // Scale Y to make it tall enough (backrestH)
  // The torus tube diameter is 2*backTube. We need height backrestH.
  const scaleY = backrestH / (backTube * 2);
  backrest.scale.set(1, scaleY, 1);
  
  // Position: Behind the seat, at height.
  // The torus center is at 0,0,0. The arc is centered at angle 0 (X axis).
  // With rotation X=90, the arc is in XZ plane, centered at +X?
  // Wait, TorusGeometry(radius, tube, radSeg, tubSeg, arc).
  // The arc starts at 0 and goes to `arc`. Centered? No, starts at 0.
  // We need to rotate the geometry or the mesh to center the arc.
  // Let's rotate the mesh around Y so the arc is centered at Z.
  backrest.rotation.y = -backArc / 2;
  
  // Now position it.
  // The torus major radius is backRadius. The center of the arc is at distance backRadius from origin.
  // We want the backrest to be behind the seat (negative Z).
  // So we place the mesh at z = -something.
  // Actually, let's just position it manually.
  backrest.position.set(0, legH + backrestH * 0.6, -seatD * 0.4);
  root.add(backrest);

  // --- Rear Legs ---
  // Curved tubes.
  function createRearLeg(side) {
    const x = side * (seatW * 0.4);
    const z = -seatD * 0.4;
    
    // Curve from floor to top of backrest support
    const p1 = new THREE.Vector3(x, 0, z + 0.05); // Foot (slightly forward)
    const p2 = new THREE.Vector3(x, legH * 0.5, z); // Mid (curves out)
    const p3 = new THREE.Vector3(x, legH + backrestH * 0.8, z); // Top
    
    const curve = new THREE.CatmullRomCurve3([p1, p2, p3]);
    const geom = new THREE.TubeGeometry(curve, 20, 0.022, 12, false);
    const mesh = new THREE.Mesh(geom, woodMat);
    return mesh;
  }

  const rearLegL = createRearLeg(-1);
  const rearLegR = createRearLeg(1);
  root.add(rearLegL);
  root.add(rearLegR);

  // --- Front Legs ---
  // Tapered cylinders, splayed out.
  const frontLegGeom = new THREE.CylinderGeometry(0.02, 0.028, legH, 16);
  // Taper is handled by radiusTop/radiusBottom.
  
  function createFrontLeg(side) {
    const x = side * (seatW * 0.4);
    const z = seatD * 0.4;
    
    const mesh = new THREE.Mesh(frontLegGeom, woodMat);
    mesh.position.set(x, legH / 2, z);
    // Splay outwards
    mesh.rotation.z = side * 0.08; 
    mesh.rotation.x = 0.05; // Slight back splay
    return mesh;
  }

  const frontLegL = createFrontLeg(-1);
  const frontLegR = createFrontLeg(1);
  root.add(frontLegL);
  root.add(frontLegR);

  // --- Foot Pads ---
  const padGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.008, 16);
  
  function addPad(x, z) {
    const pad = new THREE.Mesh(padGeom, padMat);
    pad.position.set(x, 0.004, z);
    root.add(pad);
  }

  // Approximate foot positions based on leg ends
  addPad(-seatW * 0.4, -seatD * 0.35); // Rear L
  addPad(seatW * 0.4, -seatD * 0.35);  // Rear R
  addPad(-seatW * 0.42, seatD * 0.42); // Front L
  addPad(seatW * 0.42, seatD * 0.42);  // Front R

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