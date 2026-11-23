// Three kinetic sculptures. The gallery supplies their positions and the puzzle state.
export function createExhibits(THREE) {
  const tau = Math.PI * 2;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const palette = {
    gold: 0xffb96e,
    cyan: 0x86edff,
    blue: 0x4d78e4,
    copper: 0xff8b63,
    rose: 0xff729f,
    white: 0xffe9b7,
  };

  const size = 64;
  const radialPixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const r = Math.hypot((x + 0.5) * 2 / size - 1, (y + 0.5) * 2 / size - 1);
      const alpha = Math.exp(-r * r * 7) * Math.max(0, 1 - r) ** 1.4;
      const index = (y * size + x) * 4;
      radialPixels.set([255, 255, 255, Math.round(alpha * 255)], index);
    }
  }
  const radial = new THREE.DataTexture(radialPixels, size, size);
  radial.magFilter = THREE.LinearFilter;
  radial.minFilter = THREE.LinearFilter;
  radial.needsUpdate = true;

  function glow(parent, color, radius, opacity) {
    const material = new THREE.SpriteMaterial({
      map: radial,
      color,
      opacity,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(radius);
    parent.add(sprite);
    return sprite;
  }

  function linework(parent, paths, color, opacity, luminous = true) {
    const points = [];
    for (const path of paths) {
      for (let step = 1; step < path.length; step++) {
        points.push(...path[step - 1], ...path[step]);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const material = new THREE.LineBasicMaterial({
      color,
      opacity,
      transparent: opacity < 1,
      blending: luminous ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: opacity === 1,
      toneMapped: false,
    });
    const lines = new THREE.LineSegments(geometry, material);
    parent.add(lines);
    return lines;
  }

  function sample(points, position) {
    return Array.from({length: points + 1}, (_, index) => position(index / points, index));
  }

  function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
    const piece = new THREE.Mesh(geometry, material);
    piece.position.set(x, y, z);
    parent.add(piece);
    return piece;
  }

  function lightMaterial(color) {
    return new THREE.MeshBasicMaterial({color, toneMapped: false});
  }

  const bead = new THREE.SphereGeometry(1, 12, 8);
  const cutGem = new THREE.OctahedronGeometry(1, 0);
  const coldLight = lightMaterial(palette.cyan);
  const goldLight = lightMaterial(palette.white);

  function ellipse(radiusX, radiusY, z = 0, phase = 0, sweep = tau) {
    return sample(104, (u) => [Math.cos(phase + sweep * u) * radiusX,
      Math.sin(phase + sweep * u) * radiusY, z]);
  }

  function criticalLine() {
    const root = new THREE.Group();
    const wings = new THREE.Group();
    root.add(wings);

    const layers = [[], [], []];
    for (let i = 0; i < 38; i++) {
      const layer = i % 3;
      const angle = i / 38 * tau;
      const side = i % 2 ? -1 : 1;
      layers[layer].push(sample(92, (s) => {
        const y = -1.78 + 3.56 * s;
        const width = Math.sin(s * Math.PI) ** 1.4;
        const twist = 1.32 * tau * s + angle;
        const x = side * width * (0.64 + 0.48 * Math.cos(twist) + 0.24 * Math.cos(2 * twist));
        const z = Math.sin(twist) * width * (0.36 + (i / 38) * 0.33);
        return [x, y, z];
      }));
    }
    linework(wings, layers[0], 0x64bdff, 0.51);
    linework(wings, layers[1], palette.blue, 0.34);
    linework(wings, layers[2], palette.gold, 0.36);

    mesh(root, new THREE.CylinderGeometry(0.013, 0.013, 3.55, 12), coldLight);
    const axisGlow = glow(root, 0x46b8ff, 2.7, 0.24);
    axisGlow.scale.set(0.45, 3.63, 1);
    const finials = [-1.76, 1.76];
    for (const y of finials) {
      mesh(root, cutGem, goldLight, 0, y, 0).scale.setScalar(0.07);
    }

    const zeros = [14.134725, 21.022040, 25.010858, 30.424876, 32.935062, 37.586178];
    const heights = zeros.map((height) => -1.39 + 2.78 * (height - zeros[0]) / (zeros[5] - zeros[0]));
    const guides = heights.map((y) => [[-1.43, y, -0.016], [1.43, y, -0.016]]);
    linework(root, guides, 0x97b6d2, 0.31);
    linework(root, heights.map((y) => [[-1.43, y - 0.045, -0.01], [-1.43, y + 0.045, -0.01]]), palette.gold, 0.64);
    linework(root, heights.map((y) => [[1.43, y - 0.045, -0.01], [1.43, y + 0.045, -0.01]]), palette.gold, 0.64);

    const movers = [];
    heights.forEach((y, index) => {
      if (index % 2) {
        mesh(root, bead, goldLight, 0, y, 0).scale.setScalar(0.044);
        return;
      }
      const node = new THREE.Group();
      node.position.set(0, y, 0.095);
      root.add(node);
      mesh(node, cutGem, coldLight).scale.setScalar(0.108);
      linework(node, [ellipse(0.179, 0.179)], palette.cyan, 0.62);
      const aura = glow(node, 0x4edcff, 0.93, 0.83);
      movers.push({node, aura});
    });

    return {
      root,
      handles: movers.map(({node}) => node),
      update(t, state = {}) {
        wings.rotation.y = Math.sin(t * 0.29) * 0.36 + t * 0.045;
        const offsets = state.values ?? [-0.83, 0.94, -0.67];
        movers.forEach(({node, aura}, index) => {
          const target = clamp(Number(offsets[index]) || 0, -1.52, 1.52);
          node.position.x += (target - node.position.x) * 0.19;
          aura.material.opacity = state.done ? 1 : 0.7 + 0.16 * Math.sin(t * 3 + index);
        });
        axisGlow.material.opacity = state.done ? 0.64 : 0.26;
      },
    };
  }

  function reflection() {
    const root = new THREE.Group();
    const frame = new THREE.Group();
    root.add(frame);

    linework(frame, [ellipse(1.64, 1.64, -0.14), ellipse(1.54, 1.54, -0.14),
      ellipse(1.13, 1.13, -0.25)], 0xdc906f, 0.46);
    const marks = sample(71, (_, index) => {
      const angle = index * tau / 72;
      const length = index % 6 === 0 ? 0.11 : 0.042;
      return [[Math.sin(angle) * 1.57, Math.cos(angle) * 1.57, -0.13],
        [Math.sin(angle) * (1.57 + length), Math.cos(angle) * (1.57 + length), -0.13]];
    });
    linework(frame, marks, palette.gold, 0.79);
    linework(frame, [[[-1.66, 0, -0.25], [1.66, 0, -0.25]],
      [[0, -1.66, -0.25], [0, 1.66, -0.25]]], 0xd77a92, 0.32);

    const stationary = new THREE.Group();
    const moving = new THREE.Group();
    root.add(stationary, moving);
    const rings = [stationary, moving];
    const colors = [palette.rose, palette.copper];

    const ringMarkers = [];
    rings.forEach((ring, index) => {
      const ribbon = [];
      for (let layer = 0; layer < 22; layer++) {
        const q = (layer - 10.5) / 21;
        ribbon.push(sample(112, (u) => {
          const theta = -0.89 * Math.PI + 1.78 * Math.PI * u;
          const depth = Math.sin(2 * theta + q * 1.25);
          const radius = 1.1 + q * 0.31 + 0.16 * depth;
          return [radius * Math.cos(theta), radius * Math.sin(theta) * 0.78,
            depth * (0.42 + q * 0.16) + q * 0.34];
        }));
      }
      linework(ring, ribbon, colors[index], 0.42);
      linework(ring, [sample(112, (u) => {
        const theta = -0.89 * Math.PI + 1.78 * Math.PI * u;
        const radius = 1.1 + 0.16 * Math.sin(2 * theta);
        return [radius * Math.cos(theta), radius * Math.sin(theta) * 0.78, Math.sin(2 * theta) * 0.42];
      })], 0xffdfb7, 0.95);
      const marker = new THREE.Group();
      marker.position.set(1.1, 0, 0.01);
      ring.add(marker);
      ringMarkers.push(marker);
      mesh(marker, cutGem, lightMaterial(colors[index])).scale.setScalar(0.101);
      glow(marker, colors[index], 0.96, 0.91);
    });

    stationary.rotation.z = -0.45;
    const heart = mesh(root, cutGem, goldLight);
    heart.scale.set(0.13, 0.17, 0.13);
    const combined = glow(root, 0xffaf83, 1.9, 0.22);

    return {
      root,
      handles: [ringMarkers[1]],
      update(t, state = {}) {
        const dial = clamp(Number(state.values?.[0] ?? 2), 0, 11);
        const angle = dial * tau / 12 - 0.45;
        moving.rotation.z += (angle - moving.rotation.z) * 0.18;
        frame.rotation.z = 0.045 * Math.sin(t * 0.48);
        stationary.rotation.x = 0.21 + 0.19 * Math.sin(t * 0.6);
        moving.rotation.x = -stationary.rotation.x;
        heart.rotation.y = t * 0.65;
        combined.material.opacity = state.done ? 0.78 + 0.13 * Math.sin(t * 2) : 0.19;
      },
    };
  }

  function kernel() {
    const root = new THREE.Group();
    const frame = new THREE.Group();
    root.add(frame);
    const axes = [
      [[-1.66, 0, 0], [1.66, 0, 0]],
      [[0, -1.66, 0], [0, 1.66, 0]],
      [[0, 0, -1.19], [0, 0, 1.19]],
    ];
    linework(frame, axes, 0xad8057, 0.28);

    const degrees = [0.17, 1.048, 1.92];
    const rings = degrees.map((phase, index) => {
      const assembly = new THREE.Group();
      root.add(assembly);
      const radius = 1.09 + index * 0.24;
      const frameLines = linework(assembly, [ellipse(radius, radius), ellipse(radius + 0.078, radius + 0.078),
        ellipse(radius - 0.03, radius - 0.03, 0.045, index, Math.PI * 1.18)], 0xd99b5b, 0.63);
      const scaleLines = sample(47, (_, tick) => {
        const angle = tick * tau / 48;
        const length = tick % 4 === 0 ? 0.094 : 0.038;
        return [[Math.cos(angle) * (radius - length), Math.sin(angle) * (radius - length), 0],
          [Math.cos(angle) * radius, Math.sin(angle) * radius, 0]];
      });
      linework(assembly, scaleLines, palette.gold, 0.53);
      const running = new THREE.Group();
      assembly.add(running);
      mesh(running, cutGem, goldLight).scale.setScalar(0.097);
      const beacon = glow(running, 0xffc186, 1.12, 0.19);
      return {assembly, beacon, frameLines, radius, running, phase};
    });

    const core = new THREE.Group();
    root.add(core);
    const solid = mesh(core, new THREE.IcosahedronGeometry(0.18, 1), goldLight);
    const aura = glow(core, 0xffc174, 2.2, 0.36);
    const cageMaterial = new THREE.MeshBasicMaterial({
      color: 0xffc376, wireframe: true, transparent: true, opacity: 0.67, toneMapped: false,
    });
    const cage = mesh(core, new THREE.IcosahedronGeometry(0.48, 1), cageMaterial);

    return {
      root,
      update(t, state = {}) {
        const count = clamp(Number(state.count ?? 0), 0, 3);
        rings.forEach(({assembly, beacon, frameLines, radius, running, phase}, i) => {
          const active = i < count;
          assembly.rotation.set(phase * 0.63 + Math.sin(t * 0.48 + phase) * 0.12,
            phase + t * (0.18 + i * 0.045), t * 0.21 * (i % 2 ? -1 : 1));
          const theta = t * (active ? 1.56 : 0.45) + phase * 2;
          running.position.set(Math.cos(theta) * radius, Math.sin(theta) * radius, 0);
          beacon.material.opacity = active ? 0.95 : 0.18;
          frameLines.material.opacity = active ? 0.91 : 0.44;
        });
        cage.rotation.set(t * 0.26, t * 0.47, -t * 0.17);
        solid.scale.setScalar(1 + Math.sin(t * 3.3) * (state.done ? 0.26 : 0.13));
        aura.material.opacity = state.done ? 0.95 : 0.24 + count * 0.13;
      },
    };
  }

  return [criticalLine(), reflection(), kernel()];
}
