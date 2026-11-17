# Explore and write down notes

There are two prompts here, one to poke through the Confirmation section and the second to write down the initial findings.

## Exploration

```
Using the Playwright MCP browser on http://localhost:3000, walk through the
CONFIRMATION flow only. For each step:
- describe what you did
- describe what you saw
- state what you expected to happen
- flag anything that does not match your expectation

Log in with guest@booknow.com / stay2026, click "Select Room" on a room, fill the
"Complete Your Booking" form with valid data and submit it. Then check:
- verify the confirmation page is shown only after a successful booking
- compare everything shown on the confirmation page with the data you entered
  and the booking summary on the form; make a second booking and compare the
  two confirmations
- "Browse More Rooms": where it leads, and whether a new booking works afterwards
- other navigation: navbar links, logout, browser back, page reload
Also note the headings, text, summary rows and buttons. Do not fix anything and
do not write tests — just observe and report.
```

## Creating notes

```
Based on the CONFIRMATION exploration you just did, create a file at
qa-exploration-notes.md containing three parts:

### Flows
The exact steps to log in, select a room, submit the booking form, reach the
confirmation page and return via "Browse More Rooms", as a numbered list.

### Selectors
List every element you interacted with on the Confirmation page, such as the
heading, subtitle, booking reference, each summary row shown, the
"Browse More Rooms" button and the navbar. For each one, give:
- a short description of the element
- the recommended Playwright locator
- a fallback locator if the first one is not unique (e.g. an ID such as `#confirm-ref`)

Prefer role-based or label-based locators (getByRole, getByLabel, getByText)
over brittle CSS chains. Note any element that has no accessible role, label
or stable ID.

### Surprises
Every place Confirmation page behaviour did not match expectation — what you did,
what you expected, what actually happened.
```
