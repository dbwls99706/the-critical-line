const windup = .09;
export const punchContact = .19;
export const punchLength = .43;
const ease = (value) => value * value * (3 - 2 * value);
const mix = (a, b, t) => a + (b - a) * t;

export function punchPose(age) {
  if (age < 0 || age >= punchLength) return null;
  if (age < windup) return {reach: -.15 * ease(age / windup), alpha: Math.min(1, age / .06)};
  if (age <= punchContact) {
    const t = (age - windup) / (punchContact - windup);
    return {reach: mix(-.15, 1, t ** 1.65), alpha: 1};
  }
  const t = (age - punchContact) / (punchLength - punchContact);
  return {reach: 1 - ease(t), alpha: Math.min(1, (1 - t) * 3)};
}

function capsule(ctx, x, y, w, h, radius, paint, edge = '#302325') {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = paint;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function shade(ctx, x1, y1, x2, y2, stops) {
  const paint = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(([stop, color]) => paint.addColorStop(stop, color));
  return paint;
}

export function createHands(canvas, reducedMotion) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  let visible = false;
  return (age, side, impactAge) => {
    const pose = punchPose(age);
    const flash = impactAge >= 0 && impactAge < .16;
    if (!pose && !flash && !visible) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.65);
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    visible = !!pose || flash;

    if (pose) {
      const t = reducedMotion ? .66 : pose.reach;
      const unit = Math.min(width, height) / 700;
      const tip = [width * (.5 + side * (.195 - .161 * t)), height * (.86 - .305 * t)];
      const elbow = [width * (.5 + side * (.33 - .035 * t)), height * 1.08];
      ctx.save();
      ctx.globalAlpha = pose.alpha;
      ctx.translate(...tip);
      ctx.rotate(Math.atan2(tip[0] - elbow[0], elbow[1] - tip[1]));
      ctx.scale(-side * unit, unit);
      const depth = 1.12 - .30 * t;
      ctx.scale(depth, depth);
      const sleeve = shade(ctx, -43, 20, 45, 48, [[0,'#29252d'],[.47,'#62534b'],[.73,'#473a39'],[1,'#211d24']]);
      ctx.beginPath();
      ctx.moveTo(-22, 24);
      ctx.quadraticCurveTo(-31, 77, -48, 159);
      ctx.lineTo(-83, 460);
      ctx.lineTo(91, 460);
      ctx.lineTo(50, 164);
      ctx.quadraticCurveTo(35, 91, 24, 25);
      ctx.closePath();
      ctx.fillStyle = sleeve;
      ctx.fill();
      capsule(ctx, -27, 18, 54, 32, 10, '#463631', '#8a6a55');
      const leather = shade(ctx,-33,-56,32,45,[[0,'#d2a67c'],[.25,'#a57355'],[.57,'#734c3f'],[1,'#3d3135']]);
      capsule(ctx, -31, -36, 62, 64, [15,16,18,16], leather);
      for (let i = 0; i < 4; i++) {
        const y = -47 + [6,0,2,8][i];
        const strip = shade(ctx,0,y,0,y + 36,[[0,'#bb8f70'],[.24,'#9e7054'],[1,'#665048']]);
        capsule(ctx, -29 + i * 14.5, y, 15.5, 32, [7,7,6,6], strip,'#6a4c42');
      }
      ctx.save();
      ctx.translate(-27, -5);
      ctx.rotate(-.48);
      capsule(ctx, -11, -5, 22, 37, 11, leather, '#54382f');
      ctx.restore();
      ctx.restore();
    }
    if (flash) {
      ctx.globalAlpha = (1 - impactAge / .16) * .82;
      ctx.strokeStyle = '#ffe1a9';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 6 + impactAge * 98, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };
}
