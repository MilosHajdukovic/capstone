# Explore and write down notes

There are two prompts here, one to poke through the available rooms section and the second to write down the initial findings.

## Exploration

```
Using the Playwright MCP browser on http://localhost:3000, walk through the
AVAILABLE ROOMS flow only. For each step:
- describe what you did
- describe what you saw
- state what you expected to happen
- flag anything that does not match your expectation

Try a normal login (guest@booknow.com / stay2026), verify grid view of the available rooms, inspect card details and buttons, redirections, discount calculations. Do not fix anything and do not write tests — just observe and report.

```

## Creating notes


```
Based on the AVAILABLE ROOMS exploration you just did, create a file at qa-exploration-notes.md containing three parts:

### Flows
The exact steps to log in and select a room including any redirects as a numbered list.

### Selectors
List every element you interacted with on the Available Rooms page, such as the rooms grid, each room card, the name, price and discount labels, and the
"Select Room" buttons. For each one, give:
- a short description of the element
- the recommended Playwright locator
- a fallback locator if the first one is not unique (e.g. an ID such as `#rooms-grid`)

Prefer role-based or label-based locators (getByRole, getByLabel, getByText)
over brittle CSS chains. Note any element that has no accessible role, label or stable ID.

### Surprises
Every place Available Rooms behaviour did not match expectation — what you did, what you
expected, what actually happened. 

```

