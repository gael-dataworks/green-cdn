export default function generate(THREE) {
  // --- Constants & Dimensions ---
  const ROOT = new THREE.Group();

  // Ceramic material properties
  const CERAMIC_COLOR = 0xb58b6a;
  const HOLE_SHADOW_COLOR = 0x5a4030;

  // --- Helper: Fit to Unit Cube ---
  function fitToUnitCube(root) {
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

  // --- Helper: Procedural Ceramic Texture with Holes ---
  function createCeramicTexture() {
    const width = 512;
    const height = 512;
    const data = new Uint8Array(width * height * 4);
    
    // Hole configuration (rows from bottom to top in UV space)
    // v ranges from 0 (bottom) to 1 (top).
    // We avoid the very bottom (foot) and very top (rim).
    const holeRows = [
      { v: 0.20, count: 8,   radius: 0.035 },
      { v: 0.35, count: 10,  radius: 0.038 },
      { v: 0.50, count: 12,  radius: 0.040 },
      { v: 0.65, count: 14,  radius: 0.042 },
      { v: 0.80, count: 16,  radius: 0.045 },
    ];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = 1.0 - (y / height); // Flip Y for texture coords (0 at bottom)
        const idx = (x + y * width) * 4;

        let isHole = false;

        // Check against hole rows
        for (const row of holeRows) {
          // Allow some vertical thickness for the hole in texture space
          const vDist = Math.abs(v - row.v);
          if (vDist < row.radius * 0.8) {
            // Check horizontal position (angle)
            // Normalize u to 0..1 circle
            const angle = u * Math.PI * 2;
            for (let i = 0; i < row.count; i++) {
              const holeAngle = (i / row.count) * Math.PI * 2;
              // Shortest angular distance
              let angleDiff = Math.abs(angle - holeAngle);
              if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
              
              // Convert angular diff to UV distance approx
              // Circumference at this v is roughly proportional to 1 (in UV space)
              const uDist = angleDiff / (Math.PI * 2);
              
              if (uDist < row.radius) {
                isHole = true;
                break;
              }
            }
          }
          if (isHole) break;
        }

        if (isHole) {
          // Hole: Dark shadow color, fully transparent
          data[idx] = HOLE_SHADOW_COLOR >> 16 & 0xff;
          data[idx + 1] = HOLE_SHADOW_COLOR >> 8 & 0xff;
          data[idx + 2] = HOLE_SHADOW_COLOR & 0xff;
          data[idx + 3] = 0; // Transparent
        } else {
          // Ceramic: Base color + deterministic noise
          const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5) * 20;
          const r = ((CERAMIC_COLOR >> 16 & 0xff) + noise) | 0;
          const g = ((CERAMIC_COLOR >> 8 & 0xff) + noise) | 0;
          const b = ((CERAMIC_COLOR & 0xff) + noise) | 0;
          
          data[idx] = Math.min(255, Math.max(0, r));
          data[idx + 1] = Math.min(255, Math.max(0, g));
          data[idx + 2] = Math.min(255, Math.max(0, b));
          data[idx + 3] = 255; // Opaque
        }
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    // Wrap for seamless looping around the bowl
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    
    return texture;
  }

  const ceramicTexture = createCeramicTexture();

  const ceramicMat = new THREE.MeshStandardMaterial({
    map: ceramicTexture,
    alphaMap: ceramicTexture,
    transparent: true,
    side: THREE.DoubleSide,
    color: 0xffffff, // Let texture drive color
    metalness: 0.0,
    roughness: 0.4, // Semi-gloss glaze
  });

  // --- Geometry: Bowl Body (Lathe) ---
  // Profile defines the cross-section of the wall (outer -> rim -> inner -> bottom)
  const profilePoints = [
    new THREE.Vector2(0, 0),       // Center Bottom (Axis)
    new THREE.Vector2(0.13, 0),    // Outer Bottom Edge
    new THREE.Vector2(0.13, 0.05), // Foot Top Outer
    new THREE.Vector2(0.24, 0.30), // Belly Outer
    new THREE.Vector2(0.28, 0.45), // Rim Outer Top
    new THREE.Vector2(0.25, 0.45), // Rim Inner Top (Thickness)
    new THREE.Vector2(0.21, 0.30), // Belly Inner
    new THREE.Vector2(0.06, 0.05), // Bottom Inner
    new THREE.Vector2(0, 0.05)     // Bottom Inner Axis (Closes the volume)
  ];

  const bowlGeom = new THREE.LatheGeometry(profilePoints, 32);
  const bowl = new THREE.Mesh(bowlGeom, ceramicMat);
  ROOT.add(bowl);

  // --- Geometry: Handle ---
  // Paddle shape with a hole at the end
  const handleShape = new THREE.Shape();
  const handleWidth = 0.06;
  const handleLength = 0.18;
  const holeRadius = 0.025;

  // Draw outer paddle
  handleShape.moveTo(0, -handleWidth / 2);
  handleShape.lineTo(handleLength - 0.04, -handleWidth / 2);
  handleShape.quadraticCurveTo(handleLength, -handleWidth / 2, handleLength, 0);
  handleShape.quadraticCurveTo(handleLength, handleWidth / 2, handleLength - 0.04, handleWidth / 2);
  handleShape.lineTo(0, handleWidth / 2);
  handleShape.lineTo(0, -handleWidth / 2);

  // Cutout hole
  const holePath = new THREE.Path();
  holePath.absarc(handleLength - 0.03, 0, holeRadius, 0, Math.PI * 2, true);
  handleShape.holes.push(holePath);

  const handleGeom = new THREE.ExtrudeGeometry(handleShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
  });

  // Center the geometry locally so rotation is easier
  handleGeom.center();

  const handle = new THREE.Mesh(handleGeom, ceramicMat);
  
  // Position handle: Attach to the side of the rim
  // Rim is at y=0.45, x=0.28 (outer)
  // We want the handle to extend outwards along X axis
  handle.position.set(0.28, 0.42, 0);
  // Rotate to lie flat horizontally (it was extruded along Z, we want it along X)
  // Actually Extrude is +Z. We want it sticking out +X.
  // Rotate -90 deg around Y -> Points +X.
  // Rotate -90 deg around Z -> Lies flat? 
  // Let's visualize: Shape is in XY. Extrude is Z.
  // We want the flat face to be horizontal (XZ plane).
  // So rotate 90 deg around X.
  handle.rotation.x = Math.PI / 2;
  handle.rotation.y = 0; // Points +X
  
  // Adjust position to connect cleanly to rim
  // The handle origin is now centered. We need to shift it so the "start" (0,0 in shape) touches the bowl.
  // Shape was 0 to 0.18 in X. Centered is -0.09 to 0.09.
  // We want the "start" end at the bowl surface.
  handle.position.x += 0.09; 

  ROOT.add(handle);

  // --- Final Normalization ---
  fitToUnitCube(ROOT);

  return ROOT;
}