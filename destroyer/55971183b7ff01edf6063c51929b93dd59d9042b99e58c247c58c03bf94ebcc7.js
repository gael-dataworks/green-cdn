export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear glass material
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Cork material with procedural texture
  const corkSize = 128;
  const corkData = new Uint8Array(corkSize * corkSize * 4);
  const baseColor = new THREE.Color(0xd2b48c); // Tan
  const speckleColor = new THREE.Color(0x8b5a2b); // Dark brown
  const lightSpeckleColor = new THREE.Color(0xe6c9a8); // Light tan

  for (let y = 0; y < corkSize; y++) {
    for (let x = 0; x < corkSize; x++) {
      const i = (y * corkSize + x) * 4;
      // Deterministic pseudo-noise using trig functions
      const nx = x / corkSize;
      const ny = y / corkSize;
      const noise =
        Math.sin(nx * 20) * Math.cos(ny * 20) +
        Math.sin(nx * 50 + 1) * Math.cos(ny * 50 + 1);
      
      let r, g, b;
      if (noise > 0.4) {
        // Dark speckle
        r = speckleColor.r * 255;
        g = speckleColor.g * 255;
        b = speckleColor.b * 255;
      } else if (noise < -0.4) {
        // Light speckle
        r = lightSpeckleColor.r * 255;
        g = lightSpeckleColor.g * 255;
        b = lightSpeckleColor.b * 255;
      } else {
        // Base
        r = baseColor.r * 255;
        g = baseColor.g * 255;
        b = baseColor.b * 255;
      }
      
      corkData[i] = r;
      corkData[i + 1] = g;
      corkData[i + 2] = b;
      corkData[i + 3] = 255;
    }
  }

  const corkTexture = new THREE.DataTexture(corkData, corkSize, corkSize, THREE.RGBAFormat);
  corkTexture.colorSpace = THREE.SRGBColorSpace;
  corkTexture.needsUpdate = true;
  corkTexture.wrapS = THREE.RepeatWrapping;
  corkTexture.wrapT = THREE.RepeatWrapping;

  const corkMat = new THREE.MeshStandardMaterial({
    map: corkTexture,
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Geometry ---

  // Bottle Profile (Hollow Cross-Section)
  // Coordinates: (radius, height)
  // We define the outline of the glass wall to create a hollow volume
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Center bottom (start)
    new THREE.Vector2(0.30, 0.00), // Outer bottom corner
    new THREE.Vector2(0.30, 0.05), // Outer base thickness
    new THREE.Vector2(0.28, 0.05), // Inner base corner (creates punt/thickness)
    new THREE.Vector2(0.28, 0.75), // Inner wall up to shoulder
    new THREE.Vector2(0.12, 0.85), // Inner neck start (shoulder curve)
    new THREE.Vector2(0.12, 0.96), // Inner lip top
    new THREE.Vector2(0.14, 0.96), // Outer lip flare
    new THREE.Vector2(0.14, 0.98), // Outer lip top
    new THREE.Vector2(0.12, 0.98), // Inner lip top (closing the hole)
    new THREE.Vector2(0.12, 0.88), // Inner neck down
    new THREE.Vector2(0.26, 0.80), // Inner shoulder curve
    new THREE.Vector2(0.28, 0.75), // Inner wall down (meet previous)
    // To close the loop properly for Lathe, we usually just go up one side and down the other
    // But LatheGeometry with an open shape creates a surface. With a closed shape, a solid.
    // Let's simplify: Just outer silhouette for robustness, transmission handles the look.
    // Re-defining for simple outer shell which is safer for rendering:
  ];

  // Simplified Outer Profile for robust glass rendering
  const outerProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom Center
    new THREE.Vector2(0.30, 0.00), // Bottom Edge
    new THREE.Vector2(0.30, 0.05), // Base Thickness visual
    new THREE.Vector2(0.30, 0.75), // Body Side
    new THREE.Vector2(0.28, 0.82), // Shoulder Start
    new THREE.Vector2(0.14, 0.92), // Neck Start
    new THREE.Vector2(0.14, 0.96), // Neck Top
    new THREE.Vector2(0.16, 0.98), // Lip Flare
    new THREE.Vector2(0.00, 0.98), // Top Center
  ];

  const bottleGeom = new THREE.LatheGeometry(outerProfile, 32);
  const bottle_body = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle_body);

  // Cork Stopper
  // Tapered cylinder: radiusTop > radiusBottom
  const corkHeight = 0.25;
  const corkTopRadius = 0.15;
  const corkBottomRadius = 0.12;
  const corkGeom = new THREE.CylinderGeometry(corkTopRadius, corkBottomRadius, corkHeight, 16);
  const cork_stop = new THREE.Mesh(corkGeom, corkMat);
  
  // Position cork: inserted slightly into the neck
  // Neck top is at Y=0.98. Cork height 0.25.
  // Let's say 0.05 is inside, so bottom of cork is at 0.93.
  // Center of cork = 0.93 + 0.125 = 1.055 relative to bottle base.
  cork_stop.position.y = 1.055;
  root.add(cork_stop);

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