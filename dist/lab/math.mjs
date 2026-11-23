const scale = 10n ** 30n;
const seriesTerms = 35n;
const piLower = 3141592653589793238462643383279n;
const maxEndpoint = 10n ** 60n;

const min = (a, b) => a < b ? a : b;
const max = (a, b) => a > b ? a : b;
const ceilDivide = (a, b) => (a + b - 1n) / b;

export function parseInteger(input) {
  const value = input.trim();
  if (/^\d{1,61}$/.test(value)) return BigInt(value);
  const decimalPower = /^(\d{1,61})e\+?(\d{1,2})$/i.exec(value);
  if (decimalPower && Number(decimalPower[2]) <= 60) {
    return BigInt(decimalPower[1]) * 10n ** BigInt(decimalPower[2]);
  }
  throw new Error('정수 또는 1e30 형식으로 입력해 주세요.');
}

function logSeries(p, q) {
  if (p === 0n) return [0n, 0n];
  let pPower = p;
  let qPower = q;
  const pSquared = p * p;
  const qSquared = q * q;
  let lower = 0n;
  for (let i = 0n; i < seriesTerms; i++) {
    lower += (2n * scale * pPower) / ((2n * i + 1n) * qPower);
    pPower *= pSquared;
    qPower *= qSquared;
  }
  // For 0 ≤ p/q ≤ 1/3, the omitted tail is less than 10⁻³⁰.
  return [lower, lower + seriesTerms + 1n];
}

const logTwo = logSeries(1n, 3n);

function logInteger(value) {
  const exponent = BigInt(value.toString(2).length - 1);
  const power = 1n << exponent;
  const [lower, upper] = logSeries(value - power, value + power);
  return [exponent * logTwo[0] + lower, exponent * logTwo[1] + upper];
}

function sqrtCeil(value) {
  let root = 1n << BigInt(Math.ceil(value.toString(2).length / 2));
  for (;;) {
    const next = (root + value / root) / 2n;
    if (next >= root) return root * root === value ? root : root + 1n;
    root = next;
  }
}

function endpointError(value, logUpper) {
  return ceilDivide(sqrtCeil(value) * logUpper, 8n * piLower);
}

export function primeBounds(a, width) {
  const b = a + width;
  if (a < 2657n || width < 1n || b > maxEndpoint) {
    throw new Error('시작점은 2,657 이상, 구간 길이는 1 이상, 끝점은 10^60 이하여야 합니다.');
  }
  const [logLowerA, logUpperA] = logInteger(a);
  const [, logUpperB] = logInteger(b);
  const error = endpointError(a, logUpperA) + endpointError(b, logUpperB);
  const integralLower = width * scale / logUpperB;
  const integralUpper = ceilDivide(width * scale, logLowerA);
  return {
    a, b, width, error, integralLower, integralUpper,
    lower: max(0n, integralLower - error),
    upper: min(width, integralUpper + error),
  };
}

export function canSieve(a, width) {
  return a >= 0n && a <= 10_000_000_000n && width > 0n && width <= 1_000_000n;
}

export function countPrimes(a, width) {
  if (!canSieve(a, width)) throw new RangeError('직접 셀 수 있는 범위를 벗어났습니다.');
  const first = Math.max(2, Number(a) + 1);
  const last = Number(a + width);
  if (first > last) return 0n;
  const limit = Math.floor(Math.sqrt(last));
  const compositeBase = new Uint8Array(limit + 1);
  const composite = new Uint8Array(last - first + 1);
  for (let prime = 2; prime <= limit; prime++) {
    if (compositeBase[prime]) continue;
    for (let multiple = prime * prime; multiple <= limit; multiple += prime) {
      compositeBase[multiple] = 1;
    }
    const start = Math.max(prime * prime, Math.ceil(first / prime) * prime);
    for (let multiple = start; multiple <= last; multiple += prime) {
      composite[multiple - first] = 1;
    }
  }
  let total = 0;
  for (const flag of composite) total += 1 - flag;
  return BigInt(total);
}
