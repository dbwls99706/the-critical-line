export function mangoldtBase(n) {
  for (let p = 2; p * p <= n; p++) {
    if (n % p) continue;
    while (n % p === 0) n /= p;
    return n === 1 ? p : 0;
  }
  return n > 1 ? n : 0;
}

export function primeSignal(x) {
  const terms = Array.from({length: x - 1}, (_, i) => {
    const n = i + 2;
    const base = mangoldtBase(n);
    return {n, base, weight: base ? Math.log(base) * (x / n - 1) : 0};
  });
  const sum = terms.reduce((total, term) => total + term.weight, 0);
  const baseline = x * (Math.log(x) - 1 - 0.5772156649015329);
  return {terms, sum, baseline, remainder: sum - baseline};
}

export const samplePrimes = [5, 7, 11, 13, 17, 19, 23, 29];
export function splitSign(p) { return p % 4 === 1 ? 1 : -1; }

export function liftCosts(x, power, degree) {
  const m = Math.max(1, Math.round(10 ** power));
  const shared = x / m;
  const local = m ** degree;
  return {m, shared, local, total: shared + local};
}

export function poleLogRatio(beta, k) {
  const sigma = 2.5;
  return (k + 1) * Math.log10((sigma - .5) / (sigma - beta));
}
