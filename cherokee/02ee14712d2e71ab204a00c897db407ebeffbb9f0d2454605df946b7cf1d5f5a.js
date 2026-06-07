export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Bamboo body material with procedural texture for grain
  const bambooColor = 0xdcb356;
  const bambooMat = new THREE.MeshStandardMaterial({
    color: bambooColor,
    metalness: 0.0,
    roughness: 0.65,
    map: createBambooTexture(THREE),
  });

  // Node material (darker wood rings)
  const nodeMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Hole material (dark interior)
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1510,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const length = 1.2;
  const radius = 0.09;
  const segments = 32;

  // --- Main Body ---
  // Cylinder lies along X axis. Default Cylinder is Y-up, so rotate Z by 90 deg.
  const bodyGeom = new THREE.CylinderGeometry(radius, radius, length, segments, 1, true);
  const body = new THREE.Mesh(bodyGeom, bambooMat);
  body.rotation.z = Math.PI / 2;
  root.add(body);

  // --- Nodes (Rings) ---
  // Bamboo has natural joints. We model them as slightly wider torus rings.
  // Positions along the X axis (since body is rotated).
  const nodePositions = [-0.35, 0.15, 0.55];
  const nodeRadius = radius + 0.012;
  const nodeTube = 0.015;
  
  for (const nx of nodePositions) {
    const nodeGeom = new THREE.TorusGeometry(nodeRadius, nodeTube, 16, 32);
    const node = new THREE.Mesh(nodeGeom, nodeMat);
    node.position.set(nx, 0, 0);
    node.rotation.y = Math.PI / 2; // Torus is XY plane, rotate to YZ to wrap around X-axis cylinder
    // Wait, Torus default is XY. To wrap around X-axis cylinder:
    // Cylinder surface normal at top is Y. Torus needs to be in YZ plane to encircle X axis.
    // Rotation Y = 90 deg puts Torus in YZ plane.
    root.add(node);
  }

  // --- Holes ---
  // Holes are on the "top" of the flute (Y+ in local space before rotation? 
  // No, body is rotated Z=90. So local Y of cylinder is now World Y? 
  // Let's trace: Cylinder default is Y-up. Rotate Z 90 -> X-up? No.
  // Rotation Z 90 deg: Y axis becomes X axis. X axis becomes -Y axis.
  // So the "top" of the cylinder (original Y+) is now pointing along +X? 
  // No. Rotation Z rotates around Z. Y -> X. 
  // So the "top" of the unrotated cylinder is now the +X side.
  // But we want holes on the "top" relative to the viewer (World Y+).
  // If the flute lies along X axis on the ground, the "top" surface is World Y+.
  // The cylinder geometry's "seam" or top vertex is at local Y=radius.
  // After rotation.z = PI/2, local Y becomes World X. Local X becomes World -Y.
  // This is confusing. Let's just build it aligned to X axis and place holes at local Y = radius.
  // Then rotate the whole group if needed.
  // Actually, simpler: Keep cylinder Y-up (vertical). Rotate the whole group later?
  // No, let's keep the cylinder along X.
  // CylinderGeometry(radius, radius, height, radSeg, heightSeg, openEnded, thetaStart, thetaLength)
  // Default orientation: Axis is Y.
  // If I rotate mesh.rotation.z = Math.PI / 2, the axis becomes X.
  // The "top" of the cylinder (local +Y) is now pointing to World +X.
  // The "front" of the cylinder (local +X) is now pointing to World -Y.
  // The "side" of the cylinder (local +Z) is still World +Z.
  // I want holes on World +Y (top).
  // So I need the surface normal to point +Y.
  // In the rotated mesh (axis X), the surface normals are radial in YZ plane.
  // So +Y normal is at local angle 90 deg in YZ plane?
  // Let's just place holes at local coordinates that map to World Y+.
  // If mesh is rotated Z=90:
  // Local (x, y, z) -> World (y, -x, z).
  // We want World Y > 0. So Local Y > 0.
  // So holes should be at local y = radius.
  // And local x = hole_position_along_length.
  // And local z = 0.
  
  // Hole definitions: [x_position, radius]
  // Based on image: 
  // Left end (negative x): Large hole.
  // Then node at -0.35.
  // Then 2 small holes.
  // Then node at 0.15.
  // Then 2 med holes.
  // Then node at 0.55.
  // Then 1 hole near right end.
  
  const holes = [
    { x: -0.55, r: 0.018 }, // Embouchure (large)
    { x: -0.20, r: 0.008 }, // Finger 1
    { x: -0.10, r: 0.008 }, // Finger 2
    { x:  0.30, r: 0.012 }, // Finger 3
    { x:  0.40, r: 0.012 }, // Finger 4
    { x:  0.58, r: 0.010 }  // End hole
  ];

  for (const h of holes) {
    const holeGeom = new THREE.CircleGeometry(h.r, 16);
    const hole = new THREE.Mesh(holeGeom, holeMat);
    // Position on surface: x = h.x, y = radius, z = 0
    hole.position.set(h.x, radius, 0);
    // Rotate to face up (normal +Y). Circle is XY plane (normal Z).
    // We want normal +Y. Rotate X by -90 deg.
    hole.rotation.x = -Math.PI / 2;
    // Slightly inset to avoid z-fighting
    hole.position.y -= 0.001;
    root.add(hole);
  }

  // --- End Caps (Optional, bamboo is hollow but has nodes at ends usually) ---
  // The image shows open ends but with thickness. The cylinder is openEnded=true effectively 
  // if we don't cap it, but CylinderGeometry caps by default.
  // The image shows the hollow interior at the left end.
  // To simulate this, we can add a dark ring at the end.
  const rimGeom = new THREE.RingGeometry(radius - 0.015, radius, 32);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, side: THREE.DoubleSide });
  
  // Left rim
  const leftRim = new THREE.Mesh(rimGeom, rimMat);
  leftRim.position.set(-length/2, 0, 0);
  leftRim.rotation.y = Math.PI / 2; // Face X axis
  root.add(leftRim);

  // Right rim
  const rightRim = new THREE.Mesh(rimGeom, rimMat);
  rightRim.position.set(length/2, 0, 0);
  rightRim.rotation.y = Math.PI / 2;
  root.add(rightRim);

  // --- Dark interior hint (optional, adds depth to holes) ---
  // We already have dark circles. To make the large embouchure look deeper:
  const deepHoleGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.04, 16);
  const deepHole = new THREE.Mesh(deepHoleGeom, holeMat);
  deepHole.position.set(-0.55, radius - 0.02, 0);
  deepHole.rotation.x = -Math.PI / 2;
  root.add(deepHole);

  fitToUnitCube(THREE, root);
  return root;
}

function createBambooTexture(THREE) {
  const width = 256;
  const height = 64;
  const data = new Uint8Array(width * height * 4);
  
  const baseColor = { r: 220, g: 179, b: 86 }; // #dcb356
  const grainColor = { r: 160, g: 128, b: 80 }; // #a08050
  const darkGrainColor = { r: 100, g: 80, b: 50 };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (x + y * width) * 4;
      
      // Base noise
      const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.2)) * 10;
      
      // Vertical grain lines
      let r = baseColor.r + noise;
      let g = baseColor.g + noise;
      let b = baseColor.b + noise;

      // Add random vertical streaks
      if (Math.sin(x * 0.05 + y * 0.01) > 0.8) {
        r = grainColor.r;
        g = grainColor.g;
        b = grainColor.b;
      }
      if (Math.sin(x * 0.08 + y * 0.02) > 0.9) {
        r = darkGrainColor.r;
        g = darkGrainColor.g;
        b = darkGrainColor.b;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
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