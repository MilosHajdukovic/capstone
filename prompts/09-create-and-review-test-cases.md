# Create and review test cases
We have two prompts here: first to create test cases using test cases draft from `test-cases-draft-review` and the second one to review the created test cases before their first run.


## Test cases draft + test authoring skill 

```
Following @.claude/skills/test-authoring/SKILL.md and the test matrix in @test-cases-draft-review.md,
write specs only for feature sections marked `Status: APPROVED`. Put each feature in its own
file tests/<feature>.spec.ts, plus the page objects and fixtures the skill requires (reuse and extend any that already exist in tests/). Then walk me through how they satisfy each rule in the skill.
```


## Agentic review of the test cases

```
Review created test specs critically and report on three things:

1. LOCATORS — are they readable and stable (role/label based), or fragile structural chains that will break on a redesign? Flag any fragile ones.

2. ASSERTIONS — does each assertion check something that actually matters, or just that the page did not crash? Flag any weak or missing assertions.

3. FALSE GREENS — is there anything that would pass even if the feature were
   broken (waiting on an always-present element, asserting on static text)?

For each issue, suggest the stronger version. Do not change the file yet.