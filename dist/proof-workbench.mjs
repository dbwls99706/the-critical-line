import {liftCosts, poleLogRatio, primeSignal, samplePrimes, splitSign} from './proof-math.mjs';

function node(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}

function button(label, onClick) {
  const item = node('button', 'model-button', label);
  item.type = 'button';
  item.addEventListener('click', onClick);
  return item;
}

function readings(root, values) {
  const row = node('dl', 'model-readings');
  root.append(row);
  return values.map(([label, value]) => {
    const cell = node('div');
    const result = node('dd', '', value);
    cell.append(node('dt', '', label), result);
    row.append(cell);
    return result;
  });
}

export function mountPrimeErrorModel(root, words, scale) {
  const section = node('section', 'prime-error-model');
  section.append(node('h3', '', words.title), node('p', 'prime-error-copy', words.explanation));
  const example = node('div', 'prime-count-example');
  example.append(node('strong', '', words.example));
  const values = node('dl');
  for (const [label, value] of [[words.estimate, '≈ 1,246'], [words.exact, '1,229']]) {
    const column = node('div');
    column.append(node('dt', '', label), node('dd', '', value));
    values.append(column);
  }
  example.append(values);
  section.append(example);

  const chartTitle = node('p', 'prime-error-heading', words.comparison);
  const plot = node('dl', 'prime-error-bars');
  const rows = [words.reference + ' · ½', ''].map((label) => {
    const row = node('div');
    const name = node('dt', '', label);
    const value = node('dd');
    const track = node('span', 'prime-error-track');
    const bar = node('span', 'prime-error-fill');
    const result = node('span', 'prime-error-factor');
    track.setAttribute('aria-hidden', 'true');
    track.append(bar);
    value.append(track, result);
    row.append(name, value);
    plot.append(row);
    return {name, bar, result};
  });
  plot.setAttribute('aria-live', 'polite');
  plot.setAttribute('aria-atomic', 'true');
  section.append(chartTitle, plot, node('p', 'prime-error-caption', words.caption));
  root.append(section);

  const max = scale ** .25;
  return (index, beta) => {
    const factors = [1, scale ** (beta - .5)];
    rows[1].name.textContent = words.position(index + 1) + ' · ' + (beta === .5 ? '½' : beta.toFixed(3));
    rows.forEach(({bar, result}, i) => {
      bar.style.width = 100 * factors[i] / max + '%';
      result.textContent = Number(factors[i].toFixed(2)) + '×';
    });
  };
}

function formula(root, text) {
  root.append(node('p', 'model-formula', text));
}

function chart(root, label, draw) {
  const canvas = node('canvas', 'model-chart');
  canvas.width = 680;
  canvas.height = 220;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', label);
  root.append(canvas);
  const ctx = canvas.getContext('2d');
  const paint = (data) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, 680, 220);
    ctx.fillStyle = '#15151c';
    ctx.fillRect(0, 0, 680, 220);
    ctx.strokeStyle = '#b8b1cf22';
    ctx.lineWidth = 1;
    for (const y of [25, 64, 103, 142, 181]) {
      ctx.beginPath();
      ctx.moveTo(42, y);
      ctx.lineTo(652, y);
      ctx.stroke();
    }
    ctx.font = '19px monospace';
    draw(ctx, data);
  };
  return {canvas, paint};
}

function line(ctx, points, color, width = 2, dash = []) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  for (const [x, y] of points) ctx.lineTo(x, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function dot(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, 2 * Math.PI);
  ctx.fill();
}

function number(value) {
  return value >= 10000 ? value.toExponential(1) : Number(value.toFixed(2)).toLocaleString();
}

function signal(root, {state, words, complete, say, slider}) {
  const [sum, main, error] = readings(root, [[words.measured], [words.baseline], [words.remainder]]);
  const plot = chart(root, words.rooms[3].hint, (ctx, {terms, cutoff, selected}) => {
    const max = Math.max(...terms.map(({weight}) => weight));
    for (const {n, base, weight} of terms) {
      if (!base) continue;
      const x = 44 + (n - 2) * 9.45;
      const height = Math.max(2, weight / max * 145);
      ctx.fillStyle = n === 27 ? '#f8d0ff' : base === n ? '#e8ba76' : '#9f8fba';
      ctx.fillRect(x, 181 - height, 5, height);
    }
    const x = 44 + (cutoff - 2) * 9.45;
    line(ctx, [[x, 20], [x, 181]], '#e8ba76', 2, [5, 6]);
    ctx.fillStyle = '#e2cfac';
    ctx.fillText('2', 44, 206);
    ctx.fillText('27', 268, 206);
    ctx.fillText('64', 608, 206);
    if (selected) dot(ctx, 283, 167, '#f8d0ff');
  });
  const inspect = button(words.inspect28, () => {
    state.values[1] = 1;
    render(state.values[0]);
    complete();
  });
  function render(cutoff) {
    const values = primeSignal(cutoff);
    const selected = !!state.values[1] && cutoff > 27;
    sum.textContent = number(values.sum);
    main.textContent = number(values.baseline);
    error.textContent = number(values.remainder);
    plot.paint({...values, cutoff, selected});
    inspect.disabled = cutoff <= 27;
    inspect.setAttribute('aria-pressed', String(selected));
    if (selected) {
      const weight = values.terms.find(({n}) => n === 27).weight;
      say(`27 = 3³ · log 3 × (${cutoff}/27 − 1) ≈ ${number(weight)}. ${words.signalDone}`);
    } else say(words.signalTask);
  }
  slider(words.xValue, 12, 64, 1, state.values[0], (value, out) => {
    out.textContent = value;
    state.values[0] = value;
    render(value);
  });
  root.append(inspect);
  plot.canvas.addEventListener('pointerup', (event) => {
    const bounds = plot.canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * plot.canvas.width;
    if (Math.abs(x - 283) <= 14 && !inspect.disabled) inspect.click();
  });
  formula(root, 'G₁(x) = Σₙ≤ₓ Λ(n)(x/n − 1) − x log x + (1 + γ)x');
}

const sampleFactors = {5: [2,1], 13: [3,2], 17: [4,1], 29: [5,2]};
function inert(root, {state, words, complete, say}) {
  const options = node('div', 'model-options');
  options.setAttribute('role', 'group');
  options.setAttribute('aria-label', words.choosePrime);
  const choices = samplePrimes.map((prime) => button(String(prime), () => {
    const sign = splitSign(prime);
    state.values[0] = prime;
    state.count |= sign === 1 ? 1 : 2;
    render();
    if (state.count === 3) complete();
  }));
  options.append(...choices);
  root.append(options);
  const [mod, sign, weight] = readings(root, [[words.mod], ['χ₋₄(p)'], ['1 − χ₋₄(p)']]);
  const diagram = node('div', 'prime-diagram');
  root.append(diagram);
  function render() {
    const p = state.values[0];
    const value = p ? splitSign(p) : null;
    choices.forEach((item, index) => item.setAttribute('aria-pressed', String(samplePrimes[index] === p)));
    mod.textContent = p ? p % 4 : '·';
    sign.textContent = value ?? '·';
    weight.textContent = p ? 1 - value : '·';
    diagram.classList.toggle('inert', value === -1);
    if (value === 1) {
      const [a,b] = sampleFactors[p];
      diagram.replaceChildren(node('strong', '', p), node('span', '', '='), node('span', 'prime-branch', `(${a} + ${b}i)(${a} − ${b}i)`));
    } else {
      diagram.replaceChildren(node('strong', '', p || 'ℤ[i]'), node('span', 'prime-branch', p ? words.inert : words.choosePrime));
    }
    say(state.count === 3 ? words.inertDone : words.inertTask);
  }
  render();
}

function theta(root, {state, words, complete, say, slider}) {
  const [mOut, sharedOut, localOut] = readings(root, [[words.liftCount], [words.sharedCost], [words.chainCost]]);
  const draw = chart(root, words.rooms[5].hint, (ctx, {x, power, degree, total}) => {
    const ceiling = Math.log10(x) + .5;
    const yOf = (cost) => 181 - Math.log10(cost) / ceiling * 152;
    const xOf = (p) => 44 + p / (Math.log10(x) / 2 + 1) * 600;
    const samples = Array.from({length: 101}, (_, i) => i / 100 * (Math.log10(x) / 2 + 1));
    ctx.save();
    ctx.beginPath();
    ctx.rect(43, 20, 603, 162);
    ctx.clip();
    line(ctx, samples.map((p) => [xOf(p), yOf(x / 10 ** p)]), '#e8ba76', 3);
    line(ctx, samples.map((p) => [xOf(p), yOf(10 ** (p * degree))]), '#a9eacb', 3);
    line(ctx, samples.map((p) => [xOf(p), yOf(x / 10 ** p + 10 ** (p * degree))]), '#eae3f2', 2, [5, 5]);
    line(ctx, [[xOf(power), 21], [xOf(power), 181]], '#8bddbc', 2, [3, 4]);
    dot(ctx, xOf(power), yOf(total), '#effbe9');
    ctx.restore();
    ctx.fillStyle = '#c3e0d3';
    ctx.fillText('log₁₀ m', 541, 207);
    ctx.fillText('1', 44, 207);
  });
  const choices = node('div', 'model-options');
  const switches = [2, 1].map((degree) => button(degree === 1 ? 'x/m + m' : 'x/m + m²', () => {
    state.values[2] = degree;
    state.count |= degree === 1 ? 1 : 2;
    render();
  }));
  choices.append(...switches);
  root.append(choices);
  let scaleOut, scaleInput, liftInput, liftOut;
  function render() {
    if (!liftOut || !liftInput) return;
    const [exponent, power, degree] = state.values;
    const x = 10 ** exponent;
    const {m, shared, local, total} = liftCosts(x, power, degree);
    const close = Math.max(shared, local) / Math.min(shared, local) <= 1.3;
    switches.forEach((item, i) => item.setAttribute('aria-pressed', String(degree === [2, 1][i])));
    scaleOut.textContent = `10^${exponent}`;
    liftOut.textContent = number(m);
    scaleInput.setAttribute('aria-valuetext', number(x));
    liftInput?.setAttribute('aria-valuetext', number(m));
    mOut.textContent = number(m);
    sharedOut.textContent = number(shared);
    localOut.textContent = number(local);
    draw.paint({x, power, degree, total});
    say(close ? words.balanced : words.compare);
    if (close && degree === 1 && state.count === 3) complete();
  }
  function clampLift(exponent) {
    if (!liftInput) return;
    liftInput.max = exponent / 2 + 1;
    state.values[1] = Number(liftInput.value);
    render();
  }
  scaleInput = slider(words.scale, 2, 6, 1, state.values[0], (value, output) => {
    scaleOut = output;
    state.values[0] = value;
    clampLift(value);
  });
  liftInput = slider(words.liftCount, 0, state.values[0] / 2 + 1, .025, state.values[1], (value, output) => {
    liftOut = output;
    state.values[1] = value;
    render();
  });
  render();
}

function landau(root, {state, words, complete, say, slider}) {
  const plot = chart(root, words.rooms[6].hint, (ctx, {beta, k, accepted}) => {
    const x = (value) => 64 + value * 568;
    ctx.fillStyle = accepted ? '#86c9a337' : '#a4bcff20';
    ctx.fillRect(x(.5), 25, 630 - x(.5), 133);
    line(ctx, [[x(.5), 21], [x(.5), 160]], '#bad2ff', 3);
    line(ctx, [[64, 94], [631, 94]], '#908fac', 1);
    if (!accepted) dot(ctx, x(beta), 94, '#f1bb88');
    ctx.fillStyle = '#d4d9f3';
    ctx.fillText('0', x(0), 180);
    ctx.fillText('½', x(.5) - 5, 180);
    ctx.fillText('1', x(1) - 10, 180);
    ctx.fillText('Re s', 520, 180);
    const magnitude = Math.max(0, poleLogRatio(beta, k));
    ctx.fillStyle = '#edbc85';
    ctx.fillRect(64, 196, 548 * Math.min(1, magnitude / 6), 5);
  });
  const [ratio] = readings(root, [[words.logRatio]]);
  const apply = button(words.test, () => {
    state.values[2] = 1;
    complete();
    render();
  });
  function render() {
    const [beta, k, accepted] = state.values;
    const magnitude = poleLogRatio(beta, k);
    ratio.textContent = magnitude.toFixed(2);
    apply.disabled = !!accepted || beta < .65 || k < 16;
    apply.textContent = accepted ? words.clearRight : words.test;
    plot.paint({beta, k, accepted});
    say(accepted ? words.poleDone : apply.disabled ? words.poleTask : words.poleReady);
  }
  slider(words.probe, .25, .95, .01, state.values[0], (value, output) => {
    output.textContent = value.toFixed(2);
    state.values[0] = value;
    render();
  });
  slider(words.term, 0, 60, 1, state.values[1], (value, output) => {
    output.textContent = value;
    state.values[1] = value;
    render();
  });
  root.append(apply);
  formula(root, '|aₖ(β)| / |aₖ(½)| = [(σ − ½)/(σ − β)]ᵏ⁺¹');
}

export const workshops = {3: signal, 4: inert, 5: theta, 6: landau};
