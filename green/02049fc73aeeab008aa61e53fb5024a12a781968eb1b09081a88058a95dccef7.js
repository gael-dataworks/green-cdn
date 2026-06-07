export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Beige wool color
  const woolColor = 0xE8DCC8;
  const woolShadow = 0xD4C5B0;

  // Procedural knit texture (vertical ribbing)
  const texSize = 128;
  const data = new Uint8Array(texSize * texSize * 4);
  const stripeWidth = 6;
  
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      // Create vertical stripes
      const isStripe = (x % (stripeWidth * 2)) < stripeWidth;
      
      // Base color
      let r = 232, g = 220, b = 200;
      
      // Darken the "grooves" of the knit
      if (isStripe) {
        r = 212; g = 197; b = 176;
      }
      
      // Add slight noise for yarn texture
      const noise = (Math.sin(x * 0.5) * Math.cos(y * 0.5) * 10);
      r += noise; g += noise; b += noise;

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  const knitTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  knitTexture.colorSpace = THREE.SRGBColorSpace;
  knitTexture.wrapS = THREE.RepeatWrapping;
  knitTexture.wrapT = THREE.RepeatWrapping;
  // Repeat texture to get fine ribbing detail
  knitTexture.repeat.set(4, 4); 
  knitTexture.needsUpdate = true;

  const woolMat = new THREE.MeshStandardMaterial({
    color: woolColor,
    map: knitTexture,
    bumpMap: knitTexture,
    bumpScale: 0.015,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Geometry: Hat Body (Lathe) ---
  // Profile points (radius, height) defining the silhouette from bottom inner rim to top
  const profilePoints = [
    new THREE.Vector2(0.11, 0.0),   // Inner bottom rim
    new THREE.Vector2(0.145, 0.0),  // Outer bottom edge
    new THREE.Vector2(0.145, 0.07), // Top of cuff outer
    new THREE.Vector2(0.135, 0.08), // Indent at cuff/head junction
    new THREE.Vector2(0.13, 0.12),  // Lower dome
    new THREE.Vector2(0.115, 0.17), // Mid dome
    new THREE.Vector2(0.08, 0.21),  // Upper dome taper
    new THREE.Vector2(0.0, 0.235)   // Top center
  ];

  const hatGeom = new THREE.LatheGeometry(profilePoints, 64);
  // Rotate 180 deg around Z to align texture vertically if needed, 
  // but Lathe UVs usually map V to height (Y) and U to angle, which is perfect for vertical ribbing.
  const hatBody = new THREE.Mesh(hatGeom, woolMat);
  root.add(hatBody);

  // --- Geometry: Ears ---
  // Fluffy spheres on top sides
  const earGeom = new THREE.SphereGeometry(0.045, 32, 32);
  
  // Left Ear
  const leftEar = new THREE.Mesh(earGeom, woolMat);
  leftEar.position.set(-0.10, 0.20, -0.04);
  leftEar.scale.set(1, 0.9, 0.8); // Slightly flattened
  leftEar.rotation.z = Math.PI / 6; // Tilt outward
  leftEar.rotation.x = -Math.PI / 8;
  root.add(leftEar);

  // Right Ear
  const rightEar = new THREE.Mesh(earGeom, woolMat);
  rightEar.position.set(0.10, 0.20, -0.04);
  rightEar.scale.set(1, 0.9, 0.8);
  rightEar.rotation.z = -Math.PI / 6; // Tilt outward
  rightEar.rotation.x = -Math.PI / 8;
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