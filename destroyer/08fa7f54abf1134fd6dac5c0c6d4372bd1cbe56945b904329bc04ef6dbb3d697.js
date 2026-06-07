export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Glass body: transparent, slightly reflective
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.92,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Lid: light blue matte plastic/painted metal
  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x87CEEB,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Label material (texture generated below)
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Procedural Texture for Label (Sun Graphic) ---
  function createSunTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    const yellow = [255, 215, 0, 255]; // Gold/Yellow
    const darkBrown = [60, 40, 20, 255]; // Outline
    const black = [0, 0, 0, 255];
    const pink = [255, 180, 180, 255];

    const cx = size / 2;
    const cy = size / 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        
        // Default background: Yellow
        data[idx] = yellow[0];
        data[idx + 1] = yellow[1];
        data[idx + 2] = yellow[2];
        data[idx + 3] = yellow[3];

        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Sun Rays (Starburst)
        // 16 rays. Inner radius ~100, Outer ~180
        const rayCount = 16;
        const rayAngle = (Math.PI * 2) / rayCount;
        const normalizedAngle = (angle + Math.PI) % (Math.PI * 2); // 0 to 2PI
        const rayIndex = Math.floor(normalizedAngle / rayAngle);
        
        // Create a jagged edge for rays
        const rayOffset = (Math.sin(rayIndex * 132.5) + 1) * 0.5; // Pseudo-random based on index
        const innerR = 110;
        const outerR = 190;
        
        // Simple star shape logic
        const starR = (rayIndex % 2 === 0) ? outerR : innerR + 40;
        
        if (dist < starR && dist > 80) {
           // Draw outline for sun
           if (Math.abs(dist - starR) < 3 || Math.abs(dist - 80) < 3) {
             data[idx] = darkBrown[0];
             data[idx + 1] = darkBrown[1];
             data[idx + 2] = darkBrown[2];
           } else {
             // Fill rays with slightly darker yellow/orange
             data[idx] = 255;
             data[idx + 1] = 200;
             data[idx + 2] = 0;
           }
        }

        // Face Circle (Inside the rays)
        const faceR = 75;
        if (dist < faceR) {
          // Background of face is same yellow
          data[idx] = yellow[0];
          data[idx + 1] = yellow[1];
          data[idx + 2] = yellow[2];

          // Outline of face
          if (dist > faceR - 3) {
            data[idx] = darkBrown[0];
            data[idx + 1] = darkBrown[1];
            data[idx + 2] = darkBrown[2];
          }

          // Eyes
          const eyeY = cy - 20;
          const eyeXOffset = 25;
          const eyeR = 6;
          
          // Left Eye
          if (Math.sqrt((x - (cx - eyeXOffset))**2 + (y - eyeY)**2) < eyeR) {
            data[idx] = black[0]; data[idx+1] = black[1]; data[idx+2] = black[2];
          }
          // Right Eye
          if (Math.sqrt((x - (cx + eyeXOffset))**2 + (y - eyeY)**2) < eyeR) {
            data[idx] = black[0]; data[idx+1] = black[1]; data[idx+2] = black[2];
          }

          // Smile (Arc)
          // y = cy + 20, radius ~40, from angle ~200 to ~340 degrees
          const smileY = cy + 25;
          const smileR = 35;
          const smileAngle = Math.atan2(y - smileY, x - cx);
          // Check if point is on the arc line
          const distToSmileCenter = Math.sqrt((x - cx)**2 + (y - smileY)**2);
          if (Math.abs(distToSmileCenter - smileR) < 3) {
             if (y > smileY) { // Lower half of circle relative to smile center
               data[idx] = darkBrown[0]; data[idx+1] = darkBrown[1]; data[idx+2] = darkBrown[2];
             }
          }

          // Cheeks
          const cheekY = cy + 10;
          const cheekXOffset = 45;
          const cheekR = 12;
          // Left Cheek
          if (Math.sqrt((x - (cx - cheekXOffset))**2 + (y - cheekY)**2) < cheekR) {
             data[idx] = pink[0]; data[idx+1] = pink[1]; data[idx+2] = pink[2];
             data[idx+3] = 180; // Slight transparency/softness
          }
          // Right Cheek
          if (Math.sqrt((x - (cx + cheekXOffset))**2 + (y - cheekY)**2) < cheekR) {
             data[idx] = pink[0]; data[idx+1] = pink[1]; data[idx+2] = pink[2];
             data[idx+3] = 180;
          }
        }
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  labelMat.map = createSunTexture();

  // --- Geometry Construction ---

  // 1. Glass Body (Lathe)
  // Profile from bottom-center up to top rim
  const bodyProfile = [
    new THREE.Vector2(0, 0),          // Bottom center
    new THREE.Vector2(0.32, 0),       // Bottom edge
    new THREE.Vector2(0.32, 0.05),    // Bottom curve start
    new THREE.Vector2(0.34, 0.15),    // Belly max
    new THREE.Vector2(0.33, 0.45),    // Shoulder start
    new THREE.Vector2(0.30, 0.55),    // Neck start
    new THREE.Vector2(0.31, 0.58),    // Rim lip
    new THREE.Vector2(0.30, 0.60),    // Top inner
    new THREE.Vector2(0, 0.60),       // Top center
  ];
  
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, glassMat);
  root.add(body);

  // 2. Lid (Cylinder)
  // Sits on top of the neck
  const lidGeom = new THREE.CylinderGeometry(0.33, 0.33, 0.08, 32);
  const lid = new THREE.Mesh(lidGeom, lidMat);
  lid.position.y = 0.60 + 0.04; // Half height offset
  root.add(lid);

  // 3. Label (Cylinder Segment)
  // Wrapped around the belly
  const labelRadius = 0.345; // Slightly outside glass
  const labelHeight = 0.25;
  const labelY = 0.25; // Centered on belly
  
  const labelGeom = new THREE.CylinderGeometry(labelRadius, labelRadius, labelHeight, 48, 1, true);
  const label = new THREE.Mesh(labelGeom, labelMat);
  label.position.y = labelY;
  root.add(label);

  // 4. Glass Thickness / Bottom Detail (Optional visual cue)
  // A slightly smaller inverted cone/cylinder inside to suggest thickness at bottom
  const bottomGlassGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 32);
  const bottomGlass = new THREE.Mesh(bottomGlassGeom, glassMat);
  bottomGlass.position.y = 0.025;
  root.add(bottomGlass);

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