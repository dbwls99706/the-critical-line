import {getLanguage, saveLanguage} from './museum-i18n.mjs';
import {announcement, guide, lean, proofLinks} from './proof-copy.mjs';
import {proofOrder, stations} from './gallery-layout.mjs';

const verification = 'https://leanprover-community.github.io/blog/posts/riemann-hypothesis/';
const independent = 'https://math.mit.edu/~drew/grh/';
const levelPath = 'Formalism/SharpRestriction/RamificationFrobenius/TotientGaloisClasses/';
const landauPath = 'Development/AutomorphicArithmetic/DedekindLFunctions/LandauTheorems/';
const boxes = 'Development/AutomorphicArithmetic/CharacterBoxes/';
const sources = [
  [],
  [[lean(levelPath + 'Analytic.lean#L23'), 'An.gChi'], [lean(levelPath + 'ExplicitFormulaErrorOfHostConditions.lean#L38'), 'Level.Gm']],
  [[lean('Formalism/SharpRestriction/Divisibility/OrbitPlaces.lean#L315'), 'Cor2'], [lean(landauPath + 'ChBalance.lean#L200'), 'ch_balance']],
  [[lean('Formalism/HarderNarasimhan/HarderNarasimhanProofs/SlopeIneqMean.lean#L249'), 'slope_inequality_mean'], [lean('Formalism/SharpRestriction/GlobalTheoremInputs.lean#L91'), 'LinkDIV'], [lean(boxes + 'ExistsPageN.lean#L49'), 'VWin'], [lean('Development/AutomorphicArithmetic/ThetaCorrespondence/ThetaPairLifts/ThirdPlaceSeries/LiftLambdaBound.lean#L60'), 'CovolumeBoundOfX']],
  [[lean(boxes + 'ExistsPageN.lean#L27'), 'WinPair'], [lean('Development/AutomorphicArithmetic/MeanSquareBounds/pairEx.lean#L112'), 'QH.pairEx'], [lean('Development/AutomorphicArithmetic/PrimitiveCosets/LevelGmLeOnFamilyScales.lean#L28'), 'level_gm_le_on_family_scales'], [lean('Main.lean#L8'), 'LFunction_ne_zero_of_half_lt_re']],
  [[lean('Formalism/GammaFactorNonvanishing/CritLine.lean#L29'), 'rh_of_every'], [lean(boxes + 'Imprimitive.lean#L5'), 'UpperTheory.Top.imprimitive']],
  [[verification, 'Lean / Mathlib'], [independent, 'Verification records']],
];

const half = '<mfrac><mn>1</mn><mn>2</mn></mfrac>';
const math = [
  `<math><mi>ζ</mi><mo>(</mo><mi>s</mi><mo>)</mo><mo>=</mo><mn>0</mn><mo>,</mo><mspace width=".65em"/><mn>0</mn><mo>&lt;</mo><mi mathvariant="normal">Re</mi><mi>s</mi><mo>&lt;</mo><mn>1</mn><mo>⇒</mo><mi mathvariant="normal">Re</mi><mi>s</mi><mo>=</mo>${half}</math>`,
  '<math><msub><mi>G</mi><mn>1</mn></msub><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><munder><mo>∑</mo><mrow><mi>n</mi><mo>≤</mo><mi>x</mi></mrow></munder><mi>Λ</mi><mo>(</mo><mi>n</mi><mo>)</mo><mo>(</mo><mfrac><mi>x</mi><mi>n</mi></mfrac><mo>−</mo><mn>1</mn><mo>)</mo><mo>−</mo><mi>x</mi><mi>log</mi><mi>x</mi><mo>+</mo><mo>(</mo><mn>1</mn><mo>+</mo><mi>γ</mi><mo>)</mo><mi>x</mi></math>',
  '<math><mi>p</mi><mo>=</mo><mn>13</mn><mo>=</mo><mo>(</mo><mn>3</mn><mo>+</mo><mn>2</mn><mi>i</mi><mo>)</mo><mo>(</mo><mn>3</mn><mo>−</mo><mn>2</mn><mi>i</mi><mo>)</mo><mo>,</mo><mspace width=".7em"/><mn>1</mn><mo>−</mo><msub><mi>χ</mi><mrow><mo>−</mo><mn>4</mn></mrow></msub><mo>(</mo><mn>13</mn><mo>)</mo><mo>=</mo><mn>0</mn></math><math><mn>1</mn><mo>−</mo><msub><mi>χ</mi><mrow><mo>−</mo><mn>4</mn></mrow></msub><mo>(</mo><mn>11</mn><mo>)</mo><mo>=</mo><mn>2</mn></math>',
  `<math><mfrac><mi>x</mi><mi>m</mi></mfrac><mo>+</mo><mi>m</mi><mo>≥</mo><mn>2</mn><msqrt><mi>x</mi></msqrt><mo>,</mo><mspace width=".7em"/><mi>m</mi><mo>=</mo><msqrt><mi>x</mi></msqrt></math><math><msub><mi mathvariant="normal">Err</mi><mi mathvariant="normal">norm</mi></msub><mo>≲</mo><msup><mi>x</mi><mrow><mi>O</mi><mo>(</mo><mi>ε</mi><mo>)</mo></mrow></msup><mo>(</mo><mfrac><mi>x</mi><mi>m</mi></mfrac><mo>+</mo><mi>m</mi><mo>)</mo></math>`,
  `<math><mo>∀</mo><mi>ε</mi><mo>&gt;</mo><mn>0</mn><mo>,</mo><mspace width=".3em"/><mo>∀</mo><msub><mi>Z</mi><mn>0</mn></msub><mo>,</mo><mspace width=".3em"/><mo>∃</mo><mi>Z</mi><mo>≥</mo><msub><mi>Z</mi><mn>0</mn></msub><mo>,</mo><mspace width=".3em"/><mo>∀</mo><mi>x</mi><mo>∈</mo><mo>[</mo><mi>Z</mi><mo>,</mo><msup><mi>Z</mi><mfrac><mn>3</mn><mn>2</mn></mfrac></msup><mo>]</mo><mo>,</mo><mspace width=".5em"/><msub><mi>𝒢</mi><mi>ψ</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo><mo>≤</mo><msup><mi>x</mi><mrow>${half}<mo>+</mo><mi>ε</mi></mrow></msup></math><math><mo>⇒</mo><mi>L</mi><mo>(</mo><msup><mi>ψ</mi><mi>j</mi></msup><mo>,</mo><mi>s</mi><mo>)</mo><mo>≠</mo><mn>0</mn><mo>,</mo><mspace width=".5em"/><mi mathvariant="normal">Re</mi><mi>s</mi><mo>&gt;</mo>${half}<mspace width=".6em"/><mo>(</mo><mi>s</mi><mo>≠</mo><mn>1</mn><mspace width=".3em"/><mtext>for the principal character</mtext><mo>)</mo></math>`,
  `<math><mi>ξ</mi><mo>(</mo><mi>s</mi><mo>)</mo><mo>=</mo><mi>ξ</mi><mo>(</mo><mn>1</mn><mo>−</mo><mi>s</mi><mo>)</mo><mo>,</mo><mspace width=".7em"/><mi>ρ</mi><mo>=</mo><mi>β</mi><mo>+</mo><mi>i</mi><mi>t</mi><mo>↔</mo><mn>1</mn><mo>−</mo><mover><mi>ρ</mi><mo>¯</mo></mover><mo>=</mo><mn>1</mn><mo>−</mo><mi>β</mi><mo>+</mo><mi>i</mi><mi>t</mi></math>`,
  '<math><mtext>riemannHypothesis</mtext><mo>:</mo><mtext>RiemannHypothesis</mtext><mo>:=</mo><mtext>rhOfAll</mtext></math>',
];

const text = {
  en: {
    back:'Back to the exhibition', edition:'The Critical Line / Reading guide', title:'How the proof reaches the line',
    intro:'Levent Alpöge announced the proof on 20 November 2026 and credits Claude with work on the argument and on its Lean formalization. This guide follows the published Lean declarations and Yan Ru Pei’s reading of their dependencies. The controls in the gallery isolate parts of that argument. The links take you to the original code and to the independent verification.',
    nav:'Proof chapters', links:['Original announcement', 'Original Lean source', 'Pei’s proof roadmap', 'Lean and Mathlib verification'],
    sections:[
      ['The claim', 'What is a zero?', [
        'A zero is an input where the zeta function evaluates to zero. Its trivial zeros occur at negative even integers. The proof concerns the nontrivial zeros in the strip between real parts 0 and 1.',
        'The lights in the first room use measured imaginary parts. This is a way to read the coordinates. The proof must exclude points off the line at every height, including those no one has computed.',
      ]],
      ['The explicit formula', 'How primes reveal zeros', [
        'Use Λ(n) = log p when n is a power of a prime p and zero otherwise. Weight each contribution by x/n − 1, so terms enter smoothly at the cutoff. Removing the smooth main term leaves G₁(x). Here γ is Euler’s constant. The Dirichlet-character version inserts χ(n) and uses the corresponding main term.',
        'A Mellin transform turns the weighted sum into a logarithmic derivative divided by s(s − 1). A zero ρ contributes a term proportional to x^ρ/(ρ(ρ − 1)). Its real part controls the power of x, while its imaginary part controls oscillation. That scale is the link between prime-counting error and horizontal position.',
      ]],
      ['Local arithmetic', 'Prime by prime', [
        'The Gaussian integers give a small example of the split/inert dichotomy. The actual argument uses scale-dependent auxiliary fields. At a prime inert in the relevant CM extension, Frobenius imposes vanishing on theta-kernel periods. Integral coefficients turn this vanishing into divisibility by powers of that prime.',
        'Each local order contributes with a log p weight. The balance identity subtracts an archimedean main term and identifies the difference with a character combination of the weighted remainders. This is how the arithmetic information reaches the explicit formula.',
      ]],
      ['The arithmetic estimate', 'Why the chain is this long', [
        'The averaged Bost slope inequality compares the forced local orders with the size of the same collection of periods at infinity. Fock norms and the Chowla–Selberg period formula supply the main size terms. A relative trace formula controls overlaps in the collection, and a covolume estimate controls the integral lattices.',
        'Each theta lift adds local multiplicity. The fixed cost is spread over m lifts, and the per-chain loss grows with m. Twisted lifts and a uniform Selmer bound control the loss from dividing out unknown constants. The normalized budget behaves like x/m + m, with small exponent losses. Balancing the two costs selects m near √x. The gallery’s quadratic curve is an illustration of a higher cost model.',
      ]],
      ['The analytic estimate', 'Rule out the right half', [
        'Finite Fourier averaging converts the local inequalities into a one-sided upper bound on a positive combination of remainders. The auxiliary character twists vary with the scale. Second-moment estimates let the proof choose them with small enough remainders on the window. The bound is needed on arbitrarily large windows for every ε > 0.',
        'For a character of order o, the level sum 𝒢ψ is G₁ plus 1/(3o + 1) times the sum of the remainders for the nontrivial powers (with their inducing primitive characters). Its Laplace transform has poles at zeros of the L-functions. Positivity of the weights prevents shared zeros from cancelling. The windowed Landau theorem localizes high-order Taylor coefficients to a window. A nearer pole forces rates of growth that contradict the upper bound, using Taylor centers at real and complex points. The gallery isolates the coefficient of one hypothetical pole so you can see that growth.',
      ]],
      ['The functional equation', 'Why the left half goes too', [
        'The completed zeta function is symmetric under s ↦ 1 − s. Complex conjugation supplies the partner at the same height. A left-hand zero would imply a right-hand zero, so the right-half theorem excludes the left half of the strip as well.',
        'For Dirichlet L-functions the functional equation pairs a primitive character with its conjugate. The proof obtains right-half nonvanishing for the family, then handles imprimitive characters using the finite Euler factors. The zeta case gives the original Riemann hypothesis.',
      ]],
      ['Verification', 'What the checkers checked', [
        'The original declaration in Main.lean invokes rhOfAll, which leads through the supporting Lean library. The statement comparator checked that the result matches the independently specified statement. Lean and independent kernels checked the exported proof. These records report those runs.',
        'The gallery computes the SHA-256 fingerprint of its bundled Main.lean. The hash identifies that entry file. The linked verification covers the full proof, including the dependencies behind the entry point.',
      ]],
    ],
  },
  ko: {
    back:'전시관으로 돌아가기', edition:'The Critical Line / 증명 해설', title:'증명은 왜 임계선으로 이어질까',
    intro:'레벤트 알푀게는 2026년 11월 20일에 증명을 공개했습니다. 발표문에서 Claude가 논증을 발전시키고 Lean으로 형식화하는 데 함께했다고 밝혔습니다. 이 해설은 공개 Lean 선언과 옌루 페이(Yan Ru Pei)가 정리한 증명 구조를 따라갑니다. 전시의 조작 모형을 거친 뒤 각 단계의 원본 코드와 검증 기록을 열어 볼 수 있습니다.',
    nav:'증명 단계', links:['알푀게의 발표 원문', 'Lean 증명 원본', '페이의 증명 구조 해설', 'Lean·Mathlib 검증'],
    sections:[
      ['가설의 내용', '영점은 어디에 있을까', [
        '제타 함수에 넣었을 때 결과가 0이 되는 입력값을 영점이라 부릅니다. 음의 짝수에는 자명한 영점이 있고, 증명의 대상은 실수부가 0과 1 사이인 띠에 놓인 비자명한 영점입니다.',
        '첫 방의 빛은 실제로 알려진 영점의 허수부를 높이로 옮긴 것입니다. 점을 맞추면 좌표를 읽는 법이 보입니다. 증명은 아직 계산하지 않은 높이에서도 선 밖에 영점이 없음을 보여줘야 합니다.',
      ]],
      ['명시적 공식', '소수의 합에서 영점 읽기', [
        'n이 소수 p의 거듭제곱이면 Λ(n) = log p, 그 밖에는 0으로 둡니다. 각 항에 x/n − 1을 곱하면 절단점에 들어오는 항의 무게가 0에서 시작합니다. 매끄러운 주항을 빼면 G₁(x)가 남습니다. 여기서 γ는 오일러 상수입니다. 디리클레 지표를 넣을 때는 χ(n)을 추가하고 그 지표에 맞는 주항을 뺍니다.',
        '멜린 변환을 하면 가중합이 로그 미분을 s(s − 1)로 나눈 식과 연결됩니다. 영점 ρ마다 x^ρ/(ρ(ρ − 1))에 비례하는 항이 생깁니다. 그 실수부가 x의 거듭제곱을 정하고, 허수부가 진동을 정합니다. 그래서 소수 가중합의 오차를 제한하면 영점의 가로 위치도 제한할 수 있습니다.',
      ]],
      ['국소 산술', '분해되지 않는 소수를 고르기', [
        '가우스 정수는 소수의 분해 여부를 손으로 확인해 볼 수 있는 작은 예입니다. 실제 증명은 규모에 맞춰 보조 수체를 바꿉니다. 해당 CM 확대에서 분해되지 않는 소수는 프로베니우스 작용으로 세타 핵의 주기에 소멸을 강제합니다. 정수 계수 덕분에 이 소멸이 소수 거듭제곱에 의한 가분성으로 이어집니다.',
        '소수마다 강제된 가분 차수에 log p를 곱합니다. 균형 항등식으로 전역 크기의 주항을 빼면 그 차이를 지표가 섞인 가중 나머지들의 합으로 바꿀 수 있습니다. 여기서 국소 산술의 정보가 명시적 공식과 만납니다.',
      ]],
      ['산술적 상한', '왜 제곱근 길이인가', [
        '평균화한 Bost 기울기 부등식으로 소수마다 강제된 가분성과 같은 주기들의 무한 자리 크기를 비교합니다. Fock 노름과 Chowla–Selberg 주기 공식이 크기의 주항을 정하고, 상대 궤적 공식이 주기 사상 간의 겹침을 제어합니다. 격자의 공변부피 상한도 비용에 들어갑니다.',
        '세타 리프트를 이을 때마다 국소 신호가 더해집니다. 한 번만 드는 비용은 m단계로 나뉘고 사슬에 따라 늘어나는 비용도 있습니다. 비튼 리프트와 균일한 셀머 군 상한으로 미지의 상수를 나누며 생기는 손실을 제어합니다. 작은 지수 손실을 제외하면 정규화한 비용은 x/m + m입니다. 두 항이 균형을 이루는 길이는 √x 근처입니다. 전시의 제곱 비용은 비용이 더 빨리 늘어나는 경우를 그린 모형입니다.',
      ]],
      ['해석적 상한', '오른쪽 반평면 비우기', [
        '유한 푸리에 평균으로 국소 부등식을 양의 가중치가 붙은 나머지 합의 한쪽 상한으로 바꿉니다. 보조 지표는 구간 크기마다 바뀝니다. 이차 모멘트 추정으로 해당 구간에서 오차가 충분히 작은 지표를 고릅니다. 모든 ε > 0에 대해 임의로 큰 구간들에서 상한을 확보합니다.',
        '차수가 o인 지표의 레벨 합 𝒢ψ는 G₁에 비자명한 지표 거듭제곱들의 나머지를 1/(3o + 1)씩 더한 값입니다. 각 거듭제곱은 그것을 유도하는 원시 지표로 계산합니다. 이 합의 라플라스 변환은 L 함수의 영점에서 극을 가집니다. 양의 가중치는 여러 함수가 같은 영점을 가질 때 극이 상쇄되지 않게 합니다. 구간형 Landau 정리는 높은 차수의 테일러 계수를 특정 구간에 집중시킵니다. 기준보다 가까운 극이 있다면 계수의 증가율이 상한과 모순됩니다. 실제 증명은 실수와 복소 전개 중심을 비교하고, 전시에서는 가상의 극 하나가 만드는 증가율을 조작해 봅니다.',
      ]],
      ['함수방정식', '거울 뒤도 비어 있는 이유', [
        '완성된 제타 함수는 s를 1 − s로 바꿔도 같습니다. 켤레 대칭까지 쓰면 같은 높이의 오른쪽에 왼쪽 영점의 짝이 생깁니다. 오른쪽을 이미 배제했으므로 임계띠의 왼쪽도 비게 됩니다.',
        '디리클레 L 함수의 함수방정식은 원시 지표와 그 켤레를 짝지어 줍니다. 전 계열에서 오른쪽이 비어 있음을 보인 뒤 유한한 오일러 인자로 비원시 지표도 처리합니다. 제타 함수에 적용하면 원래 리만가설을 얻습니다.',
      ]],
      ['검증 기록', '검사기는 무엇을 확인했을까', [
        '원본 Main.lean의 선언은 뒷받침하는 Lean 라이브러리의 rhOfAll을 호출합니다. 명제 대조 도구는 결과가 독립적으로 작성한 문제 명제와 일치하는지 확인했습니다. Lean과 독립 커널은 내보낸 증명을 검사했습니다.',
        '전시장에서는 함께 제공하는 Main.lean의 SHA-256 지문을 계산합니다. 이 지문은 진입점 파일을 식별합니다. 연결된 검증 기록에는 진입점의 의존성까지 포함한 전체 증명의 검사 결과가 있습니다.',
      ]],
    ],
  },
};

const rootLinks = [announcement, lean('Main.lean'), guide, verification];
const el = (id) => document.getElementById(id);
function link(url, name) {
  const node = document.createElement('a');
  node.href = url;
  node.textContent = name;
  if (url.startsWith('https:')) {
    node.target = '_blank';
    node.rel = 'noopener';
  }
  return node;
}

function render(language) {
  const words = text[language];
  document.documentElement.lang = language;
  document.title = words.title + ' - The Critical Line';
  el('back').textContent = words.back;
  el('edition').textContent = words.edition;
  el('guide-title').textContent = words.title;
  el('intro-copy').textContent = words.intro;
  el('primary-records').replaceChildren(...rootLinks.map((url, i) => link(url, words.links[i])));
  const nav = el('chapters');
  nav.setAttribute('aria-label', words.nav);
  nav.replaceChildren();
  const steps = el('steps');
  steps.replaceChildren();
  words.sections.forEach(([label, title, paragraphs], i) => {
    const room = proofOrder[i];
    const chapter = document.createElement('section');
    chapter.className = 'proof-chapter';
    chapter.id = 'step-' + (i + 1);
    chapter.style.setProperty('--ink', '#' + stations[room].color.toString(16).padStart(6, '0'));
    const overline = document.createElement('p');
    overline.className = 'overline';
    overline.textContent = label;
    const heading = document.createElement('h2');
    heading.textContent = title;
    const equation = document.createElement('div');
    equation.className = 'math-plate';
    equation.innerHTML = math[i];
    const content = paragraphs.map((line) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = line;
      return paragraph;
    });
    const references = document.createElement('div');
    references.className = 'guide-links';
    references.append(...[proofLinks[room], ...sources[i]].map(([url, name]) => link(url, name)));
    chapter.append(overline, heading, equation, ...content, references);
    steps.append(chapter);
    nav.append(link('#' + chapter.id, label));
  });
  for (const button of document.querySelectorAll('[data-lang]')) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === language));
  }
}

for (const button of document.querySelectorAll('[data-lang]')) {
  button.addEventListener('click', () => {
    saveLanguage(button.dataset.lang);
    render(button.dataset.lang);
  });
}
render(getLanguage());
const section = document.getElementById(location.hash.slice(1));
if (section) requestAnimationFrame(() => section.scrollIntoView());
