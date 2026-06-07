export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Beige knit color
  const beigeColor = 0xd8c8b5;
  const darkerBeige = 0xc4b29f;

  // Procedural Knit Texture (Vertical Ribs)
  function createKnitTexture() {
    const width = 128;
    const height = 128;
    const data = new Uint8Array(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Create vertical stripes for ribbing
        // Modulo x to create repeating ribs
        const ribWidth = 8; 
        const phase = x % (ribWidth * 2);
        const isHighlight = phase < ribWidth;
        
        // Base color
        let r = 216, g = 200, b = 181; // #d8c8b5
        
        // Darken the "grooves" between ribs
        if (!isHighlight) {
          r = 196; g = 178; b = 159; // #c4b29f
        }
        
        // Add some noise for fabric texture
        const noise = (Math.sin(x * 0.5) * Math.cos(y * 0.5) * 10);
        r += noise; g += noise; b += noise;

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Repeat pattern
    texture.needsUpdate = true;
    return texture;
  }

  const knitTexture = createKnitTexture();

  const knitMat = new THREE.MeshStandardMaterial({
    color: beigeColor,
    map: knitTexture,
    metalness: 0.0,
    roughness: 0.85,
    bumpMap: knitTexture,
    bumpScale: 0.005,
  });

  const furMat = new THREE.MeshStandardMaterial({
    color: beigeColor,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Geometry Constants ---
  const cuffRadius = 0.32;
  const cuffTube = 0.055;
  const bodyRadius = 0.31;
  const bodyHeight = 0.28;
  const earRadius = 0.09;

  // --- 1. Cuff (Folded Brim) ---
  // TorusGeometry creates the perfect folded ring shape
  const cuffGeom = new THREE.TorusGeometry(cuffRadius, cuffTube, 24, 48);
  const beanie_cuff = new THREE.Mesh(cuffGeom, knitMat);
  // Rotate to lie flat on XZ plane
  cuffGeom.rotateX(Math.PI / 2);
  // Position slightly down so body sits on top
  beanie_cuff.position.y = -0.05;
  root.add(beanie_cuff);

  // --- 2. Main Body (Dome) ---
  // SphereGeometry scaled to look like a beanie cap
  // We use a sphere segment or just a scaled sphere
  const bodyGeom = new THREE.SphereGeometry(bodyRadius, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2.2);
  const beanie_body = new THREE.Mesh(bodyGeom, knitMat);
  // Scale Y to make it slightly taller/flatter as needed
  beanie_body.scale.set(1, 1.1, 1);
  // Position on top of cuff
  beanie_body.position.y = 0.15;
  root.add(beanie_body);

  // --- 3. Ears (Fluffy Pom-poms) ---
  // Dodecahedron with detail gives a soft, organic roundness better than a perfect sphere
  const earGeom = new THREE.DodecahedronGeometry(earRadius, 1);
  
  // Left Ear
  const left_ear = new THREE.Mesh(earGeom, furMat);
  left_ear.position.set(-0.22, 0.35, -0.15);
  left_ear.rotation.set(0.4, 0.2, -0.3);
  left_ear.scale.set(1, 0.9, 0.8); // Slightly flattened
  root.add(left_ear);

  // Right Ear
  const right_ear = new THREE.Mesh(earGeom, furMat);
  right_ear.position.set(0.22, 0.35, -0.15);
  right_ear.rotation.set(0.4, -0.2, 0.3);
  right_ear.scale.set(1, 0.9, 0.8);
  root.add(right_ear);

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