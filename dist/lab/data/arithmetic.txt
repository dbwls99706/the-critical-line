import Main
import Solution

/-!
`Main` is the submitted proof (`riemannHypothesis : RiemannHypothesis`).
`Solution` is Robin1984 (`RiemannHypothesis ↔ Robin's inequality`, `↔ Lagarias's criterion`).
-/

/-- Robin's inequality: `σ(n) < e^γ · n · log log n` for every `n > 5040`. -/
theorem robin_inequality :
    ∀ n : ℕ, 5040 < n →
      ((ArithmeticFunction.sigma 1 n : ℕ) : ℝ) <
        Real.exp Real.eulerMascheroniConstant * (n : ℝ) * Real.log (Real.log (n : ℝ)) :=
  Robin1984.robin_inequality_iff_riemannHypothesis.mpr riemannHypothesis

/-- Lagarias's inequality: `σ(n) ≤ H_n + exp(H_n) · log(H_n)` for every `n ≥ 1`. -/
theorem lagarias_inequality :
    ∀ n : ℕ, 0 < n →
      ((ArithmeticFunction.sigma 1 n : ℕ) : ℝ) ≤
        (harmonic n : ℝ) + Real.exp (harmonic n : ℝ) * Real.log (harmonic n : ℝ) :=
  Robin1984.riemann_hypothesis_iff_lagarias_elementary_criterion.mp riemannHypothesis
