import { building, columnRows, columnX, hall, hallPiece, portals, spine, stations } from './gallery-layout.mjs';

const xSpan = building.right - building.left;
const zSpan = building.entrance - building.back;
const inset = {x: .075, z: .08};
let target = null;
const colorOf = ({color}) => '#' + color.toString(16).padStart(6, '0');

export function planPoint(x, z) {
  return [
    inset.x + (x - building.left) / xSpan * (1 - 2 * inset.x),
    inset.z + (z - building.back) / zSpan * (1 - 2 * inset.z),
  ];
}

export function placeOnPlan(node, x, z) {
  const [left, top] = planPoint(x, z);
  node.style.left = (left * 100).toFixed(2) + '%';
  node.style.top = (top * 100).toFixed(2) + '%';
}

function renderPlan(canvas, mini) {
  const box = canvas.getBoundingClientRect();
  const width = box.width;
  const height = box.height;
  if (!width || !height) return;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(ratio, ratio);
  const point = (x, z) => {
    const [left, top] = planPoint(x, z);
    return [left * width, top * height];
  };
  const rectangle = (x1, z1, x2, z2, fill, stroke) => {
    const [x, y] = point(x1, z1);
    const [right, bottom] = point(x2, z2);
    const w = right - x;
    const h = bottom - y;
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.strokeRect(x, y, w, h);
    }
  };
  const line = (points, color, weight = 1, dash = []) => {
    ctx.beginPath();
    ctx.moveTo(...point(...points[0]));
    for (const pair of points.slice(1)) ctx.lineTo(...point(...pair));
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  const disc = (x, z, radius, color, outline) => {
    ctx.beginPath();
    ctx.arc(...point(x, z), radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.stroke();
    }
  };
  const {left, right, entrance, back} = building;
  ctx.fillStyle = '#211b23';
  ctx.fillRect(0, 0, width, height);
  const grid = mini ? 4 : 2;
  for (let x = -12; x <= 12; x += grid) line([[x, back], [x, entrance]], '#9d886627', .6);
  for (let z = -54; z < entrance; z += grid) line([[left, z], [right, z]], '#9d886627', .6);
  ctx.lineWidth = mini ? .8 : 1.35;
  rectangle(left, back, right, entrance, null, '#d0b68c8c');
  rectangle(-columnX, back, columnX, entrance, '#d8b7890d', null);
  ctx.lineDashOffset = 0;
  for (const side of [-1, 1]) {
    line([[side * columnX, back], [side * columnX, entrance - 2.2]], '#c4ad8c4d', .65, mini ? [] : [2.5, 4]);
    for (const z of columnRows) {
      rectangle(side * columnX - .36, z - .38, side * columnX + .36, z + .38, '#c6ad89', null);
    }
  }
  for (const station of stations) {
    const half = (station.width ?? 5.2) / 2;
    rectangle(station.aimX - half, station.wallZ, station.aimX + half, station.z, '#c8b49912', '#c8b49959');
    line([[station.aimX - half, station.wallZ], [station.aimX + half, station.wallZ]], colorOf(station) + 'a0', mini ? .7 : 1.6);
  }
  for (const z of portals) {
    line([[-4.6, z], [4.6, z]], '#c3ab868d', .7, mini ? [] : [3, 3]);
  }
  rectangle(hallPiece.x - hallPiece.width / 2, hallPiece.z - hallPiece.length / 2,
    hallPiece.x + hallPiece.width / 2, hallPiece.z + hallPiece.length / 2, '#d2b28614', '#d2b2867c');
  disc(hallPiece.x, hallPiece.z, mini ? 2.4 : 7, '#d2b28664', '#e8c995bf');
  line(spine, '#d3a66e99', mini ? .65 : 1.45, mini ? [] : [4, 4]);
  for (const station of stations) {
    disc(station.aimX, station.aimZ, mini ? 1.6 : 3.6, colorOf(station));
  }
  if (target) disc(target.x, target.z, mini ? 3.3 : 6.2, '#fdde9666', '#ffe6ad');
  line([[-1.42, entrance - .14], [1.42, entrance - .14]], '#f0cea1', mini ? 1.1 : 2.4);
  disc(hall.x, hall.z, mini ? 1 : 2.6, '#f0cea18f');
}

export function showPlanTarget(next) {
  target = next;
  for (const [id, mini] of [['mini-canvas', true], ['floor-canvas', false]]) {
    renderPlan(document.getElementById(id), mini);
  }
}

export function attachPlans() {
  const floor = document.getElementById('floor-canvas');
  const mini = document.getElementById('mini-canvas');
  const resize = new ResizeObserver((entries) => {
    for (const {target} of entries) renderPlan(target, target === mini);
  });
  resize.observe(floor);
  resize.observe(mini);
  for (const button of document.querySelectorAll('button[data-room]')) {
    const station = stations[Number(button.dataset.room)];
    button.style.setProperty('--pin', colorOf(station));
    placeOnPlan(button, station.x, station.aimZ + (station.aimZ < -48 ? 3.5 : 2.7));
  }
  placeOnPlan(document.getElementById('floor-entry'), 0, 8.45);
  placeOnPlan(document.getElementById('floor-axis'), hallPiece.x, hallPiece.z + 1.8);
}
