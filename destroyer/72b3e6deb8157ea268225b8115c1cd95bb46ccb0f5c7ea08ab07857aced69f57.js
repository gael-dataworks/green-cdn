export default function generate(THREE) {
  // --- Constants & Dimensions ---
  const CHAIR_WIDTH = 0.78;
  const CHAIR_HEIGHT = 0.88;
  const CHAIR_DEPTH = 0.82;
  const SEAT_HEIGHT = 0.42;
  const CUSHION_THICK = 0.16;
  const LEG_THICK = 0.055;
  const ARM_WIDTH = 0.09;
  const ARM_THICK = 0.04;
  
  // --- Materials ---
  
  // Wood: Walnut/Tek tone, satin finish
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Fabric: High roughness, uses generated patchwork texture
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Hardware: Dark metal screws
  const screwMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.4,
    roughness: 0.6,
  });

  // --- Procedural Patchwork Texture ---
  function createPatchworkTexture(THREE) {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    
    // Palette from reference: Red, Mustard, Navy, Green, Teal, Pinkish
    const colors = [
      { r: 180, g: 40, b: 40 },   // Red
      { r: 220, g: 180, b: 40 },  // Mustard
      { r: 40, g: 60, b: 120 },   // Navy
      { r: 40, g: 100, b: 60 },   // Green
      { r: 40, g: 120, b: 120 },  // Teal
      { r: 200, g: 100, b: 100 }, // Pink/Salmon
      { r: 100, g: 100, b: 180 }, // Periwinkle
      { r: 160, g: 140, b: 80 }   // Olive
    ];

    const blockSize = 32; // Size of each patch in pixels
    const seamSize = 2;   // Size of stitching lines

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        
        // Determine which block we are in
        const bx = Math.floor(x / blockSize);
        const by = Math.floor(y / blockSize);
        
        // Deterministic color selection based on block coordinates
        // Using a prime multiplier to scramble the pattern slightly so it's not just diagonal stripes
        const colorIndex = (bx + by * 7) % colors.length;
        const base = colors[colorIndex];
        
        // Check if we are in a seam
        const localX = x % blockSize;
        const localY = y % blockSize;
        const isSeamX = localX < seamSize || localX >= blockSize - seamSize;
        const isSeamY = localY < seamSize || localY >= blockSize - seamSize;
        
        let r, g, b;
        
        if (isSeamX || isSeamY) {
          // Seam color (darker thread)
          r = 60; g = 50; b = 40;
        } else {
          // Base color with some fabric noise
          const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 15;
          r = Math.max(0, Math.min(255, base.r + noise));
          g = Math.max(0, Math.min(255, base.g + noise));
          b = Math.max(0, Math.min(255, base.b + noise));
        }
        
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Repeat texture to make patches smaller on the actual geometry
    texture.repeat.set(3, 3); 
    texture.needsUpdate = true;
    return texture;
  }

  fabricMat.map = createPatchworkTexture(THREE);

  // --- Geometry Construction ---
  const root = new THREE.Group();

  // 1. Legs
  // Front Legs: Angle forward (X) and outward (Z)
  const legGeom = new THREE.BoxGeometry(LEG_THICK, SEAT_HEIGHT, LEG_THICK);
  
  // Front Left
  const flLeg = new THREE.Mesh(legGeom, woodMat);
  flLeg.position.set(-CHAIR_WIDTH / 2 + LEG_THICK / 2, SEAT_HEIGHT / 2, CHAIR_DEPTH / 2 - LEG_THICK / 2);
  flLeg.rotation.z = 0.15; // Outward
  flLeg.rotation.x = 0.15; // Forward
  root.add(flLeg);

  // Front Right
  const frLeg = new THREE.Mesh(legGeom, woodMat);
  frLeg.position.set(CHAIR_WIDTH / 2 - LEG_THICK / 2, SEAT_HEIGHT / 2, CHAIR_DEPTH / 2 - LEG_THICK / 2);
  frLeg.rotation.z = -0.15; // Outward
  frLeg.rotation.x = 0.15; // Forward
  root.add(frLeg);

  // Back Legs: Taller, angle backward
  const backLegH = CHAIR_HEIGHT - 0.1;
  const backLegGeom = new THREE.BoxGeometry(LEG_THICK, backLegH, LEG_THICK);
  
  // Back Left
  const blLeg = new THREE.Mesh(backLegGeom, woodMat);
  blLeg.position.set(-CHAIR_WIDTH / 2 + LEG_THICK / 2, backLegH / 2, -CHAIR_DEPTH / 2 + LEG_THICK / 2);
  blLeg.rotation.x = -0.15; // Backward
  root.add(blLeg);

  // Back Right
  const brLeg = new THREE.Mesh(backLegGeom, woodMat);
  brLeg.position.set(CHAIR_WIDTH / 2 - LEG_THICK / 2, backLegH / 2, -CHAIR_DEPTH / 2 + LEG_THICK / 2);
  brLeg.rotation.x = -0.15; // Backward
  root.add(brLeg);

  // 2. Side Rails (Connecting front and back legs below seat)
  const railLen = CHAIR_DEPTH * 0.6;
  const railGeom = new THREE.BoxGeometry(LEG_THICK * 1.5, LEG_THICK * 1.5, railLen);
  
  const leftRail = new THREE.Mesh(railGeom, woodMat);
  leftRail.position.set(-CHAIR_WIDTH / 2, SEAT_HEIGHT - LEG_THICK * 2, 0);
  root.add(leftRail);

  const rightRail = new THREE.Mesh(railGeom, woodMat);
  rightRail.position.set(CHAIR_WIDTH / 2, SEAT_HEIGHT - LEG_THICK * 2, 0);
  root.add(rightRail);

  // 3. Armrests
  // Flat rounded slats sitting on front legs, extending back
  const armLen = CHAIR_DEPTH * 0.75;
  // Using Capsule for rounded edges on the armrest
  const armGeom = new THREE.CapsuleGeometry(ARM_THICK, armLen, 4, 8);
  
  const leftArm = new THREE.Mesh(armGeom, woodMat);
  leftArm.rotation.z = Math.PI / 2; // Lie flat
  leftArm.position.set(-CHAIR_WIDTH / 2 + ARM_WIDTH / 2, SEAT_HEIGHT + ARM_THICK, 0);
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, woodMat);
  rightArm.rotation.z = Math.PI / 2;
  rightArm.position.set(CHAIR_WIDTH / 2 - ARM_WIDTH / 2, SEAT_HEIGHT + ARM_THICK, 0);
  root.add(rightArm);

  // Arm Supports (vertical bits under the armrest connecting to frame)
  const supportGeom = new THREE.BoxGeometry(ARM_WIDTH, 0.15, 0.04);
  const lSupport = new THREE.Mesh(supportGeom, woodMat);
  lSupport.position.set(-CHAIR_WIDTH / 2 + ARM_WIDTH / 2, SEAT_HEIGHT + ARM_THICK - 0.075, CHAIR_DEPTH / 2 - 0.1);
  root.add(lSupport);
  
  const rSupport = new THREE.Mesh(supportGeom, woodMat);
  rSupport.position.set(CHAIR_WIDTH / 2 - ARM_WIDTH / 2, SEAT_HEIGHT + ARM_THICK - 0.075, CHAIR_DEPTH / 2 - 0.1);
  root.add(rSupport);

  // 4. Back Frame
  // A wooden structure holding the back cushion
  const backFrameWidth = CHAIR_WIDTH * 0.85;
  const backFrameH = CHAIR_HEIGHT - SEAT_HEIGHT - 0.1;
  const backFrameGeom = new THREE.BoxGeometry(backFrameWidth, 0.04, backFrameH);
  
  const backFrame = new THREE.Mesh(backFrameGeom, woodMat);
  backFrame.position.set(0, SEAT_HEIGHT + backFrameH / 2 + 0.05, -CHAIR_DEPTH / 2 + 0.05);
  backFrame.rotation.x = 0.1; // Tilted back slightly
  root.add(backFrame);

  // 5. Cushions
  
  // Seat Cushion
  const seatW = CHAIR_WIDTH * 0.9;
  const seatD = CHAIR_DEPTH * 0.85;
  const seatGeom = new THREE.BoxGeometry(seatW, CUSHION_THICK, seatD);
  const seatCushion = new THREE.Mesh(seatGeom, fabricMat);
  seatCushion.position.set(0, SEAT_HEIGHT + CUSHION_THICK / 2 - 0.02, 0.05); // Slightly forward
  root.add(seatCushion);

  // Back Cushion
  const backW = CHAIR_WIDTH * 0.8;
  const backH = CHAIR_HEIGHT - SEAT_HEIGHT - 0.15;
  const backD = 0.18; // Thick plush cushion
  const backGeom = new THREE.BoxGeometry(backW, backH, backD);
  const backCushion = new THREE.Mesh(backGeom, fabricMat);
  // Position: Resting against the back frame, tilted
  backCushion.position.set(0, SEAT_HEIGHT + backH / 2 + 0.05, -CHAIR_DEPTH / 2 + 0.15);
  backCushion.rotation.x = 0.15; // More tilt than frame for comfort look
  root.add(backCushion);

  // 6. Details: Screws/Bolts on front legs
  const screwGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8);
  
  function addScrew(x, y, z, rotZ) {
    const screw = new THREE.Mesh(screwGeom, screwMat);
    screw.rotation.z = rotZ;
    screw.position.set(x, y, z);
    root.add(screw);
  }

  // Left leg screws
  addScrew(-CHAIR_WIDTH / 2 + 0.02, SEAT_HEIGHT - 0.05, CHAIR_DEPTH / 2 - 0.02, 0);
  addScrew(-CHAIR_WIDTH / 2 + 0.02, SEAT_HEIGHT - 0.08, CHAIR_DEPTH / 2 - 0.02, 0);
  
  // Right leg screws
  addScrew(CHAIR_WIDTH / 2 - 0.02, SEAT_HEIGHT - 0.05, CHAIR_DEPTH / 2 - 0.02, 0);
  addScrew(CHAIR_WIDTH / 2 - 0.02, SEAT_HEIGHT - 0.08, CHAIR_DEPTH / 2 - 0.02, 0);

  // Normalize
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