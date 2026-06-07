export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Frosted cap material (translucent plastic)
  const capMat = new THREE.MeshPhysicalMaterial({
    color: 0xb0d4f1,
    metalness: 0.0,
    roughness: 0.4,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
    opacity: 0.9,
  });

  // Clear glass bottle material
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Liquid material (baby blue)
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0x89cff0,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Label material (will get texture)
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  // --- Procedural Label Texture (Glitter + Text) ---
  function createLabelTexture(THREE) {
    const width = 256;
    const height = 256;
    const data = new Uint8Array(width * height * 4);

    // Deterministic pseudo-random function
    function noise(x, y) {
      const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return s - Math.floor(s);
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        // Base glitter background: light blue/silver sparkles
        const n = noise(x, y);
        const sparkle = n > 0.85 ? 1.0 : 0.6 + n * 0.2;
        // Blue tint
        const r = 200 * sparkle;
        const g = 230 * sparkle;
        const b = 255 * sparkle;

        // Draw text bands (white)
        // Top band "Delect"
        if (y > 60 && y < 100) {
           // Simulate text by masking out some pixels or just a solid bar for simplicity
           // Let's make a solid white rounded rect area for the label background
           // and then darker text? No, reference is white text on glitter.
           // Let's draw white bars.
           if (x > 40 && x < 216) {
             // Top line
             if (y > 70 && y < 90) {
               data[idx] = 255; data[idx+1] = 255; data[idx+2] = 255; data[idx+3] = 255;
             }
             // Middle line
             else if (y > 100 && y < 125) {
               data[idx] = 255; data[idx+1] = 255; data[idx+2] = 255; data[idx+3] = 255;
             }
             // Bottom line "PARIS"
             else if (y > 135 && y < 155) {
               data[idx] = 255; data[idx+1] = 255; data[idx+2] = 255; data[idx+3] = 255;
             }
             else {
               // Glitter background within label bounds
               data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
             }
           } else {
             // Outside label text area, transparent or match bottle?
             // Let's make the texture have alpha for the label shape
             data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 0;
           }
        } else {
           // Outside label vertical bounds
           data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 0;
        }
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  labelMat.map = createLabelTexture(THREE);
  labelMat.transparent = true;

  // --- Geometry Construction ---

  // 1. Bottle Body (Glass) - Lathe
  // Profile: [radius, height]
  const bottleProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.32, 0.00), // Bottom edge
    new THREE.Vector2(0.32, 0.90), // Straight side
    new THREE.Vector2(0.30, 1.00), // Shoulder start
    new THREE.Vector2(0.16, 1.10), // Neck base
    new THREE.Vector2(0.16, 1.25), // Neck top
    new THREE.Vector2(0.17, 1.28), // Lip
    new THREE.Vector2(0.00, 1.28), // Close top
  ];
  const bottleGeom = new THREE.LatheGeometry(bottleProfile, 32);
  const bottleMesh = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottleMesh);

  // 2. Liquid (Inside)
  // Slightly smaller cylinder/lathe inside
  const liquidProfile = [
    new THREE.Vector2(0.00, 0.05), // Bottom center (glass thickness)
    new THREE.Vector2(0.28, 0.05), // Bottom edge
    new THREE.Vector2(0.28, 0.95), // Fill level
    new THREE.Vector2(0.00, 0.95), // Close top
  ];
  const liquidGeom = new THREE.LatheGeometry(liquidProfile, 32);
  const liquidMesh = new THREE.Mesh(liquidGeom, liquidMat);
  root.add(liquidMesh);

  // 3. Cap (Frosted Plastic)
  // Tapered cylinder
  const capGeom = new THREE.CylinderGeometry(0.18, 0.20, 0.65, 32);
  const capMesh = new THREE.Mesh(capGeom, capMat);
  capMesh.position.y = 1.28 + 0.325; // Half height offset
  root.add(capMesh);

  // 4. Label Decal
  // Curved plane wrapped around the front
  // Using a thin BoxGeometry rotated to face out, or a Cylinder segment.
  // Let's use a Cylinder segment for curvature.
  const labelRadius = 0.33; // Just outside bottle radius (0.32)
  const labelHeight = 0.50;
  const labelWidthAngle = 0.8; // Radians (~45 degrees)
  
  // Create a curved surface using CylinderGeometry with thetaLength
  const labelGeom = new THREE.CylinderGeometry(
    labelRadius, labelRadius, labelHeight, 16, 1, false, 
    -labelWidthAngle / 2, labelWidthAngle
  );
  
  const labelDecal = new THREE.Mesh(labelGeom, labelMat);
  // CylinderGeometry is Y-up. We need to rotate it so the curve faces +Z (front)
  // Default cylinder faces Y. The texture wraps around Y.
  // We want the label on the front of the bottle (Z+).
  // The cylinder geometry's UVs map around the circumference.
  // By default, the seam is at X+. We want the center of the label at Z+.
  // Rotate Y by -90 deg (-PI/2) moves X+ to Z+.
  labelDecal.rotation.y = -Math.PI / 2;
  labelDecal.position.y = 0.55; // Mid-height of the bottle body
  root.add(labelDecal);

  // 5. Base Thickening (Optional visual cue for glass bottom)
  const baseGeom = new THREE.CylinderGeometry(0.30, 0.30, 0.05, 32);
  const baseMesh = new THREE.Mesh(baseGeom, glassMat);
  baseMesh.position.y = 0.025;
  root.add(baseMesh);

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