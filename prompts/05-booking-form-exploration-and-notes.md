# Explore and write down notes

There are two prompts here, one to poke through the Booking Form section and the second to write down the initial findings.

## Exploration

```
Using the Playwright MCP browser on http://localhost:3000, walk through the
BOOKING FORM flow only. For each step:
- describe what you did
- describe what you saw
- state what you expected to happen
- flag anything that does not match your expectation

Log in with guest@booknow.com / stay2026 and open the "Complete Your Booking"
form by clicking "Select Room" on a room. Then try:
- submitting with all fields blank, and with each required field blank in turn
- invalid values: wrong email/phone formats, letters in numeric fields, spaces, very long input
- dates: past check-in, check-out on or before check-in; check the nights and total update correctly
- guests: 0, negative, above the room's capacity
- a valid submission. Stop once the confirmation page loads.
Also note the labels, placeholders and buttons. Do not fix anything and do not write tests — just observe and report.

```

## Creating notes


```
Based on the BOOKING FORM exploration you just did, create a file at qa-exploration-notes.md containing three parts:

### Flows
The exact steps to log in, select a room, fill the BOOKING FORM and send it, as a numbered list.

### Selectors
List every element you interacted with on the Complete Your Booking form, such as labels, input fields, buttons, the validation error message for each field, and the booking summary (nights and total). For each one, give:
- a short description of the element
- the recommended Playwright locator
- a fallback locator if the first one is not unique (e.g. an ID such as `#book-email`)

Prefer role-based or label-based locators (getByRole, getByLabel, getByText)
over brittle CSS chains. Note any element that has no accessible role, label or stable ID.

### Surprises
Each time Complete Your Booking form behaviour did not match expectation — what you did, what you
expected, what actually happened. 

```

