---
name: flake-triage
description: Decide whether a failing BookNow Playwright test is a real app defect or a test problem, based on reruns and trace evidence. Use whenever a test fails, before filing a bug or changing the test.
---

# Flake Triage Standard

Whenever given a test failure, inspect the test, run results, and Playwright
trace before deciding whether it is an application defect or test instability.
Work through every item below and state the evidence; do not infer a cause from
the failure message alone.

1. **Consistency:** Does it fail every run or only intermittently? Consistent
   failures lean toward a real bug; intermittent failures lean toward a flaky
   test. If unclear, ask to rerun the test a few times before classifying it.
2. **Cause:** Does the evidence show the app behaving incorrectly, or does the
   test time out, race the app, or use a fragile locator?
3. **Trace evidence:** Was the app genuinely in a broken state, or was the test
   confused or checking too early? Cite the relevant trace observations.
4. **Classification:** State exactly one: **REAL BUG** or **FLAKY TEST**.
5. **Recommendation:** For a **REAL BUG**, use the bug-reporting skill. For a
   **FLAKY TEST**, name the specific fix (for example, use a better locator,
   remove an arbitrary sleep, or isolate test state); do not file a bug.
