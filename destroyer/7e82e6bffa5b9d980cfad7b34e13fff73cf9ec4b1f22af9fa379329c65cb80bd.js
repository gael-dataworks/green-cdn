export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Main fur: warm golden tan, high roughness for soft fabric look
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xc49a6c,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Snout and foot pads: lighter cream color
  const snoutMat = new THREE.MeshStandardMaterial({
    color: 0xe8dcc8,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Nose: dark chocolate brown, slightly smoother
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0x4a3020,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Eyes: shiny black beads
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.1,
  });

  // --- Dimensions ---
  const bodyRadius = 0.22;
  const headRadius = 0.18;
  const snoutRadius = 0.07;
  const earRadius = 0.06;
  const limbRadius = 0.065;
  const limbLength = 0.16;
  const footPadRadius = 0.07;

  // --- Body ---
  // Pear-shaped body: sphere scaled Y and slightly Z
  const bodyGeom = new THREE.SphereGeometry(bodyRadius, 32, 32);
  const body = new THREE.Mesh(bodyGeom, furMat);
  body.scale.set(1.0, 1.1, 0.9);
  body.position.y = -0.05;
  root.add(body);

  // --- Head Group ---
  const headGroup = new THREE.Group();
  headGroup.position.y = bodyRadius * 0.8; // Sit on top of body
  root.add(headGroup);

  const headGeom = new THREE.SphereGeometry(headRadius, 32, 32);
  const head = new THREE.Mesh(headGeom, furMat);
  // Slightly flatten head vertically for plush look
  head.scale.set(1.0, 0.9, 0.95);
  headGroup.add(head);

  // --- Ears ---
  const earGeom = new THREE.SphereGeometry(earRadius, 24, 24);
  
  const leftEar = new THREE.Mesh(earGeom, furMat);
  leftEar.position.set(-headRadius * 0.6, headRadius * 0.6, -headRadius * 0.4);
  leftEar.scale.set(1.0, 0.8, 0.4); // Flattened disc shape
  leftEar.rotation.z = -Math.PI / 6;
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, furMat);
  rightEar.position.set(headRadius * 0.6, headRadius * 0.6, -headRadius * 0.4);
  rightEar.scale.set(1.0, 0.8, 0.4);
  rightEar.rotation.z = Math.PI / 6;
  headGroup.add(rightEar);

  // --- Snout ---
  const snoutGeom = new THREE.SphereGeometry(snoutRadius, 24, 24);
  const snout = new THREE.Mesh(snoutGeom, snoutMat);
  snout.position.set(0, -headRadius * 0.2, headRadius * 0.85);
  snout.scale.set(1.1, 0.9, 0.8);
  headGroup.add(snout);

  // --- Nose ---
  const noseGeom = new THREE.SphereGeometry(snoutRadius * 0.5, 16, 16);
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(0, snoutRadius * 0.4, snoutRadius * 0.9);
  nose.scale.set(1.2, 0.8, 0.8); // Triangular-ish shape
  headGroup.add(nose);

  // --- Eyes ---
  const eyeGeom = new THREE.SphereGeometry(0.025, 16, 16);
  
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(-headRadius * 0.4, headRadius * 0.1, headRadius * 0.75);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(headRadius * 0.4, headRadius * 0.1, headRadius * 0.75);
  headGroup.add(rightEye);

  // --- Arms ---
  const armGeom = new THREE.CapsuleGeometry(limbRadius, limbLength, 8, 16);
  
  const leftArm = new THREE.Mesh(armGeom, furMat);
  leftArm.position.set(-(bodyRadius * 0.6), bodyRadius * 0.4, 0);
  leftArm.rotation.z = Math.PI / 8;
  leftArm.rotation.x = -Math.PI / 8;
  root.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, furMat);
  rightArm.position.set(bodyRadius * 0.6, bodyRadius * 0.4, 0);
  rightArm.rotation.z = -Math.PI / 8;
  rightArm.rotation.x = -Math.PI / 8;
  root.add(rightArm);

  // --- Legs ---
  const legGeom = new THREE.CapsuleGeometry(limbRadius * 1.2, limbLength * 0.9, 8, 16);
  
  const leftLeg = new THREE.Mesh(legGeom, furMat);
  leftLeg.position.set(-(bodyRadius * 0.5), -bodyRadius * 0.6, bodyRadius * 0.4);
  leftLeg.rotation.x = Math.PI / 3; // Splayed forward
  leftLeg.rotation.z = Math.PI / 6;
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeom, furMat);
  rightLeg.position.set(bodyRadius * 0.5, -bodyRadius * 0.6, bodyRadius * 0.4);
  rightLeg.rotation.x = Math.PI / 3;
  rightLeg.rotation.z = -Math.PI / 6;
  root.add(rightLeg);

  // --- Foot Pads ---
  const padGeom = new THREE.SphereGeometry(footPadRadius, 24, 24);
  
  const leftPad = new THREE.Mesh(padGeom, snoutMat);
  leftPad.position.copy(leftLeg.position);
  leftPad.position.y -= limbRadius; // Move to bottom of leg
  leftPad.position.z += limbLength * 0.4; // Move forward
  leftPad.scale.set(1.2, 0.4, 1.2); // Flattened oval
  root.add(leftPad);

  const rightPad = new THREE.Mesh(padGeom, snoutMat);
  rightPad.position.copy(rightLeg.position);
  rightPad.position.y -= limbRadius;
  rightPad.position.z += limbLength * 0.4;
  rightPad.scale.set(1.2, 0.4, 1.2);
  root.add(rightPad);

  // --- Tail (small puff at back) ---
  const tailGeom = new THREE.SphereGeometry(0.05, 16, 16);
  const tail = new THREE.Mesh(tailGeom, furMat);
  tail.position.set(0, -bodyRadius * 0.2, -bodyRadius * 0.85);
  root.add(tail);

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