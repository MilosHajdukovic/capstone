---
name: bug-reporting
description: Write a developer-ready bug report for a BookNow defect found by a failing Playwright test or exploration. Use when a test fails on booknow-broken, when the user asks to report or log a bug, or when documenting a deviation from requirements.md.
---

# Bug Reporting Standard

When asked to report a bug, use the failing test, Playwright trace, screenshots,
and project requirements to write a concise report a developer can act on. Base
claims on evidence; mark unavailable details as unknown rather than guessing.

## Required report

- **Title:** State the observed behavior precisely, e.g. "Proceed to Checkout
  button does not respond to click."
- **Environment:** Identify the app version/state (broken or fixed, including a
  version or commit when known), browser and version, and URL.
- **Steps to reproduce:** Number the exact actions and inputs, including any
  required starting state. Make the steps reproducible by someone who was not
  present.
- **Expected result:** State the behavior required by the specification.
- **Actual result:** State what happened instead, based on the test and trace.
  Keep this separate from Expected result; never combine them into one sentence.
- **Severity:** Choose Critical, High, Medium, or Low and give a one-line
  justification based on user impact and scope.
- **Evidence:** Reference the failing test and relevant Playwright trace and
  screenshot by path or attachment. Identify what each demonstrates. If an
  artifact is unavailable, say so; do not imply it exists.

## Final self-check

Ask: **"Could a developer reproduce this from the steps alone?"** If not, add
the missing setup or exact action and check again. The report is not done until
the answer is yes.
