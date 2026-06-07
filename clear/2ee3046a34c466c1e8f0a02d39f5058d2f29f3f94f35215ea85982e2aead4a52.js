export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Ceramic glaze: earthy brown/tan with speckles.
  // We use a DataTexture for the speckled pattern.
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseColor = { r: 188, g: 170, b: 164 }; // #bcaaa4
  const speckleColor = { r: 93, g: 64, b: 55 }; // #5d4037

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      // Deterministic pseudo-noise for speckles
      const noise = Math.sin(x * 0.15) * Math.cos(y * 0.15) + Math.sin(x * 0.05 + y * 0.05) * 2.0;
      const isSpeckle = noise > 1.2;
      
      data[i] = isSpeckle ? speckleColor.r : baseColor.r;
      data[i + 1] = isSpeckle ? speckleColor.g : baseColor.g;
      data[i + 2] = isSpeckle ? speckleColor.b : baseColor.b;
      data[i + 3] = 255;
    }
  }

  const glazeTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  glazeTexture.colorSpace = THREE.SRGBColorSpace;
  glazeTexture.wrapS = THREE.RepeatWrapping;
  glazeTexture.wrapT = THREE.RepeatWrapping;
  glazeTexture.needsUpdate = true;

  const ceramicMat = new THREE.MeshStandardMaterial({
    map: glazeTexture,
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.35,
  });

  const darkClayMat = new THREE.MeshStandardMaterial({
    color: 0x5d4037,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Geometry: Outer Bowl ---
  // Profile for the exterior shape (including foot and rim)
  const outerProfile = [
    new THREE.Vector2(0.00, -0.02), // Bottom center
    new THREE.Vector2(0.09, -0.02), // Foot edge
    new THREE.Vector2(0.12, -0.01), // Foot curve up
    new THREE.Vector2(0.15, 0.05),  // Bowl side
    new THREE.Vector2(0.19, 0.12),  // Rim outer edge
    new THREE.Vector2(0.20, 0.14),  // Top of rim outer
    new THREE.Vector2(0.18, 0.14),  // Top of rim inner
    new THREE.Vector2(0.17, 0.12),  // Rim inner lip
    new THREE.Vector2(0.13, 0.05),  // Bowl side inner
    new THREE.Vector2(0.08, 0.00),  // Bottom inner
    new THREE.Vector2(0.00, 0.00),  // Close at center
  ];
  
  const outerBowlGeom = new THREE.LatheGeometry(outerProfile, 32);
  // Flip normals so we see the outside? Lathe defaults to outward normals for CCW profile.
  // The profile above goes bottom->top->in->bottom. This creates a solid volume.
  // We want to see the outside.
  const outerBowl = new THREE.Mesh(outerBowlGeom, ceramicMat);
  root.add(outerBowl);

  // --- Geometry: Inner Bowl ---
  // A slightly smaller bowl inside to simulate thickness, visible at rim and holes.
  const innerProfile = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.07, 0.00),
    new THREE.Vector2(0.12, 0.05),
    new THREE.Vector2(0.16, 0.115), // Just below rim
    new THREE.Vector2(0.00, 0.115), // Close center
  ];
  
  const innerBowlGeom = new THREE.LatheGeometry(innerProfile, 32);
  const innerBowl = new THREE.Mesh(innerBowlGeom, darkClayMat);
  innerBowl.position.y = 0.005; // Slight offset to sit inside
  root.add(innerBowl);

  // --- Geometry: Handle ---
  // Flat paddle shape with a hole.
  const handleShape = new THREE.Shape();
  // Start at rim connection
  handleShape.moveTo(0.17, 0.12); 
  handleShape.lineTo(0.35, 0.12);
  handleShape.quadraticCurveTo(0.40, 0.12, 0.40, 0.16); // Rounded end
  handleShape.quadraticCurveTo(0.40, 0.20, 0.35, 0.20);
  handleShape.lineTo(0.17, 0.20);
  handleShape.lineTo(0.17, 0.12);

  // Hole in handle
  const holePath = new THREE.Path();
  holePath.absarc(0.28, 0.16, 0.04, 0, Math.PI * 2, true);
  handleShape.holes.push(holePath);

  const handleGeom = new THREE.ExtrudeGeometry(handleShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
  });

  // Center the handle geometry locally so rotation is easier
  handleGeom.center();
  
  const handle = new THREE.Mesh(handleGeom, ceramicMat);
  // Position handle to attach to the side of the bowl
  // The bowl is rotationally symmetric. We place handle at +X side.
  handle.position.set(0.20, 0.16, 0); 
  root.add(handle);

  // --- Perforations (Holes) ---
  // We simulate holes by placing small dark cylinders on the outer surface.
  // This avoids complex boolean operations.
  const holeGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.015, 8);
  const holeMat = darkClayMat;
  
  // Define rows of holes (y, count, radius_offset)
  // Approximate bowl radius function: R(y) ~ 0.12 + (y + 0.02) * 0.5
  const holeRows = [
    { y: 0.02, count: 6 },
    { y: 0.05, count: 8 },
    { y: 0.08, count: 10 },
    { y: 0.10, count: 12 },
  ];

  holeRows.forEach(row => {
    const radius = 0.12 + (row.y + 0.02) * 0.5;
    for (let i = 0; i < row.count; i++) {
      const angle = (i / row.count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const hole = new THREE.Mesh(holeGeom, holeMat);
      hole.position.set(x, row.y, z);
      
      // Orient hole to face center (0, y, 0)
      // Normal vector points inward: (-x, 0, -z)
      hole.lookAt(0, row.y, 0);
      // Cylinder default is Y-up. lookAt makes Z face target. 
      // We want the cylinder axis (Y) to point to center.
      // So rotate 90 deg around X after lookAt?
      // Easier: Calculate quaternion directly.
      const normal = new THREE.Vector3(-x, 0, -z).normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      hole.quaternion.copy(quaternion);
      
      // Push slightly inward so it sits flush/inset
      hole.position.add(normal.clone().multiplyScalar(0.005));
      
      root.add(hole);
    }
  });

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