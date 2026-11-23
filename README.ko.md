# The Critical Line

[전시 입장](https://riemann-proof-lab.dbwls99.chatgpt.site/) · [English](README.md)

리만가설과 공개 Lean 증명을 소재로 만든 1인칭 웹 전시입니다. 전시장을 걸어 다니며 세 빛을 임계선에 올리고, 궤도를 반 바퀴 돌리고, 공개 소스에서 독립 검사 기록까지 이어 보세요.

[![전시 입구와 지도, 빛을 임계선으로 옮기는 장면](docs/exhibition.gif)](https://riemann-proof-lab.dbwls99.chatgpt.site/)

## 관람 방법

- **PC** - WASD로 이동합니다. 화면을 끌어 방향을 바꾸고 작품 가까이에서 E를 누르세요. 바닥을 클릭해서 이동할 수도 있습니다.
- **터치 화면** - 방향 버튼으로 이동하고 화면을 끌어 둘러보세요. 작품을 터치하면 열립니다.
- **전시 지도** - 현재 위치를 확인하거나 작품으로 곧장 이동할 수 있습니다. 지도에 표시된 동선은 전시장 바닥의 안내선과 색이 같습니다.

처음에는 영어로 열립니다. 상단의 **KO**를 누르면 한국어로 바뀝니다. 선택한 언어와 모은 빛 조각은 브라우저에 저장됩니다. 배포 사이트는 비공개입니다.

## 로컬에서 실행하기

저장소의 루트에서 실행합니다.

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

[localhost:8000](http://localhost:8000/)을 엽니다. 정적 파일만으로 실행됩니다. WebGL 2를 지원하면 Three.js를 쓰고, 그렇지 않으면 Canvas 2D로 같은 전시장을 그립니다.

## 전시 속 증명

**증명 릴레이**에서는 공개된 진입점 파일 `Main.lean`의 SHA-256을 브라우저에서 계산합니다. 이어서 공개된 명제 대조 결과와 독립 커널 검사 결과를 볼 수 있습니다. 퍼즐은 수학에서 아이디어를 가져왔습니다. 전체 증명과 검사 과정은 아래 기록에 있습니다.

- [레벤트 알푀게의 증명 발표](https://alpo.ge/remark.pdf)
- [Lean·Mathlib 공동 성명](https://leanprover-community.github.io/blog/posts/riemann-hypothesis/)
- [앤드루 서덜랜드의 독립 검사 기록](https://math.mit.edu/~drew/grh/)

전시 노트에는 [소수 구간 실험](dist/lab/index.html)도 있습니다. 작은 구간에서 센 소수 개수를 Schoenfeld 부등식으로 구한 범위와 대조할 수 있습니다.

## 사용한 라이브러리와 서체

[Three.js](https://github.com/mrdoob/three.js)는 [MIT 라이선스](dist/vendor/THREE-LICENSE.txt)로 배포됩니다. [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif)와 [Pretendard](https://github.com/orioncactus/pretendard)를 줄여 만든 Gallery Sans를 사용했습니다. [Instrument Serif](dist/fonts/instrument-serif-OFL.txt)와 [Gallery Sans](dist/fonts/gallery-sans-OFL.txt)의 글꼴 라이선스를 함께 두었습니다.
