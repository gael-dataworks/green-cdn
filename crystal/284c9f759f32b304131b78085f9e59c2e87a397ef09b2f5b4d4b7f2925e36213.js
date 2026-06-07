export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Galvanized steel / brushed aluminum. 
  // Using emissive to ensure brightness as per metal rules (no env map).
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xcfd4d9,
    metalness: 0.5,
    roughness: 0.4,
    emissive: 0xcfd4d9,
    emissiveIntensity: 0.15,
  });

  // Slightly darker/worn material for seams/ribs to create contrast
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0xb0b5ba,
    metalness: 0.5,
    roughness: 0.5,
    emissive: 0xb0b5ba,
    emissiveIntensity: 0.1,
  });

  // --- Dimensions ---
  const totalHeight = 0.6;
  const bottomRadius = 0.55;
  const topRadius = 0.28;
  const bandRadius = 0.56; // Slight flare at the band
  const bandHeight = 0.22; // Height from bottom to the horizontal band
  const topCapThickness = 0.015;
  const ribCount = 8;

  // --- 1. Main Body (Lathe) ---
  // Profile from bottom-left to top-right (radius, y)
  // We start at bottom rim, go up the skirt, step out for band, curve in to top.
  const profilePoints = [
    new THREE.Vector2(bottomRadius, 0.0),          // Bottom edge
    new THREE.Vector2(bottomRadius, bandHeight),   // Bottom of band
    new THREE.Vector2(bandRadius, bandHeight),     // Flare of band
    new THREE.Vector2(topRadius, totalHeight),     // Top edge under cap
    new THREE.Vector2(0.0, totalHeight),           // Center top (close the shape)
  ];
  
  // To get a smooth curve for the dome section, we use a curve for the upper part
  // and straight lines for the lower part.
  const curvePath = new THREE.CurvePath();
  // Lower skirt (straight)
  curvePath.add(new THREE.LineCurve3(
    new THREE.Vector3(bottomRadius, 0.0, 0),
    new THREE.Vector3(bandRadius, bandHeight, 0)
  ));
  // Upper dome (curved) - Bezier from band to top
  // Control points to create a convex dome shape
  const cp1 = new THREE.Vector3(bandRadius * 1.1, bandHeight + (totalHeight - bandHeight) * 0.3, 0);
  const cp2 = new THREE.Vector3(topRadius * 1.2, totalHeight - (totalHeight - bandHeight) * 0.2, 0);
  
  curvePath.add(new THREE.CubicBezierCurve3(
    new THREE.Vector3(bandRadius, bandHeight, 0),
    cp1,
    cp2,
    new THREE.Vector3(topRadius, totalHeight, 0)
  ));

  const sampledPoints = curvePath.getSpacedPoints(50);
  // Convert Vector3 to Vector2 for LatheGeometry
  const latheProfile = sampledPoints.map(p => new THREE.Vector2(p.x, p.y));
  // Close the top
  latheProfile.push(new THREE.Vector2(0, totalHeight));
  // Close the bottom center to make it solid (optional, but good for caps)
  // Actually, the image shows it's open at the bottom (it's a cap). 
  // We will leave the bottom open or add a rim. The profile above starts at radius > 0.
  // Let's add a small lip at the bottom.
  latheProfile.unshift(new THREE.Vector2(bottomRadius + 0.02, 0.0)); // Lip
  latheProfile.unshift(new THREE.Vector2(bottomRadius + 0.02, -0.02)); // Under lip

  const bodyGeom = new THREE.LatheGeometry(latheProfile, 64);
  // Flip normals if needed, but standard lathe should be fine. 
  // We want to see the outside.
  const body = new THREE.Mesh(bodyGeom, steelMat);
  root.add(body);

  // --- 2. Top Cap ---
  const capGeom = new THREE.CylinderGeometry(topRadius + 0.04, topRadius + 0.04, topCapThickness, 64);
  const cap = new THREE.Mesh(capGeom, steelMat);
  cap.position.y = totalHeight + topCapThickness / 2;
  root.add(cap);

  // --- 3. Horizontal Band ---
  // A torus or tube ring at the band height
  const bandGeom = new THREE.TorusGeometry(bandRadius + 0.015, 0.012, 16, 64);
  const band = new THREE.Mesh(bandGeom, seamMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = bandHeight;
  root.add(band);

  // --- 4. Vertical Ribs ---
  // We need ribs that follow the curvature of the body.
  // We can use TubeGeometry with a path that matches the outer surface.
  // Reuse the curvePath logic but offset slightly outward for the rib thickness.
  
  const ribPathPoints = [];
  // Sample points along the height
  const segments = 40;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // We need to interpolate radius and height based on our profile logic
    let r, y;
    if (t < 0.35) { 
      // Lower skirt roughly
       y = t * (bandHeight / 0.35);
       r = THREE.MathUtils.lerp(bottomRadius, bandRadius, t / 0.35);
    } else {
      // Upper dome roughly
      const domeT = (t - 0.35) / (1 - 0.35);
      // Approximate the bezier curve position
      // This is a rough approximation for the rib path, good enough for visual
      y = THREE.MathUtils.lerp(bandHeight, totalHeight, domeT);
      // Simple lerp for radius with a bulge for the dome
      const baseR = THREE.MathUtils.lerp(bandRadius, topRadius, domeT);
      const bulge = Math.sin(domeT * Math.PI) * 0.08; 
      r = baseR + bulge;
    }
    // Add small lip at bottom
    if (i === 0) {
        r += 0.02;
        y = -0.02;
    }
    ribPathPoints.push(new THREE.Vector3(r, y, 0));
  }

  const ribCurve = new THREE.CatmullRomCurve3(ribPathPoints);
  const ribGeom = new THREE.TubeGeometry(ribCurve, 40, 0.012, 8, false);
  
  for (let i = 0; i < ribCount; i++) {
    const angle = (i / ribCount) * Math.PI * 2;
    const rib = new THREE.Mesh(ribGeom, seamMat);
    rib.rotation.y = angle;
    root.add(rib);
  }

  // --- 5. Bottom Lip Ring ---
  // Visual reinforcement at the very bottom
  const bottomRingGeom = new THREE.TorusGeometry(bottomRadius + 0.02, 0.008, 16, 64);
  const bottomRing = new THREE.Mesh(bottomRingGeom, seamMat);
  bottomRing.rotation.x = Math.PI / 2;
  bottomRing.position.y = 0.0;
  root.add(bottomRing);

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