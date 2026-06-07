export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Beige knit material
  const hatColor = 0xE6D8C8;
  const knitMat = new THREE.MeshStandardMaterial({
    color: hatColor,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Generate a vertical ribbed bump map for the knit texture
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      // Create vertical stripes: light ridges, dark grooves
      // Modulo 16 gives a rib width. 8 pixels ridge, 8 pixels groove.
      const isRidge = (x % 16) < 8;
      const val = isRidge ? 220 : 100;
      const i = (y * texSize + x) * 4;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 255;
    }
  }
  const bumpTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  bumpTexture.colorSpace = THREE.SRGBColorSpace;
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.RepeatWrapping;
  // Repeat horizontally to get many ribs around the hat, once vertically
  bumpTexture.repeat.set(24, 1); 
  bumpTexture.needsUpdate = true;
  knitMat.bumpMap = bumpTexture;
  knitMat.bumpScale = 0.015;

  // Ear material (slightly fuzzier/different tone)
  const earMat = new THREE.MeshStandardMaterial({
    color: 0xE0D0C0,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Geometry: Main Hat Body ---
  // Lathe profile from bottom inner cuff to top center
  // Coordinates: (radius, y)
  const profilePoints = [
    new THREE.Vector2(0.40, -0.45), // Inner bottom edge of cuff
    new THREE.Vector2(0.52, -0.45), // Outer bottom edge of cuff
    new THREE.Vector2(0.50, -0.30), // Outer top of cuff (fold line)
    new THREE.Vector2(0.45, -0.28), // Transition inward slightly
    new THREE.Vector2(0.46, -0.20), // Start of head dome
    new THREE.Vector2(0.48, 0.00),  // Widest part of head
    new THREE.Vector2(0.42, 0.25),  // Top curve start
    new THREE.Vector2(0.25, 0.40),  // Top dome
    new THREE.Vector2(0.00, 0.48),  // Top center
  ];
  
  const hatGeom = new THREE.LatheGeometry(profilePoints, 36);
  // Adjust UVs for the texture to align vertically
  // LatheGeometry UVs are usually (angle, height). 
  // We want the bump map stripes to run vertically (along Y).
  // Default UVs should work if we map the texture correctly.
  // The texture is set to repeat 24 times horizontally (around the hat).
  
  const hat = new THREE.Mesh(hatGeom, knitMat);
  root.add(hat);

  // --- Geometry: Ears ---
  // Fluffy spheres, slightly flattened
  const earGeom = new THREE.SphereGeometry(0.14, 24, 24);
  
  // Left Ear
  const leftEar = new THREE.Mesh(earGeom, earMat);
  leftEar.position.set(-0.32, 0.35, -0.15);
  leftEar.rotation.set(0.2, 0, 0.3); // Tilt out and back
  leftEar.scale.set(1, 0.9, 0.8); // Flatten slightly
  root.add(leftEar);

  // Right Ear
  const rightEar = new THREE.Mesh(earGeom, earMat);
  rightEar.position.set(0.32, 0.35, -0.15);
  rightEar.rotation.set(0.2, 0, -0.3); // Tilt out and back
  rightEar.scale.set(1, 0.9, 0.8);
  root.add(rightEar);

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