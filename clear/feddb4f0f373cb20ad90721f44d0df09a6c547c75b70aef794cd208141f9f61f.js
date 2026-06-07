export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Copper material. Metalness capped at 0.6 as per rules.
  // Roughness 0.35 for polished but not mirror finish.
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.35,
  });

  // --- Procedural Texture for Engraving ---
  // The mug has intricate engraved patterns (scrolls and flowers).
  // We generate a DataTexture to represent this surface decoration.
  const texSize = 512;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseColor = { r: 184, g: 115, b: 51 };   // Copper #b87333
  const darkColor = { r: 100, g: 60, b: 30 };    // Darker engraving color

  // Helper to draw lines in UV space
  function drawLine(u1, v1, u2, v2, width, imageData) {
    const w = texSize;
    const h = texSize;
    const x1 = u1 * w, y1 = (1 - v1) * h; // Flip Y for texture coords
    const x2 = u2 * w, y2 = (1 - v2) * h;
    const lenSq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    const len = Math.sqrt(lenSq);
    if (len === 0) return;

    const dx = (x2 - x1) / len;
    const dy = (y2 - y1) / len;

    // Bounding box for optimization
    const minX = Math.max(0, Math.floor(Math.min(x1, x2) - width));
    const maxX = Math.min(w, Math.ceil(Math.max(x1, x2) + width));
    const minY = Math.max(0, Math.floor(Math.min(y1, y2) - width));
    const maxY = Math.min(h, Math.ceil(Math.max(y1, y2) + width));

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        // Distance from point (x,y) to line segment
        const px = x - x1;
        const py = y - y1;
        const proj = px * dx + py * dy;
        let distSq;
        if (proj < 0) distSq = px * px + py * py;
        else if (proj > len) {
          const dx2 = x - x2, dy2 = y - y2;
          distSq = dx2 * dx2 + dy2 * dy2;
        } else {
          const closeX = x1 + proj * dx;
          const closeY = y1 + proj * dy;
          const ddx = x - closeX;
          const ddy = y - closeY;
          distSq = ddx * ddx + ddy * ddy;
        }

        if (distSq < width * width) {
          const idx = (y * w + x) * 4;
          // Interpolate color based on distance for anti-aliasing
          const t = Math.sqrt(distSq) / width;
          imageData[idx] = baseColor.r * t + darkColor.r * (1 - t);
          imageData[idx + 1] = baseColor.g * t + darkColor.g * (1 - t);
          imageData[idx + 2] = baseColor.b * t + darkColor.b * (1 - t);
          imageData[idx + 3] = 255;
        }
      }
    }
  }

  // Helper to draw filled ellipse (for leaves/flowers)
  function drawEllipse(u, v, wRad, hRad, imageData) {
    const cx = u * texSize;
    const cy = (1 - v) * texSize;
    const w = texSize, h = texSize;
    const minX = Math.max(0, Math.floor(cx - wRad));
    const maxX = Math.min(w, Math.ceil(cx + wRad));
    const minY = Math.max(0, Math.floor(cy - hRad));
    const maxY = Math.min(h, Math.ceil(cy + hRad));

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const dx = (x - cx) / wRad;
        const dy = (y - cy) / hRad;
        if (dx * dx + dy * dy <= 1) {
          const idx = (y * w + x) * 4;
          // Darken slightly for filled shape
          imageData[idx] = darkColor.r;
          imageData[idx + 1] = darkColor.g;
          imageData[idx + 2] = darkColor.b;
          imageData[idx + 3] = 255;
        }
      }
    }
  }

  // Initialize with base copper color
  for (let i = 0; i < data.length; i += 4) {
    data[i] = baseColor.r;
    data[i + 1] = baseColor.g;
    data[i + 2] = baseColor.b;
    data[i + 3] = 255;
  }

  // Draw Pattern
  // 1. Horizontal Bands (Scrolls)
  // Top band around v=0.85, Bottom around v=0.20
  const bandHeight = 0.05;
  const scrollFreq = 8; // Number of scrolls around
  for (let i = 0; i < scrollFreq; i++) {
    const uStart = i / scrollFreq;
    const uEnd = (i + 1) / scrollFreq;
    // Top Band
    drawLine(uStart, 0.85, uEnd, 0.85 + Math.sin(i) * 0.02, 4, data);
    drawLine(uStart, 0.85 + 0.04, uEnd, 0.85 + 0.04 + Math.sin(i) * 0.02, 4, data);
    // Bottom Band
    drawLine(uStart, 0.20, uEnd, 0.20 + Math.sin(i) * 0.02, 4, data);
    drawLine(uStart, 0.20 + 0.04, uEnd, 0.20 + 0.04 + Math.sin(i) * 0.02, 4, data);
  }
  // Connect scrolls vertically at seams
  for (let i = 0; i < scrollFreq; i++) {
    const u = i / scrollFreq;
    drawLine(u, 0.85, u, 0.89, 3, data);
    drawLine(u, 0.20, u, 0.24, 3, data);
  }

  // 2. Vertical Motifs (Flowers)
  // 3 motifs evenly spaced
  const motifCount = 3;
  for (let i = 0; i < motifCount; i++) {
    const u = (i + 0.5) / motifCount;
    // Stem
    drawLine(u, 0.25, u, 0.80, 3, data);
    // Leaves (ellipses)
    drawEllipse(u, 0.40, 0.03, 0.06, data); // Left leaf
    drawEllipse(u, 0.55, 0.03, 0.06, data); // Right leaf
    // Flower head
    drawEllipse(u, 0.75, 0.04, 0.04, data);
  }

  const patternTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  patternTexture.colorSpace = THREE.SRGBColorSpace;
  patternTexture.needsUpdate = true;
  patternTexture.wrapS = THREE.RepeatWrapping;
  patternTexture.wrapT = THREE.ClampToEdgeWrapping;
  
  copperMat.map = patternTexture;

  // --- Body Geometry (Lathe) ---
  // Profile defines the cross-section of the mug wall.
  // Coordinates: (radius, height)
  const profilePoints = [
    new THREE.Vector2(0, 0),          // Center bottom
    new THREE.Vector2(0.32, 0),       // Outer bottom edge
    new THREE.Vector2(0.32, 0.02),    // Slight rounding
    new THREE.Vector2(0.32, 0.90),    // Outer wall top
    new THREE.Vector2(0.35, 0.95),    // Rim flare out
    new THREE.Vector2(0.30, 0.95),    // Inner rim
    new THREE.Vector2(0.30, 0.03),    // Inner bottom
    new THREE.Vector2(0, 0.03)        // Center inner bottom (closes the solid)
  ];
  
  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, copperMat);
  root.add(body);

  // --- Handle Geometry (Tube) ---
  // D-shaped curve attached to the side
  const handleRadius = 0.32; // Attach radius
  const handleDepth = 0.18;  // How far it sticks out
  const handleTop = 0.85;
  const handleBottom = 0.25;
  
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(handleRadius, handleBottom, 0),
    new THREE.Vector3(handleRadius + handleDepth * 0.2, handleBottom, 0),
    new THREE.Vector3(handleRadius + handleDepth, (handleTop + handleBottom) * 0.5, 0),
    new THREE.Vector3(handleRadius + handleDepth * 0.2, handleTop, 0),
    new THREE.Vector3(handleRadius, handleTop, 0)
  ]);

  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.025, 12, false);
  const handle = new THREE.Mesh(handleGeom, copperMat);
  root.add(handle);

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