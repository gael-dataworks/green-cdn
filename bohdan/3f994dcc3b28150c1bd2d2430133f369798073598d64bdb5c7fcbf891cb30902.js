export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions (Relative Units) ---
  const bookHeight = 1.0;
  const bookWidth = 0.75;
  const bookThickness = 0.22;
  const coverThickness = 0.025;
  const spineRadius = 0.03;

  // --- Materials ---
  // Leather: Dark green, matte/rough
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a4d3e,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Pages: Cream/Off-white
  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf0e6d2,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Gold Foil: Gold color, shiny but capped metalness
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- DataTexture for Front Cover Details ---
  // We generate a texture that contains the green base, gold borders, text, and corner flourishes.
  // This avoids complex geometry for the text/flora and ensures they stick to the surface.
  const texSize = 512;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseGreen = [26, 77, 62]; // 0x1a4d3e
  const goldColor = [212, 175, 55]; // 0xd4af37

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      
      // Default: Leather Green
      data[idx] = baseGreen[0];
      data[idx + 1] = baseGreen[1];
      data[idx + 2] = baseGreen[2];
      data[idx + 3] = 255;

      // Normalize coords 0..1
      const u = x / texSize;
      const v = 1.0 - y / texSize; // Flip Y for texture coords

      // 1. Border Lines (Double line)
      const margin = 0.08;
      const innerMargin = 0.095;
      const lineThick = 0.008;
      
      const onBorderX = (Math.abs(u - margin) < lineThick || Math.abs(u - (1 - margin)) < lineThick ||
                         Math.abs(v - margin) < lineThick || Math.abs(v - (1 - margin)) < lineThick);
      const onInnerBorderX = (Math.abs(u - innerMargin) < lineThick || Math.abs(u - (1 - innerMargin)) < lineThick ||
                              Math.abs(v - innerMargin) < lineThick || Math.abs(v - (1 - innerMargin)) < lineThick);

      if (onBorderX || onInnerBorderX) {
        data[idx] = goldColor[0];
        data[idx + 1] = goldColor[1];
        data[idx + 2] = goldColor[2];
      }

      // 2. Corner Flourishes (Procedural leafy patterns)
      // Simple approach: Draw clusters of small ellipses/circles in corners
      const drawFlourish = (cx, cy, rot) => {
        // Local coords relative to corner
        let lx = u - cx;
        let ly = v - cy;
        
        // Rotate
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        const rx = lx * cos - ly * sin;
        const ry = lx * sin + ly * cos;

        // Central stem
        const stemDist = Math.sqrt(rx*rx + ry*ry);
        if (stemDist < 0.03 && Math.abs(rx) < 0.01) {
           data[idx] = goldColor[0]; data[idx+1] = goldColor[1]; data[idx+2] = goldColor[2];
        }

        // Leaves (ellipses)
        const leaves = [
          {x: 0.02, y: 0.01, w: 0.025, h: 0.012, r: 0.5},
          {x: 0.04, y: -0.01, w: 0.03, h: 0.015, r: -0.2},
          {x: 0.01, y: 0.03, w: 0.02, h: 0.01, r: 0.8},
          {x: -0.01, y: 0.02, w: 0.02, h: 0.01, r: -0.8}
        ];

        for (const l of leaves) {
          const llx = rx - l.x;
          const lly = ry - l.y;
          // Rotate back for ellipse check
          const elx = llx * Math.cos(-l.r) - lly * Math.sin(-l.r);
          const ely = llx * Math.sin(-l.r) + lly * Math.cos(-l.r);
          
          const dist = (elx*elx)/(l.w*l.w) + (ely*ely)/(l.h*l.h);
          if (dist < 1.0) {
            data[idx] = goldColor[0]; data[idx+1] = goldColor[1]; data[idx+2] = goldColor[2];
          }
        }
      };

      // Draw 4 corners
      drawFlourish(margin + 0.04, margin + 0.04, Math.PI / 4); // Bottom Left (UV space)
      drawFlourish(1 - margin - 0.04, margin + 0.04, -Math.PI / 4); // Bottom Right
      drawFlourish(margin + 0.04, 1 - margin - 0.04, -Math.PI / 4); // Top Left
      drawFlourish(1 - margin - 0.04, 1 - margin - 0.04, Math.PI / 4); // Top Right

      // 3. Text "Don..." (Simplified block letters)
      // Position: Spine area on the texture? No, this texture is for Front Cover.
      // The text "Don..." is on the SPINE in the image.
      // The front cover has NO text in the center, just the border and corners.
      // Wait, looking closely at the image:
      // - Spine has "Don..." and bands.
      // - Front cover has border and corners.
      // So this texture is just for the front board.
    }
  }

  const frontCoverTex = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  frontCoverTex.colorSpace = THREE.SRGBColorSpace;
  frontCoverTex.needsUpdate = true;
  
  const frontCoverMat = leatherMat.clone();
  frontCoverMat.map = frontCoverTex;
  frontCoverMat.roughness = 0.85;

  // Spine Texture (Green with Gold Bands + Text)
  const spineTexSize = 256;
  const spineData = new Uint8Array(spineTexSize * spineTexSize * 4);
  for (let y = 0; y < spineTexSize; y++) {
    for (let x = 0; x < spineTexSize; x++) {
      const idx = (y * spineTexSize + x) * 4;
      spineData[idx] = baseGreen[0];
      spineData[idx+1] = baseGreen[1];
      spineData[idx+2] = baseGreen[2];
      spineData[idx+3] = 255;

      const v = y / spineTexSize;
      const u = x / spineTexSize;

      // Gold Bands (Horizontal stripes)
      // 3 bands typically. Top, Middle, Bottom.
      const bands = [0.15, 0.5, 0.85];
      for (const by of bands) {
        if (Math.abs(v - by) < 0.03) {
           // Double line effect
           if (Math.abs(v - by) < 0.015) {
             spineData[idx] = goldColor[0]; spineData[idx+1] = goldColor[1]; spineData[idx+2] = goldColor[2];
           } else {
             // Gap between double lines stays green or darker
             spineData[idx] = baseGreen[0]*0.8; spineData[idx+1] = baseGreen[1]*0.8; spineData[idx+2] = baseGreen[2]*0.8;
           }
        }
      }

      // Text "Don..." roughly in the middle band area
      // Simple horizontal bar representation for "Don..." to avoid complex font rasterization
      if (v > 0.45 && v < 0.55 && u > 0.2 && u < 0.8) {
         // Check for letter shapes (very crude block letters)
         // D: Left bar + curve
         // o: circle
         // n: arch
         // Just drawing a gold rectangle with some cutouts is hard. 
         // Let's draw a gold strip that implies text location or simple blocks.
         // To be safe and clean, I'll draw the gold bands clearly and skip complex text rasterization 
         // to avoid artifacts, relying on the bands to signify "labeled spine".
         // Actually, let's try to draw "Don" as 3 blocks.
         const localX = u - 0.3;
         const localY = v - 0.5;
         // D
         if (localX > 0 && localX < 0.08 && Math.abs(localY) < 0.04) {
            spineData[idx] = goldColor[0]; spineData[idx+1] = goldColor[1]; spineData[idx+2] = goldColor[2];
         }
         // o
         if (localX > 0.10 && localX < 0.18 && localY*localY + (localX-0.14)*(localX-0.14) < 0.04*0.04) {
            spineData[idx] = goldColor[0]; spineData[idx+1] = goldColor[1]; spineData[idx+2] = goldColor[2];
         }
         // n
         if (localX > 0.20 && localX < 0.28 && Math.abs(localY) < 0.04) {
             spineData[idx] = goldColor[0]; spineData[idx+1] = goldColor[1]; spineData[idx+2] = goldColor[2];
         }
      }
    }
  }
  const spineTex = new THREE.DataTexture(spineData, spineTexSize, spineTexSize, THREE.RGBAFormat);
  spineTex.colorSpace = THREE.SRGBColorSpace;
  spineTex.needsUpdate = true;
  spineTex.wrapS = THREE.RepeatWrapping;
  
  const spineMat = leatherMat.clone();
  spineMat.map = spineTex;
  spineMat.roughness = 0.85;


  // --- Geometry Construction ---

  // 1. Pages Block
  // Slightly smaller than cover dimensions
  const pagesGeom = new THREE.BoxGeometry(bookWidth - 0.04, bookHeight - 0.04, bookThickness - 0.02);
  const pages = new THREE.Mesh(pagesGeom, pageMat);
  // Position pages so they align with the front of the spine
  // Book center is (0,0,0). 
  // Spine is at -Z (or +Z depending on orientation). Let's say Spine is at -X (left side).
  // Actually, standard book orientation: Spine on Left (-X), Front Cover facing +Z.
  // Pages block center should be shifted slightly +X from spine center.
  const pagesX = -bookWidth/2 + bookThickness/2 + 0.02; 
  pages.position.set(pagesX, 0, 0);
  root.add(pages);

  // 2. Spine (Curved)
  // Cylinder segment. Radius ~ bookThickness/2 + coverThickness
  const spineRadiusGeo = bookThickness / 2 + coverThickness;
  // We want a half-cylinder or slightly more.
  const spineGeom = new THREE.CylinderGeometry(spineRadiusGeo, spineRadiusGeo, bookHeight, 16, 1, true, 0, Math.PI);
  const spine = new THREE.Mesh(spineGeom, spineMat);
  // Cylinder is Y-up. We need it to curve around the Z axis? 
  // Default Cylinder: Y is height. Circular in XZ.
  // We want the curve to be on the X side.
  // So rotate 90 deg around Y? No.
  // If Cylinder is Y-up, the curve is in XZ plane.
  // We want the spine to be vertical (Y). So Cylinder Y-up is correct.
  // The curve should face +X (towards the front cover).
  // Default Cylinder (0 to PI) creates a half tube.
  // Let's align it.
  spine.rotation.y = -Math.PI / 2; // Face the curve towards +X
  spine.position.set(-bookWidth/2 + spineRadiusGeo, 0, 0);
  root.add(spine);

  // 3. Front Cover Board
  // Flat box attached to the front of the spine
  const frontBoardGeom = new THREE.BoxGeometry(bookWidth - spineRadiusGeo, bookHeight, coverThickness);
  const frontBoard = new THREE.Mesh(frontBoardGeom, frontCoverMat);
  // Position: To the right of the spine center
  frontBoard.position.set(-bookWidth/2 + spineRadiusGeo + (bookWidth - spineRadiusGeo)/2, 0, 0);
  root.add(frontBoard);

  // 4. Back Cover Board
  // Similar to front, but on the other side of the pages? 
  // Actually, for a closed book, the back cover is parallel to front.
  // But the spine connects them.
  // Let's just place a back board at the back of the pages.
  const backBoardGeom = new THREE.BoxGeometry(bookWidth - spineRadiusGeo, bookHeight, coverThickness);
  const backBoard = new THREE.Mesh(backBoardGeom, leatherMat);
  backBoard.position.set(-bookWidth/2 + spineRadiusGeo + (bookWidth - spineRadiusGeo)/2, 0, -bookThickness + coverThickness/2);
  // Wait, coordinate system check.
  // Thickness is along Z.
  // Spine is at -X.
  // Front Cover is at +Z face? Or -Z?
  // Let's assume Front Cover faces +Z.
  // Pages are centered at Z=0.
  // Front Cover should be at Z = +bookThickness/2.
  // Back Cover should be at Z = -bookThickness/2.
  // Spine connects them at X = -bookWidth/2.
  
  // Re-positioning based on Z-axis thickness:
  // Center of book = (0,0,0).
  // Pages: Z from -T/2 to T/2.
  // Front Cover: Z = T/2 + offset.
  // Back Cover: Z = -T/2 - offset.
  // Spine: Curved at X = -W/2.
  
  // Let's rebuild positions slightly for clarity.
  root.remove(pages);
  root.remove(spine);
  root.remove(frontBoard);
  root.remove(backBoard);

  const halfThick = bookThickness / 2;
  const halfWidth = bookWidth / 2;
  const halfHeight = bookHeight / 2;

  // Pages
  const pagesMesh = new THREE.Mesh(
    new THREE.BoxGeometry(bookWidth - 0.04, bookHeight - 0.04, bookThickness - 0.02),
    pageMat
  );
  // Pages are inset. 
  // Spine is at -X. Pages start near spine.
  // Let's say Spine center is at X = -halfWidth + spineRadius.
  // Pages center X = -halfWidth + spineRadius + (bookWidth - spineRadius)/2 - small_gap
  pagesMesh.position.set(-halfWidth + spineRadiusGeo + (bookWidth - spineRadiusGeo)/2 - 0.01, 0, 0);
  root.add(pagesMesh);

  // Front Cover (Facing +Z)
  const frontCoverMesh = new THREE.Mesh(
    new THREE.BoxGeometry(bookWidth - spineRadiusGeo, bookHeight, coverThickness),
    frontCoverMat
  );
  frontCoverMesh.position.set(-halfWidth + spineRadiusGeo + (bookWidth - spineRadiusGeo)/2, 0, halfThick + coverThickness/2);
  root.add(frontCoverMesh);

  // Back Cover (Facing -Z)
  const backCoverMesh = new THREE.Mesh(
    new THREE.BoxGeometry(bookWidth - spineRadiusGeo, bookHeight, coverThickness),
    leatherMat
  );
  backCoverMesh.position.set(-halfWidth + spineRadiusGeo + (bookWidth - spineRadiusGeo)/2, 0, -halfThick - coverThickness/2);
  root.add(backCoverMesh);

  // Spine (Connecting Front and Back at -X)
  // Cylinder Y-up. Curve in XZ plane.
  // We need it to wrap from Front Cover edge to Back Cover edge.
  // Front Cover edge X: -halfWidth + spineRadiusGeo
  // Back Cover edge X: -halfWidth + spineRadiusGeo
  // Z range: -halfThick to +halfThick
  // So the cylinder center should be at X = -halfWidth + spineRadiusGeo, Z = 0.
  // Radius = spineRadiusGeo.
  // But wait, if center is at -halfWidth + R, and radius is R, the back of the cylinder is at -halfWidth.
  // The front is at -halfWidth + 2R.
  // We want the spine to connect the covers which are at Z = +/- halfThick.
  // So the diameter should be roughly bookThickness. Radius = halfThick + coverThickness.
  // Center X = -halfWidth + Radius.
  // Rotation: We want the flat side of the half-cylinder to face +X (inside the book)? 
  // No, the curved side faces -X (outside).
  // Cylinder (0, PI) creates a half tube.
  // Default starts at +X axis, goes counter-clockwise to -X axis (top view).
  // So it covers +Y to -Y? No, in XZ plane.
  // Start angle 0 is +X. End angle PI is -X.
  // So it covers the +Z side? No.
  // Angle 0 = (1, 0). Angle PI/2 = (0, 1). Angle PI = (-1, 0).
  // So 0 to PI covers +Z hemisphere.
  // We want the spine to cover the -X side.
  // So we need angles PI/2 to 3PI/2.
  const spineMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(spineRadiusGeo, spineRadiusGeo, bookHeight, 16, 1, true, Math.PI/2, Math.PI),
    spineMat
  );
  // Rotate to align the flat face with +X axis
  spineMesh.rotation.y = -Math.PI / 2;
  spineMesh.position.set(-halfWidth + spineRadiusGeo, 0, 0);
  root.add(spineMesh);

  // 5. Gold Corner Ornaments (Geometry version for extra pop, optional but nice)
  // The texture handles the flat gold, but let's add slight relief if possible.
  // Actually, the texture is sufficient and safer for "flat printed graphics".
  // I will skip extra geometry for corners to keep draw calls low and rely on the DataTexture.

  // 6. Slight tilt to match image perspective
  // Image shows book angled.
  root.rotation.x = 0.3; // Tilt back
  root.rotation.z = -0.2; // Tilt side
  root.rotation.y = -0.5; // Rotate to show spine and front

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