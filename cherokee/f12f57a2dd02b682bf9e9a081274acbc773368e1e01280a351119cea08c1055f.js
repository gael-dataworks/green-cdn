export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Blade: Polished metal. High brightness via emissive to avoid looking black.
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.3,
  });

  // Handle: Green plastic/rubber. Matte.
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x4caf50,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Procedural Logo Texture ---
  // Draws "LEWIS" text on a transparent background.
  function createLogoTexture() {
    const width = 256;
    const height = 64;
    const data = new Uint8Array(width * height * 4);
    
    // Helper to draw a filled rect
    function drawRect(x, y, w, h, r, g, b, a) {
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const idx = ((y + j) * width + (x + i)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }
    }

    // Helper to draw a character from a 5x7 bitmap
    // 1 = pixel on, 0 = off
    const font = {
      'L': [0,0,0,0,1, 0,0,0,0,1, 0,0,0,0,1, 0,0,0,0,1, 0,0,0,0,1, 0,0,0,0,1, 0,0,1,1,1],
      'E': [0,0,1,1,1, 0,0,0,0,1, 0,0,1,1,1, 0,0,0,0,1, 0,0,1,1,1, 0,0,0,0,1, 0,0,1,1,1],
      'W': [1,0,0,0,1, 1,0,0,0,1, 1,0,1,0,1, 1,0,1,0,1, 1,0,1,0,1, 1,1,0,1,1, 1,1,0,1,1],
      'I': [0,0,1,1,1, 0,0,0,1,0, 0,0,0,1,0, 0,0,0,1,0, 0,0,0,1,0, 0,0,0,1,0, 0,0,1,1,1],
      'S': [0,0,1,1,1, 0,0,0,0,1, 0,0,1,1,1, 0,0,0,0,1, 0,0,1,1,1, 0,0,0,0,1, 0,0,1,1,1]
    };

    const text = "LEWIS";
    const charW = 5;
    const charH = 7;
    const spacing = 2;
    const totalW = text.length * (charW + spacing);
    const startX = (width - totalW) / 2;
    const startY = (height - charH) / 2;

    // Clear background (transparent)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0; data[i+1] = 0; data[i+2] = 0; data[i+3] = 0;
    }

    for (let c = 0; c < text.length; c++) {
      const char = text[c];
      const bits = font[char];
      if (!bits) continue;
      const cx = startX + c * (charW + spacing);
      for (let y = 0; y < charH; y++) {
        for (let x = 0; x < charW; x++) {
          if (bits[y * charW + x]) {
            drawRect(cx + x, startY + y, 1, 1, 60, 60, 60, 255);
          }
        }
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const logoTexture = createLogoTexture();
  bladeMat.map = logoTexture;
  // Adjust UVs roughly via texture transform if needed, but Extrude UVs are usually 0-1 on top face.
  // We want the logo on the top face. Extrude top face UVs map 0,0 to 1,1 across the shape bounds.
  // We might need to offset/scale to position it near the spine.
  logoTexture.repeat.set(1, 1);
  logoTexture.offset.set(0, 0);


  // --- Blade Geometry ---
  // Shape in XY plane. Y is length, X is width.
  const bladeShape = new THREE.Shape();
  // Start at heel (back of blade, near handle)
  // Heel width approx 0.14 total (0.07 half)
  const heelW = 0.07;
  const bladeL = 0.50;
  
  bladeShape.moveTo(0, -heelW); 
  // Tang insertion area (goes into handle)
  bladeShape.lineTo(-0.05, -heelW); 
  bladeShape.lineTo(-0.05, heelW);
  bladeShape.lineTo(0, heelW);
  
  // Spine (top edge) - slight curve
  bladeShape.bezierCurveTo(0.15, heelW * 0.8, 0.35, heelW * 0.4, bladeL, 0);
  
  // Edge (bottom edge) - curves up to tip
  bladeShape.bezierCurveTo(0.35, -heelW * 0.6, 0.15, -heelW * 0.9, 0, -heelW);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    steps: 1
  });

  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Rotate to lie flat in XZ plane. 
  // Extrude Z (thickness) -> World Y.
  // Extrude Y (length) -> World Z.
  blade.rotation.x = -Math.PI / 2;
  // Position: Tip at +Z, Heel at 0.
  // Geometry center is roughly at Y=0.25 (half length).
  // We want Heel at Z=0. So shift geometry by -0.25 in its local Y (which becomes Z).
  // Actually, let's just position the mesh.
  // Local Y=0 is heel. Local Y=0.5 is tip.
  // After rotation: Local Y becomes World Z.
  // So Heel is at Z=0, Tip is at Z=0.5.
  blade.position.set(0, 0, 0); 
  // Wait, the tang part goes to -0.05. So Heel start is -0.05.
  // Let's adjust position so the handle connection is clean.
  // Let's say Handle starts at Z=0. Blade tang goes into it.
  // Blade geometry Y range: -0.05 (tang end) to 0.5 (tip).
  // Center of geometry Y: ~0.225.
  // If we place mesh at Z=0.225, Tip is at 0.5, Tang End is at 0.
  blade.position.z = 0.225;
  
  // Texture positioning: The logo is on the top face (+Z in geo, +Y in world).
  // UVs for Extrude top face map the shape bounding box to 0..1.
  // Shape X: -0.07 to 0.07. Shape Y: -0.05 to 0.5.
  // We want logo near the spine (positive X in shape? No, spine is Y axis in shape? No.)
  // In my shape definition:
  // Y is length. X is width.
  // Spine is the curve from (0, 0.07) to (0.5, 0). This is positive X? No.
  // My shape: moveTo(0, -0.07). Spine is bezier to (0.5, 0).
  // Wait, (0, -0.07) is negative X? No, moveTo(x, y).
  // I used moveTo(0, -heelW). So Y is width?
  // Let's re-verify axes for Extrude.
  // Shape is in XY. Extrusion is Z.
  // I want Length along Z (world). Width along X (world).
  // So Shape Y should be Length. Shape X should be Width.
  // My Shape:
  // moveTo(0, -0.07). X=0, Y=-0.07.
  // lineTo(-0.05, -0.07). X=-0.05, Y=-0.07.
  // This means X is Depth (Tang), Y is Width.
  // This is confusing. Let's restart Shape definition to be clear.
  
  // Clear Plan:
  // Shape X = Width (left/right of knife).
  // Shape Y = Length (heel to tip).
  // Extrusion Z = Thickness.
  // Rotation: X -90 deg.
  // Result: Shape X -> World X. Shape Y -> World Z. Extrusion Z -> World Y.
  
  // Redefine Shape:
  const bladeShape2 = new THREE.Shape();
  const w = 0.07; // half width
  const l = 0.50; // length
  
  // Start at Heel Bottom (World -X)
  bladeShape2.moveTo(-w, 0); 
  // Tang (goes into handle, negative Y in shape)
  bladeShape2.lineTo(-w * 0.8, -0.05);
  bladeShape2.lineTo(w * 0.8, -0.05);
  bladeShape2.lineTo(w, 0);
  
  // Spine (World +X side? No, let's say Spine is +X)
  // Curve from Heel Top (w, 0) to Tip (0, l)
  bladeShape2.bezierCurveTo(w * 0.8, l * 0.2, w * 0.4, l * 0.6, 0, l);
  
  // Edge (World -X side)
  // Curve from Tip (0, l) to Heel Bottom (-w, 0)
  bladeShape2.bezierCurveTo(-w * 0.4, l * 0.6, -w * 0.8, l * 0.2, -w, 0);
  
  // Update geometry
  blade.geometry.dispose();
  blade.geometry = new THREE.ExtrudeGeometry(bladeShape2, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    steps: 1
  });
  
  // Positioning:
  // Shape Y range: -0.05 (tang end) to 0.5 (tip).
  // Center Y: 0.225.
  // We want Tang End at Z=0 (inside handle).
  // So Mesh Z should be 0.225.
  blade.position.set(0, 0, 0.225);
  
  // Logo Texture Offset:
  // UVs map X (-0.07 to 0.07) -> 0 to 1.
  // UVs map Y (-0.05 to 0.5) -> 0 to 1.
  // Logo is "LEWIS". In photo, it's on the upper half of the blade (near spine), closer to handle.
  // Spine is +X side. Handle is low Y.
  // So we want UV X > 0.5 (Spine side). UV Y around 0.2 to 0.5 (Handle to Mid).
  // Current texture is centered.
  // Let's shift offset.
  logoTexture.offset.set(0.1, 0.2); // Move right (spine) and up (towards handle/mid)
  logoTexture.repeat.set(0.6, 0.4); // Shrink it


  // --- Handle Geometry ---
  // Lathe around Y. Profile in XY.
  // We want Handle along Z. So Rotate X -90.
  // Profile Y becomes Z. Profile X becomes Radius.
  const points = [];
  // Profile starts at Bolster (Z=0 in world -> Y=0 in profile)
  // Ends at Butt (Z=-0.5 in world -> Y=0.5 in profile)
  // Note: Lathe rotates around Y=0. We want the handle to be solid.
  // Points: (x, y)
  points.push(new THREE.Vector2(0.06, 0)); // Bolster radius
  points.push(new THREE.Vector2(0.065, 0.1)); // Grip start swell
  points.push(new THREE.Vector2(0.075, 0.25)); // Max grip
  points.push(new THREE.Vector2(0.07, 0.4)); // Taper
  points.push(new THREE.Vector2(0.06, 0.5)); // Butt
  points.push(new THREE.Vector2(0, 0.5)); // Close top
  points.push(new THREE.Vector2(0, 0)); // Close bottom
  
  const handleGeom = new THREE.LatheGeometry(points, 24);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  
  // Rotate to align with Z axis
  handle.rotation.x = -Math.PI / 2;
  // Position:
  // Profile Y range: 0 to 0.5.
  // Center Y: 0.25.
  // We want Bolster (Y=0) at Z=0.
  // Butt (Y=0.5) at Z=-0.5.
  // Mesh position Z should be -0.25.
  handle.position.set(0, 0, -0.25);
  
  // Add a slight ergonomic bend? 
  // The reference shows the handle dropping slightly relative to the blade spine.
  // Let's rotate the handle slightly down around X axis (in world, which is local X for the handle mesh).
  // Actually, let's just keep it straight for simplicity unless it looks wrong. 
  // The reference shows a slight drop. Let's rotate handle +10 deg around X (local).
  // Wait, if I rotate handle around X, it points down.
  handle.rotation.x = -Math.PI / 2 + 0.15; // Tilted down slightly
  // This will misalign the bolster. Let's just keep it straight for robustness.
  // Reverting to straight.
  handle.rotation.x = -Math.PI / 2;


  // --- Assembly ---
  root.add(blade);
  root.add(handle);

  // Add a small bolster ring where they meet for visual separation
  const bolsterGeom = new THREE.CylinderGeometry(0.075, 0.075, 0.02, 24);
  const bolsterMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.3, roughness: 0.5 });
  const bolster = new THREE.Mesh(bolsterGeom, bolsterMat);
  bolster.rotation.x = Math.PI / 2;
  bolster.position.set(0, 0, -0.01); // Just inside handle start
  root.add(bolster);

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