export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const sliceW = 0.40;
  const sliceD = 0.50;
  const sliceH = 0.30;
  const crustH = 0.04;
  const fillingH = sliceH - crustH;

  // --- Materials ---
  // Crust: Graham cracker style, brown, rough
  const crustMat = new THREE.MeshStandardMaterial({
    color: 0x9c6b3f,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Filling: Creamy cheesecake, matte but soft
  const fillingMat = new THREE.MeshStandardMaterial({
    color: 0xfffdd0,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Internal Cherry Chunks: Darker red, slightly shiny
  const chunkMat = new THREE.MeshStandardMaterial({
    color: 0xa02040,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Glaze: Shiny, translucent red syrup
  const glazeMat = new THREE.MeshPhysicalMaterial({
    color: 0xd02050,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.9,
  });

  // Top Cherries: Deep red, very glossy/wet look
  const cherryMat = new THREE.MeshStandardMaterial({
    color: 0x8a0325,
    metalness: 0.4,
    roughness: 0.1,
  });

  // --- Geometry Construction ---

  // 1. Filling Body (The main white block)
  // Positioned so crust is at bottom.
  const fillingGeom = new THREE.BoxGeometry(sliceW, fillingH, sliceD);
  const filling_body = new THREE.Mesh(fillingGeom, fillingMat);
  filling_body.position.set(0, crustH + fillingH / 2, 0);
  root.add(filling_body);

  // 2. Crust Base (Bottom layer, slightly wider)
  const crustBaseGeom = new THREE.BoxGeometry(sliceW + 0.02, crustH, sliceD + 0.02);
  const crust_base = new THREE.Mesh(crustBaseGeom, crustMat);
  crust_base.position.set(0, crustH / 2, 0);
  root.add(crust_base);

  // 3. Crust Sides (Back and Left faces are the original crust)
  // Back Crust
  const crustBackGeom = new THREE.BoxGeometry(sliceW + 0.02, fillingH, 0.03);
  const crust_side_back = new THREE.Mesh(crustBackGeom, crustMat);
  crust_side_back.position.set(0, crustH + fillingH / 2, -sliceD / 2 - 0.015);
  root.add(crust_side_back);

  // Left Crust
  const crustLeftGeom = new THREE.BoxGeometry(0.03, fillingH, sliceD + 0.02);
  const crust_side_left = new THREE.Mesh(crustLeftGeom, crustMat);
  crust_side_left.position.set(-sliceW / 2 - 0.015, crustH + fillingH / 2, 0);
  root.add(crust_side_left);

  // 4. Internal Cherry Chunks (Visible in the cut face)
  // Placed slightly inside the filling to simulate swirls
  const chunkGeom = new THREE.SphereGeometry(0.025, 16, 16);
  
  const chunk1 = new THREE.Mesh(chunkGeom, chunkMat);
  chunk1.position.set(0.05, crustH + fillingH * 0.6, -0.05);
  chunk1.scale.set(1.5, 1.0, 1.0);
  root.add(chunk1);

  const chunk2 = new THREE.Mesh(chunkGeom, chunkMat);
  chunk2.position.set(-0.08, crustH + fillingH * 0.3, 0.1);
  chunk2.scale.set(1.2, 1.2, 1.2);
  root.add(chunk2);

  const chunk3 = new THREE.Mesh(chunkGeom, chunkMat);
  chunk3.position.set(0.12, crustH + fillingH * 0.8, 0.15);
  chunk3.scale.set(1.0, 0.8, 1.0);
  root.add(chunk3);

  // 5. Glaze Layer (Top shiny coating)
  const glazeGeom = new THREE.BoxGeometry(sliceW + 0.01, 0.015, sliceD + 0.01);
  const glaze_top = new THREE.Mesh(glazeGeom, glazeMat);
  glaze_top.position.set(0, sliceH - 0.007, 0);
  root.add(glaze_top);

  // 6. Glaze Drips (Running down the back and left sides)
  const dripGeom = new THREE.CapsuleGeometry(0.015, 0.06, 4, 8);
  
  const drip1 = new THREE.Mesh(dripGeom, glazeMat);
  drip1.position.set(-sliceW / 2 + 0.05, sliceH - 0.05, -sliceD / 2 - 0.01);
  drip1.rotation.x = Math.PI; // Hang down
  root.add(drip1);

  const drip2 = new THREE.Mesh(dripGeom, glazeMat);
  drip2.position.set(0, sliceH - 0.08, -sliceD / 2 - 0.01);
  drip2.rotation.x = Math.PI;
  drip2.scale.set(1, 1.5, 1);
  root.add(drip2);

  const drip3 = new THREE.Mesh(dripGeom, glazeMat);
  drip3.position.set(-sliceW / 2 - 0.01, sliceH - 0.06, 0.1);
  drip3.rotation.z = Math.PI / 2; // Hang down side
  root.add(drip3);

  // 7. Top Cherries (Garnish)
  // Using spheres, slightly scaled to look organic
  const cherryGeom = new THREE.SphereGeometry(0.045, 32, 32);

  const cherry_left = new THREE.Mesh(cherryGeom, cherryMat);
  cherry_left.position.set(-0.12, sliceH + 0.03, 0.15);
  cherry_left.scale.set(1.1, 0.9, 1.1);
  root.add(cherry_left);

  const cherry_center = new THREE.Mesh(cherryGeom, cherryMat);
  cherry_center.position.set(0.0, sliceH + 0.04, 0.0);
  cherry_center.scale.set(1.0, 1.0, 1.0);
  root.add(cherry_center);

  const cherry_right = new THREE.Mesh(cherryGeom, cherryMat);
  cherry_right.position.set(0.12, sliceH + 0.03, -0.15);
  cherry_right.scale.set(1.1, 0.9, 1.1);
  root.add(cherry_right);

  // Highlight specs on cherries (simple small white spheres)
  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const highlightGeom = new THREE.SphereGeometry(0.01, 8, 8);
  
  const h1 = new THREE.Mesh(highlightGeom, highlightMat);
  h1.position.set(-0.10, sliceH + 0.05, 0.17);
  root.add(h1);

  const h2 = new THREE.Mesh(highlightGeom, highlightMat);
  h2.position.set(0.02, sliceH + 0.06, 0.02);
  root.add(h2);

  const h3 = new THREE.Mesh(highlightGeom, highlightMat);
  h3.position.set(0.14, sliceH + 0.05, -0.13);
  root.add(h3);

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