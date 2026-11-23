import {primeBounds, countPrimes} from './lab/math.mjs';
import {lean} from './proof-copy.mjs';

const schoenfeld = 'https://www.ams.org/mcom/1976-30-134/S0025-5718-1976-0457374-X/S0025-5718-1976-0457374-X.pdf';
const bombieri = 'https://www.claymath.org/wp-content/uploads/2022/05/riemann.pdf';
const bach = 'https://digitalcommons.butler.edu/facsch_papers/1121/';
const scope = 'https://math.mit.edu/~drew/grh/';
const references = [[lean('Main.lean#L4'),'Main.lean'], [schoenfeld,'Schoenfeld, 1976'], [bach,'Bach & Sorenson, 1996'], [scope,'MIT verification records']];
const ranges = [[10_000, 5_000], [100_000, 10_000], [1_000_000, 50_000]];
const languages = {
  en: {
    summary: 'What the proof settles', direct: 'Theorems in the Lean release', consequences: 'What follows from them',
    limits: 'Where the result stops', window: 'Prime-counting interval', answers: ['Observed prime count', 'Guaranteed range'],
    short: 'Zeta zeros lie at real part ½. The same holds for every Dirichlet L-function in the critical strip. Together these results give tighter bounds on prime counts, including counts in residue classes.',
    claim: 'All nontrivial zeros of the Riemann zeta function have real part ½.',
    general: 'For every Dirichlet character χ, L(s, χ) has no zeros to the right of ½ (with the pole at s = 1 for a principal character excluded). Its zeros in 0 < Re s < 1 have real part ½. The entry point gives both the primitive and the general zero statements.',
    count: 'The prime number theorem gives the trend Li(x). RH bounds the error by a constant times √x log x. The explicit formula pairs each zero ρ with a contribution involving x^ρ, so controlling its real part controls the growth rate.',
    reading: 'The exact integer count below comes from a sieve. The outer interval comes from applying Schoenfeld’s RH bound at both endpoints, then enclosing the Li difference. Change the interval to compare.',
    residue: 'Dirichlet GRH gives square-root-scale error, up to logarithmic factors, for primes in a fixed reduced residue class. For example, primes ending in 1, 3, 7 and 9 each approach one quarter of the prime total. In each reduced class a mod q, q ≥ 3, the least prime is below 2(q log q)² by Bach and Sorenson.',
    limitsText: 'The Lean release covers the zeta function and Dirichlet L-functions. Other families, such as elliptic-curve L-functions, have their own hypotheses. Twin primes and the strong Goldbach conjecture remain separate open problems.',
    lab: 'Open the prime-counting lab', sources: 'Source and references',
  },
  ko: {
    summary: '이 증명이 해결한 것', direct: 'Lean 원본이 직접 증명한 명제', consequences: '그 결과로 알 수 있는 것',
    limits: '증명의 범위', window: '소수 개수를 비교할 구간', answers: ['직접 센 소수 개수', '증명이 보장하는 범위'],
    short: '제타 함수와 모든 디리클레 L 함수의 비자명한 영점은 실수부 ½ 위에 있어요. 그래서 전체 소수의 개수뿐 아니라, 특정 나머지를 갖는 소수의 개수도 오차 범위와 함께 추정할 수 있어요.',
    claim: '리만 제타 함수의 비자명한 영점은 모두 실수부가 ½입니다.',
    general: '모든 디리클레 지표 χ에 대해 L(s, χ)는 ½ 오른쪽에 영점이 없습니다. 주지표의 s = 1은 극이라 제외합니다. 0 < Re s < 1의 영점은 모두 실수부가 ½입니다. 원본에는 원시 지표와 전체 지표에 대한 두 버전이 들어 있습니다.',
    count: '소수정리는 Li(x)로 전체적인 추세를 알려줍니다. 리만가설은 실제 개수와의 차이가 √x log x 크기를 넘지 않도록 제한합니다. 명시적 공식에서 영점 ρ가 만드는 항에 x^ρ가 들어가므로, 실수부가 오차의 증가 속도를 좌우합니다.',
    reading: '아래 소수 개수는 체로 직접 셌습니다. 보장 범위는 구간 양 끝에 Schoenfeld의 오차 상한을 적용하고 Li 차이의 범위를 계산한 값입니다. 구간을 바꿔 비교할 수 있습니다.',
    residue: '디리클레 GRH는 서로소인 나머지류에 속하는 소수 개수에도 로그 인자를 제외하면 제곱근 크기의 오차를 보장합니다. 예를 들어 1, 3, 7, 9로 끝나는 소수는 각각 전체의 ¼에 가까워집니다. Bach와 Sorenson의 결과로 q ≥ 3이고 a와 q가 서로소면 a mod q의 첫 소수는 2(q log q)²보다 작습니다.',
    limitsText: '공개된 증명은 제타 함수와 디리클레 L 함수까지 다룹니다. 타원곡선 L 함수처럼 다른 함수 계열에는 별도의 가설이 있습니다. 쌍둥이 소수와 강한 골드바흐 추측도 각각 남아 있는 문제입니다.',
    lab: '소수 개수 실험실 열기', sources: '원본과 참고 자료',
  },
};

export const resultCopy = (language) => languages[language];

function node(tag, text, className) {
  const item = document.createElement(tag);
  if (text) item.textContent = text;
  if (className) item.className = className;
  return item;
}

function link(href, text) {
  const item = node('a',text);
  item.href = href;
  if (href.startsWith('https:')) {
    item.target = '_blank';
    item.rel = 'noopener';
  }
  return item;
}

export function renderResults(root, language) {
  const words = languages[language];
  const previous = root.querySelector('select')?.value;
  const direct = node('div', '', 'result-proof');
  direct.append(node('h3', words.direct), node('p', words.claim), node('p', words.general));
  const implications = node('div', '', 'result-proof');
  implications.append(node('h3', words.consequences), node('p', words.count));
  const equation = node('p', '', 'math-plate');
  equation.innerHTML = '<math><mi>π</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mi mathvariant="normal">Li</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>+</mo><mi>O</mi><mo>(</mo><msqrt><mi>x</mi></msqrt><mi>log</mi><mi>x</mi><mo>)</mo></math>';
  implications.append(equation,node('p',words.reading));

  const example = node('div', '', 'result-example');
  const label = node('label', words.window);
  const select = node('select');
  const formatter = new Intl.NumberFormat(language === 'ko' ? 'ko-KR' : 'en-US');
  ranges.forEach(([a,width], i) => {
    const option = node('option', `(${formatter.format(a)}, ${formatter.format(a + width)}]`);
    option.value = i;
    select.append(option);
  });
  if (previous !== undefined) select.value = previous;
  label.append(select);
  const actual = node('dd');
  const interval = node('dd');
  const counts = node('dl', '', 'count-results');
  for (const [title, value] of [[words.answers[0],actual],[words.answers[1],interval]]) {
    const row = node('div');
    row.append(node('dt',title),value);
    counts.append(row);
  }
  counts.setAttribute('aria-live','polite');
  function renderCount() {
    const [a, width] = ranges[Number(select.value)].map(BigInt);
    const n = countPrimes(a,width);
    const {lower,upper} = primeBounds(a,width);
    actual.textContent = formatter.format(n);
    interval.textContent = `${formatter.format(lower)} - ${formatter.format(upper)}`;
  }
  select.addEventListener('change', renderCount);
  renderCount();
  example.append(label,counts,link('./lab/index.html',words.lab));
  implications.append(example,node('p',words.residue));
  const bounds = node('div','','result-proof');
  bounds.append(node('h3',words.limits),node('p',words.limitsText));
  const sources = node('nav','','guide-links');
  sources.setAttribute('aria-label',words.sources);
  sources.append(...[references[0],[bombieri,'Bombieri'],...references.slice(1)].map(([href,text]) => link(href,text)));
  root.replaceChildren(direct,implications,bounds,sources);
}
