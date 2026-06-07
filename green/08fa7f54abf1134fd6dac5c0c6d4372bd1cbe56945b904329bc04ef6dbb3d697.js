export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Glass: Clear, high transmission, low roughness
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Lid: Light blue matte plastic/painted metal
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x87CEEB,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Label: Yellow paper with procedural sun texture
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Base white, texture provides color
    metalness: 0.0,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });

  // Contents: White pills/cotton
  const contentMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Procedural Texture for Label ---

  function createSunLabelTexture() {
    const width = 256;
    const height = 128; // Aspect ratio 2:1 for wrapping
    const data = new Uint8Array(width * height * 4);
    const yellow = [255, 235, 59, 255];
    const black = [20, 20, 20, 255];
    const pink = [255, 160, 160, 255];

    const cx = width / 2;
    const cy = height / 2;
    const faceR = 24;
    const rayR = 44;
    const rayInner = 28;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Default yellow background
        data[idx] = yellow[0];
        data[idx + 1] = yellow[1];
        data[idx + 2] = yellow[2];
        data[idx + 3] = 255;

        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Draw Rays
        // 16 rays, angular width ~0.2 rad
        const rayCount = 16;
        const rayWidth = 0.25;
        let isRay = false;
        if (dist > rayInner && dist < rayR) {
          // Normalize angle to 0-2PI
          let a = angle;
          if (a < 0) a += Math.PI * 2;
          // Check against ray angles
          for (let i = 0; i < rayCount; i++) {
            const rayAngle = (i / rayCount) * Math.PI * 2;
            let diff = Math.abs(a - rayAngle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff < rayWidth / 2) {
              isRay = true;
              break;
            }
          }
        }

        if (isRay) {
          data[idx] = black[0];
          data[idx + 1] = black[1];
          data[idx + 2] = black[2];
        }

        // Draw Face Circle Outline
        if (dist > faceR - 2 && dist <= faceR) {
          data[idx] = black[0];
          data[idx + 1] = black[1];
          data[idx + 2] = black[2];
        }

        // Draw Eyes
        const eyeY = cy - 6;
        const eyeXOffset = 8;
        const eyeR = 3;
        if (Math.sqrt((x - (cx - eyeXOffset)) ** 2 + (y - eyeY) ** 2) < eyeR ||
            Math.sqrt((x - (cx + eyeXOffset)) ** 2 + (y - eyeY) ** 2) < eyeR) {
          data[idx] = black[0];
          data[idx + 1] = black[1];
          data[idx + 2] = black[2];
        }

        // Draw Cheeks
        const cheekY = cy + 6;
        const cheekXOffset = 12;
        const cheekR = 4;
        if (Math.sqrt((x - (cx - cheekXOffset)) ** 2 + (y - cheekY) ** 2) < cheekR ||
            Math.sqrt((x - (cx + cheekXOffset)) ** 2 + (y - cheekY) ** 2) < cheekR) {
          data[idx] = pink[0];
          data[idx + 1] = pink[1];
          data[idx + 2] = pink[2];
        }

        // Draw Smile (arc)
        // y = cy + 10 + (x-cx)^2 * factor
        const smileY = cy + 8;
        const smileWidth = 14;
        const smileDepth = 8;
        // Simple arc check
        const smileProgress = Math.abs(x - cx) / smileWidth;
        if (smileProgress <= 1.0) {
          const arcY = smileY + smileDepth * (smileProgress * smileProgress);
          if (Math.abs(y - arcY) < 2.0) {
             data[idx] = black[0];
             data[idx + 1] = black[1];
             data[idx + 2] = black[2];
          }
        }
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  labelMat.map = createSunLabelTexture();

  // --- Geometry Construction ---

  // 1. Jar Body (Lathe)
  // Profile points [radius, y] from bottom center up
  const jarProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.14, 0.02), // Bottom curve start
    new THREE.Vector2(0.14, 0.40), // Side wall
    new THREE.Vector2(0.13, 0.42), // Neck start (slight inward)
    new THREE.Vector2(0.13, 0.45), // Neck top
    new THREE.Vector2(0.15, 0.46), // Rim flare
    new THREE.Vector2(0.00, 0.46), // Close top (for solid glass look, though hollow is better for jar)
  ];
  // Actually for a jar we want hollow. But simple solid glass with transmission often looks okay.
  // To make it look like a container, let's keep it simple solid glass first.
  // Re-defining profile for better hollow look is complex with Lathe. 
  // Let's stick to the silhouette.
  const jarGeom = new THREE.LatheGeometry(jarProfile, 32);
  const jarBody = new THREE.Mesh(jarGeom, glassMat);
  root.add(jarBody);

  // 2. Lid (Cylinder)
  const lidGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.05, 32);
  const lid = new THREE.Mesh(lidGeom, lidMat);
  lid.position.y = 0.475; // Sit on top of rim
  root.add(lid);

  // 3. Label (Cylinder)
  // Slightly larger radius than jar body (0.14) to avoid z-fighting
  const labelRadius = 0.145;
  const labelHeight = 0.24;
  const labelY = 0.18;
  const labelGeom = new THREE.CylinderGeometry(labelRadius, labelRadius, labelHeight, 32, 1, true);
  const label = new THREE.Mesh(labelGeom, labelMat);
  label.position.y = labelY;
  // Rotate so seam is at back
  label.rotation.y = Math.PI; 
  root.add(label);

  // 4. Contents (White spheres/capsules inside)
  // Deterministic positions
  const contentPositions = [
    [0.05, 0.05, 0.05],
    [-0.06, 0.08, -0.04],
    [0.02, 0.12, -0.08],
    [-0.08, 0.04, 0.06],
    [0.07, 0.15, 0.02],
  ];
  
  const contentGeom = new THREE.SphereGeometry(0.04, 16, 16);
  
  for (let i = 0; i < contentPositions.length; i++) {
    const [x, y, z] = contentPositions[i];
    const pill = new THREE.Mesh(contentGeom, contentMat);
    pill.position.set(x, y, z);
    // Random-ish rotation based on index
    pill.rotation.set(i * 0.5, i * 0.3, i * 0.7);
    // Scale to look like capsules
    pill.scale.set(1, 1.5, 1);
    root.add(pill);
  }

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