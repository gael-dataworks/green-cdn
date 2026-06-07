export default function generate(THREE) {
  // --- Constants & Dimensions ---
  const COLOR_BEIGE = 0xe3d5c3;
  const COLOR_SHADOW = 0xc9b8a0;
  const COLOR_EAR = 0xe8dcc8;
  
  const BRIM_RADIUS = 0.48;
  const BRIM_HEIGHT = 0.12;
  const BODY_HEIGHT = 0.65;
  const EAR_RADIUS = 0.13;
  const EAR_Y = 0.55;
  const EAR_X_OFFSET = 0.28;
  const EAR_Z_OFFSET = -0.15;

  // --- Helper: Procedural Knit Texture ---
  function createKnitTexture() {
    const width = 256;
    const height = 256;
    const data = new Uint8Array(width * height * 4);
    
    // Base colors
    const rBase = 227, gBase = 213, bBase = 195; // #e3d5c3
    const rShadow = 180, gShadow = 160, bShadow = 140; // Darker for grooves

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (x + y * width) * 4;
        
        // Create vertical ribbing pattern
        // Use sine wave for soft transitions between yarn ribs
        const stripeFreq = 0.4; 
        const pattern = Math.sin(x * stripeFreq * Math.PI * 2 / 16); 
        
        // Mix colors based on pattern
        // pattern is -1 to 1. Map to 0 to 1.
        const mix = (pattern + 1) * 0.5;
        
        // Add some noise for fabric texture
        const noise = (Math.sin(x * 0.5) * Math.cos(y * 0.5)) * 0.1;
        const finalMix = Math.max(0, Math.min(1, mix + noise));

        data[i] = rShadow + (rBase - rShadow) * finalMix;
        data[i + 1] = gShadow + (gBase - gShadow) * finalMix;
        data[i + 2] = bShadow + (bBase - bShadow) * finalMix;
        data[i + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  const knitTexture = createKnitTexture();

  // --- Materials ---
  const knitMat = new THREE.MeshStandardMaterial({
    color: COLOR_BEIGE,
    map: knitTexture,
    metalness: 0.0,
    roughness: 0.9,
  });

  const furMat = new THREE.MeshStandardMaterial({
    color: COLOR_EAR,
    metalness: 0.0,
    roughness: 0.95,
    flatShading: true, // Gives a faceted, fluffy look
  });

  // --- Group ---
  const root = new THREE.Group();

  // --- 1. Brim (Folded Cuff) ---
  // Using CylinderGeometry for easy vertical rib mapping
  const brimGeom = new THREE.CylinderGeometry(
    BRIM_RADIUS, 
    BRIM_RADIUS, 
    BRIM_HEIGHT, 
    32, 
    1, 
    true // openEnded
  );
  const brim = new THREE.Mesh(brimGeom, knitMat);
  brim.position.y = -BRIM_HEIGHT / 2;
  // Scale texture to match ribs count
  knitTexture.repeat.set(12, 4); 
  knitTexture.offset.set(0, 0);
  root.add(brim);

  // --- 2. Main Body (Dome) ---
  // Lathe profile for a slouchy beanie shape
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),  // Top center
    new THREE.Vector2(0.12, 0.10),  // Top curve
    new THREE.Vector2(0.30, 0.35),  // Upper dome
    new THREE.Vector2(0.42, 0.55),  // Mid dome
    new THREE.Vector2(0.45, 0.65),  // Bottom rim (relative to top)
  ];
  // Reverse points because Lathe expects bottom-to-top or we rotate 180
  // Let's define bottom-to-top for clarity
  const bodyProfile = [
    new THREE.Vector2(0.45, 0.00),  // Bottom rim (sits on brim)
    new THREE.Vector2(0.45, 0.08),  // Straight up slightly
    new THREE.Vector2(0.42, 0.25),  // Curve in
    new THREE.Vector2(0.30, 0.45),  // Upper dome
    new THREE.Vector2(0.12, 0.60),  // Top gather
    new THREE.Vector2(0.00, 0.65),  // Top center
  ];
  
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, knitMat);
  // Position body on top of brim
  // Brim top is at y=0.06 (since center is -0.06 and height 0.12)
  // Body profile starts at y=0.0 relative to its origin.
  body.position.y = BRIM_HEIGHT / 2; 
  
  // Adjust texture mapping for the dome
  // We want the vertical ribs to continue from the brim
  // Lathe UVs: u is around the axis, v is along the profile.
  // We want vertical stripes, so we need to repeat along U (around axis).
  knitTexture.repeat.set(16, 2); // More repeats around circumference
  root.add(body);

  // --- 3. Ears (Pom-poms) ---
  // Using Icosahedron for a faceted fluffy look
  const earGeom = new THREE.IcosahedronGeometry(EAR_RADIUS, 2);
  
  const leftEar = new THREE.Mesh(earGeom, furMat);
  leftEar.position.set(-EAR_X_OFFSET, EAR_Y, EAR_Z_OFFSET);
  leftEar.rotation.set(0.2, 0, 0.3); // Tilt slightly out and back
  root.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, furMat);
  rightEar.position.set(EAR_X_OFFSET, EAR_Y, EAR_Z_OFFSET);
  rightEar.rotation.set(0.2, 0, -0.3); // Tilt slightly out and back
  root.add(rightEar);

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