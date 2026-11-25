---
name: test-case-design
description: Design BookNow test cases (positive, negative, edge) from requirements.md and qa-exploration-notes.md, in the TC-<FEATURE>-<NN> format. Use when planning tests for a page or feature, before writing Playwright code.
---

# Test Case Design Standard

This document governs the design and generation of test cases in this project. Whenever instructed to design test cases for a feature, follow this standard systematically.

---

## 1. Inputs Required

Before authoring test cases, ensure two source documents are reviewed:
1. **Requirements Specification**: The expected behavior, business rules, and acceptance criteria.
2. **Exploration Notes**: The real application behavior, DOM structure, resilient selectors, and documented surprises/bugs.

Never generate test cases from generic assumptions. Base every step, selector strategy, and assertion on real application findings recorded during exploration.

---

## 2. Mandatory Coverage Categories

Every feature under test must include test cases across all three categories:

### A. Positive Cases
- Validate the primary happy path and intended functional workflows.
- Use valid, realistic inputs adhering to business requirements.
- Verify end-to-end state transitions, successful notifications, and correct UI changes.

### B. Negative Cases
- Validate that the system safely rejects invalid, malformed, or unauthorized input.
- Test scenarios include:
  - Missing or blank required fields.
  - Invalid formats (e.g., malformed email addresses, non-numeric phone numbers, invalid card patterns).
  - Incorrect authentication credentials.
  - Actions attempted outside permissible workflow sequences.
- Verify that meaningful error messages or validation states are displayed and that the user is not allowed to proceed.

### C. Edge Cases
- Validate behavior at and beyond operational boundaries.
- Test scenarios include:
  - Minimum and maximum boundaries (e.g., quantity of 1 vs. 0 vs. -1; order total just below minimum threshold like $9.99 vs. $10.00).
  - String length extremes (minimum length, very long text inputs, whitespace-only strings).
  - Date boundaries (current month/year vs. past month/year on expiry fields).
  - Repeated rapid actions (double-clicking submit buttons, rapid quantity updates).

---

## 3. Test Case Specification Schema

Every designed test case must strictly follow this structure:

```markdown
#### [TC-<FEATURE>-<NUMBER>] <Behavior-Driven Title>
- **Category:** Positive | Negative | Edge
- **Regression Flag:** [None | Planned Regression: <Bug Reference/Description>]
- **Preconditions:** Initial application state, authentication status, and preconditions required before starting the test.
- **Steps:**
  1. Concrete action step (referencing real controls from exploration notes).
  2. Concrete action step.
- **Expected Result:** Explicit, verifiable assertion (text displayed, state changed, URL, error notification).
```

### Title Formatting Rules
- Titles must clearly state the **expected behavior**, not the test mechanics.
- **Good:** `Login rejects empty password with validation error`
- **Good:** `Cart prevents quantity decrement below 1`
- **Good:** `Checkout blocks card submission with expired date`
- **Bad:** `Test Password Field`
- **Bad:** `Negative Test 2`

---

## 4. Known Bug & Regression Tracking Rule

Any deviation, defect, or unexpected behavior documented in the feature's **Exploration Notes** must be captured as a dedicated test case.

- Mark these cases with:  
  `**Regression Flag:** Planned Regression: <Brief description of observed bug>`
- The **Expected Result** must state what the specification requires (the desired pass condition), not the broken current behavior.
- These cases serve as automated guards when bug fixes are deployed.

---

## 5. Quality Checklist

Before finalizing a test matrix, verify:
- [ ] All three categories (Positive, Negative, Edge) are present for the feature.
- [ ] Every title describes a specific behavior.
- [ ] Steps and selectors align with the real DOM and locators in `qa-exploration-notes.md`.
- [ ] All surprises and known defects from exploration notes are captured and tagged as planned regressions.
- [ ] Assertions are deterministic and measurable.

---

## 6. Output

- Save the matrix to `test-cases-draft-review.md` in the repo root, with one section per feature (e.g. `## Login`, `## Rooms`).
- Put `Status: DRAFT` directly under each feature heading. Only the tester changes it to `Status: APPROVED`, one feature at a time.
- If the file already exists, update it instead of creating a new one, and keep any manual edits by the tester.
- After saving, show the matrix in chat for review.
