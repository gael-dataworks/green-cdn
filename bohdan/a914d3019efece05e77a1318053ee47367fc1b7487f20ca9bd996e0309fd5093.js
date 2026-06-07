export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Light bamboo/wood material
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xdcbfa0,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Slightly darker wood for carved details to simulate depth/shadow
  const carveMat = new THREE.MeshStandardMaterial({
    color: 0xc4a57b,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Metal loop for handle attachment
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 0.5,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const radiusTop = 0.26;
  const radiusBottom = 0.24;
  const height = 0.45;
  const rimY = height / 2;
  const topBandY = 0.10;
  const bottomBandY = -0.15;

  // --- Body (Staves) ---
  // Use a cylinder with moderate segments to simulate staves
  const bodyGeom = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    24, // radialSegments - creates faceted look like staves
    1,
    true // openEnded
  );
  const body = new THREE.Mesh(bodyGeom, woodMat);
  root.add(body);

  // --- Rim ---
  // Torus for the thick top rim
  const rimGeom = new THREE.TorusGeometry(radiusTop + 0.015, 0.025, 16, 32);
  const rim = new THREE.Mesh(rimGeom, woodMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = rimY;
  root.add(rim);

  // --- Top Band ---
  const topBandGeom = new THREE.TorusGeometry(radiusTop + 0.005, 0.012, 16, 32);
  const topBand = new THREE.Mesh(topBandGeom, woodMat);
  topBand.rotation.x = Math.PI / 2;
  topBand.position.y = topBandY;
  root.add(topBand);

  // --- Bottom Band ---
  const bottomBandGeom = new THREE.TorusGeometry(radiusBottom + 0.005, 0.012, 16, 32);
  const bottomBand = new THREE.Mesh(bottomBandGeom, woodMat);
  bottomBand.rotation.x = Math.PI / 2;
  bottomBand.position.y = bottomBandY;
  root.add(bottomBand);

  // --- Carvings / Decorations ---
  const decorGroup = new THREE.Group();
  root.add(decorGroup);

  // Helper to get surface position on the body
  function getSurfacePos(angle, y, offset = 0.005) {
    // Interpolate radius based on Y
    const t = (y + height / 2) / height;
    const r = radiusBottom + (radiusTop - radiusBottom) * t;
    const x = Math.cos(angle) * (r + offset);
    const z = Math.sin(angle) * (r + offset);
    return new THREE.Vector3(x, y, z);
  }

  // Helper to get orientation quaternion for surface
  function getSurfaceQuat(angle) {
    const normal = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  }

  // 1. Top Vertical Vine (Left side, approx angle PI)
  const vineAngle = Math.PI;
  const vinePoints = [];
  const vineStartY = topBandY + 0.02;
  const vineEndY = rimY - 0.02;
  const steps = 10;
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = vineStartY + (vineEndY - vineStartY) * t;
    // Add some sine wave wiggle in angle
    const a = vineAngle + Math.sin(t * Math.PI * 4) * 0.05;
    vinePoints.push(getSurfacePos(a, y, 0.006));
  }
  
  const vineCurve = new THREE.CatmullRomCurve3(vinePoints);
  const vineGeom = new THREE.TubeGeometry(vineCurve, 20, 0.004, 8, false);
  const vine = new THREE.Mesh(vineGeom, carveMat);
  decorGroup.add(vine);

  // Add some leaves to the vine
  for (let i = 2; i < steps - 2; i += 3) {
    const t = i / steps;
    const y = vineStartY + (vineEndY - vineStartY) * t;
    const a = vineAngle + Math.sin(t * Math.PI * 4) * 0.05;
    const pos = getSurfacePos(a, y, 0.006);
    const quat = getSurfaceQuat(a);
    
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.015, 8), carveMat);
    leaf.position.copy(pos);
    leaf.quaternion.copy(quat);
    leaf.rotateZ(Math.PI / 2); // Orient along vine
    leaf.scale.set(1, 0.5, 1);
    decorGroup.add(leaf);
  }

  // 2. Bottom Floral Band
  // Place flowers and vines around the bottom band
  const flowerCount = 6;
  const bandRadius = radiusBottom + 0.005;
  
  for (let i = 0; i < flowerCount; i++) {
    const angle = (i / flowerCount) * Math.PI * 2;
    const y = bottomBandY;
    const pos = getSurfacePos(angle, y, 0.006);
    const quat = getSurfaceQuat(angle);

    // Flower center
    const flowerCenter = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), carveMat);
    flowerCenter.position.copy(pos);
    flowerCenter.quaternion.copy(quat);
    decorGroup.add(flowerCenter);

    // Petals
    for (let p = 0; p < 5; p++) {
      const pAngle = (p / 5) * Math.PI * 2;
      const px = Math.cos(pAngle) * 0.015;
      const py = Math.sin(pAngle) * 0.015;
      // We need to orient the petal in the tangent plane
      const petal = new THREE.Mesh(new THREE.CircleGeometry(0.008, 8), carveMat);
      petal.position.copy(pos);
      petal.quaternion.copy(quat);
      // Move in local tangent space
      petal.translateX(px);
      petal.translateY(py);
      petal.rotateZ(pAngle + Math.PI / 2);
      petal.scale.set(1, 0.6, 1);
      decorGroup.add(petal);
    }

    // Connecting vines between flowers
    if (i < flowerCount - 1) {
      const nextAngle = ((i + 1) / flowerCount) * Math.PI * 2;
      const vPoints = [];
      for (let v = 0; v <= 5; v++) {
        const vt = v / 5;
        const va = angle + (nextAngle - angle) * vt;
        // Slight curve in Y
        const vy = y + Math.sin(vt * Math.PI) * 0.01;
        vPoints.push(getSurfacePos(va, vy, 0.006));
      }
      const vCurve = new THREE.CatmullRomCurve3(vPoints);
      const vGeom = new THREE.TubeGeometry(vCurve, 10, 0.003, 6, false);
      const vMesh = new THREE.Mesh(vGeom, carveMat);
      decorGroup.add(vMesh);
    }
  }

  // --- Handle Loop Attachment (Left Side) ---
  // Small metal loop on the rim
  const loopAngle = Math.PI; // Left side
  const loopX = Math.cos(loopAngle) * (radiusTop + 0.015);
  const loopZ = Math.sin(loopAngle) * (radiusTop + 0.015);
  
  const loopGeom = new THREE.TorusGeometry(0.02, 0.003, 8, 16);
  const loop = new THREE.Mesh(loopGeom, metalMat);
  loop.position.set(loopX, rimY, loopZ);
  loop.rotation.y = loopAngle; // Face outward
  loop.rotation.z = Math.PI / 2; // Hang down
  root.add(loop);

  // --- Base (Optional, to close bottom if needed, but image shows open/standing) ---
  // The cylinder is openEnded: true, so we might need a bottom cap if it looks too hollow
  // But usually buckets stand on the rim of the staves. Let's add a thin bottom cap.
  const bottomCapGeom = new THREE.CircleGeometry(radiusBottom, 24);
  const bottomCap = new THREE.Mesh(bottomCapGeom, woodMat);
  bottomCap.rotation.x = -Math.PI / 2;
  bottomCap.position.y = -height / 2;
  root.add(bottomCap);

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