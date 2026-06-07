export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glass: Physical material for transmission/refraction
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
    side: THREE.DoubleSide,
  });

  // Lid: Light blue plastic/metal
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x90C8EC,
    metalness: 0.1,
    roughness: 0.4,
  });

  // --- Procedural Label Texture (Sun Graphic) ---
  const W = 256, H = 256;
  const data = new Uint8Array(W * H * 4);
  
  // Colors
  const yellow = [255, 235, 59, 255];
  const black = [30, 30, 30, 255];
  const pink = [255, 160, 160, 255];
  const white = [255, 255, 255, 255];

  const cx = W / 2;
  const cy = H / 2;
  const faceR = 45;
  const rayR = 75;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      
      // Default Background: Yellow
      data[idx] = yellow[0];
      data[idx+1] = yellow[1];
      data[idx+2] = yellow[2];
      data[idx+3] = yellow[3];

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      let angle = Math.atan2(dy, dx); 
      if (angle < 0) angle += Math.PI * 2;

      // 1. Draw Rays (12 spikes)
      const rayCount = 12;
      const rayStep = (Math.PI * 2) / rayCount;
      // Find which sector this pixel is in
      const sector = Math.floor(angle / rayStep);
      const sectorCenter = sector * rayStep + rayStep / 2;
      const angleDiff = Math.abs(angle - sectorCenter);
      // Taper ray width: wider at base, narrower at tip
      const t = dist / rayR; // 0 at center, 1 at tip
      const maxAngleWidth = 0.25 * (1.0 - t); 
      
      // Draw ray if within angle and distance range (outside face, inside max radius)
      if (dist > faceR + 2 && dist < rayR && angleDiff < maxAngleWidth) {
        data[idx] = black[0];
        data[idx+1] = black[1];
        data[idx+2] = black[2];
      }

      // 2. Draw Face Circle (Yellow overwrite)
      if (dist < faceR) {
        data[idx] = yellow[0];
        data[idx+1] = yellow[1];
        data[idx+2] = yellow[2];
        
        // Eyes
        const eyeY = cy - 15;
        const eyeOff = 15;
        const eyeR = 5;
        
        // Left Eye
        const dLeft = Math.sqrt((x - (cx - eyeOff))**2 + (y - eyeY)**2);
        if (dLeft < eyeR) {
          data[idx] = black[0]; data[idx+1] = black[1]; data[idx+2] = black[2];
          // Highlight
          if (Math.sqrt((x - (cx - eyeOff + 2))**2 + (y - (eyeY - 2))**2) < 2) {
            data[idx] = white[0]; data[idx+1] = white[1]; data[idx+2] = white[2];
          }
        }
        
        // Right Eye
        const dRight = Math.sqrt((x - (cx + eyeOff))**2 + (y - eyeY)**2);
        if (dRight < eyeR) {
          data[idx] = black[0]; data[idx+1] = black[1]; data[idx+2] = black[2];
          // Highlight
          if (Math.sqrt((x - (cx + eyeOff + 2))**2 + (y - (eyeY - 2))**2) < 2) {
            data[idx] = white[0]; data[idx+1] = white[1]; data[idx+2] = white[2];
          }
        }

        // Mouth (Smile Arc)
        const mouthY = cy + 10;
        const mouthR = 25;
        const mouthDist = Math.sqrt(dx*dx + (y - mouthY)**2);
        // Draw arc segment (bottom half of circle)
        if (mouthDist > mouthR - 3 && mouthDist < mouthR + 3 && y > mouthY) {
          data[idx] = black[0]; data[idx+1] = black[1]; data[idx+2] = black[2];
        }

        // Cheeks (Pink Ovals)
        const cheekY = cy + 5;
        const cheekOff = 25;
        const cheekRX = 10, cheekRY = 6;
        
        // Left Cheek
        const normLeftX = (x - (cx - cheekOff)) / cheekRX;
        const normLeftY = (y - cheekY) / cheekRY;
        if (normLeftX*normLeftX + normLeftY*normLeftY < 1) {
          data[idx] = pink[0]; data[idx+1] = pink[1]; data[idx+2] = pink[2];
        }
        
        // Right Cheek
        const normRightX = (x - (cx + cheekOff)) / cheekRX;
        const normRightY = (y - cheekY) / cheekRY;
        if (normRightX*normRightX + normRightY*normRightY < 1) {
          data[idx] = pink[0]; data[idx+1] = pink[1]; data[idx+2] = pink[2];
        }
      }
      
      // 3. Face Outline
      if (dist > faceR - 2 && dist < faceR + 2) {
         data[idx] = black[0]; data[idx+1] = black[1]; data[idx+2] = black[2];
      }
    }
  }

  const labelTex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  labelTex.needsUpdate = true;
  labelTex.wrapS = THREE.RepeatWrapping;
  labelTex.wrapT = THREE.ClampToEdgeWrapping;

  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTex,
    metalness: 0.0,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });

  // --- Geometry: Jar Body (Hollow Lathe) ---
  // Profile defines the cross-section of the GLASS WALLS
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom Center (Start)
    new THREE.Vector2(0.34, 0.00), // Bottom Outer Edge
    new THREE.Vector2(0.34, 0.75), // Body Side Outer Top
    new THREE.Vector2(0.30, 0.80), // Shoulder
    new THREE.Vector2(0.28, 0.85), // Neck Start
    new THREE.Vector2(0.36, 0.88), // Lip/Thread Outer
    new THREE.Vector2(0.36, 0.92), // Lip Top Outer
    new THREE.Vector2(0.32, 0.92), // Lip Top Inner
    new THREE.Vector2(0.32, 0.88), // Lip Inner Down
    new THREE.Vector2(0.31, 0.85), // Neck Inner
    new THREE.Vector2(0.31, 0.03), // Body Side Inner Bottom
    new THREE.Vector2(0.05, 0.03), // Bottom Inner Punt Edge
    new THREE.Vector2(0.00, 0.03), // Bottom Center Inner
    new THREE.Vector2(0.00, 0.00)  // Close Loop to Start
  ];
  
  const jarGeom = new THREE.LatheGeometry(profilePoints, 32);
  const jarBody = new THREE.Mesh(jarGeom, glassMat);
  root.add(jarBody);

  // --- Geometry: Lid ---
  // Skirt
  const lidSkirtGeom = new THREE.CylinderGeometry(0.38, 0.37, 0.10, 32);
  const lidSkirt = new THREE.Mesh(lidSkirtGeom, lidMat);
  lidSkirt.position.y = 0.92 + 0.05; // Sit on lip
  root.add(lidSkirt);
  
  // Top Cap
  const lidTopGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.04, 32);
  const lidTop = new THREE.Mesh(lidTopGeom, lidMat);
  lidTop.position.y = 0.92 + 0.10 + 0.02;
  root.add(lidTop);

  // --- Geometry: Label ---
  // Cylinder wrapping around the body (Radius 0.34 + epsilon)
  const labelGeom = new THREE.CylinderGeometry(0.345, 0.345, 0.50, 32, 1, true);
  const label = new THREE.Mesh(labelGeom, labelMat);
  label.position.y = 0.30; // Centered on body
  // Rotate so texture center (u=0.5) faces +Z (Camera)
  // Default Cylinder u=0 is +X, u=0.5 is -X.
  // Rotate -90 deg moves -X to +Z.
  label.rotation.y = -Math.PI / 2;
  root.add(label);

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