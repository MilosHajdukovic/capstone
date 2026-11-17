# Explore and write down notes

There are two prompts here, one to poke through the log in section and the second to write down the initial findings.

## Exploration

```
Using the Playwright MCP browser on http://localhost:3000, walk through the
LOGIN flow only. For each step:
- describe what you did
- describe what you saw
- state what you expected to happen
- flag anything that does not match your expectation

Try a normal login (guest@booknow.com / stay2026), then try submitting the
form with empty fields, then try a wrong password. Watch the password field
specifically. Do not fix anything and do not write tests — just observe and report.

```

## Creating notes


```
Based on the LOGIN exploration you just did, create a file at
qa-exploration-notes.md containing three parts:

### Flows
The exact steps to log in, as a numbered list.

### Selectors
List every element you interacted with on the login page: the email field,
the password field, the sign-in button and the error message. For each one, give:
- a short description of the element
- the recommended Playwright locator
- a fallback locator if the first one is not unique (e.g. an ID such as `#login-user`)

Prefer role-based or label-based locators (getByRole, getByLabel, getByText)
over brittle CSS chains. Note any element that has no accessible role, label
or stable ID.

### Surprises
Every place login behaviour did not match expectation — what you did, what you
expected, what actually happened. 

```

