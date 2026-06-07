export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants & Dimensions ---
  const BAG_WIDTH = 0.6;
  const BAG_HEIGHT = 0.35;
  const BAG_DEPTH = 0.06; // Thickness of the clutch
  const CORNER_RADIUS = 0.04;

  // --- Materials ---
  // Leather: Low metalness, moderate roughness, burgundy color.
  const leatherColor = 0x7a1f36;
  const leatherMat = new THREE.MeshStandardMaterial({
    color: leatherColor,
    metalness: 0.0,
    roughness: 0.55,
  });

  // --- Procedural Quilting Texture ---
  // Generates a diamond grid pattern with stitching shadows and puffy centers.
  function createQuiltedTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    const baseR = 122, baseG = 31, baseB = 54; // #7a1f36
    const shadowR = 60, shadowG = 10, shadowB = 25; // Darker for stitching
    const highlightR = 160, highlightG = 60, highlightB = 80; // Lighter for puff

    // Diamond grid parameters
    const tileSize = 64; // Size of one diamond
    const stitchWidth = 4;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        // Normalize coordinates to tile space
        // Offset every other row to create diamond pattern
        const rowOffset = Math.floor(y / tileSize) % 2 === 0 ? 0 : tileSize / 2;
        const localX = (x + rowOffset) % tileSize;
        const localY = y % tileSize;

        // Center of the tile
        const cx = tileSize / 2;
        const cy = tileSize / 2;

        // Distance from center (Manhattan distance for diamond shape)
        const dist = Math.abs(localX - cx) + Math.abs(localY - cy);
        const maxDist = tileSize / 2;

        // Determine if we are in the stitching zone (edges of diamond)
        // or the puffy center.
        // Stitching is near the boundary of the diamond (dist close to maxDist)
        const edgeDist = maxDist - dist; // 0 at center, maxDist at edge

        let r = baseR, g = baseG, b = baseB;

        if (edgeDist < stitchWidth) {
          // Stitching line (shadow)
          // Smooth interpolation for anti-aliasing
          const t = edgeDist / stitchWidth;
          r = shadowR + (baseR - shadowR) * t;
          g = shadowG + (baseG - shadowG) * t;
          b = shadowB + (baseB - shadowB) * t;
        } else {
          // Puffy center gradient
          // Lighter in the very center, fading to base color
          const centerDist = dist; // 0 at edge, maxDist at center? No, dist is 0 at center for Manhattan?
          // Wait, Manhattan dist: center (cx,cy) -> dist=0. Edge -> dist=maxDist.
          // So centerDist is actually just `dist`.
          // We want highlight at dist=0, base color at dist=maxDist-stitchWidth.
          
          const puffRange = maxDist - stitchWidth;
          if (dist < puffRange * 0.6) {
             const t = 1.0 - (dist / (puffRange * 0.6));
             r = baseR + (highlightR - baseR) * t * 0.4; // Subtle highlight
             g = baseG + (highlightG - baseG) * t * 0.4;
             b = baseB + (highlightB - baseB) * t * 0.4;
          }
        }

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Adjust repeat to match bag dimensions roughly
    texture.repeat.set(4, 2.5); 
    texture.needsUpdate = true;
    return texture;
  }

  const quiltedTexture = createQuiltedTexture();
  leatherMat.map = quiltedTexture;
  leatherMat.bumpMap = quiltedTexture;
  leatherMat.bumpScale = 0.002; // Subtle depth
  leatherMat.roughnessMap = quiltedTexture; // Stitching is rougher/darker

  // --- Geometry: Main Body (Rounded Box via Extrude) ---
  const shape = new THREE.Shape();
  const w = BAG_WIDTH / 2;
  const h = BAG_HEIGHT / 2;
  const r = CORNER_RADIUS;

  // Draw rounded rectangle
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const extrudeSettings = {
    steps: 1,
    depth: BAG_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 4,
  };

  const bodyGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center the geometry
  bodyGeom.center();
  
  const body = new THREE.Mesh(bodyGeom, leatherMat);
  // Rotate to face forward/up correctly. Extrude is along Z.
  // We want the flat face to be the front.
  // Default Extrude is in XY plane, extruded along Z.
  // So the face is already facing +Z.
  root.add(body);

  // --- Geometry: Side Fold (Gusset) ---
  // The image shows a folded edge on the right side.
  // We simulate this with a thin, tall box on the right edge.
  const sideFoldGeom = new THREE.BoxGeometry(0.02, BAG_HEIGHT * 0.9, BAG_DEPTH * 0.8);
  const sideFold = new THREE.Mesh(sideFoldGeom, leatherMat);
  
  // Position on the right edge (+X)
  sideFold.position.set(w - 0.01, 0, 0);
  
  // Rotate slightly to mimic the leather tucking in
  sideFold.rotation.y = -Math.PI / 8; 
  
  root.add(sideFold);

  // --- Geometry: Back Flap Edge (Optional detail) ---
  // The top edge looks like a flap folding over.
  // Add a thin cylinder/box at the top back to suggest the fold line.
  const foldLineGeom = new THREE.CylinderGeometry(0.015, 0.015, BAG_WIDTH, 16);
  const foldLine = new THREE.Mesh(foldLineGeom, leatherMat);
  foldLine.rotation.x = Math.PI / 2;
  foldLine.rotation.z = Math.PI / 2; // Align with width
  foldLine.position.set(0, h - 0.02, -BAG_DEPTH / 2 - 0.01);
  root.add(foldLine);

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