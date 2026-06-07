export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Tan fur material (main body)
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Lighter cream material (snout, paw pads)
  const snoutMat = new THREE.MeshStandardMaterial({
    color: 0xf5deb3,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Dark brown nose
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Black shiny eyes
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.2,
  });

  // --- Dimensions ---
  const headR = 0.24;
  const bodyR = 0.26;
  const snoutR = 0.11;
  const earR = 0.07;
  const limbR = 0.075;
  const limbLen = 0.22;

  // --- Body ---
  // Pear-shaped body using a scaled sphere
  const bodyGeom = new THREE.SphereGeometry(bodyR, 32, 32);
  const body = new THREE.Mesh(bodyGeom, furMat);
  body.scale.set(1.1, 1.2, 1.0);
  body.position.y = -0.15;
  root.add(body);

  // --- Head ---
  const headGeom = new THREE.SphereGeometry(headR, 32, 32);
  const head = new THREE.Mesh(headGeom, furMat);
  head.position.set(0, 0.25, 0.05);
  // Tilt head slightly forward
  head.rotation.x = 0.1;
  root.add(head);

  // --- Snout ---
  const snoutGeom = new THREE.SphereGeometry(snoutR, 32, 32);
  const snout = new THREE.Mesh(snoutGeom, snoutMat);
  snout.position.set(0.08, 0.22, 0.20);
  snout.scale.set(1.0, 0.9, 1.2);
  root.add(snout);

  // --- Nose ---
  const noseGeom = new THREE.SphereGeometry(0.045, 16, 16);
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.set(0.10, 0.25, 0.29);
  root.add(nose);

  // --- Eyes ---
  const eyeGeom = new THREE.SphereGeometry(0.025, 16, 16);
  
  const eyeLeft = new THREE.Mesh(eyeGeom, eyeMat);
  eyeLeft.position.set(0.15, 0.32, 0.18);
  root.add(eyeLeft);

  const eyeRight = new THREE.Mesh(eyeGeom, eyeMat);
  eyeRight.position.set(0.02, 0.32, 0.15);
  root.add(eyeRight);

  // --- Ears ---
  const earGeom = new THREE.SphereGeometry(earR, 32, 32);
  
  const earLeft = new THREE.Mesh(earGeom, furMat);
  earLeft.position.set(0.20, 0.42, 0.05);
  earLeft.scale.set(1.0, 1.0, 0.6);
  root.add(earLeft);

  const earRight = new THREE.Mesh(earGeom, furMat);
  earRight.position.set(-0.15, 0.42, -0.05);
  earRight.scale.set(1.0, 1.0, 0.6);
  root.add(earRight);

  // --- Arms ---
  const armGeom = new THREE.CapsuleGeometry(limbR, limbLen, 8, 16);
  
  // Right Arm (foreground, resting on leg)
  const armRight = new THREE.Mesh(armGeom, furMat);
  armRight.position.set(0.12, 0.05, 0.18);
  armRight.rotation.z = -Math.PI / 3.5;
  armRight.rotation.x = -Math.PI / 6;
  root.add(armRight);

  // Left Arm (background, slightly behind)
  const armLeft = new THREE.Mesh(armGeom, furMat);
  armLeft.position.set(-0.15, 0.05, -0.10);
  armLeft.rotation.z = Math.PI / 4;
  armLeft.rotation.x = -Math.PI / 8;
  root.add(armLeft);

  // --- Legs ---
  const legGeom = new THREE.SphereGeometry(limbR + 0.03, 32, 32);
  
  // Right Leg (foreground)
  const legRight = new THREE.Mesh(legGeom, furMat);
  legRight.position.set(0.15, -0.25, 0.20);
  legRight.scale.set(1.0, 0.9, 1.3);
  root.add(legRight);

  // Left Leg (side)
  const legLeft = new THREE.Mesh(legGeom, furMat);
  legLeft.position.set(-0.18, -0.25, 0.05);
  legLeft.scale.set(1.0, 0.9, 1.2);
  root.add(legLeft);

  // --- Paw Pads ---
  const padGeom = new THREE.CircleGeometry(0.06, 32);
  
  const padRight = new THREE.Mesh(padGeom, snoutMat);
  padRight.position.set(0.15, -0.33, 0.32);
  padRight.rotation.x = Math.PI / 2.5;
  padRight.rotation.y = -0.2;
  root.add(padRight);

  const padLeft = new THREE.Mesh(padGeom, snoutMat);
  padLeft.position.set(-0.22, -0.33, 0.15);
  padLeft.rotation.x = Math.PI / 2.5;
  padLeft.rotation.y = 0.3;
  root.add(padLeft);

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