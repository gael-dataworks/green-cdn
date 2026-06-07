export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Beige knit material with procedural ribbing texture
  const knitColor = 0xE0D0C0;
  const knitMat = new THREE.MeshStandardMaterial({
    color: knitColor,
    metalness: 0.0,
    roughness: 0.85,
    map: createKnitTexture(THREE),
  });

  // Fluffy ear material (slightly lighter, no ribbing, very rough)
  const fluffMat = new THREE.MeshStandardMaterial({
    color: 0xEADCC8,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Geometry: Main Hat Body (Dome + Brim) ---
  // Using LatheGeometry to create a seamless shape where texture coordinates
  // run vertically up the brim and then up the dome, matching the knit pattern.
  const profilePoints = [
    new THREE.Vector2(0.36, 0.00), // Inner bottom of brim
    new THREE.Vector2(0.48, 0.00), // Outer bottom of brim
    new THREE.Vector2(0.48, 0.11), // Top of brim (fold line)
    new THREE.Vector2(0.46, 0.14), // Start of dome curve
    new THREE.Vector2(0.42, 0.25), // Side of dome
    new THREE.Vector2(0.30, 0.42), // Upper dome
    new THREE.Vector2(0.15, 0.52), // Top curve
    new THREE.Vector2(0.00, 0.56), // Top center
  ];

  const hatGeom = new THREE.LatheGeometry(profilePoints, 36);
  // Fix UVs if necessary, but Lathe default (v along profile, u around) works for vertical stripes
  const hatBody = new THREE.Mesh(hatGeom, knitMat);
  hatBody.name = "hat_body";
  root.add(hatBody);

  // --- Geometry: Ears ---
  // Two fluffy spheres attached to the top sides
  const earRadius = 0.11;
  const earGeom = new THREE.SphereGeometry(earRadius, 24, 24);
  
  // Position ears: Top sides, slightly back
  const earY = 0.48;
  const earX = 0.24;
  const earZ = -0.12;

  const leftEar = new THREE.Mesh(earGeom, fluffMat);
  leftEar.name = "left_ear";
  leftEar.position.set(-earX, earY, earZ);
  // Rotate slightly to face outward/up
  leftEar.rotation.z = Math.PI / 6;
  leftEar.rotation.x = -Math.PI / 8;
  root.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, fluffMat);
  rightEar.name = "right_ear";
  rightEar.position.set(earX, earY, earZ);
  rightEar.rotation.z = -Math.PI / 6;
  rightEar.rotation.x = -Math.PI / 8;
  root.add(rightEar);

  // --- Normalization ---
  fitToUnitCube(THREE, root);

  return root;
}

// Helper: Procedural vertical ribbed knit texture
function createKnitTexture(THREE) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  
  const colorLight = [230, 216, 200]; // #E6D8C8
  const colorDark = [200, 180, 160];  // #C8B4A0
  
  const stripeWidth = 8; // Pixels per rib pair

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      
      // Create vertical stripes
      // Modulo x to determine which stripe we are in
      const stripePhase = (x % (stripeWidth * 2)) / stripeWidth;
      
      // Simple step function for hard ribs, or smooth for soft yarn
      // Let's do a soft gradient to simulate round yarn
      const t = Math.sin(stripePhase * Math.PI); 
      
      let r, g, b;
      if (t > 0.5) {
        // Light part of rib
        r = colorLight[0]; g = colorLight[1]; b = colorLight[2];
      } else {
        // Dark part (shadow between ribs)
        r = colorDark[0]; g = colorDark[1]; b = colorDark[2];
      }

      // Add subtle horizontal noise for yarn texture
      const noise = (Math.sin(x * 0.5) * Math.cos(y * 0.5) + 1) * 10;
      r = Math.min(255, Math.max(0, r + noise));
      g = Math.min(255, Math.max(0, g + noise));
      b = Math.min(255, Math.max(0, b + noise));

      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // Repeat texture to make ribs finer
  texture.repeat.set(4, 1); 
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