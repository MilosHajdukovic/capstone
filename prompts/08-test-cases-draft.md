# Test case draft

There are two prompts here: one that uses requirements, exploration notes and test design skill to create draft test cases and the second one that creates the test spec using test authoring skill. 

## Requirements + exploration notes + test design skill

```
Following @.claude/skills/test-case-design/SKILL.md exactly, and using @qa-exploration-notes.md, design the test cases for all features and save in 
@test-cases-draft-review.md. 
Treat @requirements.md as the source of truth. Where the exploration notes show different behavior, the expected result follows the requirement, and the case gets a Planned Regression flag. 
Produce positive, negative, and edge cases for each, in the skill's format. Output the matrix so I can review it.

- Tag each case with the requirement it covers.
- Don't invent requirements. If no requirement in @requirements.md covers a behavior,
  tag the case `NO REQUIREMENT` and list it under (b) below.
- Mark each feature section `Status: DRAFT`.
- If a requirement is ambiguous or silent on expected behavior, mark the case OPEN QUESTION
  instead of guessing.
- At the end, list (a) requirements with no cases and (b) app behavior seen in exploration that no requirement covers.
```

## Draft Review

```
Review @test-cases-draft-review.md. Use @requirements.md as the source of truth,
@qa-exploration-notes.md for how the app actually behaves, and follow
@.claude/skills/test-case-design/SKILL.md.

For each feature, check:

1. Every requirement has at least one test case. Show me a list: requirement → the
   test case IDs that cover it. If a requirement has no test case, add one. If a
   test case doesn't match any requirement, or two cases test the same thing, point
   it out.

2. Each feature has real positive, negative, and edge cases. If a case is labeled
   wrong (for example, called "Edge" but it's just the normal happy path), point it
   out. Add any type that is missing.

3. Add negative cases specific to this app that a generic checklist would miss. Base
   them on the exploration notes. Examples: skipping a step or opening a page
   without logging in, losing data after a page reload, wrong date order, guest
   user limits, wrong discount or total math, clicking submit twice.

4. Every bug or difference found in the exploration notes has a test case marked
   "Planned Regression: <bug>". Its expected result must describe what the
   requirement says should happen, not what the app does now.

5. Expected results are exact and checkable (exact text, number, URL, or state),
   not vague like "works correctly". If a requirement is unclear, mark the case
   OPEN QUESTION instead of guessing.

Rules:
- Use the skill's format exactly.
- Keep existing test case IDs; give new cases the next numbers.
- Don't delete any test case. Point out problems instead.
- Don't change any Status line.
- Keep my manual edits.
- Save all new cases in the file.

When done, tell me in chat, for each feature: which cases you added (ID and a short
reason), which cases you flagged, any open questions, and where coverage still
feels thin and why.

```

