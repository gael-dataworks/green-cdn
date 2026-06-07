export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed stainless steel for body and lid
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Darker brushed metal for the base ring
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.5,
    roughness: 0.4,
  });

  // Matte black plastic for handles and knob
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Glossy black for control panel background
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.2,
  });

  // Emissive green for the digital display
  const displayMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0x00ff00,
    emissiveIntensity: 1.5,
    toneMapped: false,
  });

  // --- Geometry Construction ---

  // 1. Main Body (Lathe for rounded bottom + straight sides)
  const bodyProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.38, 0),
    new THREE.Vector2(0.42, 0.08), // Rounded bottom edge
    new THREE.Vector2(0.42, 0.75), // Straight sides up to rim
    new THREE.Vector2(0.41, 0.78), // Slight lip
    new THREE.Vector2(0, 0.78),
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 48);
  const body = new THREE.Mesh(bodyGeom, steelMat);
  root.add(body);

  // 2. Base Ring (Darker band at bottom)
  const baseGeom = new THREE.TorusGeometry(0.42, 0.03, 16, 48);
  const baseRing = new THREE.Mesh(baseGeom, baseMat);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.03;
  root.add(baseRing);

  // 3. Lid (Domed)
  // Using a sphere scaled down on Y, cut in half
  const lidGeom = new THREE.SphereGeometry(0.44, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.2);
  const lid = new THREE.Mesh(lidGeom, steelMat);
  lid.position.y = 0.78;
  lid.scale.set(1, 0.6, 1); // Flatten to make a dome
  root.add(lid);

  // Lid Rim (Thin cylinder under the dome for seating)
  const lidRimGeom = new THREE.CylinderGeometry(0.44, 0.44, 0.04, 48);
  const lidRim = new THREE.Mesh(lidRimGeom, steelMat);
  lidRim.position.y = 0.76;
  root.add(lidRim);

  // 4. Lid Knob Assembly
  const knobStemGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16);
  const knobStem = new THREE.Mesh(knobStemGeom, plasticMat);
  knobStem.position.y = 0.78 + 0.26 + 0.04; // Top of lid + offset
  root.add(knobStem);

  const knobTopGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 32);
  const knobTop = new THREE.Mesh(knobTopGeom, plasticMat);
  knobTop.position.y = 0.78 + 0.26 + 0.08;
  root.add(knobTop);

  // 5. Side Handles (Left and Right)
  // Handle shape: Torus loop in YZ plane
  const handleLoopGeom = new THREE.TorusGeometry(0.09, 0.025, 12, 24, Math.PI); // Half torus
  // We need a full loop shape, let's use a full torus and rotate, or construct from tubes.
  // Image shows a D-shape or rectangular loop. Let's use a Torus for the curved part and boxes for mounts.
  
  function createHandle(side) {
    const handleGroup = new THREE.Group();
    const dir = side === 'left' ? -1 : 1;

    // Mounting bracket on body
    const bracketGeom = new THREE.BoxGeometry(0.04, 0.12, 0.08);
    const bracket = new THREE.Mesh(bracketGeom, plasticMat);
    bracket.position.set(dir * 0.42, 0.70, 0);
    handleGroup.add(bracket);

    // The Loop (Torus rotated to stand vertically on the side)
    // Default Torus is in XY plane. We want it in YZ plane (facing X).
    // Rotate X 90 deg -> YZ plane.
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 12, 24), plasticMat);
    loop.rotation.x = Math.PI / 2;
    loop.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2; // Face outward
    loop.position.set(dir * 0.46, 0.70, 0);
    handleGroup.add(loop);

    return handleGroup;
  }

  const leftHandle = createHandle('left');
  root.add(leftHandle);

  const rightHandle = createHandle('right');
  root.add(rightHandle);

  // 6. Control Panel (Procedural Texture)
  // Create a DataTexture for the display "3:58" and icons
  const panelWidth = 128;
  const panelHeight = 64;
  const data = new Uint8Array(panelWidth * panelHeight * 4);
  
  // Fill background black
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 10;     // R
    data[i + 1] = 10; // G
    data[i + 2] = 15; // B
    data[i + 3] = 255; // A
  }

  // Helper to draw a rect on the texture
  function drawRect(x, y, w, h, r, g, b) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const idx = ((y + dy) * panelWidth + (x + dx)) * 4;
        if (idx < data.length) {
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }

  // Draw "3:58" digits (simplified blocky segments)
  // Digit 3
  drawRect(40, 20, 4, 24, 0, 255, 0); // top
  drawRect(40, 44, 4, 24, 0, 255, 0); // bottom
  drawRect(40, 20, 4, 48, 0, 255, 0); // right vert
  drawRect(40, 44, 4, 4, 0, 255, 0); // mid
  
  // Colon
  drawRect(50, 25, 4, 4, 0, 255, 0);
  drawRect(50, 45, 4, 4, 0, 255, 0);

  // Digit 5
  drawRect(60, 20, 24, 4, 0, 255, 0); // top
  drawRect(60, 44, 24, 4, 0, 255, 0); // bottom
  drawRect(60, 20, 4, 24, 0, 255, 0); // top-left
  drawRect(80, 44, 4, 24, 0, 255, 0); // bottom-right
  drawRect(60, 44, 24, 4, 0, 255, 0); // mid

  // Digit 8
  drawRect(90, 20, 24, 4, 0, 255, 0); // top
  drawRect(90, 44, 24, 4, 0, 255, 0); // bottom
  drawRect(90, 20, 4, 48, 0, 255, 0); // left
  drawRect(110, 20, 4, 48, 0, 255, 0); // right
  drawRect(90, 44, 24, 4, 0, 255, 0); // mid

  // Icons (Red power left, Blue settings right)
  drawRect(10, 25, 10, 10, 255, 50, 50); // Red icon
  drawRect(10, 45, 10, 10, 255, 50, 50); 
  drawRect(100, 25, 10, 10, 50, 50, 255); // Blue icon
  drawRect(100, 45, 10, 10, 50, 50, 255);

  const panelTexture = new THREE.DataTexture(data, panelWidth, panelHeight, THREE.RGBAFormat);
  panelTexture.colorSpace = THREE.SRGBColorSpace;
  panelTexture.needsUpdate = true;

  // Panel Geometry (Rounded rectangle plane)
  // We use a Shape for the rounded rectangle
  const panelShape = new THREE.Shape();
  const pw = 0.18;
  const ph = 0.08;
  const radius = 0.02;
  panelShape.moveTo(-pw/2 + radius, -ph/2);
  panelShape.lineTo(pw/2 - radius, -ph/2);
  panelShape.quadraticCurveTo(pw/2, -ph/2, pw/2, -ph/2 + radius);
  panelShape.lineTo(pw/2, ph/2 - radius);
  panelShape.quadraticCurveTo(pw/2, ph/2, pw/2 - radius, ph/2);
  panelShape.lineTo(-pw/2 + radius, ph/2);
  panelShape.quadraticCurveTo(-pw/2, ph/2, -pw/2, ph/2 - radius);
  panelShape.lineTo(-pw/2, -ph/2 + radius);
  panelShape.quadraticCurveTo(-pw/2, -ph/2, -pw/2 + radius, -ph/2);

  const panelGeom = new THREE.ExtrudeGeometry(panelShape, { depth: 0.005, bevelEnabled: false });
  // Rotate to face front and slightly up to match lid slope
  const controlPanel = new THREE.Mesh(panelGeom, panelMat);
  // Position on the front of the lid
  controlPanel.position.set(0, 0.78 + 0.15, 0.35);
  controlPanel.rotation.x = -0.4; // Tilt back to match dome slope
  
  // Apply texture to the front face of the extrusion
  // Since ExtrudeGeometry has multiple groups, we need to assign materials carefully or use a single material with map
  // For simplicity with ExtrudeGeometry, we can just use the map on the main material if UVs are okay, 
  // but ExtrudeGeometry UVs are complex. 
  // Better approach for flat panel: Use a PlaneGeometry for the face and a thin Box for the body.
  
  root.remove(controlPanel); // Remove the extruded one

  // Revised Panel: Thin Box + Plane for texture
  const panelBodyGeom = new THREE.BoxGeometry(pw, 0.005, ph);
  const panelBody = new THREE.Mesh(panelBodyGeom, plasticMat);
  panelBody.position.set(0, 0.78 + 0.15, 0.35);
  panelBody.rotation.x = -0.4;
  root.add(panelBody);

  const screenGeom = new THREE.PlaneGeometry(pw * 0.9, ph * 0.8);
  const screenMat = new THREE.MeshBasicMaterial({ map: panelTexture });
  const screen = new THREE.Mesh(screenGeom, screenMat);
  screen.position.set(0, 0.003, 0); // Slightly in front of panel body
  screen.rotation.x = Math.PI; // Flip to face out correctly depending on UVs, usually Plane faces +Z
  // Adjust rotation to match parent
  screen.rotation.x = 0; 
  panelBody.add(screen);


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