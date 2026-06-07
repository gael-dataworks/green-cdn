export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Beige wool material. High roughness for fabric feel, zero metalness.
  const woolMat = new THREE.MeshStandardMaterial({
    color: 0xE6D8C8,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Procedural Knit Texture ---
  // Generates vertical stripes to simulate ribbed knit pattern.
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const colorLight = [230, 216, 200]; // #E6D8C8
  const colorDark = [200, 180, 160];  // #C8B4A0
  const stripeWidth = 8; // Width of one rib in pixels

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      // Create vertical stripes
      const isLight = Math.floor(x / stripeWidth) % 2 === 0;
      const c = isLight ? colorLight : colorDark;
      
      // Add slight noise for yarn texture
      const noise = (Math.sin(x * 0.5) * 10 + Math.cos(y * 0.5) * 10);
      
      data[i] = Math.max(0, Math.min(255, c[0] + noise));
      data[i + 1] = Math.max(0, Math.min(255, c[1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, c[2] + noise));
      data[i + 3] = 255;
    }
  }

  const knitTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  knitTexture.colorSpace = THREE.SRGBColorSpace;
  knitTexture.wrapS = THREE.RepeatWrapping;
  knitTexture.wrapT = THREE.RepeatWrapping;
  knitTexture.repeat.set(4, 2); // Repeat pattern to match hat size
  knitTexture.needsUpdate = true;
  woolMat.map = knitTexture;

  // --- Main Hat Body (Lathe) ---
  // Profile defines the cross-section of the beanie including the folded brim.
  // Coordinates are (radius, height).
  const profilePoints = [
    new THREE.Vector2(0.00, 0.29), // Top center
    new THREE.Vector2(0.06, 0.26), // Top curve start
    new THREE.Vector2(0.12, 0.18), // Crown side
    new THREE.Vector2(0.14, 0.09), // Crown base / Brim top inner
    new THREE.Vector2(0.13, 0.05), // Brim bottom inner (fold)
    new THREE.Vector2(0.16, 0.05), // Brim bottom outer (fold)
    new THREE.Vector2(0.16, 0.00), // Brim top outer (bottom edge of hat)
  ];

  // Use a curve to smooth the profile between points
  const curve = new THREE.SplineCurve(profilePoints);
  const points = curve.getSpacedPoints(32);
  
  const hatGeom = new THREE.LatheGeometry(points, 36);
  // Rotate geometry so the flat bottom is at y=0 if needed, but Lathe centers by default.
  // The profile starts at y=0.29 (top) and goes to y=0.00 (bottom).
  // Lathe centers the geometry. We need to shift it so the bottom is at a known position.
  // Let's just compute the bounding box later or shift manually.
  // Actually, let's shift the profile so the bottom is at y=0.
  // Current min y is 0.00. Max y is 0.29. Center is ~0.145.
  // We want the hat to sit nicely. Let's keep it as is and let fitToUnitCube handle scale/pos.
  
  const hat = new THREE.Mesh(hatGeom, woolMat);
  // Shift hat down so the brim bottom is near y=0
  hat.position.y = -0.145; 
  root.add(hat);

  // --- Ears (Pom-poms) ---
  // Fluffy spheres attached to the top sides.
  const earGeom = new THREE.SphereGeometry(0.055, 24, 24);
  
  // Left Ear
  const leftEar = new THREE.Mesh(earGeom, woolMat);
  leftEar.position.set(-0.11, 0.18, 0.0); // Top left side
  leftEar.scale.set(1, 0.9, 1); // Slightly flattened
  leftEar.rotation.z = Math.PI / 6; // Angle out
  leftEar.rotation.y = -Math.PI / 6;
  root.add(leftEar);

  // Right Ear
  const rightEar = new THREE.Mesh(earGeom, woolMat);
  rightEar.position.set(0.11, 0.18, 0.0); // Top right side
  rightEar.scale.set(1, 0.9, 1);
  rightEar.rotation.z = -Math.PI / 6; // Angle out
  rightEar.rotation.y = Math.PI / 6;
  root.add(rightEar);

  // --- Fit to Unit Cube ---
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