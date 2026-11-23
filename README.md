# The Critical Line

[Visit the exhibition](https://riemann-proof-lab.dbwls99.chatgpt.site/) · [한국어](README.ko.md)

A first-person, browser-based exhibition about the Riemann hypothesis and its published Lean proof. Walk through the hall, bring three lights onto the critical line, turn a mirrored orbit, and follow the proof from its source file to the independent checkers.

[![The exhibition entrance, floor plan, and the player moving a light onto the critical line](docs/exhibition.gif)](https://riemann-proof-lab.dbwls99.chatgpt.site/)

## Visit

- **Desktop** - Move with WASD, drag to look around, and press E near an installation. Click the floor to walk there.
- **Touch** - Use the directional buttons and drag the view. Tap an installation to open it.
- **Floor plan** - See where you are and jump to any installation. The colored routes match the markers on the floor.

English is the default. Switch to Korean with **KO** at the top of the screen. Your language and collected light fragments stay in this browser. The hosted site is private.

## Run locally

Run this from the repository root.

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open [localhost:8000](http://localhost:8000/). The site runs from static files. It uses Three.js with WebGL 2 when available and draws the same hall with Canvas 2D otherwise.

## The proof inside the exhibition

In **Proof Relay**, the browser computes the SHA-256 of the published `Main.lean` entry file. The next two steps show the published statement comparison and independent kernel results. The puzzles model ideas from the mathematics. The linked records cover the full proof.

- [Levent Alpöge's announcement](https://alpo.ge/remark.pdf)
- [Lean and Mathlib's joint statement](https://leanprover-community.github.io/blog/posts/riemann-hypothesis/)
- [Andrew Sutherland's verification record](https://math.mit.edu/~drew/grh/)

The exhibition notes also link to the [prime-counting lab](dist/lab/index.html), which compares exact counts in small intervals with bounds from Schoenfeld's inequality.

## Credits

[Three.js](https://github.com/mrdoob/three.js) is distributed under the [MIT license](dist/vendor/THREE-LICENSE.txt). The typefaces are [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) and Gallery Sans, a subset of [Pretendard](https://github.com/orioncactus/pretendard). The [Instrument Serif](dist/fonts/instrument-serif-OFL.txt) and [Gallery Sans](dist/fonts/gallery-sans-OFL.txt) font licenses are included.
