export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Ceramic finish: low roughness, low metalness
  const matRed = new THREE.MeshStandardMaterial({ color: 0xe60000, roughness: 0.2, metalness: 0.1 });
  const matGreen = new THREE.MeshStandardMaterial({ color: 0x00aa00, roughness: 0.2, metalness: 0.1 });
  const matBlue = new THREE.MeshStandardMaterial({ color: 0x0080ff, roughness: 0.2, metalness: 0.1 });
  const matPurple = new THREE.MeshStandardMaterial({ color: 0x6a0dad, roughness: 0.2, metalness: 0.1 });
  const matYellow = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.1 });
  const matOrange = new THREE.MeshStandardMaterial({ color: 0xffa500, roughness: 0.2, metalness: 0.1 });
  const matInterior = new THREE.MeshStandardMaterial({ color: 0x000022, roughness: 0.3, metalness: 0.2 });
  const matRim = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.1 });

  // --- Dimensions ---
  const bodyRadius = 0.35;
  const bodySegments = 32;
  
  // Stack heights (approximate proportions based on image)
  // Total height approx 1.0 unit before normalization
  const hPurpleBase = 0.18;
  const hYellowLine1 = 0.025;
  const hBlue = 0.16;
  const hGreen = 0.16;
  const hOrangeLine = 0.025;
  const hRedTop = 0.25;
  const hRim = 0.04;
  
  let currentY = 0.0;

  // --- Body Segments (Bottom to Top) ---

  // 1. Purple Base
  const geomPurpleBase = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 0.95, hPurpleBase, bodySegments);
  const meshPurpleBase = new THREE.Mesh(geomPurpleBase, matPurple);
  meshPurpleBase.position.y = currentY + hPurpleBase / 2;
  root.add(meshPurpleBase);
  currentY += hPurpleBase;

  // 2. Yellow Line
  const geomYellow1 = new THREE.CylinderGeometry(bodyRadius, bodyRadius, hYellowLine1, bodySegments);
  const meshYellow1 = new THREE.Mesh(geomYellow1, matYellow);
  meshYellow1.position.y = currentY + hYellowLine1 / 2;
  root.add(meshYellow1);
  currentY += hYellowLine1;

  // 3. Blue Band
  const geomBlue = new THREE.CylinderGeometry(bodyRadius, bodyRadius, hBlue, bodySegments);
  const meshBlue = new THREE.Mesh(geomBlue, matBlue);
  meshBlue.position.y = currentY + hBlue / 2;
  root.add(meshBlue);
  currentY += hBlue;

  // 4. Green Band
  const geomGreen = new THREE.CylinderGeometry(bodyRadius, bodyRadius, hGreen, bodySegments);
  const meshGreen = new THREE.Mesh(geomGreen, matGreen);
  meshGreen.position.y = currentY + hGreen / 2;
  root.add(meshGreen);
  currentY += hGreen;

  // 5. Orange Line
  const geomOrange = new THREE.CylinderGeometry(bodyRadius, bodyRadius, hOrangeLine, bodySegments);
  const meshOrange = new THREE.Mesh(geomOrange, matOrange);
  meshOrange.position.y = currentY + hOrangeLine / 2;
  root.add(meshOrange);
  currentY += hOrangeLine;

  // 6. Red Top
  const geomRed = new THREE.CylinderGeometry(bodyRadius, bodyRadius, hRedTop, bodySegments);
  const meshRed = new THREE.Mesh(geomRed, matRed);
  meshRed.position.y = currentY + hRedTop / 2;
  root.add(meshRed);
  currentY += hRedTop;

  // 7. Rim (Dark edge)
  const geomRim = new THREE.CylinderGeometry(bodyRadius, bodyRadius, hRim, bodySegments);
  const meshRim = new THREE.Mesh(geomRim, matRim);
  meshRim.position.y = currentY + hRim / 2;
  root.add(meshRim);
  currentY += hRim;

  // --- Interior (Dark cylinder to show depth) ---
  // Slightly smaller radius, sits inside the top red section
  const interiorRadius = bodyRadius * 0.85;
  const interiorHeight = hRedTop * 0.9;
  const geomInterior = new THREE.CylinderGeometry(interiorRadius, interiorRadius * 0.95, interiorHeight, bodySegments);
  const meshInterior = new THREE.Mesh(geomInterior, matInterior);
  // Position slightly below the rim top
  meshInterior.position.y = (currentY - hRim) + (hRedTop * 0.6); 
  root.add(meshInterior);

  // --- Handles ---
  // Torus geometry: TorusGeometry(radius, tube, radialSegments, tubularSegments)
  const handleRadius = 0.24;
  const handleTube = 0.045;
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 16, 32);

  // Left Handle (Purple)
  const meshHandleLeft = new THREE.Mesh(handleGeom, matPurple);
  // Torus is in XY plane. Rotate 90 deg around Z to stand vertically in YZ plane?
  // Actually, we want it on the side (X axis). 
  // Default Torus is flat on XY. 
  // Rotate X by 90 deg -> Flat on YZ. 
  // Then position at X = -bodyRadius.
  meshHandleLeft.rotation.x = Math.PI / 2;
  meshHandleLeft.position.set(-bodyRadius - (handleTube * 0.2), currentY - hRedTop * 0.55, 0);
  // Slight tilt to match ergonomic curve if needed, but vertical is fine for this style
  root.add(meshHandleLeft);

  // Right Handle (Red)
  const meshHandleRight = new THREE.Mesh(handleGeom, matRed);
  meshHandleRight.rotation.x = Math.PI / 2;
  meshHandleRight.position.set(bodyRadius + (handleTube * 0.2), currentY - hRedTop * 0.55, 0);
  root.add(meshHandleRight);

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