const near = .14;
const clamped = (value, max = 1) => Math.max(0, Math.min(max, value));
const corners = [
  [-.5, -.5, -.5], [.5, -.5, -.5], [.5, .5, -.5], [-.5, .5, -.5],
  [-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5],
];
const faces = [
  [[0, 3, 2, 1], .78], [[4, 5, 6, 7], 1.08],
  [[0, 4, 7, 3], .83], [[1, 2, 6, 5], 1.15],
  [[0, 1, 5, 4], .73], [[3, 7, 6, 2], 1.25],
];

function mix(a, b, t) {
  return a + (b - a) * t;
}

function inFront(a, b) {
  const fraction = (near - a[2]) / (b[2] - a[2]);
  return [mix(a[0], b[0], fraction), mix(a[1], b[1], fraction), near];
}

function clipPolygon(points) {
  const output = [];
  for (let index = 0; index < points.length; index++) {
    const current = points[index];
    const previous = points[(index + points.length - 1) % points.length];
    if ((current[2] >= near) !== (previous[2] >= near)) output.push(inFront(previous, current));
    if (current[2] >= near) output.push(current);
  }
  return output;
}

function shade(hex, light, depth = 0, golden = 0) {
  const haze = clamped(depth / 77, .51);
  const channel = (position, fog, warm) =>
    Math.round(clamped(mix(parseInt(hex.slice(position, position + 2), 16) * light + warm * golden, fog, haze), 255));
  return 'rgb(' + channel(0, 37, 27) + ',' + channel(2, 28, 14) + ',' + channel(4, 34, 3) + ')';
}

export function createCanvasRenderer(THREE, canvas) {
  const context = canvas.getContext('2d', {alpha: false});
  if (!context) throw new Error('Canvas 2D unavailable');
  const backdrop = document.createElement('canvas');
  const background = backdrop.getContext('2d', {alpha: false});
  if (!background) throw new Error('Canvas backdrop unavailable');
  const transform = new THREE.Matrix4();
  const stationary = new THREE.Vector3();
  let width = 1;
  let height = 1;
  let scale = 1;
  let lens = 1;
  let lastCamera = '';
  let lastFrame = 0;
  let previousFrame = 0;
  let loop;

  function viewPoint(matrix, x, y, z) {
    return [
      matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
      matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
      -(matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]),
    ];
  }

  function screen([x, y, depth]) {
    return [width / 2 + lens * x / depth, height / 2 - lens * y / depth, depth];
  }

  function path(ctx, pixels) {
    ctx.beginPath();
    ctx.moveTo(pixels[0][0], pixels[0][1]);
    for (let i = 1; i < pixels.length; i++) ctx.lineTo(pixels[i][0], pixels[i][1]);
    ctx.closePath();
  }

  function rgbFor(object) {
    return object.material.color?.getHexString() ?? 'ffffff';
  }

  function depthOf(points) {
    return points.reduce((sum, point) => sum + point[2], 0) / points.length;
  }

  function addFace(draw, points, shadeHex, light, warm, opacity, index = 0, image) {
    const clipped = clipPolygon(points);
    if (clipped.length < 3) return;
    const pixels = clipped.map(screen);
    const depth = depthOf(clipped);
    const minX = Math.min(...pixels.map((point) => point[0]));
    const maxX = Math.max(...pixels.map((point) => point[0]));
    const minY = Math.min(...pixels.map((point) => point[1]));
    const maxY = Math.max(...pixels.map((point) => point[1]));
    if (minX > width || maxX < 0 || minY > height || maxY < 0) return;
    draw.push({
      pixels, depth: index === -1 ? 10000 : depth, opacity,
      color: shade(shadeHex, light, index === -1 ? 4 : depth, warm),
      image, minX, maxX, minY, maxY,
    });
  }

  function renderFaces(ctx, draw) {
    draw.sort((first, next) => next.depth - first.depth);
    for (const face of draw) {
      ctx.globalAlpha = face.opacity;
      path(ctx, face.pixels);
      ctx.fillStyle = face.color;
      ctx.fill();
      if (face.image) {
        ctx.save();
        ctx.clip();
        ctx.drawImage(face.image, face.minX, face.minY, face.maxX - face.minX, face.maxY - face.minY);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  function box(object, matrix, draw) {
    const points = corners.map(([x, y, z]) => viewPoint(matrix, x, y, z));
    const hex = rgbFor(object);
    const gloss = object.material.isMeshBasicMaterial ? 1 : .8;
    const lit = object.material.isMeshBasicMaterial ? 0 : clamped(1 - Math.hypot(object.position.x, object.position.z + 4) / 11);
    const floor = object.position.y < 0 && object.scale.x > 20;
    for (const [indices, directional] of faces) {
      const face = indices.map((index) => points[index]);
      const [a, b, c] = face;
      const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const crossX = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]);
      const crossY = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]);
      if (crossX * a[0] + crossY * a[1] + area * a[2] <= 0) continue;
      addFace(draw, face, hex, gloss * directional, lit, object.material.opacity, floor ? -1 : 0);
    }
  }

  function rings(object, matrix, draw) {
    const {radius, innerRadius, outerRadius, radiusTop, radiusBottom, height: thickness} = object.geometry.parameters;
    const hex = rgbFor(object);
    const opacity = object.material.opacity;
    const ring = outerRadius !== undefined;
    const segments = 32;
    const upper = [];
    const lower = [];
    for (let i = 0; i < segments; i++) {
      const theta = 2 * Math.PI * i / segments;
      const x = Math.cos(theta);
      const y = Math.sin(theta);
      if (ring) {
        upper.push(viewPoint(matrix, x * outerRadius, y * outerRadius, 0));
        lower.push(viewPoint(matrix, x * innerRadius, y * innerRadius, 0));
      } else {
        upper.push(viewPoint(matrix, x * (radiusTop ?? radius), thickness / 2, y * (radiusTop ?? radius)));
        lower.push(viewPoint(matrix, x * (radiusBottom ?? radius), -thickness / 2, y * (radiusBottom ?? radius)));
      }
    }
    if (!ring) addFace(draw, upper, hex, 1.05, .15, opacity);
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const light = ring ? 1.1 : .68 + .45 * Math.max(0, Math.cos(i / segments * 6.283 + .45));
      addFace(draw, [upper[i], upper[next], lower[next], lower[i]], hex, light, 0, opacity);
    }
  }

  function stroke(ctx, object, matrix, torus = false) {
    const attr = object.geometry.attributes.position;
    const segments = object.isLineSegments;
    const count = torus ? object.geometry.parameters.tubularSegments + 1 : attr.count;
    const color = object.material.vertexColors ? '#ffc588' : '#' + rgbFor(object);
    if (!count) return;
    ctx.globalAlpha = object.material.opacity * (object.material.vertexColors ? .38 : .9);
    const additive = object.material.blending === THREE.AdditiveBlending;
    if (additive) ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = color;
    ctx.lineWidth = torus ? 1.1 : .85;
    ctx.beginPath();
    let prior = viewPoint(matrix, attr.getX(0), attr.getY(0), attr.getZ(0));
    for (let i = 1; i < count; i++) {
      const point = viewPoint(matrix, attr.getX(i), attr.getY(i), attr.getZ(i));
      if (!segments || i % 2) {
        if (prior[2] >= near || point[2] >= near) {
          const a = screen(prior[2] >= near ? prior : inFront(prior, point));
          const b = screen(point[2] >= near ? point : inFront(point, prior));
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
        }
      }
      prior = point;
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function glow(ctx, x, y, radius, hex, opacity, sharp = false) {
    if (radius < .55 || x < -radius || x > width + radius || y < -radius || y > height + radius) return;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#' + hex + (sharp ? 'ff' : 'e5'));
    gradient.addColorStop(sharp ? .28 : .34, '#' + hex + (sharp ? 'a0' : '43'));
    gradient.addColorStop(1, '#' + hex + '00');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.globalAlpha = opacity;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawPoints(ctx, object, matrix) {
    const vertices = object.geometry.attributes.position;
    const color = '#' + (object.material.vertexColors ? 'f4c17d' : rgbFor(object));
    ctx.fillStyle = color;
    ctx.globalAlpha = object.material.opacity;
    ctx.beginPath();
    for (let i = 0; i < vertices.count; i++) {
      const point = viewPoint(matrix, vertices.getX(i), vertices.getY(i), vertices.getZ(i));
      if (point[2] < near) continue;
      const [x, y, depth] = screen(point);
      if (x < 0 || y < 0 || x > width || y > height) continue;
      const radius = clamped(lens * object.material.size / depth * .23, 2);
      ctx.rect(x, y, Math.max(.55, radius), Math.max(.55, radius));
    }
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function architecture(scene, camera) {
    const context = background;
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#161318');
    gradient.addColorStop(.45, '#242028');
    gradient.addColorStop(1, '#1d161c');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    const batch = [];
    const seamLines = [];
    scene.traverseVisible((object) => {
      if (!object.isMesh && !object.isLine) return;
      if (!object.material.visible) return;
      const matrix = transform.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld).elements;
      const type = object.geometry.type;
      if (object.isLine) {
        seamLines.push(object);
      } else if (type === 'BoxGeometry') {
        box(object, matrix, batch);
      } else if (type === 'RingGeometry' || type === 'CylinderGeometry') {
        rings(object, matrix, batch);
      } else if (type === 'PlaneGeometry' && object.material.map?.image?.width === 768) {
        const dimensions = object.geometry.parameters;
        const points = corners.slice(0, 4).map(([x,y]) => viewPoint(matrix,x * dimensions.width,y * dimensions.height,0));
        addFace(batch, points, '211916', 1, 0, 1, 0, object.material.map.image);
      }
    });
    renderFaces(context, batch);
    for (const object of seamLines) {
      const matrix = transform.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld).elements;
      stroke(context, object, matrix);
    }
    for (const [x,y,z,hex,radius,opacity] of [[0,2.5,-4,'f7ad60',4.7,.18],[-8.2,2.25,-13.4,'3992c0',3.7,.18],[8.2,2.15,-13.4,'d96a84',3.8,.16],[0,2.6,-20.2,'d6a356',3,.13]]) {
      const point = viewPoint(camera.matrixWorldInverse.elements, x, y, z);
      if (point[2] < 2) continue;
      const [sx, sy] = screen(point);
      glow(context, sx, sy, Math.min(width * .55, lens * radius / point[2]), hex, opacity);
    }
  }

  function renderArt(scene, camera) {
    const layer = [];
    scene.traverseVisible((object) => {
      if (object === scene.userData.architecture || object.parent === scene.userData.architecture) return;
      if (!object.isMesh && !object.isLine && !object.isSprite && !object.isPoints) return;
      if (!object.material.visible || object.material.opacity < .015) return;
      stationary.setFromMatrixPosition(object.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
      layer.push({object, depth: -stationary.z});
    });
    layer.sort((first, next) => next.depth - first.depth);
    for (const {object, depth} of layer) {
      const matrix = transform.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld).elements;
      if (object.isLine || object.geometry?.type === 'TorusGeometry') {
        stroke(context, object, matrix, !object.isLine);
      } else if (object.isPoints) {
        drawPoints(context, object, matrix);
      } else if (object.geometry?.type === 'CylinderGeometry') {
        const batch = [];
        rings(object, matrix, batch);
        renderFaces(context, batch);
      } else if (depth >= near) {
        const point = viewPoint(matrix, 0, 0, 0);
        const [x, y] = screen(point);
        const local = object.geometry?.parameters?.radius ?? .22;
        const objectScale = Math.hypot(object.matrixWorld.elements[0], object.matrixWorld.elements[1], object.matrixWorld.elements[2]);
        const radius = clamped(lens * (object.isSprite ? objectScale * .46 : objectScale * local) / depth, width * .75);
        glow(context, x, y, Math.max(1, radius), rgbFor(object), object.material.opacity * (object.isSprite ? .76 : 1), !object.isSprite);
      }
    }
  }

  return {
    setPixelRatio(value) { scale = Math.min(value, 1.18); },
    setSize(newWidth, newHeight) {
      width = newWidth;
      height = newHeight;
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      backdrop.width = canvas.width;
      backdrop.height = canvas.height;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      background.setTransform(scale, 0, 0, scale, 0, 0);
      lastCamera = '';
    },
    setAnimationLoop(callback) {
      loop = callback;
      function update(now) {
        if (!loop) return;
        requestAnimationFrame(update);
        if (now - previousFrame < 1000 / 32) return;
        previousFrame = now;
        loop(now);
      }
      requestAnimationFrame(update);
    },
    render(scene, camera) {
      const now = performance.now();
      if (now - lastFrame < 20) return;
      lastFrame = now;
      lens = height * .5 / Math.tan(camera.fov * Math.PI / 360);
      scene.updateMatrixWorld();
      camera.updateMatrixWorld();
      const key = camera.matrixWorldInverse.elements.map((value) => value.toFixed(4)).join(',');
      if (key !== lastCamera) {
        architecture(scene.userData.architecture, camera);
        lastCamera = key;
      }
      context.drawImage(backdrop, 0, 0, width, height);
      renderArt(scene, camera);
    },
  };
}
