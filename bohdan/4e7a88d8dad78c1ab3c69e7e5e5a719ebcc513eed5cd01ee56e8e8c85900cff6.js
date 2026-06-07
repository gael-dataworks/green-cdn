export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Leather material with procedural texture for wear/veins
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Binding/Edge material (lighter, rougher, fibrous look)
  const bindingMat = new THREE.MeshStandardMaterial({
    color: 0x8b6f47,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Dark interior/hole material
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Procedural Leather Texture ---
  // Generates wear, veins, and scratches to match the reference identity
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Deterministic pseudo-random helper
  function hash(x, y) {
    return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
  }

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Base dark brown
      let r = 92, g = 64, b = 51; 
      
      // Noise grain
      const n = hash(x, y);
      r += (n - 0.5) * 20;
      g += (n - 0.5) * 15;
      b += (n - 0.5) * 10;

      // Veins / Lighter streaks (low frequency noise simulation)
      const vx = Math.sin(x * 0.05 + y * 0.02) * 0.5 + 0.5;
      const vy = Math.cos(x * 0.03 - y * 0.04) * 0.5 + 0.5;
      if (vx > 0.7 || vy > 0.7) {
        const strength = Math.max(vx, vy) - 0.7;
        r += strength * 60;
        g += strength * 40;
        b += strength * 20;
      }

      // Scratches (high frequency lines)
      if (n > 0.98) {
        r += 40; g += 30; b += 20;
      }

      data[i] = Math.min(255, Math.max(0, r));
      data[i+1] = Math.min(255, Math.max(0, g));
      data[i+2] = Math.min(255, Math.max(0, b));
      data[i+3] = 255;
    }
  }

  const leatherTex = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  leatherTex.colorSpace = THREE.SRGBColorSpace;
  leatherTex.needsUpdate = true;
  leatherTex.wrapS = THREE.RepeatWrapping;
  leatherTex.wrapT = THREE.RepeatWrapping;
  leatherMat.map = leatherTex;
  leatherMat.normalScale = new THREE.Vector2(0.5, 0.5); // Subtle bump from texture

  // --- Dimensions ---
  const width = 1.0;   // X (Spine to edge)
  const height = 0.7;  // Y
  const depth = 1.4;   // Z (Front to back)
  const thickness = 0.04; // Thickness of cover layers

  // --- Core Geometry ---
  // Main block
  const coreGeom = new THREE.BoxGeometry(width, height, depth);
  const core = new THREE.Mesh(coreGeom, leatherMat);
  root.add(core);

  // --- Spine Details (Left Side, -X) ---
  // Raised bands on the spine
  const bandCount = 3;
  const bandHeight = 0.06;
  const bandDepth = 0.03; // How much they stick out
  const bandWidth = 0.04; // Thickness along X
  
  for (let i = 0; i < bandCount; i++) {
    const y = -height/2 + (height / (bandCount + 1)) * (i + 1);
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(bandWidth, bandHeight, depth - 0.1),
      leatherMat
    );
    // Position on the left face (-X)
    band.position.set(-width/2 - bandDepth/2, y, 0);
    root.add(band);
  }

  // Clasp hole / Keyhole on spine
  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.1, 16),
    holeMat
  );
  hole.rotation.z = Math.PI / 2;
  hole.position.set(-width/2 - 0.02, 0, 0.15);
  root.add(hole);

  // --- Edges / Binding ---
  // Simulate the rough, fibrous edges where leather turns in
  // We add thin boxes along the 4 vertical edges of the front and back faces
  
  const edgeThick = 0.03;
  const edgeWidth = 0.05;
  
  // Front face edges (+Z)
  const frontLeftEdge = new THREE.Mesh(
    new THREE.BoxGeometry(edgeWidth, height, edgeThick),
    bindingMat
  );
  frontLeftEdge.position.set(-width/2 + edgeWidth/2, 0, depth/2 + edgeThick/2);
  root.add(frontLeftEdge);

  const frontRightEdge = new THREE.Mesh(
    new THREE.BoxGeometry(edgeWidth, height, edgeThick),
    bindingMat
  );
  frontRightEdge.position.set(width/2 - edgeWidth/2, 0, depth/2 + edgeThick/2);
  root.add(frontRightEdge);

  // Back face edges (-Z)
  const backLeftEdge = new THREE.Mesh(
    new THREE.BoxGeometry(edgeWidth, height, edgeThick),
    bindingMat
  );
  backLeftEdge.position.set(-width/2 + edgeWidth/2, 0, -depth/2 - edgeThick/2);
  root.add(backLeftEdge);

  const backRightEdge = new THREE.Mesh(
    new THREE.BoxGeometry(edgeWidth, height, edgeThick),
    bindingMat
  );
  backRightEdge.position.set(width/2 - edgeWidth/2, 0, -depth/2 - edgeThick/2);
  root.add(backRightEdge);

  // Top and Bottom edge strips to connect them
  const topEdge = new THREE.Mesh(
    new THREE.BoxGeometry(width, edgeThick, depth),
    bindingMat
  );
  topEdge.position.set(0, height/2 + edgeThick/2, 0);
  root.add(topEdge);

  const bottomEdge = new THREE.Mesh(
    new THREE.BoxGeometry(width, edgeThick, depth),
    bindingMat
  );
  bottomEdge.position.set(0, -height/2 - edgeThick/2, 0);
  root.add(bottomEdge);

  // --- Frayed Corners (Optional detail) ---
  // Small irregular cylinders at corners to simulate fraying
  const frayGeom = new THREE.CylinderGeometry(0.015, 0.025, 0.08, 6);
  const frayPositions = [
    [-width/2, height/2, depth/2], [width/2, height/2, depth/2],
    [-width/2, -height/2, depth/2], [width/2, -height/2, depth/2],
    [-width/2, height/2, -depth/2], [width/2, height/2, -depth/2],
    [-width/2, -height/2, -depth/2], [width/2, -height/2, -depth/2]
  ];

  for (const pos of frayPositions) {
    const fray = new THREE.Mesh(frayGeom, bindingMat);
    fray.position.set(pos[0], pos[1], pos[2]);
    // Random-ish rotation based on position to look organic
    fray.rotation.x = (pos[0] + pos[2]) * 0.5;
    fray.rotation.z = (pos[1] + pos[2]) * 0.5;
    root.add(fray);
  }

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