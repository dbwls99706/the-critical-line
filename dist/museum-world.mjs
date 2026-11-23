import * as THREE from './vendor/three.module.min.js';
import { createSculpture } from './museum-sculpture.mjs';
import { createExhibits } from './museum-exhibits.mjs';
import { createHands, punchContact, punchLength } from './museum-hands.mjs';
import { createCanvasRenderer } from './museum-canvas.mjs';

import { drawZeroAtlas } from './zero-atlas.mjs';
import { building, columnRows, columnX, hall, portals, proofOrder, spine, stations } from './gallery-layout.mjs';

const borders = {left: building.left + .8, right: building.right - .8, front: building.entrance - .8, back: building.back + .8};
const aisleLength = building.entrance - building.back;
const aisleMid = (building.entrance + building.back) / 2;
const bellPosition = [2.85, 5.35];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const unitCube = new THREE.BoxGeometry(1, 1, 1);
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const up = new THREE.Vector3(0, 1, 0);
const clock = () => performance.now() / 1000;

function solid(parent, material, size, position) {
  const mesh = new THREE.Mesh(unitCube, material);
  mesh.scale.set(...size);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function finish(parent, geometry, material, x, y, z, rotation = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.x = rotation;
  parent.add(mesh);
  return mesh;
}

function randomGenerator(seed = 0x785435) {
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function mineralTexture(repeatX, repeatY) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  const image = context.createImageData(256, 256);
  const random = randomGenerator();
  for (let i = 0; i < image.data.length; i += 4) {
    const x = (i / 4) % 256;
    const y = Math.floor(i / 1024);
    const strata = Math.sin(x / 41 + Math.sin(y / 18) + y / 27) * 3;
    const light = 203 + 13 * (random() - .5) + strata;
    image.data[i] = light;
    image.data[i + 1] = light - 3;
    image.data[i + 2] = light - 6;
    image.data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 2;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function haloTexture() {
  const sheet = document.createElement('canvas');
  sheet.width = sheet.height = 128;
  const context = sheet.getContext('2d');
  const radial = context.createRadialGradient(64, 64, 1, 64, 64, 64);
  radial.addColorStop(0, '#ffffffd8');
  radial.addColorStop(.25, '#ffffff85');
  radial.addColorStop(.55, '#ffffff2a');
  radial.addColorStop(1, '#ffffff00');
  context.fillStyle = radial;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(sheet);
}

function artworkSign(parent, title, label, position, ink) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 192;
  const context = canvas.getContext('2d');
  context.fillStyle = '#1a1717';
  context.fillRect(0, 0, 768, 192);
  context.strokeStyle = '#b9a68960';
  context.lineWidth = 2;
  context.strokeRect(5, 5, 758, 182);
  context.fillStyle = ink;
  context.textAlign = 'center';
  context.font = '23px monospace';
  context.fillText(label, 384, 59);
  context.fillStyle = '#f9eed5';
  context.font = '400 64px "Times New Roman", Georgia, serif';
  context.fillText(title, 384, 127, 690);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = finish(parent, new THREE.PlaneGeometry(2.55, .64),
    new THREE.MeshBasicMaterial({map: texture}), ...position);
  sign.userData.paintedPlane = true;
  return sign;
}

function spotHalo(parent, texture, color, x, y, z, width, depth, alpha) {
  const material = new THREE.MeshBasicMaterial({
    color, map: texture, transparent: true, opacity: alpha, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false,
  });
  return finish(parent, new THREE.PlaneGeometry(width, depth), material, x, y, z, -Math.PI / 2);
}

function makeRoom(scene) {
  const marble = mineralTexture(2, 2);
  const wall = new THREE.MeshStandardMaterial({color: 0x504b4c, map: marble, roughness: .82});
  const panel = new THREE.MeshStandardMaterial({color: 0x77706a, map: marble, roughness: .68});
  const dark = new THREE.MeshStandardMaterial({color: 0x1d1b22, map: marble, roughness: .72});
  const bronze = new THREE.MeshStandardMaterial({color: 0x837052, metalness: .4, roughness: .39});
  const limestone = new THREE.MeshStandardMaterial({color: 0x4b4040, map: mineralTexture(13, 29), roughness: .59});
  const goldenStrip = new THREE.MeshBasicMaterial({color: 0xeec88d, toneMapped: false});
  const softGold = new THREE.MeshBasicMaterial({color: 0x785738});
  const halo = haloTexture();

  solid(scene, limestone, [26, .28, aisleLength + .6], [0, -.14, aisleMid]);
  solid(scene, wall, [25.8, 8.8, .55], [0, 4.4, building.back]);
  solid(scene, wall, [25.8, 8.8, .55], [0, 4.4, building.entrance]);
  solid(scene, wall, [.55, 8.8, aisleLength], [building.left, 4.4, aisleMid]);
  solid(scene, wall, [.55, 8.8, aisleLength], [building.right, 4.4, aisleMid]);
  solid(scene, dark, [25.8, .4, aisleLength], [0, 8.4, aisleMid]);
  for (const side of [-1, 1]) {
    solid(scene, panel, [.27, .4, aisleLength - .55], [side * 12.47, .23, aisleMid]);
    solid(scene, bronze, [.11, .04, aisleLength - .8], [side * 3.1, .008, aisleMid]);
    solid(scene, dark, [3.6, .25, aisleLength - .8], [side * 8.15, 7.9, aisleMid]);
    solid(scene, softGold, [.046, .037, aisleLength - .8], [side * (columnX + .05), 7.67, aisleMid]);
    for (const z of columnRows) {
      solid(scene, panel, [.7, 7.9, .76], [side * columnX, 3.95, z]);
      solid(scene, dark, [1.05, .25, 1.06], [side * columnX, .13, z]);
      solid(scene, bronze, [.77, .12, .83], [side * columnX, 6.9, z]);
      solid(scene, goldenStrip, [.022, 4.9, .025], [side * columnX - side * .355, 4.1, z + .385]);
      if (side === -1 && z === .55) continue;
      solid(scene, panel, [.15, 6.9, 3.95], [side * 12.55, 3.62, z - 1.2]);
      solid(scene, bronze, [.023, 6.8, 3.98], [side * 12.46, 3.65, z - 1.2]);
      solid(scene, goldenStrip, [.023, .022, 1.20], [side * 12.42, .51, z - 1.2]);
    }
  }

  const atlasCanvas = document.createElement('canvas');
  drawZeroAtlas(atlasCanvas, {width: 752, height: 840, framed: true});
  const atlasTexture = new THREE.CanvasTexture(atlasCanvas);
  atlasTexture.colorSpace = THREE.SRGBColorSpace;
  solid(scene, bronze, [.07, 4.66, 4.21], [-12.47, 2.92, -.65]);
  const atlas = finish(scene, new THREE.PlaneGeometry(4.05, 4.52),
    new THREE.MeshBasicMaterial({map: atlasTexture, toneMapped: false}), -12.36, 2.92, -.65);
  atlas.rotation.y = Math.PI / 2;
  atlas.userData.paintedPlane = true;

  const trail = new THREE.MeshBasicMaterial({color: 0xd8a76d, transparent: true, opacity: .48});
  const segments = new Set();
  for (let segment = 1; segment < spine.length; segment++) {
    const [x0, z0] = spine[segment - 1];
    const [x1, z1] = spine[segment];
    const key = [spine[segment - 1].join(','), spine[segment].join(',')].sort().join('|');
    if (segments.has(key)) continue;
    segments.add(key);
    const steps = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / .68);
    for (let i = 0; i < steps; i++) {
      const t = (i + .5) / steps;
      solid(scene, trail, [x0 === x1 ? .037 : .24, .018, z0 === z1 ? .037 : .24],
        [THREE.MathUtils.lerp(x0, x1, t), .016, THREE.MathUtils.lerp(z0, z1, t)]);
    }
  }

  const floorSeams = [];
  for (let x = -12; x <= 12; x += 2) floorSeams.push(x, .008, building.back + .3, x, .008, building.entrance - .3);
  for (let z = -54; z < 11; z += 2) floorSeams.push(-12.5, .008, z, 12.5, .008, z);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(floorSeams, 3));
  scene.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({color: 0x645048, transparent: true, opacity: .48})));

  for (const z of columnRows) {
    solid(scene, dark, [11.3, .6, .53], [0, 7.8, z]);
    solid(scene, bronze, [11.17, .12, .61], [0, 7.46, z]);
    solid(scene, goldenStrip, [6.1, .026, .053], [0, 7.39, z]);
  }
  solid(scene, dark, [4.3, .24, aisleLength - 1.7], [0, 8.1, aisleMid]);
  solid(scene, softGold, [2.84, .025, aisleLength - 2.25], [0, 7.966, aisleMid]);
  for (const x of [-1.43, 1.43]) {
    solid(scene, goldenStrip, [.055, .035, aisleLength - 2.1], [x, 7.952, aisleMid]);
  }

  solid(scene, dark, [7.6, .23, 6.25], [0, .11, -4.15]);
  solid(scene, bronze, [7.75, .046, 6.34], [0, .235, -4.15]);
  solid(scene, dark, [7.42, .031, 6.06], [0, .265, -4.15]);
  finish(scene, new THREE.CylinderGeometry(1.48, 1.82, .33, 64), bronze, 0, .43, -4);
  finish(scene, new THREE.CylinderGeometry(1.43, 1.47, .22, 64), dark, 0, .64, -4);
  finish(scene, new THREE.RingGeometry(1.37, 1.40, 80), goldenStrip, 0, .753, -4, -Math.PI / 2);
  finish(scene, new THREE.RingGeometry(2.59, 2.61, 80), softGold, 0, .282, -4, -Math.PI / 2);
  spotHalo(scene, halo, 0xffad63, 0, .292, -3.7, 8, 7, .46);
  spotHalo(scene, halo, 0xffc28d, 0, .017, 2.15, 8.4, 10.3, .14);

  stations.forEach((station, index) => {
    const {aimX: x, aimZ: z, color, name} = station;
    const bright = new THREE.MeshBasicMaterial({color, toneMapped: false});
    const bayWidth = station.width ?? 5.2;
    const wallZ = station.wallZ;
    solid(scene, dark, [bayWidth, 5.85, .35], [x, 3.14, wallZ]);
    solid(scene, panel, [bayWidth + .32, .26, .7], [x, .15, wallZ]);
    solid(scene, panel, [bayWidth + .32, .36, .64], [x, 6.12, wallZ]);
    solid(scene, panel, [.23, 5.9, .64], [x - bayWidth / 2, 3.14, wallZ]);
    solid(scene, panel, [.23, 5.9, .64], [x + bayWidth / 2, 3.14, wallZ]);
    solid(scene, bright, [.026, 4.95, .046], [x - bayWidth / 2 + .25, 3.14, wallZ + .25]);
    solid(scene, bright, [.026, 4.95, .046], [x + bayWidth / 2 - .25, 3.14, wallZ + .25]);
    solid(scene, bright, [bayWidth - .5, .024, .054], [x, 5.62, wallZ + .25]);
    for (let i = -4; i <= 4; i++) {
      solid(scene, bronze, [.018, 5.3, .04], [x + i * .48, 3.02, wallZ + .21]);
    }
    solid(scene, dark, [4.55, .22, 4.9], [x, .1, z]);
    finish(scene, new THREE.CylinderGeometry(1.52, 1.64, .49, 64), bronze, x, .39, z);
    finish(scene, new THREE.CylinderGeometry(1.50, 1.51, .17, 64), dark, x, .71, z);
    finish(scene, new THREE.RingGeometry(1.37, 1.4, 72), bright, x, .8, z, -Math.PI / 2);
    spotHalo(scene, halo, color, x, .222, z + .5, 4.55, 4.85, .31);
    spotHalo(scene, halo, color, x, .015, z + 4.5, 3.8, 5.4, .18);
    artworkSign(scene, name, String(proofOrder.indexOf(index) + 1).padStart(2, '0'), [x, 4.98, wallZ + .29],
      '#' + new THREE.Color(color).getHexString());
    const light = new THREE.PointLight(color, 29, 9, 2);
    light.position.set(x, 3.1, z + 1.3);
    scene.add(light);
  });

  const galleryNames = [
    [portals[0], 'Arithmetic Wing', 'LOCAL DATA / GLOBAL BOUNDS'],
    [portals[1], 'The Analytic Wing', 'THE ZERO-FREE HALF / SYMMETRY'],
  ];
  for (const [z, name, theme] of galleryNames) {
    solid(scene, dark, [10.8, .64, .54], [0, 6.52, z]);
    solid(scene, bronze, [10.9, .028, .62], [0, 6.19, z]);
    for (const side of [-1, 1]) {
      solid(scene, bronze, [.36, 6.2, .54], [side * 4.45, 3.1, z]);
      solid(scene, goldenStrip, [.028, 4.6, .032], [side * 4.45, 3.85, z + .3]);
    }
    const plaque = artworkSign(scene, name, theme, [0, 6.53, z + .29], '#efc690');
    plaque.scale.setScalar(1.65);
  }
  const belltower = new THREE.Group();
  const [bx, bz] = bellPosition;
  belltower.position.set(bx, 1.65, bz);
  finish(scene, new THREE.CylinderGeometry(.41, .57, .22, 24), bronze, bx, .12, bz);
  finish(scene, new THREE.CylinderGeometry(.105, .13, 2.63, 12), bronze, bx, 1.42, bz - .4);
  finish(belltower, new THREE.CylinderGeometry(.135, .32, .36, 32), bronze, 0, .04, 0);
  finish(belltower, new THREE.RingGeometry(.23, .315, 36), goldenStrip, 0, -.13, 0, -Math.PI / 2);
  const bellGlow = spotHalo(scene, halo, 0xffcb82, bx, .02, bz, 2.2, 2.2, .15);

  const centerLight = new THREE.PointLight(0xffb879, 70, 14, 2);
  centerLight.position.set(.9, 4.8, -3.75);
  scene.add(centerLight);
  const entranceLight = new THREE.PointLight(0xffdec4, 58, 20, 2);
  entranceLight.position.set(-3.3, 5, 5.65);
  scene.add(entranceLight);
  const overhead = new THREE.DirectionalLight(0xddc09e, 1.08);
  overhead.position.set(-4, 12, 5);
  scene.add(overhead, new THREE.HemisphereLight(0xf9e4d5, 0x675a77, 1.58));
  return {centerLight, belltower, bellGlow};
}

function makeDust(scene, texture, count) {
  const random = randomGenerator(552144);
  const coordinates = [];
  for (let i = 0; i < count; i++) {
    coordinates.push((random() - .5) * 23, .4 + random() * 6.7, 9 - random() * 34);
  }
  const points = new THREE.BufferGeometry();
  points.setAttribute('position', new THREE.Float32BufferAttribute(coordinates, 3));
  const material = new THREE.PointsMaterial({
    map: texture, color: 0xe8b46d, size: .10, sizeAttenuation: true, opacity: .52,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(points, material);
  scene.add(dust);
  return dust;
}

function finaleArt(scene, texture) {
  const group = new THREE.Group();
  group.position.set(0, .74, -4);
  group.visible = false;
  const lay = [0x8bdfef, 0xf7a1a7, 0xffd585].map((color, slot) => {
    const material = new THREE.SpriteMaterial({
      map: texture, color, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, opacity: 0,
    });
    const node = new THREE.Sprite(material);
    node.scale.setScalar(1.2);
    group.add(node);
    return {node, slot};
  });
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(.035, .02, 6.6, 28),
    new THREE.MeshBasicMaterial({
      color: 0xffe2ab, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false,
    }),
  );
  beam.position.y = 3.3;
  group.add(beam);
  scene.add(group);
  return {group, beam, lay};
}

export function createWorld(canvas, viewmodel, onFrame, onPick, onBell, reducedMotion) {
  const settings = {alpha: false, antialias: true, powerPreference: 'high-performance'};
  const webgl = canvas.getContext('webgl2', settings);
  const renderer = webgl ? new THREE.WebGLRenderer({canvas, context: webgl, ...settings}) :
    createCanvasRenderer(THREE, canvas);
  canvas.dataset.renderer = webgl ? 'webgl' : 'canvas';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.55));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x211a20);
  scene.fog = new THREE.FogExp2(0x21191f, .023);
  const camera = new THREE.PerspectiveCamera(57, 1, .09, 95);
  camera.rotation.order = 'YXZ';
  const art = createSculpture(THREE);
  art.root.position.set(0, 2.87, -4);
  scene.add(art.root);
  const exhibits = createExhibits(THREE);
  exhibits.forEach(({root}, i) => {
    root.position.set(stations[i].aimX, 2.51, stations[i].aimZ);
    scene.add(root);
  });
  const interactionPlanes = exhibits.map(({root}, index) => {
    const collider = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.4, 3), new THREE.MeshBasicMaterial({visible:false}));
    collider.userData.room = index;
    collider.position.copy(root.position);
    scene.add(collider);
    return collider;
  });
  const architecture = new THREE.Group();
  const {centerLight, belltower, bellGlow} = makeRoom(architecture);
  scene.userData.architecture = architecture;
  scene.add(architecture, belltower);
  const haze = haloTexture();
  const dust = makeDust(scene, haze, 640);
  const finale = finaleArt(scene, haze);
  const ray = new THREE.Raycaster();
  const focusTarget = new THREE.Vector3();
  const aim = new THREE.Vector3();
  const bellVector = new THREE.Vector3();
  const hand = createHands(viewmodel, reducedMotion);
  const focusPoint = new THREE.Vector2();
  const lookTarget = new THREE.Vector2();
  const desired = new THREE.Vector3();
  const keys = new Set();
  const pointer = new THREE.Vector2();
  const exhibitPlane = new THREE.Plane();
  const projected = new THREE.Vector3();
  const columns = columnRows.flatMap((z) => [-columnX, columnX].map((x) => [x, z, .77]));
  const posts = portals.flatMap((z) => [-4.45, 4.45].map((x) => [x, z, .58]));
  const blocked = [...columns, ...posts, [0, -4, 2.05], [...bellPosition, .63],
    ...stations.map((point) => [point.aimX, point.aimZ, 1.85])];
  let states = [];
  let playing = false;
  let suspended = false;
  let dragging;
  let travel;
  let finalAt = null;
  let last = clock();
  let initialAspect;
  let yaw = 0;
  let pitch = 0;
  let walkPulse = 0;
  let hoveredRoom = null;
  let targetYaw = 0;
  let targetPitch = 0;
  let suppressClick = false;
  let jumpHeight = 0;
  let jumpVelocity = 0;
  let hitAt = -Infinity;
  let swing = null;
  let swingSide = -1;
  let returnView = null;
  let inspection = null;
  let transition = null;
  let offsetX = 0;
  let offsetY = 0;
  let waypoint = null;
  const beaconGeometry = new THREE.RingGeometry(.58, .62, 44);
  const beacon = finish(scene, beaconGeometry, new THREE.MeshBasicMaterial({
    color: 0xffd292, transparent: true, opacity: .85, toneMapped: false, depthWrite: false,
  }), 0, .04, 0, -Math.PI / 2);
  beacon.visible = false;

  function place(room, eyeHeight = 2.03) {
    camera.position.set(room.x, eyeHeight, room.z);
    focusTarget.set(room.aimX, room.lookY ?? 2.44, room.aimZ);
    camera.lookAt(focusTarget);
    targetYaw = yaw = camera.rotation.y;
    targetPitch = pitch = camera.rotation.x;
    travel = null;
    walkPulse = 0;
    jumpHeight = jumpVelocity = 0;
  }

  function stageIntro(aspect) {
    if (aspect > 1) place({x:-5.35, z:7.15, aimX:-4.1, aimZ:-9, lookY:3.25}, 2.07);
    else place({x:0, z:8.3, aimX:0, aimZ:-4.4, lookY:.05}, 2.15);
  }

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < height ? 68 : 57;
    projectInspection(offsetX, offsetY);
    if (!playing && initialAspect !== camera.aspect) stageIntro(camera.aspect);
    initialAspect = camera.aspect;
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  function projectInspection(x, y) {
    offsetX = x;
    offsetY = y;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    if (x || y) camera.setViewOffset(width, height, width * x, height * y, width, height);
    else camera.clearViewOffset();
  }

  function pose() {
    const {x, y, z} = camera.position;
    return {x, y, z, yaw, pitch, offsetX, offsetY};
  }

  function easeTo(end, seconds = .47) {
    const from = pose();
    transition = {from, end, time: clock(), seconds: reducedMotion ? 0 : seconds};
  }

  function inspectionPose(view) {
    const narrow = canvas.clientWidth <= 700;
    const distance = (narrow ? 6.8 : 5.45) - Math.abs(view.angle) * .95;
    const {aimX: x, aimZ: z} = view.station;
    return {x: x + Math.sin(view.angle) * distance, y: 2.51 + Math.sin(view.elevation) * distance,
      z: z + Math.cos(view.angle) * distance, yaw: view.angle, pitch: -view.elevation,
      offsetX: narrow ? 0 : Math.min(.255, 254 / Math.max(1, canvas.clientWidth)), offsetY: narrow ? .188 : .015};
  }

  function steerInspection(delta, elevation = 0) {
    if (!inspection) return;
    inspection.angle = clamp(inspection.angle + delta, -.70, .70);
    inspection.elevation = clamp(inspection.elevation + elevation, -.17, .26);
  }

  function updateView(time) {
    if (transition) {
      const {from, end, seconds} = transition;
      const progress = seconds ? clamp((time - transition.time) / seconds, 0, 1) : 1;
      const t = progress * progress * (3 - 2 * progress);
      const destination = inspection ? inspectionPose(inspection) : end;
      camera.position.set(THREE.MathUtils.lerp(from.x,destination.x,t), THREE.MathUtils.lerp(from.y,destination.y,t),
        THREE.MathUtils.lerp(from.z,destination.z,t));
      yaw = from.yaw + Math.atan2(Math.sin(destination.yaw - from.yaw), Math.cos(destination.yaw - from.yaw)) * t;
      pitch = THREE.MathUtils.lerp(from.pitch,destination.pitch,t);
      projectInspection(THREE.MathUtils.lerp(from.offsetX,destination.offsetX,t), THREE.MathUtils.lerp(from.offsetY,destination.offsetY,t));
      if (progress === 1) {
        targetYaw = yaw = destination.yaw;
        targetPitch = pitch = destination.pitch;
        transition = null;
      }
      return;
    }
    if (inspection) {
      const next = inspectionPose(inspection);
      camera.position.set(next.x, next.y, next.z);
      yaw = next.yaw;
      pitch = next.pitch;
      if (offsetX !== next.offsetX || offsetY !== next.offsetY) projectInspection(next.offsetX, next.offsetY);
    }
  }

  function allowed(x, z) {
    if (x < borders.left || x > borders.right || z < borders.back || z > borders.front) return false;
    if (stations.some((station) => Math.abs(z - station.wallZ) < .67 &&
      Math.abs(x - station.aimX) < (station.width ?? 5.2) / 2 + .36)) return false;
    return blocked.every(([obstacleX, obstacleZ, radius]) => Math.hypot(x - obstacleX,z - obstacleZ) > radius);
  }

  function move(x, z) {
    const {position} = camera;
    const count = Math.max(1, Math.ceil(Math.hypot(x, z) / .26));
    const dx = x / count;
    const dz = z / count;
    for (let step = 0; step < count; step++) {
      if (allowed(position.x + dx, position.z)) position.x += dx;
      if (allowed(position.x, position.z + dz)) position.z += dz;
    }
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (!playing || (suspended && !inspection) || event.button > 0) return;
    canvas.setPointerCapture(event.pointerId);
    dragging = {x: event.clientX, y: event.clientY, originX: event.clientX, originY: event.clientY};
    suppressClick = false;
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging || !playing || (suspended && !inspection)) return;
    const dx = event.clientX - dragging.x;
    const dy = event.clientY - dragging.y;
    if (Math.hypot(event.clientX - dragging.originX, event.clientY - dragging.originY) > 5) suppressClick = true;
    if (suppressClick) {
      if (inspection) steerInspection(-dx * .004, dy * .0028);
      else {
        targetYaw -= dx * .0034;
        targetPitch = clamp(targetPitch - dy * .0034, -1.05, 1.03);
        travel = null;
      }
    }
    dragging.x = event.clientX;
    dragging.y = event.clientY;
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!dragging) return;
    dragging = null;
    if (suppressClick || suspended) return;
    const area = canvas.getBoundingClientRect();
    pointer.set((event.clientX - area.left) / area.width * 2 - 1, -(event.clientY - area.top) / area.height * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const exhibit = ray.intersectObjects(interactionPlanes, false)[0];
    if (exhibit?.object.userData.room === hoveredRoom) {
      travel = null;
      onPick(exhibit.object.userData.room);
      return;
    }
    const point = ray.ray.intersectPlane(ground, focusTarget);
    if (point && camera.position.distanceTo(point) < 21 && allowed(point.x, point.z)) {
      travel = new THREE.Vector2(point.x, point.z);
    }
  });
  canvas.addEventListener('pointercancel', () => { dragging = null; });

  function step(dt) {
    if (!playing || suspended || transition) return;
    const steer = Number(keys.has('ArrowLeft')) - Number(keys.has('ArrowRight'));
    if (steer) {
      targetYaw += steer * dt * 1.5;
    }
    const front = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
    const side = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 8.3 : 5.15;
    let moving = false;
    if (front || side) {
      travel = null;
      moving = true;
      desired.set(side, 0, -front).normalize().applyAxisAngle(up, yaw).multiplyScalar(speed * dt);
      move(desired.x, desired.z);
    } else if (travel) {
      focusPoint.copy(travel).sub(lookTarget.set(camera.position.x, camera.position.z));
      if (focusPoint.length() < .3) {
        travel = null;
      } else {
        const x = camera.position.x;
        const z = camera.position.z;
        focusPoint.normalize().multiplyScalar(dt * 5.5);
        move(focusPoint.x, focusPoint.y);
        moving = camera.position.x !== x || camera.position.z !== z;
        if (!moving) travel = null;
      }
    }
    if (jumpHeight > 0 || jumpVelocity > 0) {
      jumpVelocity -= dt * 19;
      jumpHeight = Math.max(0, jumpHeight + dt * jumpVelocity);
      if (!jumpHeight) jumpVelocity = 0;
    }
    walkPulse = moving ? walkPulse + dt * 10 : 0;
    const bob = reducedMotion || jumpHeight ? 0 : moving ? Math.sin(walkPulse) * .027 : 0;
    camera.position.y = 2.03 + bob + jumpHeight;
  }

  function draw(nowMs) {
    const time = nowMs / 1000;
    const dt = Math.min(.13, Math.max(0, time - last));
    last = time;
    step(dt);
    if (transition || inspection) updateView(time);
    else {
      const rotationSpeed = reducedMotion ? 1 : Math.min(1, dt * 12);
      yaw = THREE.MathUtils.lerp(yaw, targetYaw, rotationSpeed);
      pitch = THREE.MathUtils.lerp(pitch, targetPitch, rotationSpeed);
    }
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
    if (playing) {
      const {x, z} = returnView ?? transition?.end ?? camera.position;
      hoveredRoom = stations.findIndex(({aimX, aimZ}) => z >= aimZ + .8 && Math.hypot(x - aimX, z - aimZ) < 5.7);
      onFrame(x, z, hoveredRoom, returnView?.yaw ?? yaw);
    }

    const t = reducedMotion ? 11 : time;
    const finishTime = finalAt === null ? 0 : reducedMotion ? 20 : time - finalAt;
    let power = 0;
    if (finishTime > 0) {
      finale.group.visible = true;
      power = clamp((finishTime - 1.9) / 2.2, 0, 1);
      finale.beam.material.opacity = power * .88;
      finale.lay.forEach(({node,slot}) => {
        const progress = clamp((finishTime - slot * .18) / 3, 0, 1);
        const phase = t * .78 + slot * 2.094;
        node.position.set(Math.cos(phase) * (4 * (1 - progress)), 4.8 - progress * 2.44, Math.sin(phase) * (4 * (1 - progress)));
        node.material.opacity = .93 * Math.sin(progress * Math.PI) + power * .52;
        node.scale.setScalar(.9 + power * .8);
      });
    } else if (finale.group.visible) {
      finale.group.visible = false;
    }
    dust.rotation.y = .012 * Math.sin(t * .08);
    dust.position.y = .09 * Math.sin(t / 4);
    centerLight.intensity = 70 + power * 48;
    const age = swing ? time - swing.time : -1;
    if (swing && age >= punchContact && !swing.contact) {
      swing.contact = true;
      bellVector.set(bellPosition[0], 1.70, bellPosition[1]).sub(camera.position);
      camera.getWorldDirection(aim);
      const reach = bellVector.dot(aim);
      if (reach > 0 && reach < 1.95 && bellVector.addScaledVector(aim, -reach).lengthSq() < .41 ** 2) {
        hitAt = time;
        onBell();
      }
    }
    if (swing && age >= punchLength) swing = null;
    const ringAge = time - hitAt;
    belltower.rotation.z = ringAge < .85 ? Math.sin(ringAge * 29) * Math.exp(-ringAge * 5.1) * .24 : 0;
    bellGlow.material.opacity = ringAge < .85 ? .15 + Math.exp(-ringAge * 8) * .50 : .15;
    hand(swing ? age : -1, swingSide, ringAge);
    if (waypoint) beacon.material.opacity = .64 + .22 * Math.sin(t * 3.1);
    art.update(t, power);
    exhibits.forEach((exhibit, i) => {
      const {aimX, aimZ} = stations[i];
      exhibit.root.visible = webgl || Math.hypot(camera.position.x - aimX, camera.position.z - aimZ) < 28;
      if (exhibit.root.visible) exhibit.update(t, states[i] ?? {});
    });
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(draw);
  return {
    keys,
    start() { if (!playing) { playing = true; place(hall); } },
    focus(room) {
      returnView ??= transition?.end ?? {...pose(), y: 2.03, yaw: targetYaw, pitch: targetPitch};
      if (room === null) {
        const {x, y, z} = camera.position;
        focusTarget.set(hall.aimX, 2.55, hall.aimZ);
        focusTarget.sub(camera.position);
        easeTo({x, y, z, yaw: Math.atan2(-focusTarget.x,-focusTarget.z),
          pitch: Math.atan2(focusTarget.y, Math.hypot(focusTarget.x,focusTarget.z)), offsetX: 0, offsetY: 0});
      } else {
        inspection = {station: stations[room], angle: 0, elevation: 0};
        easeTo(inspectionPose(inspection));
      }
    },
    rotateExhibit(angle) { steerInspection(angle); },
    frontView() {
      if (!inspection) return;
      inspection.angle = inspection.elevation = 0;
      easeTo(inspectionPose(inspection), .23);
    },
    releaseFocus() {
      if (!returnView) return;
      const view = returnView;
      returnView = inspection = null;
      easeTo(view, .31);
    },
    waypoint(target) {
      waypoint = target;
      beacon.visible = !!target;
      if (target) { beacon.position.x = target.x; beacon.position.z = target.z; }
    },
    jump() {
      if (!playing || suspended || jumpHeight || jumpVelocity) return false;
      jumpVelocity = 6.1;
      return true;
    },
    punch() {
      if (!playing || suspended || transition || swing) return;
      swingSide = -swingSide;
      swing = {time: clock(), contact: false};
    },
    handlePositions(room) {
      camera.updateMatrixWorld();
      if (transition) return [];
      return (exhibits[room]?.handles ?? []).map((handle) => {
        handle.getWorldPosition(projected).project(camera);
        return [(projected.x + 1) * 50, (1 - projected.y) * 50, projected.z < 1];
      });
    },
    dragValue(room, clientX, clientY) {
      const station = stations[room];
      if (!station) return null;
      const bounds = canvas.getBoundingClientRect();
      pointer.set((clientX - bounds.left) / bounds.width * 2 - 1, -(clientY - bounds.top) / bounds.height * 2 + 1);
      camera.updateMatrixWorld();
      ray.setFromCamera(pointer, camera);
      exhibitPlane.setComponents(0, 0, 1, -(station.aimZ + .095));
      const hit = ray.ray.intersectPlane(exhibitPlane, projected);
      if (!hit) return null;
      const x = hit.x - station.aimX;
      if (room === 0) return clamp(Math.round(x * 20) / 20, -1.5, 1.5);
      const angle = Math.atan2(hit.y - 2.51, x) + .45;
      return (Math.round(angle / (Math.PI / 6)) + 12) % 12;
    },
    suspend(paused) {
      suspended = paused;
      if (!paused) return;
      keys.clear();
      dragging = travel = swing = null;
      jumpHeight = jumpVelocity = 0;
    },
    setStates(next) { states = next; },
    finale(active) { finalAt = active ? clock() : null; },
  };
}
