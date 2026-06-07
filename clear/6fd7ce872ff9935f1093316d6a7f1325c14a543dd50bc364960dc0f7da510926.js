export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Blue anodized aluminum body
  const blueBodyMat = new THREE.MeshStandardMaterial({
    color: 0x007bff,
    metalness: 0.4,
    roughness: 0.4,
    emissive: 0x007bff,
    emissiveIntensity: 0.3,
  });

  // Silver metal connector and cap
  const silverMetalMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    metalness: 0.5,
    roughness: 0.3,
    emissive: 0xd0d0d0,
    emissiveIntensity: 0.4,
  });

  // Dark material for connector holes
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const bodyRadius = 0.15;
  const bodyLength = 0.60;
  const capThickness = 0.02;
  
  const connWidth = 0.24;
  const connHeight = 0.08;
  const connLength = 0.25;

  // --- Body (Blue Cylinder) ---
  // CylinderGeometry is Y-up by default. Rotate X by 90 deg to align with Z axis.
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLength, 32);
  const body = new THREE.Mesh(bodyGeom, blueBodyMat);
  body.rotation.x = Math.PI / 2;
  root.add(body);

  // --- Back Cap (Silver Disc) ---
  const capGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, capThickness, 32);
  const cap = new THREE.Mesh(capGeom, silverMetalMat);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = -(bodyLength / 2 + capThickness / 2);
  root.add(cap);

  // --- Connector Housing (Silver Box) ---
  const connGeom = new THREE.BoxGeometry(connWidth, connHeight, connLength);
  const connector = new THREE.Mesh(connGeom, silverMetalMat);
  connector.position.z = bodyLength / 2 + connLength / 2;
  // Slightly lower than body center to match typical USB profile
  connector.position.y = -0.02; 
  root.add(connector);

  // --- Connector Holes (Recessed Black Rectangles) ---
  // Two holes on the top face of the connector
  const holeWidth = 0.06;
  const holeDepth = 0.04;
  const holeHeight = 0.01; // Thin box
  const holeGeom = new THREE.BoxGeometry(holeWidth, holeHeight, holeDepth);
  
  const holeOffsetZ = 0.06;
  const holeY = connHeight / 2 + 0.001; // Sit on top surface
  const holeZ = connector.position.z;

  const holeLeft = new THREE.Mesh(holeGeom, darkMat);
  holeLeft.position.set(-0.06, holeY, holeZ - holeOffsetZ);
  root.add(holeLeft);

  const holeRight = new THREE.Mesh(holeGeom, darkMat);
  holeRight.position.set(0.06, holeY, holeZ + holeOffsetZ);
  root.add(holeRight);

  // --- USB Label Texture ---
  // Generate a simple texture for the "USB" text and extra detail on the connector
  const texWidth = 128;
  const texHeight = 64;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Fill with silver background
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 200;     // R
    data[i + 1] = 200; // G
    data[i + 2] = 200; // B
    data[i + 3] = 255; // A
  }

  // Draw "USB" text roughly (blocky letters)
  // Simple horizontal bars for text
  function drawRect(x, y, w, h, r, g, b) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const idx = ((y + dy) * texWidth + (x + dx)) * 4;
        if (idx < data.length) {
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }

  // Draw U
  drawRect(20, 20, 4, 24, 50, 50, 50);
  drawRect(36, 20, 4, 24, 50, 50, 50);
  drawRect(20, 40, 20, 4, 50, 50, 50);
  
  // Draw S
  drawRect(50, 20, 20, 4, 50, 50, 50);
  drawRect(50, 20, 4, 12, 50, 50, 50);
  drawRect(50, 30, 20, 4, 50, 50, 50);
  drawRect(66, 30, 4, 12, 50, 50, 50);
  drawRect(50, 40, 20, 4, 50, 50, 50);

  // Draw B
  drawRect(80, 20, 4, 24, 50, 50, 50);
  drawRect(80, 20, 16, 4, 50, 50, 50);
  drawRect(80, 30, 16, 4, 50, 50, 50);
  drawRect(80, 40, 16, 4, 50, 50, 50);

  const labelTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  labelTexture.needsUpdate = true;

  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTexture,
    metalness: 0.5,
    roughness: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -1, // Fight z-fighting
  });

  const labelGeom = new THREE.PlaneGeometry(connWidth * 0.8, connLength * 0.6);
  const label = new THREE.Mesh(labelGeom, labelMat);
  label.rotation.x = Math.PI / 2;
  label.position.set(0, connHeight / 2 + 0.002, connector.position.z);
  root.add(label);

  // --- Normalize ---
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