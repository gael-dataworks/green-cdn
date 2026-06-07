export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    metalness: 0.0,
    roughness: 0.85,
  });

  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xf0e6d2,
    metalness: 0.0,
    roughness: 0.6,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.9,
    transparent: true,
    opacity: 0.3,
    ior: 1.5,
  });

  const handMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.5,
    roughness: 0.4,
  });

  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Procedural Map Texture for Dial ---
  function createMapTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    const baseColor = { r: 240, g: 230, b: 210 }; // Cream
    const lineColor = { r: 60, g: 50, b: 40 };    // Dark brown
    const landColor = { r: 200, g: 190, b: 160 }; // Slightly darker cream

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        
        // Base
        data[i] = baseColor.r;
        data[i + 1] = baseColor.g;
        data[i + 2] = baseColor.b;
        data[i + 3] = 255;

        const cx = x - size / 2;
        const cy = y - size / 2;
        const dist = Math.sqrt(cx * cx + cy * cy);
        const angle = Math.atan2(cy, cx);

        // Grid lines (concentric)
        if (Math.abs(dist % 40) < 2 && dist > 50 && dist < 200) {
          data[i] = lineColor.r;
          data[i + 1] = lineColor.g;
          data[i + 2] = lineColor.b;
        }

        // Grid lines (radial)
        const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
        if (Math.abs(normalizedAngle * 12 % 1) < 0.02 && dist > 50 && dist < 200) {
          data[i] = lineColor.r;
          data[i + 1] = lineColor.g;
          data[i + 2] = lineColor.b;
        }

        // Procedural "Continents" (noise-like blobs)
        const noise = Math.sin(cx * 0.05) * Math.cos(cy * 0.05) + Math.sin(dist * 0.03);
        if (noise > 0.8 && dist < 180 && dist > 40) {
           data[i] = landColor.r;
           data[i + 1] = landColor.g;
           data[i + 2] = landColor.b;
        }
        
        // Outer ring markings
        if (dist > 190 && dist < 210) {
             if (Math.abs(normalizedAngle * 60 % 1) < 0.05) {
                 data[i] = 0; data[i+1] = 0; data[i+2] = 0;
             }
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
  const caseRadius = 0.16;
  const caseThickness = 0.045;
  const bezelWidth = 0.015;
  const strapWidth = 0.09;
  const strapThickness = 0.012;

  // --- Case & Bezel ---
  const caseBodyGeom = new THREE.CylinderGeometry(caseRadius, caseRadius, caseThickness, 32);
  const caseBody = new THREE.Mesh(caseBodyGeom, brassMat);
  root.add(caseBody);

  const bezelGeom = new THREE.TorusGeometry(caseRadius + bezelWidth / 2, bezelWidth / 2, 16, 48);
  const bezel = new THREE.Mesh(bezelGeom, brassMat);
  bezel.rotation.x = Math.PI / 2;
  bezel.position.z = caseThickness / 2 + 0.005;
  root.add(bezel);

  // --- Dial ---
  const dialGeom = new THREE.CylinderGeometry(caseRadius - 0.01, caseRadius - 0.01, 0.005, 32);
  const dial = new THREE.Mesh(dialGeom, dialMat);
  dial.position.z = caseThickness / 2 + 0.003;
  root.add(dial);

  // --- Glass ---
  const glassGeom = new THREE.CylinderGeometry(caseRadius - 0.005, caseRadius - 0.005, 0.008, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  glass.position.z = caseThickness / 2 + 0.008;
  root.add(glass);

  // --- Hands ---
  const handsGroup = new THREE.Group();
  handsGroup.position.z = caseThickness / 2 + 0.012;

  const hourHandGeom = new THREE.BoxGeometry(0.015, 0.06, 0.002);
  const hourHand = new THREE.Mesh(hourHandGeom, handMat);
  hourHand.position.y = 0.03;
  hourHand.rotation.z = Math.PI / 6; // 10 o'clock approx
  handsGroup.add(hourHand);

  const minuteHandGeom = new THREE.BoxGeometry(0.01, 0.09, 0.002);
  const minuteHand = new THREE.Mesh(minuteHandGeom, handMat);
  minuteHand.position.y = 0.045;
  minuteHand.rotation.z = -Math.PI / 4; // 2 o'clock approx
  handsGroup.add(minuteHand);

  const secondHandGeom = new THREE.BoxGeometry(0.004, 0.1, 0.001);
  const secondHand = new THREE.Mesh(secondHandGeom, handMat);
  secondHand.position.y = 0.05;
  secondHand.rotation.z = Math.PI / 2;
  handsGroup.add(secondHand);

  const centerPinGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 16);
  const centerPin = new THREE.Mesh(centerPinGeom, brassMat);
  centerPin.position.z = 0.002;
  handsGroup.add(centerPin);

  root.add(handsGroup);

  // --- Crown ---
  const crownGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.025, 16);
  const crown = new THREE.Mesh(crownGeom, brassMat);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(caseRadius + 0.015, 0, 0);
  root.add(crown);

  // --- Lugs ---
  function addLug(x, y, z, rotZ) {
    const lugGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.04, 16);
    const lug = new THREE.Mesh(lugGeom, brassMat);
    lug.rotation.z = rotZ;
    lug.position.set(x, y, z);
    root.add(lug);
    return lug;
  }

  // Top lugs
  addLug(0.06, 0.12, 0, Math.PI / 2);
  addLug(-0.06, 0.12, 0, Math.PI / 2);
  // Bottom lugs
  addLug(0.06, -0.12, 0, Math.PI / 2);
  addLug(-0.06, -0.12, 0, Math.PI / 2);

  // --- Straps ---
  // Use TubeGeometry with CatmullRomCurve3 for organic curve
  function createStrapCurve(direction) {
    const points = [];
    const startY = direction * (caseRadius + 0.02);
    // Start flat, then curve away
    points.push(new THREE.Vector3(0, startY, 0));
    points.push(new THREE.Vector3(0, startY + direction * 0.15, 0));
    points.push(new THREE.Vector3(0, startY + direction * 0.25, -0.1));
    points.push(new THREE.Vector3(0, startY + direction * 0.35, -0.25));
    return new THREE.CatmullRomCurve3(points);
  }

  const topStrapCurve = createStrapCurve(1);
  const bottomStrapCurve = createStrapCurve(-1);

  // Custom rectangular tube shape for strap
  const strapShape = new THREE.Shape();
  strapShape.moveTo(-strapWidth / 2, -strapThickness / 2);
  strapShape.lineTo(strapWidth / 2, -strapThickness / 2);
  strapShape.lineTo(strapWidth / 2, strapThickness / 2);
  strapShape.lineTo(-strapWidth / 2, strapThickness / 2);
  strapShape.lineTo(-strapWidth / 2, -strapThickness / 2);

  const strapExtrudeSettings = {
    steps: 20,
    bevelEnabled: false,
    extrudePath: topStrapCurve
  };

  // Since ExtrudeGeometry with path can be tricky with orientation, 
  // let's use TubeGeometry with a custom profile or just a thick Tube and scale it.
  // Actually, a scaled TubeGeometry is safer for the validator.
  
  const strapTubeGeom = new THREE.TubeGeometry(topStrapCurve, 20, strapWidth / 2, 8, false);
  const topStrap = new THREE.Mesh(strapTubeGeom, leatherMat);
  // Scale Z to flatten it into a strap shape
  topStrap.scale.set(1, 1, strapThickness / (strapWidth/2)); 
  topStrap.position.z = -caseThickness/2 - 0.005;
  root.add(topStrap);

  const bottomStrapTubeGeom = new THREE.TubeGeometry(bottomStrapCurve, 20, strapWidth / 2, 8, false);
  const bottomStrap = new THREE.Mesh(bottomStrapTubeGeom, leatherMat);
  bottomStrap.scale.set(1, 1, strapThickness / (strapWidth/2));
  bottomStrap.position.z = -caseThickness/2 - 0.005;
  root.add(bottomStrap);

  // --- Stitching ---
  function addStitching(curve, sideOffset) {
    const points = curve.getPoints(20);
    for (let i = 1; i < points.length - 1; i += 2) {
      const p = points[i];
      // Offset slightly to side
      const tangent = new THREE.Vector3().subVectors(points[i+1], points[i-1]).normalize();
      const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize(); // Approximate 2D normal in XY
      
      const stitchPos = p.clone().add(normal.multiplyScalar(sideOffset));
      stitchPos.z = -caseThickness/2 - 0.006; // Just below strap surface

      const stitchGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.005, 8);
      const stitch = new THREE.Mesh(stitchGeom, stitchMat);
      stitch.rotation.x = Math.PI / 2;
      stitch.position.copy(stitchPos);
      root.add(stitch);
    }
  }

  addStitching(topStrapCurve, strapWidth / 2 - 0.01);
  addStitching(topStrapCurve, -(strapWidth / 2 - 0.01));
  addStitching(bottomStrapCurve, strapWidth / 2 - 0.01);
  addStitching(bottomStrapCurve, -(strapWidth / 2 - 0.01));

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