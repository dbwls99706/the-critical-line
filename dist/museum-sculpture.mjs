const turn = Math.PI * 2;

function seedRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function glowTexture(THREE) {
  const size = 32;
  const texels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const radius = Math.hypot(x - 15.5, y - 15.5) / 15.5;
      const alpha = Math.exp(-radius * radius * 4) * Math.max(0, 1 - radius ** 2);
      texels.set([255, 255, 255, Math.round(alpha * 255)], (y * size + x) * 4);
    }
  }
  const texture = new THREE.DataTexture(texels, size, size);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function makeGlow(THREE, texture, color, scale, opacity) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

function filamentPoint(angle, strand, progress, layer) {
  const p = progress * 2 - 1;
  const waist = Math.abs(p) ** (layer === 0 ? 1.23 : 1.65);
  const ripple = Math.sin(progress * turn * 2 + angle * 3) * .04 * Math.sin(Math.PI * progress);
  const radius = (layer === 0 ? .165 : .08) + waist * (layer === 0 ? 1.03 : .76) + ripple;
  const twist = p * (layer === 0 ? 1.55 : -2.22) + Math.sin(p * Math.PI) * (.17 + .11 * strand);
  const theta = angle + twist;
  return [
    Math.cos(theta) * radius * 1.19 + .09 * Math.sin(p * 2.2),
    p * (layer === 0 ? 1.66 : 1.83) + .19 * Math.cos(angle) * Math.abs(p) ** 4 + .05 * strand,
    Math.sin(theta) * radius - .10 * Math.cos(p * 2.9),
  ];
}

function makeFilaments(THREE, count, layer) {
  const positions = [];
  const colors = [];
  const hot = new THREE.Color(layer === 0 ? '#f2b871' : '#ffe1a0');
  const cool = new THREE.Color(layer === 0 ? '#8c4856' : '#a55942');
  const random = seedRandom(784 + layer);
  const tint = new THREE.Color();
  const steps = 56;
  for (let index = 0; index < count; index++) {
    const strand = random() * 2 - 1;
    const angle = (index + random() * .72) * turn / count;
    const strength = .35 + random() * .65;
    for (let step = 0; step < steps; step++) {
      for (const progress of [step / steps, (step + 1) / steps]) {
        const p = progress * 2 - 1;
        positions.push(...filamentPoint(angle, strand, progress, layer));
        tint.copy(cool).lerp(hot, .23 + .66 * (1 - Math.abs(p) ** .82));
        tint.multiplyScalar(strength * (.62 + .38 * Math.sin(angle - p * 2) ** 2));
        colors.push(tint.r, tint.g, tint.b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: layer === 0 ? .84 : .62,
  });
  return new THREE.LineSegments(geometry, material);
}

function makeOrbit(THREE, configuration) {
  const {
    radius, thickness, angleX, angleY, angleZ, stretch, y, color, opacity, arc = turn, start = 0,
  } = configuration;
  const geometry = new THREE.TorusGeometry(radius, thickness, 5, 112, arc);
  geometry.rotateZ(start);
  const material = new THREE.MeshBasicMaterial({color, transparent: true, opacity});
  const orbit = new THREE.Mesh(geometry, material);
  orbit.rotation.set(angleX, angleY, angleZ);
  orbit.scale.y = stretch;
  orbit.position.y = y;
  return orbit;
}

const orbits = [
  {radius: 1.53, thickness: .011, angleX: .61, angleY: .47, angleZ: .27, stretch: 1.35, y: 0, color: '#cf8f56', opacity: .84},
  {radius: 1.68, thickness: .006, angleX: -.69, angleY: -.19, angleZ: -.42, stretch: .95, y: -.03, color: '#96604a', opacity: .71},
  {radius: 1.61, thickness: .006, angleX: 1.12, angleY: .48, angleZ: -.32, stretch: .94, y: .13, color: '#df9665', opacity: .79, arc: 4.91, start: .68},
  {radius: 1.23, thickness: .013, angleX: Math.PI / 2 + .13, angleY: .08, angleZ: .08, stretch: .91, y: 1.65, color: '#ffe2a4', opacity: .83},
  {radius: 1.22, thickness: .01, angleX: Math.PI / 2 - .15, angleY: -.13, angleZ: -.06, stretch: .92, y: -1.64, color: '#d79768', opacity: .87},
  {radius: 1.38, thickness: .004, angleX: Math.PI / 2 + .15, angleY: .015, angleZ: -.07, stretch: .95, y: -1.56, color: '#dcae79', opacity: .85},
  {radius: .49, thickness: .014, angleX: 1.19, angleY: -.32, angleZ: -.23, stretch: 1.09, y: -.04, color: '#fff0bd', opacity: .94, arc: 4.85, start: 1.37},
];

function makeDust(THREE, texture) {
  const positions = [];
  const colors = [];
  const random = seedRandom(71);
  const tint = new THREE.Color();
  const amber = new THREE.Color('#b47444');
  const pearl = new THREE.Color('#fff1bf');
  for (let i = 0; i < 186; i++) {
    const z = random() * 2 - 1;
    const angle = random() * turn;
    const radius = (1.1 + random() * .89) * Math.sqrt(1 - z * z);
    positions.push(Math.cos(angle) * radius, z * 2.11, Math.sin(angle) * radius * .8);
    tint.copy(amber).lerp(pearl, random() ** 2);
    colors.push(tint.r, tint.g, tint.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: .039,
    map: texture,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: .73,
  });
  return new THREE.Points(geometry, material);
}

export function createSculpture(THREE) {
  const root = new THREE.Group();
  root.name = 'Critical line sculpture';

  const weave = new THREE.Group();
  const outerFilaments = makeFilaments(THREE, 101, 0);
  const innerFilaments = makeFilaments(THREE, 54, 1);
  const metallicOrbits = orbits.map((configuration) => makeOrbit(THREE, configuration));
  weave.add(outerFilaments, innerFilaments, ...metallicOrbits);
  weave.rotation.y = -.22;
  root.add(weave);

  const texture = glowTexture(THREE);
  const dust = makeDust(THREE, texture);
  root.add(dust);

  const axis = new THREE.Mesh(
    new THREE.CylinderGeometry(.009, .009, 4.16, 7),
    new THREE.MeshBasicMaterial({color: '#ffd797', transparent: true, opacity: .82}),
  );
  root.add(axis);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(.106, 2),
    new THREE.MeshBasicMaterial({color: '#fff4ce'}),
  );
  core.rotation.x = Math.PI / 4;
  root.add(core);

  const centerGlow = makeGlow(THREE, texture, '#ffa448', 1.14, .8);
  const outerGlow = makeGlow(THREE, texture, '#b4582c', 2.26, .32);
  root.add(centerGlow, outerGlow);

  const seedMesh = new THREE.SphereGeometry(1, 10, 8);
  const seedTint = new THREE.MeshBasicMaterial({color: '#ffe9be'});
  const orbitSeeds = new THREE.Group();
  const seedOffsets = [-1.65, -1.02, -.54, -.26, .33, .66, 1.02, 1.36, 1.66];
  for (let index = 0; index < seedOffsets.length; index++) {
    const y = seedOffsets[index];
    const seed = new THREE.Mesh(seedMesh, seedTint);
    const size = index === 0 || index === seedOffsets.length - 1 ? .036 : .018;
    seed.scale.setScalar(size);
    seed.position.y = y;
    const seedGlow = makeGlow(THREE, texture, '#ffb775', size * 9, .66);
    seedGlow.position.y = y;
    orbitSeeds.add(seed, seedGlow);
  }
  root.add(orbitSeeds);

  const pulses = [0, 1, 2].map((index) => {
    const pulse = makeGlow(THREE, texture, index === 1 ? '#ffd791' : '#ffaa68', .41, .75);
    root.add(pulse);
    return pulse;
  });

  function update(timeSeconds, intensity = 0) {
    const force = Math.min(1, Math.max(0, intensity));
    const breath = Math.sin(timeSeconds * 1.34) * .5 + .5;
    weave.rotation.y = -.22 + Math.sin(timeSeconds * .23) * .25;
    weave.rotation.z = Math.sin(timeSeconds * .36) * .04;
    dust.rotation.y = timeSeconds * .048;
    dust.rotation.z = Math.sin(timeSeconds * .24) * .07;
    dust.material.opacity = .60 + .13 * breath + .23 * force;
    outerFilaments.material.opacity = .73 + .08 * breath + .17 * force;
    innerFilaments.material.opacity = .52 + .10 * breath + .24 * force;

    core.rotation.y = timeSeconds * .35;
    core.scale.setScalar(1 + .11 * breath + .38 * force);
    centerGlow.material.opacity = .71 + .16 * breath + .13 * force;
    centerGlow.scale.set(1.04 + .16 * breath + .28 * force, 1.04 + .16 * breath + .28 * force, 1);
    outerGlow.material.opacity = .26 + .06 * breath + .14 * force;

    for (let index = 0; index < pulses.length; index++) {
      const position = (timeSeconds * (.22 + force * .24) + index / pulses.length) % 1;
      const pulse = pulses[index];
      pulse.position.y = (index % 2 === 0 ? 1 : -1) * (4.16 * position - 2.08);
      pulse.material.opacity = (.49 + .41 * force) * Math.sin(position * Math.PI);
    }
  }

  update(0);
  return {root, update};
}
