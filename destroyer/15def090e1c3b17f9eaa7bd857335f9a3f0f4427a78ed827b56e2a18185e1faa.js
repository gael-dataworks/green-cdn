export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Beige canvas fabric: high roughness, no metalness.
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xB8B5A8,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Lime green plastic zipper/handles: slightly shiny, low metalness.
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xC4F638,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Darker stitching/seam color for subtle details
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x99968A,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Main Body ---
  // Profile: Flat bottom, vertical sides, rounded top arch.
  const bodyShape = new THREE.Shape();
  const bw = 0.17; // half width
  const bh = 0.23; // half height (approx)
  const bottomY = -0.22;
  const topY = 0.23;
  const cornerR = 0.06;

  bodyShape.moveTo(-bw, bottomY);
  bodyShape.lineTo(-bw, topY - cornerR);
  // Top left corner arc
  bodyShape.quadraticCurveTo(-bw, topY, -bw + cornerR, topY);
  // Top arch
  bodyShape.lineTo(bw - cornerR, topY);
  // Top right corner arc
  bodyShape.quadraticCurveTo(bw, topY, bw, topY - cornerR);
  bodyShape.lineTo(bw, bottomY);
  bodyShape.lineTo(-bw, bottomY);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 12,
  });
  // Center the geometry so pivot is at bottom-center-back roughly
  bodyGeom.translate(0, 0, -0.07); 
  
  const mainBody = new THREE.Mesh(bodyGeom, fabricMat);
  // Rotate to face +Z (Extrude is +Z by default, but we want the curve in XY plane facing Z)
  // Actually ExtrudeGeometry creates shape in XY, extrudes along Z. 
  // Our shape is in XY. We want the flat face to be front/back.
  // The shape defined above is in XY. Extrusion is along Z.
  // So the front face is at Z = depth/2.
  // We want the backpack to face +Z.
  // The current setup: Shape in XY, extruded to Z. Front face is +Z. This is correct.
  // But we translated Z by -0.07, so it goes from -0.14 to 0.
  // Let's recenter it so the bulk is around 0.
  mainBody.position.z = 0.07; 
  root.add(mainBody);

  // --- Front Pocket ---
  // A smaller box attached to the lower front.
  const pocketW = 0.26;
  const pocketH = 0.16;
  const pocketD = 0.04;
  const pocketGeom = new THREE.BoxGeometry(pocketW, pocketH, pocketD);
  const frontPocket = new THREE.Mesh(pocketGeom, fabricMat);
  frontPocket.position.set(0, -0.14, 0.16); // On front face
  root.add(frontPocket);

  // Pocket vertical seam/fold detail (left side of pocket)
  const seamGeom = new THREE.PlaneGeometry(0.005, pocketH);
  const seam = new THREE.Mesh(seamGeom, seamMat);
  seam.position.set(-0.06, -0.14, 0.162); // Slightly in front of pocket
  seam.rotation.y = -0.1; // Slight angle
  root.add(seam);

  // --- Zipper Track ---
  // Follows the top curve of the main body.
  const zipperCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, 0.18, 0.145), // Left start
    new THREE.Vector3(-0.08, 0.24, 0.145), // Left curve up
    new THREE.Vector3(0.00, 0.26, 0.145),  // Top center
    new THREE.Vector3(0.08, 0.24, 0.145),  // Right curve down
    new THREE.Vector3(0.12, 0.18, 0.145),  // Right end
  ]);

  const zipperGeom = new THREE.TubeGeometry(zipperCurve, 20, 0.006, 8, false);
  const zipperTrack = new THREE.Mesh(zipperGeom, accentMat);
  root.add(zipperTrack);

  // --- Zipper Pull ---
  // Rectangular tab hanging from the zipper.
  const pullGeom = new THREE.BoxGeometry(0.015, 0.035, 0.008);
  const zipperPull = new THREE.Mesh(pullGeom, accentMat);
  // Position near the right side of the zipper track end
  zipperPull.position.set(0.10, 0.15, 0.15);
  zipperPull.rotation.x = 0.5; // Hang down slightly
  root.add(zipperPull);

  // --- Top Handle ---
  // Loop at the very top center.
  const handleRadius = 0.025;
  const handleTube = 0.008;
  const topHandleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 8, 16, Math.PI);
  const topHandle = new THREE.Mesh(topHandleGeom, fabricMat);
  topHandle.position.set(0, 0.26, 0.0); // Top center, slightly back
  topHandle.rotation.x = Math.PI / 2; // Lie flat on top
  topHandle.rotation.z = Math.PI / 2; // Orient loop along Z
  root.add(topHandle);

  // --- Side Handle ---
  // Loop on the left side (visible in image).
  const sideHandleGeom = new THREE.TorusGeometry(0.025, 0.008, 8, 16, Math.PI);
  const sideHandle = new THREE.Mesh(sideHandleGeom, accentMat); // Lime green like zipper
  sideHandle.position.set(-0.17, 0.0, 0.0); // Left side middle
  sideHandle.rotation.y = Math.PI / 2; // Stick out sideways
  sideHandle.rotation.z = Math.PI / 2; // Loop vertical
  root.add(sideHandle);

  // --- Back Straps (Simplified) ---
  // Just hints of straps on the back to give it volume/context.
  const strapW = 0.04;
  const strapH = 0.15;
  const strapD = 0.02;
  const strapGeom = new THREE.BoxGeometry(strapW, strapH, strapD);
  
  const leftStrap = new THREE.Mesh(strapGeom, fabricMat);
  leftStrap.position.set(-0.06, 0.10, -0.08); // Back face
  leftStrap.rotation.x = 0.2; // Angle out slightly
  root.add(leftStrap);

  const rightStrap = new THREE.Mesh(strapGeom, fabricMat);
  rightStrap.position.set(0.06, 0.10, -0.08);
  rightStrap.rotation.x = 0.2;
  root.add(rightStrap);

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