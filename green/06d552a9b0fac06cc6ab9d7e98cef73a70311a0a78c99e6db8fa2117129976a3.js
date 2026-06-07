export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Porcelain: Glossy ceramic, white/cream base.
  const porcelainMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f0,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Gold: Metallic yellow, capped metalness per rules.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Floral Decal Material: Uses a generated DataTexture.
  // We clone the porcelain material to inherit properties, then add the map.
  const floralMat = porcelainMat.clone();
  floralMat.map = createFloralTexture(THREE);
  floralMat.needsUpdate = true;

  // --- Geometry: Cup Body (Hollow Shell) ---
  // We construct a hollow cup using an outer shell, an inner shell (BackSide), and a bottom cap.
  
  // Outer Profile: Defines the exterior shape.
  // Points [radius, height] from bottom to top.
  const outerProfile = [
    new THREE.Vector2(0.14, 0.00), // Foot edge
    new THREE.Vector2(0.14, 0.04), // Foot top
    new THREE.Vector2(0.12, 0.05), // Base curve in
    new THREE.Vector2(0.16, 0.20), // Belly
    new THREE.Vector2(0.22, 0.45), // Rim edge
    new THREE.Vector2(0.23, 0.46), // Lip flare
  ];
  const outerShellGeom = new THREE.LatheGeometry(outerProfile, 32);
  const outerShell = new THREE.Mesh(outerShellGeom, floralMat);
  root.add(outerShell);

  // Inner Profile: Defines the interior cavity.
  // Slightly smaller radius to simulate wall thickness.
  // Rendered with BackSide so we see the inside surface.
  const innerProfile = [
    new THREE.Vector2(0.12, 0.05), // Bottom inner start
    new THREE.Vector2(0.13, 0.10),
    new THREE.Vector2(0.18, 0.30),
    new THREE.Vector2(0.21, 0.45), // Rim inner edge
    new THREE.Vector2(0.21, 0.46), // Top inner
  ];
  const innerShellGeom = new THREE.LatheGeometry(innerProfile, 32);
  const innerShellMat = porcelainMat.clone();
  innerShellMat.side = THREE.BackSide;
  const innerShell = new THREE.Mesh(innerShellGeom, innerShellMat);
  root.add(innerShell);

  // Bottom Cap: Closes the hole at the bottom of the outer shell.
  const bottomCapGeom = new THREE.CircleGeometry(0.14, 32);
  const bottomCap = new THREE.Mesh(bottomCapGeom, porcelainMat);
  bottomCap.rotation.x = -Math.PI / 2;
  bottomCap.position.y = 0.00;
  root.add(bottomCap);

  // --- Geometry: Handle ---
  // Curved path using CatmullRomCurve3
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.22, 0.20, 0.00), // Lower attach point
    new THREE.Vector3(0.35, 0.20, 0.00), // Curve out
    new THREE.Vector3(0.38, 0.35, 0.00), // Top curve
    new THREE.Vector3(0.24, 0.44, 0.00), // Upper attach point
  ]);
  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.018, 12, false);
  const handle = new THREE.Mesh(handleGeom, goldMat);
  root.add(handle);

  // --- Geometry: Gold Trim ---
  // Rim Trim: Thin torus at the top lip.
  const rimTrimGeom = new THREE.TorusGeometry(0.23, 0.006, 16, 32);
  const rimTrim = new THREE.Mesh(rimTrimGeom, goldMat);
  rimTrim.rotation.x = Math.PI / 2;
  rimTrim.position.y = 0.46;
  root.add(rimTrim);

  // Base Trim: Thin torus at the foot.
  const baseTrimGeom = new THREE.TorusGeometry(0.14, 0.006, 16, 32);
  const baseTrim = new THREE.Mesh(baseTrimGeom, goldMat);
  baseTrim.rotation.x = Math.PI / 2;
  baseTrim.position.y = 0.04;
  root.add(baseTrim);

  // --- Normalization ---
  fitToUnitCube(THREE, root);
  return root;
}

// --- Helper: Procedural Floral Texture ---
function createFloralTexture(THREE) {
  const width = 256;
  const height = 256;
  const data = new Uint8Array(width * height * 4);
  
  // Base color: Off-white porcelain
  const baseR = 245, baseG = 245, baseB = 240;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Default to base color
      data[idx] = baseR;
      data[idx + 1] = baseG;
      data[idx + 2] = baseB;
      data[idx + 3] = 255;

      // Normalize coordinates 0..1
      const u = x / width;
      const v = y / height;

      // Draw Vines (Brown/Green sin waves)
      // We want a vine running horizontally across the middle band
      const vineY = 0.5 + 0.05 * Math.sin(u * Math.PI * 4);
      const distToVine = Math.abs(v - vineY);
      
      if (distToVine < 0.02) {
        // Vine color
        data[idx] = 85;
        data[idx + 1] = 107;
        data[idx + 2] = 47;
      }

      // Draw Roses (Pink circles at specific intervals)
      // Place 3 roses around the cup
      const roseCenters = [0.2, 0.5, 0.8];
      for (let i = 0; i < roseCenters.length; i++) {
        const cx = roseCenters[i];
        const cy = 0.5 + 0.05 * Math.sin(cx * Math.PI * 4); // Align with vine
        
        // Distance from center of rose
        const dx = u - cx;
        const dy = v - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const radius = 0.08;

        if (dist < radius) {
          // Rose color gradient (lighter at edges, darker center)
          const t = dist / radius;
          const r = 255;
          const g = Math.floor(105 * (1 - t) + 180 * t); // Pinkish
          const b = Math.floor(180 * (1 - t) + 220 * t);
          
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
      }

      // Draw Leaves (Green ellipses near roses)
      const leafCenters = [0.35, 0.65];
      for (let i = 0; i < leafCenters.length; i++) {
        const lx = leafCenters[i];
        const ly = 0.5 + 0.05 * Math.sin(lx * Math.PI * 4);
        
        const ldx = u - lx;
        const ldy = v - ly;
        // Ellipse check
        if ((ldx*ldx)/0.005 + (ldy*ldy)/0.002 < 1) {
           data[idx] = 60;
           data[idx + 1] = 120;
           data[idx + 2] = 60;
        }
      }
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  // Adjust repeat to match the cup circumference if needed, default 1 is fine for this scale
  return texture;
}

// --- Helper: Fit to Unit Cube ---
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