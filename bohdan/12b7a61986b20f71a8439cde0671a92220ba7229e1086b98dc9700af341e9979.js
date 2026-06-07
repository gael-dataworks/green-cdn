export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark gunmetal/blackened steel. 
  // Metalness capped at 0.6 to avoid black void in no-env-map render.
  // Color is lightened slightly (#4a4a4a) so it doesn't render as pure black.
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Dark matte grip material (leather/rubber)
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.85,
  });

  // --- Procedural Texture for Blade/Guard Etching ---
  // Generates a dark texture with lighter geometric "etched" lines near the base.
  const texSize = 256;
  const texData = new Uint8Array(texSize * texSize * 4);
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      
      // Base dark metal color
      let r = 60, g = 60, b = 60; 

      // Etching zone: bottom 25% of texture (near guard)
      if (y < texSize * 0.25) {
        const normY = y / (texSize * 0.25);
        const normX = x / texSize;
        
        // Draw diamond/chevron patterns
        const pattern = Math.sin(normX * Math.PI * 4) * Math.sin(normY * Math.PI * 2);
        if (pattern > 0.8) {
          r = 100; g = 100; b = 100; // Lighter etched line
        }
        // Central spine line
        if (Math.abs(normX - 0.5) < 0.02) {
           r = 90; g = 90; b = 90;
        }
      }
      
      texData[idx] = r;
      texData[idx + 1] = g;
      texData[idx + 2] = b;
      texData[idx + 3] = 255;
    }
  }
  const etchingTex = new THREE.DataTexture(texData, texSize, texSize, THREE.RGBAFormat);
  etchingTex.colorSpace = THREE.SRGBColorSpace;
  etchingTex.needsUpdate = true;
  etchingTex.wrapS = THREE.ClampToEdgeWrapping;
  etchingTex.wrapT = THREE.ClampToEdgeWrapping;
  
  // Apply texture to metal material
  darkMetalMat.map = etchingTex;

  // --- 1. Blade ---
  // Shape for the blade profile (tapered triangle with slight curve)
  const bladeShape = new THREE.Shape();
  const bladeLen = 0.65;
  const bladeBaseW = 0.14;
  const bladeTipW = 0.0;
  
  bladeShape.moveTo(0, -bladeBaseW / 2);
  // Slight curve out then in to tip
  bladeShape.quadraticCurveTo(bladeLen * 0.4, -bladeBaseW * 0.4, bladeLen, 0);
  bladeShape.quadraticCurveTo(bladeLen * 0.4, bladeBaseW * 0.4, 0, bladeBaseW / 2);
  bladeShape.lineTo(0, -bladeBaseW / 2);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.015,
    bevelEnabled: false,
  });
  // Center the geometry so pivot is at the base center
  bladeGeom.translate(0, 0, -0.0075); 
  const blade = new THREE.Mesh(bladeGeom, darkMetalMat);
  // Rotate to point along +Z (Shape is XY plane by default, extruded on Z)
  // Actually ExtrudeGeometry extrudes along Z. The shape is in XY.
  // We want the blade to lie flat in XZ plane or XY? 
  // Standard sword: Edge in XY, flat in XZ? Or flat in XY?
  // Let's make it lie flat in XY plane, pointing +X? 
  // Let's align with +Z for "forward" facing convention.
  // Shape is drawn in XY. Extrusion is Z.
  // We want the flat face to be visible. So we rotate 90 deg around X.
  blade.rotation.x = Math.PI / 2;
  blade.position.z = 0.25; // Offset from center to make room for handle
  root.add(blade);

  // Fuller (Groove) - Thin box recessed into the blade
  const fullerGeom = new THREE.BoxGeometry(bladeLen * 0.8, 0.025, 0.002);
  const fuller = new THREE.Mesh(fullerGeom, darkMetalMat);
  fuller.rotation.x = Math.PI / 2;
  fuller.position.set(bladeLen * 0.4, 0, 0.25 + 0.001); // Slightly raised from base to simulate groove depth visually via lighting or just sit on surface
  // To simulate a groove, we actually want it slightly *inside* the blade volume if we had CSG.
  // Without CSG, we rely on the texture or just accept it sits on top. 
  // Better: Make the fuller color slightly darker to look like a shadow/groove.
  const fullerMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.4 });
  fuller.material = fullerMat;
  root.add(fuller);

  // --- 2. Guard (Crossguard) ---
  // Straight bar with slight angle back
  const guardW = 0.22;
  const guardH = 0.04;
  const guardD = 0.03;
  const guardGeom = new THREE.BoxGeometry(guardW, guardH, guardD);
  // Taper the ends slightly for style
  // Simple box is fine for low poly, maybe rotate slightly
  const guard = new THREE.Mesh(guardGeom, darkMetalMat);
  guard.position.set(0, 0, 0); // At origin, between blade and handle
  // Angle the guard tips back towards the pommel
  guard.rotation.x = Math.PI / 2; // Flat
  // To angle tips back, we'd need a custom shape or scaling. 
  // Let's just keep it straight for robustness, maybe slight rotation on Z for the whole sword later.
  root.add(guard);

  // --- 3. Grip (Handle) ---
  // Ribbed cylinder. We will stack thin cylinders to create ridges.
  const gripLen = 0.18;
  const gripR = 0.035;
  const ridgeCount = 9;
  const ridgeH = gripLen / ridgeCount;
  const ridgeGap = 0.005;
  
  const gripGroup = new THREE.Group();
  gripGroup.position.z = -gripLen / 2 - 0.01; // Behind guard
  
  for (let i = 0; i < ridgeCount; i++) {
    const ridgeGeom = new THREE.CylinderGeometry(gripR, gripR, ridgeH - ridgeGap, 16);
    const ridge = new THREE.Mesh(ridgeGeom, gripMat);
    ridge.rotation.x = Math.PI / 2; // Cylinder axis along Z
    ridge.position.z = i * ridgeH - gripLen / 2 + ridgeH / 2;
    gripGroup.add(ridge);
  }
  root.add(gripGroup);

  // --- 4. Pommel ---
  // Rounded end cap
  const pommelR = 0.05;
  const pommelGeom = new THREE.SphereGeometry(pommelR, 24, 16);
  const pommel = new THREE.Mesh(pommelGeom, darkMetalMat);
  pommel.position.z = -gripLen - 0.02;
  // Flatten it slightly
  pommel.scale.set(1, 1, 0.6);
  root.add(pommel);

  // Pommel Emblem (Star/Flower on the end)
  // Small raised cylinder on the very back
  const emblemGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.005, 5); // 5 sides = star-ish
  const emblem = new THREE.Mesh(emblemGeom, darkMetalMat);
  emblem.rotation.x = Math.PI / 2;
  emblem.position.z = -gripLen - 0.02 - pommelR * 0.6;
  root.add(emblem);

  // --- Final Assembly & Normalization ---
  // The sword is currently centered around the guard (0,0,0).
  // We want to return the group.
  
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