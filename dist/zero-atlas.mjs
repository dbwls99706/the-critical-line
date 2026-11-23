const ordinates = [
  14.134725, 21.022040, 25.010858, 30.424876, 32.935062, 37.586178,
  40.918719, 43.327073, 48.005151, 49.773832, 52.970321, 56.446248,
  59.347044, 60.831779, 65.112544, 67.079811, 69.546402, 72.067158,
  75.704691, 77.144840, 79.337375, 82.910381, 84.735493, 87.425275,
];

function seededStars() {
  let seed = 1492781;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function drawZeroAtlas(canvas, { width, height, ratio = 1, framed = false }) {
  const ctx = canvas.getContext('2d');
  if (!ctx || width < 1 || height < 1) return;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.scale(ratio, ratio);

  if (framed) {
    ctx.fillStyle = '#12121c';
    ctx.fillRect(0, 0, width, height);
  }
  const x = width * (framed ? .51 : .70);
  const y = height * (framed ? .49 : .50);
  const chartHeight = height * (framed ? .58 : .70);
  const yAt = (ordinate) => y - ordinate / 90 * chartHeight / 2;

  const halo = ctx.createRadialGradient(x, y, 0, x, y, Math.max(width, height) * .58);
  halo.addColorStop(0, '#44326b55');
  halo.addColorStop(.46, '#34365a2c');
  halo.addColorStop(1, '#15152a00');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);

  const random = seededStars();
  const stars = Math.round(520 * Math.sqrt(width * height / 520000));
  for (let i = 0; i < stars; i++) {
    const u = random(), v = random(), luminous = random();
    ctx.fillStyle = luminous > .97 ? '#fff2ccac' : luminous > .8 ? '#dfb98966' : '#a9a6d143';
    const size = luminous > .97 ? 1.35 : .35 + luminous * .75;
    ctx.fillRect(width * u, height * v, size, size);
  }

  ctx.strokeStyle = '#c8ae7f27';
  ctx.lineWidth = .75;
  ctx.beginPath();
  for (let row = -8; row <= 8; row++) {
    const rowY = yAt(row * 10);
    ctx.moveTo(x - width * .26, rowY);
    ctx.lineTo(x + width * .22, rowY);
  }
  for (let column = -5; column <= 5; column++) {
    const columnX = x + column * width * .043;
    ctx.moveTo(columnX, yAt(90));
    ctx.lineTo(columnX, yAt(-90));
  }
  ctx.stroke();

  ctx.save();
  ctx.translate(x, y);
  for (const [index, angle] of [-.76, -.42, .38, .74].entries()) {
    ctx.strokeStyle = index % 2 ? '#bbadc34d' : '#dbad7240';
    ctx.beginPath();
    ctx.ellipse(0, 0, width * .14, chartHeight * .66, angle, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  const rule = ctx.createLinearGradient(0, yAt(100), 0, yAt(-100));
  rule.addColorStop(0, '#eed4a126');
  rule.addColorStop(.15, '#eed4a1c2');
  rule.addColorStop(.85, '#eed4a1c2');
  rule.addColorStop(1, '#eed4a126');
  ctx.strokeStyle = rule;
  ctx.lineWidth = framed ? 1.9 : 1;
  ctx.beginPath();
  ctx.moveTo(x, yAt(100));
  ctx.lineTo(x, yAt(-100));
  ctx.stroke();

  for (const [index, ordinate] of ordinates.entries()) {
    for (const sign of [-1, 1]) {
      const pointY = yAt(sign * ordinate);
      const featured = index === 0 || index === 4 || index === 14 || index === ordinates.length - 1;
      const size = featured ? 8 : 3.8;
      const glow = ctx.createRadialGradient(x, pointY, 0, x, pointY, size);
      glow.addColorStop(0, featured ? '#fff1baff' : '#ddd4f3ce');
      glow.addColorStop(.27, featured ? '#f9d38dae' : '#aca0dd74');
      glow.addColorStop(1, '#e6b97500');
      ctx.fillStyle = glow;
      ctx.fillRect(x - size, pointY - size, size * 2, size * 2);
      ctx.fillStyle = featured ? '#fff2cd' : '#ddd1ea';
      ctx.fillRect(x - .8, pointY - .8, 1.6, 1.6);
      if (!featured || width < 425) continue;
      ctx.strokeStyle = '#ddc3936b';
      ctx.beginPath();
      ctx.moveTo(x + 5, pointY);
      ctx.lineTo(x + 18, pointY);
      ctx.stroke();
      ctx.fillStyle = '#e1c9a3b0';
      ctx.font = `${framed ? 18 : 10}px ui-monospace, monospace`;
      ctx.fillText((sign < 0 ? '−' : '+') + ordinate.toFixed(3) + 'i', x + 23, pointY + (framed ? 6 : 3));
    }
  }

  if (!framed) return;
  ctx.strokeStyle = '#d7b87b9e';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(10, 10, width - 20, height - 20);
  ctx.strokeStyle = '#d7b87b39';
  ctx.strokeRect(17, 17, width - 34, height - 34);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f3d7a6';
  ctx.font = '39px Georgia, serif';
  ctx.fillText('Atlas of Zeta Zeros', width / 2, height * .10);
  ctx.fillStyle = '#c8b99e';
  ctx.font = '20px ui-monospace, monospace';
  ctx.fillText('Re(s) = ½', width / 2, height * .92);
}

export function mountZeroAtlas(canvas, reducedMotion) {
  const observer = new ResizeObserver(() => {
    const {clientWidth: width, clientHeight: height} = canvas;
    drawZeroAtlas(canvas, {width, height, ratio: Math.min(window.devicePixelRatio || 1, 1.65)});
  });
  observer.observe(canvas);
  if (reducedMotion || !matchMedia('(pointer: fine)').matches) return;
  const entrance = document.getElementById('intro');
  const museum = document.getElementById('museum');
  museum.addEventListener('pointermove', (event) => {
    if (entrance.hidden) return;
    const bounds = museum.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    canvas.style.setProperty('--atlas-x', `${x * 17}px`);
    canvas.style.setProperty('--atlas-y', `${y * 13}px`);
  });
  museum.addEventListener('pointerleave', () => {
    canvas.style.removeProperty('--atlas-x');
    canvas.style.removeProperty('--atlas-y');
  });
}
