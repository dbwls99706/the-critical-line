import { canSieve, parseInteger, primeBounds } from './math.mjs';

const byId = (id) => document.getElementById(id);
const integerFormat = new Intl.NumberFormat('en-US');
const cases = {
  small: ['1e8', '1e6'],
  edge: ['1e30', '1e17'],
  huge: ['1e30', '1e18'],
};
const sources = {
  main: {
    path: 'src/Main.lean',
    upstream: 'https://github.com/CocoSgt/riemann-hypothesis-lean/blob/main/src/Main.lean',
    hash: '017645ca448f2fd1f6fd5c4c2cb2c6e96e472725be13f6e180ca6e1574360939',
    lines: [1, 2, 3, 4],
    detail: '리만가설 명제는 Mathlib에 정의되어 있습니다. 이 진입점은 증명 라이브러리에서 가져온 rhOfAll을 그 명제의 증명으로 선언합니다.',
  },
  arithmetic: {
    path: 'ArithSolution.lean',
    upstream: 'https://math.mit.edu/~drew/grh/ArithSolution.lean',
    hash: 'cda0f06e9000beb855648ce0367d19a0d0c2da51ad8244c5db6ba8e7279a97c4',
    lines: [1, 2, 9, 10, 11, 12, 13],
    detail: 'Sutherland는 이 증명을 Robin1984와 결합했습니다. 선택한 줄은 5,040보다 큰 모든 정수에서 약수합이 일정한 한계 아래에 있음을 증명합니다. 소수 실험은 별도로 Schoenfeld의 부등식을 사용합니다.',
  },
};

const startInput = byId('start');
const widthInput = byId('width');
const scaleSlider = byId('width-scale');
const plot = byId('bound-plot');
const countButton = byId('count-exact');
const caseButtons = [...document.querySelectorAll('[data-case]')];
const sourceButtons = [...document.querySelectorAll('[data-source]')];

let currentBounds;
let baseWidth;
let sieveWorker;
let currentSource;
let sourceBytes;
let hashVersion = 0;

function exactInteger(value) {
  return integerFormat.format(value);
}

function displayInteger(element, value) {
  const digits = value.toString();
  element.title = exactInteger(value);
  element.textContent = exactInteger(value);
  if (digits.length <= 11) return;
  const exponent = document.createElement('sup');
  exponent.textContent = String(digits.length - 1);
  element.replaceChildren(`≈ ${(Number(digits.slice(0, 8)) / 10 ** 7).toFixed(3)} × 10`, exponent);
}

function compact(value) {
  if (value === 0) return '0';
  if (Math.abs(value) < 10000) return String(Math.round(value));
  return value.toExponential(1).replace('e+', 'e').replace('.0e', 'e');
}

function drawPlot() {
  if (!currentBounds || !baseWidth) return;
  const { width, height } = plot.getBoundingClientRect();
  if (width < 1 || height < 1) return;
  const pixelRatio = Math.min(2, devicePixelRatio || 1);
  plot.width = Math.round(width * pixelRatio);
  plot.height = Math.round(height * pixelRatio);
  const context = plot.getContext('2d');
  context.scale(pixelRatio, pixelRatio);
  const a = Number(currentBounds.a);
  const magnitude = Number(baseWidth);
  const currentWidth = Number(currentBounds.width);
  const logA = Math.log(a);
  const frame = { left: width < 350 ? 45 : 52, top: 24, right: width - 18, bottom: height - 31 };
  const maxWidth = Math.min(magnitude * 12, Number(10n ** 60n - currentBounds.a));
  const minWidth = Math.min(maxWidth, Math.max(1, magnitude / 30));
  const logMin = Math.log(minWidth);
  const logSpan = Math.log(maxWidth) - logMin;
  const horizontal = (span) => frame.left + (frame.right - frame.left) *
    (logSpan === 0 ? 0.5 : (Math.log(span) - logMin) / logSpan);
  const estimatedRange = (span) => {
    const b = a + span;
    const logB = Math.log(b);
    const error = (Math.sqrt(a) * logA + Math.sqrt(b) * logB) / (8 * Math.PI);
    return [Math.max(0, span / logB - error), Math.min(span, span / logA + error)];
  };
  const yMax = Math.max(1, estimatedRange(maxWidth)[1]) * 1.05;
  const vertical = (value) => frame.bottom - (frame.bottom - frame.top) * Math.min(value / yMax, 1);
  const samples = Array.from({length: 121}, (_, index) => {
    const span = Math.exp(logMin + logSpan * index / 120);
    const [lower, upper] = estimatedRange(span);
    return [horizontal(span), vertical(lower), vertical(upper)];
  });
  const path = (coordinate, move) => {
    samples.forEach((sample, index) => {
      if (index === 0 && move) context.moveTo(sample[0], sample[coordinate]);
      else context.lineTo(sample[0], sample[coordinate]);
    });
  };

  context.font = '11px ui-monospace, monospace';
  context.strokeStyle = '#2a4058';
  context.fillStyle = '#a1b7ce';
  for (let row = 0; row <= 4; row++) {
    const value = yMax * row / 4;
    const y = vertical(value);
    context.beginPath();
    context.moveTo(frame.left, y);
    context.lineTo(frame.right, y);
    context.stroke();
    context.textAlign = 'right';
    context.fillText(compact(value), frame.left - 7, y + 4);
  }
  for (let col = 0; col <= 4; col++) {
    const value = Math.exp(logMin + logSpan * col / 4);
    const x = frame.left + (frame.right - frame.left) * col / 4;
    context.beginPath();
    context.moveTo(x, frame.top);
    context.lineTo(x, frame.bottom);
    context.stroke();
    if (logSpan === 0 && col !== 2) continue;
    context.textAlign = col === 0 ? 'left' : col === 4 ? 'right' : 'center';
    context.fillText(compact(Math.max(1, value)), x, frame.bottom + 19);
  }

  const gradient = context.createLinearGradient(0, frame.top, 0, frame.bottom);
  gradient.addColorStop(0, '#66d9f290');
  gradient.addColorStop(1, '#3f9ebc1a');
  context.beginPath();
  path(2, true);
  for (let i = samples.length - 1; i >= 0; i--) context.lineTo(samples[i][0], samples[i][1]);
  context.closePath();
  context.fillStyle = gradient;
  context.fill();
  context.lineWidth = 1.8;
  context.strokeStyle = '#9cf0fd';
  context.beginPath();
  path(2, true);
  context.stroke();
  context.strokeStyle = '#5bb9d4';
  context.beginPath();
  path(1, true);
  context.stroke();

  const marker = horizontal(currentWidth);
  const lowY = vertical(Number(currentBounds.lower));
  const highY = vertical(Number(currentBounds.upper));
  context.lineWidth = 1;
  context.strokeStyle = '#faca8b';
  context.setLineDash([4, 4]);
  context.beginPath();
  context.moveTo(marker, frame.top);
  context.lineTo(marker, frame.bottom);
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = '#faca8b';
  for (const y of [lowY, highY]) {
    context.beginPath();
    context.arc(marker, y, 3, 0, Math.PI * 2);
    context.fill();
  }
  context.textAlign = 'center';
  context.fillText('Δ', marker, frame.top - 7);
}

function setCaseButton(activeCase) {
  for (const button of caseButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.case === activeCase));
  }
}

function setError(message = '') {
  const error = byId('form-error');
  error.hidden = !message;
  error.textContent = message;
}

function stopSieve() {
  sieveWorker?.terminate();
  sieveWorker = null;
  countButton.disabled = false;
}

function renderBounds(bounds) {
  currentBounds = bounds;
  stopSieve();
  const { a, lower, upper, width } = bounds;
  setError();
  displayInteger(byId('lower'), lower);
  displayInteger(byId('upper'), upper);
  byId('left-label').textContent = exactInteger(lower);
  byId('right-label').textContent = exactInteger(upper);
  const state = byId('range-state');
  state.textContent = lower > 0n ? '소수 존재 보장' : '하한 0';
  state.dataset.tone = lower > 0n ? 'good' : 'warn';
  byId('result-note').textContent = lower > 0n
    ? '이 구간에는 적어도 아래 왼쪽의 정수만큼 소수가 있습니다.'
    : '이 오차 한계로는 소수가 한 개 이상 있는지 판정할 수 없습니다.';
  byId('exact-section').hidden = !canSieve(a, width);
  byId('exact-copy').textContent = '';
  byId('exact-mark').hidden = true;
  byId('top-scale').textContent = `a = ${compact(Number(a))}`;
  drawPlot();
}

function resetSlider(width) {
  baseWidth = width;
  scaleSlider.value = '0';
  byId('scale-value').textContent = '×1.00';
}

function selectCase(name) {
  const [start, width] = cases[name];
  startInput.value = start;
  widthInput.value = width;
  resetSlider(parseInteger(width));
  setCaseButton(name);
  byId('receipt-message').hidden = true;
  renderBounds(primeBounds(parseInteger(start), baseWidth));
}

byId('interval-form').addEventListener('submit', (event) => {
  event.preventDefault();
  byId('receipt-message').hidden = true;
  try {
    const bounds = primeBounds(parseInteger(startInput.value), parseInteger(widthInput.value));
    resetSlider(bounds.width);
    setCaseButton();
    renderBounds(bounds);
  } catch (error) {
    setError(error.message);
  }
});

for (const button of caseButtons) {
  button.addEventListener('click', () => selectCase(button.dataset.case));
}

scaleSlider.addEventListener('input', () => {
  const factor = 10 ** (Number(scaleSlider.value) / 20);
  const numerator = BigInt(Math.round(10000 * factor));
  const candidate = (baseWidth * numerator + 5000n) / 10000n;
  try {
    const a = parseInteger(startInput.value);
    const room = 10n ** 60n - a;
    const width = candidate > room ? room : candidate > 0n ? candidate : 1n;
    const bounds = primeBounds(a, width);
    widthInput.value = width.toString();
    byId('scale-value').textContent = `×${(Number(width) / Number(baseWidth)).toFixed(2)}`;
    setCaseButton();
    byId('receipt-message').hidden = true;
    renderBounds(bounds);
  } catch (error) {
    setError(error.message);
  }
});

countButton.addEventListener('click', () => {
  const bounds = currentBounds;
  if (!canSieve(bounds.a, bounds.width)) return;
  stopSieve();
  const exact = byId('exact-copy');
  countButton.disabled = true;
  exact.textContent = '구간을 직접 세는 중…';
  try {
    sieveWorker = new Worker(new URL('./sieve.mjs', import.meta.url), {type: 'module'});
    sieveWorker.onmessage = ({data}) => {
      stopSieve();
      if (data.error) {
        exact.textContent = data.error;
        return;
      }
      const { count } = data;
      const inside = bounds.lower <= count && count <= bounds.upper;
      exact.textContent = `${exactInteger(count)}개 · ${inside ? '계산 범위 안' : '계산 범위 밖'}`;
      if (!inside) return;
      const ratio = bounds.upper === bounds.lower ? 0.5 :
        Number(count - bounds.lower) / Number(bounds.upper - bounds.lower);
      const mark = byId('exact-mark');
      mark.style.left = `${ratio * 100}%`;
      mark.hidden = false;
    };
    sieveWorker.onerror = () => {
      stopSieve();
      exact.textContent = '브라우저에서 구간 체를 실행하지 못했습니다.';
    };
    sieveWorker.postMessage({a: bounds.a, width: bounds.width});
  } catch {
    stopSieve();
    exact.textContent = '브라우저에서 구간 체를 실행하지 못했습니다.';
  }
});

function receiptFrom(bounds) {
  return {
    schema: 'riemann-proof-lab/prime-interval-v1',
    premise: 'RiemannHypothesis',
    theorem: 'Schoenfeld 1976, Corollary 1',
    proofEntrySha256: sources.main.hash,
    ...Object.fromEntries(Object.entries(bounds).map(([key, value]) => [key, value.toString()])),
  };
}

byId('download').addEventListener('click', () => {
  const receipt = JSON.stringify(receiptFrom(currentBounds), null, 2) + '\n';
  const url = URL.createObjectURL(new Blob([receipt], {type: 'application/json'}));
  const link = Object.assign(document.createElement('a'), {href: url, download: 'riemann-prime-interval.json'});
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

byId('receipt-file').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  const message = byId('receipt-message');
  event.target.value = '';
  if (!file) return;
  message.hidden = false;
  try {
    if (file.size > 16000) throw new Error('큰 파일');
    const supplied = JSON.parse(await file.text());
    if (typeof supplied.a !== 'string' || typeof supplied.width !== 'string') throw new Error('잘못된 입력');
    const bounds = primeBounds(parseInteger(supplied.a), parseInteger(supplied.width));
    const recomputed = receiptFrom(bounds);
    if (!Object.entries(recomputed).every(([key, value]) => supplied[key] === value)) throw new Error('값 불일치');
    startInput.value = bounds.a.toString();
    widthInput.value = bounds.width.toString();
    resetSlider(bounds.width);
    setCaseButton();
    renderBounds(bounds);
    message.dataset.error = 'false';
    message.textContent = '검사 통과 · 입력과 오차 상한, 소수 개수 범위가 일치합니다.';
  } catch {
    message.dataset.error = 'true';
    message.textContent = '기록이 올바른 형식인지 확인해 주세요. 다시 계산한 값과 일치해야 합니다.';
  }
});

const defaultHashNote = '파일의 바이트 지문을 비교합니다. 정리 검증 결과는 아래 독립 검사 기록에서 확인할 수 있습니다.';

function setHashStatus(label, tone, hash, note) {
  const status = byId('hash-status');
  status.textContent = label;
  status.dataset.tone = tone;
  byId('hash-output').textContent = hash;
  byId('hash-note').textContent = note;
}

async function verifyBytes(bytes, name, version) {
  if (!crypto.subtle) {
    setHashStatus('환경 확인', 'warn', sources[currentSource].hash, '파일 지문 계산에는 HTTPS가 필요합니다.');
    return;
  }
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  if (version !== hashVersion) return;
  const hash = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const match = hash === sources[currentSource].hash;
  const suffix = match ? '' : ` 기준 지문 ${sources[currentSource].hash}.`;
  setHashStatus(match ? '지문 일치' : '지문 불일치', match ? 'good' : 'warn', hash, `${name}. ${defaultHashNote}${suffix}`);
}

function showCodeExcerpt(bytes, lineNumbers) {
  const code = byId('source-code');
  const lines = new TextDecoder().decode(bytes).split('\n');
  const rows = lineNumbers.map((lineNumber) => {
    const row = document.createElement('span');
    row.className = 'code-line';
    const number = document.createElement('span');
    number.className = 'line-no';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(lineNumber).padStart(2, '0');
    row.append(number);
    const line = lines[lineNumber - 1] ?? '';
    for (const word of line.split(/(\bimport\b|\btheorem\b|\briemannHypothesis\b|\bRiemannHypothesis\b)/g)) {
      const highlight = ['import', 'theorem'].includes(word) ? 'code-key' :
        ['riemannHypothesis', 'RiemannHypothesis'].includes(word) ? 'code-symbol' : '';
      if (!highlight) {
        row.append(document.createTextNode(word));
        continue;
      }
      const token = document.createElement('span');
      token.className = highlight;
      token.textContent = word;
      row.append(token);
    }
    return row;
  });
  code.replaceChildren(...rows);
}

async function selectSource(key) {
  currentSource = key;
  sourceBytes = null;
  const version = ++hashVersion;
  const source = sources[key];
  byId('file-path').textContent = source.path;
  byId('upstream').href = source.upstream;
  byId('source-explanation').textContent = source.detail;
  byId('source-code').textContent = '원본의 주요 줄을 불러오는 중';
  byId('tamper').disabled = true;
  byId('lean-file').disabled = true;
  setHashStatus('확인 중', 'good', source.hash, defaultHashNote);
  for (const button of sourceButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.source === key));
  }
  try {
    const response = await fetch(`./data/${key}.txt`);
    if (!response.ok) throw new Error('파일 응답');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (version !== hashVersion) return;
    sourceBytes = bytes;
    showCodeExcerpt(bytes, source.lines);
    await verifyBytes(bytes, '공개본 주요 줄 표시', version);
    if (version !== hashVersion) return;
    byId('tamper').textContent = '한 바이트 변경 실험';
    byId('tamper').disabled = false;
    byId('lean-file').disabled = false;
  } catch {
    if (version !== hashVersion) return;
    byId('source-code').textContent = '파일 원문 링크에서 확인할 수 있습니다.';
    setHashStatus('불러오기 실패', 'warn', source.hash, defaultHashNote);
  }
}

for (const button of sourceButtons) {
  button.addEventListener('click', () => selectSource(button.dataset.source));
}

byId('tamper').addEventListener('click', async () => {
  if (!sourceBytes) return;
  const button = byId('tamper');
  if (button.textContent === '원본으로 복구') {
    await selectSource(currentSource);
    return;
  }
  const changed = sourceBytes.slice();
  changed[0] ^= 32;
  showCodeExcerpt(changed, sources[currentSource].lines);
  button.textContent = '원본으로 복구';
  await verifyBytes(changed, '첫 바이트를 변경한 복사본', ++hashVersion);
});

byId('lean-file').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  event.target.value = '';
  if (!file) return;
  const version = ++hashVersion;
  if (file.size > 4_000_000) {
    setHashStatus('파일 크기 초과', 'warn', sources[currentSource].hash, '4 MB 이하의 Lean 파일을 선택해 주세요.');
    return;
  }
  try {
    const bytes = await file.arrayBuffer();
    if (version !== hashVersion) return;
    showCodeExcerpt(sourceBytes, sources[currentSource].lines);
    byId('tamper').textContent = '한 바이트 변경 실험';
    await verifyBytes(bytes, `선택한 파일 ${file.name}`, version);
  } catch {
    if (version !== hashVersion) return;
    setHashStatus('검사 실패', 'warn', sources[currentSource].hash, '선택한 파일을 다시 열어 주세요.');
  }
});

new ResizeObserver(drawPlot).observe(plot);
selectCase('huge');
selectSource('main');
