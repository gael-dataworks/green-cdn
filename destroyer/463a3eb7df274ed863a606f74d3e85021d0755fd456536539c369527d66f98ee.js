export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B7D6B,
    metalness: 0.0,
    roughness: 0.85,
  });

  const plaidMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.9,
    map: createPlaidTexture(THREE),
  });

  // --- Dimensions ---
  const legW = 0.12;
  const legD = 0.12;
  const legH = 1.9;
  const seatH = 0.42;
  const totalW = 1.6;
  const totalD = 0.9;
  const canopyH = 1.75;
  const beamW = 0.10;
  const beamD = 0.10;

  // --- Frame: Legs ---
  const legGeom = new THREE.BoxGeometry(legW, legH, legD);
  
  const front_left_leg = new THREE.Mesh(legGeom, woodMat);
  front_left_leg.position.set(-totalW / 2, legH / 2, totalD / 2);
  root.add(front_left_leg);

  const front_right_leg = new THREE.Mesh(legGeom, woodMat);
  front_right_leg.position.set(totalW / 2, legH / 2, totalD / 2);
  root.add(front_right_leg);

  const back_left_leg = new THREE.Mesh(legGeom, woodMat);
  back_left_leg.position.set(-totalW / 2, legH / 2, -totalD / 2);
  root.add(back_left_leg);

  const back_right_leg = new THREE.Mesh(legGeom, woodMat);
  back_right_leg.position.set(totalW / 2, legH / 2, -totalD / 2);
  root.add(back_right_leg);

  // --- Frame: Canopy Top ---
  const top_front_beam = new THREE.Mesh(new THREE.BoxGeometry(totalW + legW, beamD, beamW), woodMat);
  top_front_beam.position.set(0, canopyH, totalD / 2);
  root.add(top_front_beam);

  const top_back_beam = new THREE.Mesh(new THREE.BoxGeometry(totalW + legW, beamD, beamW), woodMat);
  top_back_beam.position.set(0, canopyH, -totalD / 2);
  root.add(top_back_beam);

  const top_left_beam = new THREE.Mesh(new THREE.BoxGeometry(beamW, beamD, totalD), woodMat);
  top_left_beam.position.set(-totalW / 2, canopyH, 0);
  root.add(top_left_beam);

  const top_right_beam = new THREE.Mesh(new THREE.BoxGeometry(beamW, beamD, totalD), woodMat);
  top_right_beam.position.set(totalW / 2, canopyH, 0);
  root.add(top_right_beam);

  // --- Frame: Seat Base Structure ---
  // Side rails
  const side_rail_geom = new THREE.BoxGeometry(beamW, beamD, totalD);
  const left_base_rail = new THREE.Mesh(side_rail_geom, woodMat);
  left_base_rail.position.set(-totalW / 2, seatH, 0);
  root.add(left_base_rail);

  const right_base_rail = new THREE.Mesh(side_rail_geom, woodMat);
  right_base_rail.position.set(totalW / 2, seatH, 0);
  root.add(right_base_rail);

  // Front/Back rails for seat support
  const seat_support_geom = new THREE.BoxGeometry(totalW, beamD, beamW);
  const front_seat_rail = new THREE.Mesh(seat_support_geom, woodMat);
  front_seat_rail.position.set(0, seatH, totalD / 2);
  root.add(front_seat_rail);

  const back_seat_rail = new THREE.Mesh(seat_support_geom, woodMat);
  back_seat_rail.position.set(0, seatH, -totalD / 2);
  root.add(back_seat_rail);

  // Center support beam under cushions
  const center_support = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, totalD - 0.1), woodMat);
  center_support.position.set(0, seatH - 0.05, 0);
  root.add(center_support);

  // Cross brace (diagonal under seat)
  const braceGeom = new THREE.BoxGeometry(0.06, 0.06, 0.8);
  const cross_brace = new THREE.Mesh(braceGeom, woodMat);
  cross_brace.position.set(0, seatH - 0.15, 0);
  cross_brace.rotation.y = Math.PI / 4;
  root.add(cross_brace);

  // --- Backrest ---
  const backrest_top_rail = new THREE.Mesh(new THREE.BoxGeometry(totalW - legW * 2, beamD, beamW), woodMat);
  backrest_top_rail.position.set(0, seatH + 0.6, -totalD / 2);
  root.add(backrest_top_rail);

  const backrest_bottom_rail = new THREE.Mesh(new THREE.BoxGeometry(totalW - legW * 2, beamD, beamW), woodMat);
  backrest_bottom_rail.position.set(0, seatH + 0.1, -totalD / 2);
  root.add(backrest_bottom_rail);

  // Vertical spindles
  const spindleGeom = new THREE.BoxGeometry(0.035, 0.5, 0.035);
  const spindleCount = 9;
  const spindleSpacing = (totalW - legW * 2) / (spindleCount + 1);
  
  for (let i = 1; i <= spindleCount; i++) {
    const spindle = new THREE.Mesh(spindleGeom, woodMat);
    spindle.position.set(-totalW / 2 + legW + i * spindleSpacing, seatH + 0.35, -totalD / 2);
    root.add(spindle);
  }

  // --- Armrests ---
  const armrestGeom = new THREE.BoxGeometry(0.08, 0.08, totalD - legD);
  const left_armrest = new THREE.Mesh(armrestGeom, woodMat);
  left_armrest.position.set(-totalW / 2, seatH + 0.25, 0);
  root.add(left_armrest);

  const right_armrest = new THREE.Mesh(armrestGeom, woodMat);
  right_armrest.position.set(totalW / 2, seatH + 0.25, 0);
  root.add(right_armrest);

  // Armrest posts (vertical supports for arms)
  const arm_post_geom = new THREE.BoxGeometry(0.06, 0.25, 0.06);
  const front_left_arm_post = new THREE.Mesh(arm_post_geom, woodMat);
  front_left_arm_post.position.set(-totalW / 2 + legW/2 + 0.02, seatH + 0.125, totalD / 2 - 0.05);
  root.add(front_left_arm_post);
  
  const front_right_arm_post = new THREE.Mesh(arm_post_geom, woodMat);
  front_right_arm_post.position.set(totalW / 2 - legW/2 - 0.02, seatH + 0.125, totalD / 2 - 0.05);
  root.add(front_right_arm_post);

  // --- Cushions ---
  const cushionW = (totalW - legW * 2 - 0.1) / 2;
  const cushionD = totalD - 0.15;
  const cushionH = 0.22;
  const cushionGeom = new THREE.BoxGeometry(cushionW, cushionH, cushionD);

  // Seat Cushions
  const seat_cushion_left = new THREE.Mesh(cushionGeom, plaidMat);
  seat_cushion_left.position.set(-cushionW / 2 - 0.05, seatH + cushionH / 2 + 0.02, 0);
  root.add(seat_cushion_left);

  const seat_cushion_right = new THREE.Mesh(cushionGeom, plaidMat);
  seat_cushion_right.position.set(cushionW / 2 + 0.05, seatH + cushionH / 2 + 0.02, 0);
  root.add(seat_cushion_right);

  // Back Cushions
  const back_cushion_geom = new THREE.BoxGeometry(cushionW, 0.45, 0.15);
  const back_cushion_left = new THREE.Mesh(back_cushion_geom, plaidMat);
  back_cushion_left.position.set(-cushionW / 2 - 0.05, seatH + 0.45, -totalD / 2 + 0.15);
  root.add(back_cushion_left);

  const back_cushion_right = new THREE.Mesh(back_cushion_geom, plaidMat);
  back_cushion_right.position.set(cushionW / 2 + 0.05, seatH + 0.45, -totalD / 2 + 0.15);
  root.add(back_cushion_right);

  fitToUnitCube(THREE, root);
  return root;
}

function createPlaidTexture(THREE) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  
  // Plaid Colors
  const base = [30, 60, 90];    // Dark Blue
  const red = [140, 20, 20];    // Dark Red
  const green = [40, 100, 40];  // Forest Green
  const white = [240, 240, 230];// Cream
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = base[0], g = base[1], b = base[2];
      
      // Define bands
      const isRedX = (x % 64) < 8 || (x % 64) > 56;
      const isRedY = (y % 64) < 8 || (y % 64) > 56;
      const isGreenX = (x % 32) >= 8 && (x % 32) < 12;
      const isGreenY = (y % 32) >= 8 && (y % 32) < 12;
      const isWhiteX = (x % 128) === 64;
      const isWhiteY = (y % 128) === 64;

      if (isRedX || isRedY) {
        if (isRedX && isRedY) { r=red[0]; g=red[1]; b=red[2]; } // Intersection darker
        else { r=red[0]; g=red[1]; b=red[2]; }
      } else if (isGreenX || isGreenY) {
         r=green[0]; g=green[1]; b=green[2];
      } else if (isWhiteX || isWhiteY) {
         r=white[0]; g=white[1]; b=white[2];
      }

      const i = (x + y * size) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
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