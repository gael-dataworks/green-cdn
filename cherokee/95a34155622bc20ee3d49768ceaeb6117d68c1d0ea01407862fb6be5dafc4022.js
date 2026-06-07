export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brass/Gold Case: Warm yellow, moderate metalness, low roughness.
  // Emissive helps it pop in this lighting setup.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd4af37,
    emissiveIntensity: 0.15
  });

  // Leather Strap: Brown, matte, high roughness.
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    metalness: 0.0,
    roughness: 0.85
  });

  // Glass Crystal: High transmission, low roughness.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true
  });

  // Dial Background: Parchment color.
  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xf5e6c6,
    metalness: 0.0,
    roughness: 0.6
  });

  // Hands: Dark gunmetal.
  const handMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.5,
    roughness: 0.4,
    emissive: 0x2a2a2a,
    emissiveIntensity: 0.1
  });

  // Second Hand Tip: Red accent.
  const secondHandTipMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    metalness: 0.0,
    roughness: 0.5
  });

  // --- Procedural Map Texture for Dial ---
  function createMapTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    const baseColor = new THREE.Color(0xf5e6c6); // Parchment
    const lineColor = new THREE.Color(0x5c4033); // Dark brown ink

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (x + y * size) * 4;
        
        // Base parchment with slight noise
        const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) * 10;
        const r = baseColor.r * 255 + noise;
        const g = baseColor.g * 255 + noise;
        const b = baseColor.b * 255 + noise;

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;

        const cx = x - size / 2;
        const cy = y - size / 2;
        const dist = Math.sqrt(cx * cx + cy * cy);
        const angle = Math.atan2(cy, cx);

        // Draw concentric grid circles
        if (Math.abs(dist % 40) < 1.5 && dist > 60 && dist < 200) {
          data[i] = lineColor.r * 255;
          data[i + 1] = lineColor.g * 255;
          data[i + 2] = lineColor.b * 255;
        }

        // Draw radial grid lines
        if (Math.abs(angle % (Math.PI / 12)) < 0.03 && dist > 60 && dist < 200) {
          data[i] = lineColor.r * 255;
          data[i + 1] = lineColor.g * 255;
          data[i + 2] = lineColor.b * 255;
        }

        // Draw "Coastlines" using complex sine waves
        const landNoise = Math.sin(cx * 0.05 + cy * 0.03) * Math.cos(cy * 0.04 - cx * 0.02);
        if (landNoise > 0.6 && dist > 80 && dist < 190) {
           data[i] = lineColor.r * 255;
           data[i + 1] = lineColor.g * 255;
           data[i + 2] = lineColor.b * 255;
        }
        
        // Outer decorative ring
        if (dist > 210 && dist < 225) {
             data[i] = 0x333333;
             data[i+1] = 0x333333;
             data[i+2] = 0x333333;
        }
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const mapTexture = createMapTexture();
  dialMat.map = mapTexture;

  // --- Dimensions ---
  const caseRadius = 0.22;
  const caseThickness = 0.06;
  const dialRadius = caseRadius * 0.85;
  const lugWidth = 0.06;
  const lugLength = 0.08;
  const strapWidth = 0.14;
  const strapThickness = 0.025;

  // --- Case Assembly ---
  const caseGroup = new THREE.Group();
  
  // Main Case Body (Cylinder)
  const caseBodyGeom = new THREE.CylinderGeometry(caseRadius, caseRadius, caseThickness, 32);
  const caseBody = new THREE.Mesh(caseBodyGeom, brassMat);
  caseGroup.add(caseBody);

  // Bezel (Top Ring)
  const bezelGeom = new THREE.TorusGeometry(caseRadius, 0.015, 16, 32);
  const bezel = new THREE.Mesh(bezelGeom, brassMat);
  bezel.rotation.x = Math.PI / 2;
  bezel.position.y = caseThickness / 2;
  caseGroup.add(bezel);

  // Back Plate
  const backGeom = new THREE.CylinderGeometry(caseRadius * 0.95, caseRadius * 0.95, 0.01, 32);
  const backPlate = new THREE.Mesh(backGeom, brassMat);
  backPlate.position.y = -caseThickness / 2;
  caseGroup.add(backPlate);

  // Lugs (4 cylinders connecting strap)
  const lugGeom = new THREE.CylinderGeometry(lugWidth/2, lugWidth/2, lugLength, 16);
  // Rotate to lie flat on case surface
  lugGeom.rotateX(Math.PI / 2); 
  
  const lugPositions = [
    { x: 0, y: caseThickness/2, z: caseRadius - lugLength/2 }, // Top (12 o'clock)
    { x: 0, y: caseThickness/2, z: -caseRadius + lugLength/2 }, // Bottom (6 o'clock)
  ];

  // Actually, lugs usually stick out from the side of the case cylinder.
  // Let's place them at +/- Y relative to the dial face (which is XY plane in local, but let's assume dial is on top).
  // Wait, standard watch orientation: Dial faces +Z or +Y? 
  // Let's make Dial face +Y (Up). Case is flat cylinder on XZ plane.
  // Lugs are at +Z and -Z ends of the cylinder diameter along Z axis.
  
  // Re-orienting case logic for Y-Up:
  // Case Body is Cylinder along Y. Height is thickness.
  // Dial is on Top (+Y).
  // Lugs are at +Z and -Z.
  
  caseGroup.remove(caseBody);
  caseGroup.remove(bezel);
  caseGroup.remove(backPlate);

  // Correct Case Body (Flat Cylinder on XZ)
  // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments) -> Axis is Y.
  // To make it flat on XZ, we rotate the geometry or the mesh.
  // Let's keep Cylinder along Y, but scale Y to be thin? No, that distorts segments.
  // Better: Cylinder along Y, then rotate mesh 90 deg? No.
  // Standard: CylinderGeometry creates vertical cylinder.
  // We want a flat puck. So Height = caseThickness. Radius = caseRadius.
  // It stands up along Y. That's fine. Dial is on the "side" wall? No.
  // Dial is usually the top cap. So Dial is in XZ plane.
  
  // Let's restart Case orientation for clarity:
  // Watch lies on a table. Face up.
  // Case is a cylinder standing on its edge? No, lying flat.
  // So Cylinder axis is Y. Height is Thickness. Radius is CaseRadius.
  // Top Face (+Y) is the Dial.
  
  const mainCaseGeom = new THREE.CylinderGeometry(caseRadius, caseRadius, caseThickness, 32);
  const mainCase = new THREE.Mesh(mainCaseGeom, brassMat);
  caseGroup.add(mainCase);

  // Bezel Ring (on top edge)
  const bezelRingGeom = new THREE.TorusGeometry(caseRadius, 0.012, 16, 32);
  const bezelRing = new THREE.Mesh(bezelRingGeom, brassMat);
  bezelRing.rotation.x = Math.PI / 2; // Lie flat in XZ
  bezelRing.position.y = caseThickness / 2; // Top surface
  caseGroup.add(bezelRing);

  // Lugs
  // Lugs stick out from the sides. Let's say along Z axis (12 and 6 o'clock).
  // They are small cylinders or boxes.
  const lugGeo = new THREE.CylinderGeometry(lugWidth/2, lugWidth/2, 0.06, 16);
  lugGeo.rotateZ(Math.PI / 2); // Orient along Z
  
  const lug1 = new THREE.Mesh(lugGeo, brassMat);
  lug1.position.set(0, 0, caseRadius - 0.03);
  caseGroup.add(lug1);

  const lug2 = new THREE.Mesh(lugGeo, brassMat);
  lug2.position.set(0, 0, -caseRadius + 0.03);
  caseGroup.add(lug2);
  
  // Side Lugs (for strap width support) - usually 4 lugs total.
  // Let's add two more slightly offset or just make the existing ones longer/wider.
  // Simplified: Just two main attachment points for the strap curve.
  // But visually watches have 4. Let's add small cylinders next to the main lugs.
  const smallLugGeo = new THREE.CylinderGeometry(lugWidth/3, lugWidth/3, 0.04, 16);
  smallLugGeo.rotateZ(Math.PI / 2);
  
  const lug3 = new THREE.Mesh(smallLugGeo, brassMat);
  lug3.position.set(0, 0, caseRadius - 0.06);
  caseGroup.add(lug3);

  const lug4 = new THREE.Mesh(smallLugGeo, brassMat);
  lug4.position.set(0, 0, -caseRadius + 0.06);
  caseGroup.add(lug4);

  // Crown (Winding knob at 3 o'clock -> +X)
  const crownGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 16);
  crownGeom.rotateZ(Math.PI / 2); // Stick out along X
  const crown = new THREE.Mesh(crownGeom, brassMat);
  crown.position.set(caseRadius + 0.02, 0, 0);
  caseGroup.add(crown);

  root.add(caseGroup);

  // --- Dial ---
  const dialGeom = new THREE.CircleGeometry(dialRadius, 32);
  const dial = new THREE.Mesh(dialGeom, dialMat);
  dial.rotation.x = Math.PI / 2; // Face up
  dial.position.y = caseThickness / 2 + 0.001; // Slightly above case
  root.add(dial);

  // Glass Crystal
  const glassGeom = new THREE.CylinderGeometry(caseRadius * 0.98, caseRadius * 0.98, 0.015, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  glass.position.y = caseThickness / 2 + 0.008;
  root.add(glass);

  // --- Hands ---
  const handsGroup = new THREE.Group();
  handsGroup.position.y = caseThickness / 2 + 0.015; // Above dial, below glass

  // Hour Hand (Short, thick)
  const hourHandGeom = new THREE.BoxGeometry(0.015, 0.002, 0.09);
  const hourHand = new THREE.Mesh(hourHandGeom, handMat);
  hourHand.position.z = 0.045; // Offset so pivot is at 0,0
  hourHand.rotation.z = -Math.PI / 4; // 10 o'clock approx
  handsGroup.add(hourHand);

  // Minute Hand (Long, thin)
  const minHandGeom = new THREE.BoxGeometry(0.01, 0.002, 0.14);
  const minHand = new THREE.Mesh(minHandGeom, handMat);
  minHand.position.z = 0.07;
  minHand.rotation.z = Math.PI / 6; // 2 o'clock approx
  handsGroup.add(minHand);

  // Second Hand (Very thin, red tip)
  const secHandGeom = new THREE.BoxGeometry(0.004, 0.001, 0.16);
  const secHand = new THREE.Mesh(secHandGeom, handMat);
  secHand.position.z = 0.08;
  secHand.rotation.z = -Math.PI / 2; // 12 o'clock
  handsGroup.add(secHand);

  // Second Hand Tip
  const secTipGeom = new THREE.BoxGeometry(0.006, 0.001, 0.04);
  const secTip = new THREE.Mesh(secTipGeom, secondHandTipMat);
  secTip.position.z = -0.06; // Tail end
  secHand.add(secTip);

  // Center Pin
  const pinGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.01, 16);
  const pin = new THREE.Mesh(pinGeom, brassMat);
  pin.position.y = 0.002;
  handsGroup.add(pin);

  root.add(handsGroup);

  // --- Strap ---
  // We need two curved straps.
  // Top Strap: Starts at +Z lug, curves up and back (-Y, +Z).
  // Bottom Strap: Starts at -Z lug, curves down and forward (-Y, -Z).
  
  function createStrap(startZ, directionZ) {
    const strapGroup = new THREE.Group();
    
    // Curve points
    // Start at lug end: (0, 0, startZ)
    // End point: (0, -0.4, startZ + directionZ * 0.3)
    const points = [];
    points.push(new THREE.Vector3(0, 0, startZ));
    points.push(new THREE.Vector3(0, -0.1, startZ + directionZ * 0.1));
    points.push(new THREE.Vector3(0, -0.25, startZ + directionZ * 0.25));
    points.push(new THREE.Vector3(0, -0.45, startZ + directionZ * 0.3));

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeom = new THREE.TubeGeometry(curve, 20, strapWidth / 2, 12, false);
    
    // We need to flatten the tube to look like a strap.
    // Scale Z (local thickness) down, keep X (width) and Y (follows curve).
    // Actually TubeGeometry builds around the curve. 
    // Default radius is circular. We want elliptical cross section.
    // Easiest way: Scale the mesh non-uniformly.
    // Tube is built along curve. Local Y is 'up' relative to curve? 
    // No, TubeGeometry aligns locally. 
    // Let's just scale the mesh.
    
    const strapMesh = new THREE.Mesh(tubeGeom, leatherMat);
    // Flatten the tube: Scale the cross-section axes.
    // The tube runs along the curve. The cross section is in the plane perpendicular to tangent.
    // We want width (X-ish) to be wide, thickness (Y-ish) to be thin.
    // Scaling the whole object might distort the curve length.
    // Better: Create the tube with specific radius, then scale.
    // If we scale Z by 0.2, it becomes a flat ribbon.
    strapMesh.scale.set(1, 1, 0.25); 
    
    strapGroup.add(strapMesh);

    // Stitching details (small cylinders along the edges)
    // Simplified: Skip complex stitching for performance/brevity, rely on texture or just smooth leather.
    // Add a buckle loop on the bottom strap.
    if (directionZ < 0) {
        const loopGeom = new THREE.TorusGeometry(strapWidth/2 + 0.01, 0.005, 8, 16);
        const loop = new THREE.Mesh(loopGeom, brassMat);
        loop.rotation.x = Math.PI / 2;
        loop.position.set(0, -0.35, startZ + directionZ * 0.25);
        strapGroup.add(loop);
    }

    return strapGroup;
  }

  // Top Strap (attached to +Z lug)
  // The lug is at Z = caseRadius - offset.
  const topStrap = createStrap(caseRadius - 0.03, 1);
  // Rotate to align with lug orientation if needed. 
  // Our curve starts at (0,0, Z) and goes -Y. This matches the lug sticking out +Z.
  root.add(topStrap);

  // Bottom Strap (attached to -Z lug)
  const bottomStrap = createStrap(-caseRadius + 0.03, -1);
  root.add(bottomStrap);

  // --- Final Normalization ---
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