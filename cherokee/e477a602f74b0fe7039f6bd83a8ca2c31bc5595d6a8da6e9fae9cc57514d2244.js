export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Feather vane: Matte, soft, off-white
  const featherMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f0,
    metalness: 0.0,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });

  // Rachis (spine): Natural brown, semi-matte
  const rachisMat = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Brass quill base: Metallic, warm gold/brass
  // Using emissive to ensure brightness against white background per metal rules
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xd4af37,
    emissiveIntensity: 0.35,
  });

  // Needle tip: Slightly darker/sharper metal
  const needleMat = new THREE.MeshStandardMaterial({
    color: 0xb89628,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xb89628,
    emissiveIntensity: 0.2,
  });

  // --- Procedural Feather Texture (Veins) ---
  // Generate a DataTexture to simulate natural feather striations
  const texWidth = 256;
  const texHeight = 512;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      const u = x / texWidth; // 0 to 1 across width
      const v = y / texHeight; // 0 to 1 along length
      
      // Base color: off-white
      let r = 245, g = 245, b = 240;
      
      // Center rachis shadow area (darker near middle)
      const distFromCenter = Math.abs(u - 0.5);
      if (distFromCenter < 0.05) {
        const shadow = 1.0 - (distFromCenter / 0.05);
        r -= shadow * 40;
        g -= shadow * 40;
        b -= shadow * 40;
      }

      // Veins: Diagonal lines radiating from center
      // Angle from bottom-center
      const angle = Math.atan2(v - 0.1, u - 0.5);
      // Normalize angle to create repeating bands
      const veinFreq = 12.0;
      const veinPattern = Math.sin(angle * veinFreq + v * 5.0);
      
      if (veinPattern > 0.85) {
        // Vein color: slightly darker beige/grey
        r = 200; g = 200; b = 195;
      }
      
      // Add some noise for texture
      const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) * 10;
      r -= noise; g -= noise; b -= noise;

      const i = (y * texWidth + x) * 4;
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
      data[i + 3] = 255;
    }
  }

  const featherTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  featherTexture.colorSpace = THREE.SRGBColorSpace;
  featherTexture.needsUpdate = true;
  featherMat.map = featherTexture;

  // --- Geometry Construction ---

  // 1. Feather Vane (The white part)
  // Use ShapeGeometry for the organic leaf shape
  const vaneShape = new THREE.Shape();
  // Start at bottom center (near quill)
  vaneShape.moveTo(0, 0);
  // Right side curve (larger)
  vaneShape.bezierCurveTo(0.15, 0.3, 0.25, 0.6, 0.18, 0.95);
  // Tip
  vaneShape.bezierCurveTo(0.1, 1.05, -0.1, 1.05, -0.18, 0.95);
  // Left side curve (smaller/straighter)
  vaneShape.bezierCurveTo(-0.25, 0.6, -0.15, 0.3, 0, 0);
  
  const vaneGeom = new THREE.ExtrudeGeometry(vaneShape, {
    depth: 0.002,
    bevelEnabled: false,
  });
  // Center the geometry locally so rotation is easier
  vaneGeom.center();
  
  const feather_vane = new THREE.Mesh(vaneGeom, featherMat);
  // Position slightly up so base aligns with quill
  feather_vane.position.y = 0.5; 
  // Tilt slightly for natural pose
  feather_vane.rotation.z = -0.1;
  root.add(feather_vane);

  // 2. Rachis (The central spine)
  // Curve from base of vane to tip
  const rachisCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.1, 0),   // Base
    new THREE.Vector3(0, 0.5, 0.02), // Mid slight arch
    new THREE.Vector3(0, 0.9, 0.01), // Near tip
    new THREE.Vector3(0, 1.0, 0)     // Tip
  ]);
  
  const rachisGeom = new THREE.TubeGeometry(rachisCurve, 16, 0.008, 8, false);
  const feather_rachis = new THREE.Mesh(rachisGeom, rachisMat);
  feather_rachis.position.y = 0.5; // Match vane offset
  feather_rachis.rotation.z = -0.1;
  root.add(feather_rachis);

  // 3. Quill Base (Brass barrel)
  // Tapered cylinder
  const quill_base_geom = new THREE.CylinderGeometry(0.035, 0.055, 0.4, 16);
  const quill_base = new THREE.Mesh(quill_base_geom, brassMat);
  // Position below the feather
  quill_base.position.y = -0.2;
  // Align with feather tilt
  quill_base.rotation.z = -0.1;
  root.add(quill_base);

  // 4. Quill Collar (Decorative ring)
  const collar_geom = new THREE.TorusGeometry(0.038, 0.006, 8, 24);
  const quill_collar = new THREE.Mesh(collar_geom, brassMat);
  // Place at top of the barrel (where feather starts)
  // Barrel top is at -0.2 + 0.2 = 0.0
  quill_collar.position.y = 0.0;
  quill_collar.rotation.x = Math.PI / 2; // Face up
  quill_collar.rotation.z = -0.1; // Match tilt
  root.add(quill_collar);

  // 5. Quill Tip (Needle)
  // Very thin cylinder extending down
  const tip_geom = new THREE.CylinderGeometry(0.002, 0.01, 0.25, 8);
  const quill_tip = new THREE.Mesh(tip_geom, needleMat);
  // Position at bottom of barrel
  // Barrel bottom is at -0.2 - 0.2 = -0.4
  // Shift down so it extends out
  quill_tip.position.y = -0.52;
  quill_tip.rotation.z = -0.1;
  root.add(quill_tip);

  // 6. Downy fibers (Optional detail at base of vane)
  // Simple thin lines to suggest fuzz
  const fiberMat = new THREE.LineBasicMaterial({ color: 0xeeeeee });
  const fiberPoints = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI - Math.PI / 2;
    const x = Math.cos(angle) * 0.05;
    const y = Math.sin(angle) * 0.05;
    // Start near rachis base
    fiberPoints.push(new THREE.Vector3(0, 0.1, 0));
    // End slightly out
    fiberPoints.push(new THREE.Vector3(x * 0.5, 0.1 + y * 0.5, 0));
  }
  const fiberGeom = new THREE.BufferGeometry().setFromPoints(fiberPoints);
  const downy_fibers = new THREE.LineSegments(fiberGeom, fiberMat);
  downy_fibers.position.y = 0.5;
  downy_fibers.rotation.z = -0.1;
  root.add(downy_fibers);

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