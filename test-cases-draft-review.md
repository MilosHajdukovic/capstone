# BookNow — Test Case Matrix (Draft for Review)

Designed 2026-11-25 per `.claude/skills/test-case-design/SKILL.md`.
Sources: `requirements.md` (source of truth) and `qa-exploration-notes.md` (explored against `booknow-broken`).

## Conventions

- **Requirement tags** use the IDs from the Requirements Coverage section of `qa-exploration-notes.md` (L1–L9, R1–R5, B1–B11, C1–C4). `NO REQUIREMENT` means no line of `requirements.md` covers the behavior.
- **OPEN QUESTION** means the requirement is ambiguous or silent. The Expected Result gives a *proposed* outcome that needs product-owner confirmation before the case is automated.
- **Planned Regression** cases assert what the spec requires. They are expected to **fail** on `booknow-broken` and pass on `booknow-fixed`. Automated with the `@regression` tag.
- **Open Question** flag (`@open-question` tag): the expected result is a proposed answer to an OPEN QUESTION, or no line of `requirements.md` covers the case. These tests may fail on both builds. They become Planned Regressions once the product owner confirms the answer.
- All pages share the URL `http://localhost:3000/`. Assert on visible sections and headings, never on the URL, and never use `page.goBack()` to move inside the app.
- Shared preconditions referenced below:
  - **Fresh page:** open `http://localhost:3000/`; `#page-login` is visible; not logged in.
  - **Logged in:** from a fresh page, fill `getByLabel('Email Address')` with `process.env.BOOKNOW_EMAIL`, `getByLabel('Password')` with `process.env.BOOKNOW_PASSWORD`, click `getByRole('button', { name: 'Sign In' })`; `getByRole('heading', { name: 'Available Rooms' })` is visible.
  - **On booking form for `<room>`:** Logged in, then click `card('<room>').getByRole('button', { name: 'Select Room' })` where `card = name => page.locator('#rooms-grid .room-card').filter({ hasText: name })`; `getByRole('heading', { name: 'Complete Your Booking' })` is visible.
  - **Valid booking data:** `#book-fname` = `John`, `#book-lname` = `Smith`, `#book-email` = `john@example.com`, `#book-phone` = `+1 234 567 8900`, `#book-checkin` = `2026-12-01`, `#book-checkout` = `2026-12-04`, `#book-guests` = `2` (dates set with `fill('YYYY-MM-DD')`).
- **Login error check** (used in several cases): `#page-login` stays visible, `#login-error` is visible with non-empty text (`toHaveText(/\S/)`), and the "Available Rooms" heading is not visible. The error wording is unknown (never displayed on the broken build), so no exact string is asserted.
- **Correct discounted prices** (R3): Deluxe $103.20, Superior $80.10, Family Suite $169.15, Penthouse $284.05.

---

## Login

Status: APPROVED

#### [TC-LOGIN-01] Valid credentials sign in and open the Available Rooms page
- **Category:** Positive
- **Requirement:** L1, L5, L6
- **Regression Flag:** None
- **Preconditions:** Fresh page.
- **Steps:**
  1. Fill `getByLabel('Email Address')` with `process.env.BOOKNOW_EMAIL`.
  2. Fill `getByLabel('Password')` with `process.env.BOOKNOW_PASSWORD`.
  3. Click `getByRole('button', { name: 'Sign In' })`.
- **Expected Result:** `getByRole('heading', { name: 'Available Rooms' })` is visible, `#rooms-grid .room-card` has count 4, and `#page-login` is hidden. `#login-error` is hidden.

#### [TC-LOGIN-02] Nav bar becomes visible after a successful login
- **Category:** Positive
- **Requirement:** L8
- **Regression Flag:** None
- **Preconditions:** Fresh page.
- **Steps:**
  1. Log in with valid credentials as in TC-LOGIN-01.
- **Expected Result:** `getByRole('navigation')` (`#main-navbar`) is visible on the Available Rooms page.

#### [TC-LOGIN-03] Password field masks typed characters
- **Category:** Positive
- **Requirement:** L3
- **Regression Flag:** Planned Regression: Login S1 — password input is `type="text"`, value shown in plain text
- **Preconditions:** Fresh page.
- **Steps:**
  1. Fill `getByLabel('Password')` with `process.env.BOOKNOW_PASSWORD`. (Do not use `getByRole('textbox', { name: 'Password' })`; it only matches the broken `type="text"` input.)
- **Expected Result:** `getByLabel('Password')` has attribute `type="password"`.

#### [TC-LOGIN-04] Login rejects a wrong password with an error and stays on the login page
- **Category:** Negative
- **Requirement:** L7
- **Regression Flag:** Planned Regression: Login S3 — `buggyLogin()` calls `showPage('rooms')` on the failure branch
- **Preconditions:** Fresh page.
- **Steps:**
  1. Fill `getByLabel('Email Address')` with `process.env.BOOKNOW_EMAIL`.
  2. Fill `getByLabel('Password')` with `wrongpass123`.
  3. Click **Sign In**.
- **Expected Result:** Login error check passes (stays on `#page-login`, `#login-error` visible with text, rooms heading not visible).

#### [TC-LOGIN-05] Login rejects an unregistered email with the correct password
- **Category:** Negative
- **Requirement:** L5, L7
- **Regression Flag:** Planned Regression: Login S3 — `wrong@booknow.com` / `stay2026` logs in
- **Preconditions:** Fresh page.
- **Steps:**
  1. Fill **Email Address** with `wrong@booknow.com`.
  2. Fill **Password** with `process.env.BOOKNOW_PASSWORD`.
  3. Click **Sign In**.
- **Expected Result:** Login error check passes.

#### [TC-LOGIN-06] Login rejects submission with both fields empty
- **Category:** Negative
- **Requirement:** L4
- **Regression Flag:** Planned Regression: Login S2 — empty fields log in, `#login-error` stays hidden
- **Preconditions:** Fresh page.
- **Steps:**
  1. Leave **Email Address** and **Password** empty.
  2. Click **Sign In**.
- **Expected Result:** Login error check passes.

#### [TC-LOGIN-07] Login rejects an empty password
- **Category:** Negative
- **Requirement:** L4
- **Regression Flag:** Planned Regression: Login S2 — empty password only logs in
- **Preconditions:** Fresh page.
- **Steps:**
  1. Fill **Email Address** with `process.env.BOOKNOW_EMAIL`; leave **Password** empty.
  2. Click **Sign In**.
- **Expected Result:** Login error check passes.

#### [TC-LOGIN-08] Login rejects an empty email
- **Category:** Negative
- **Requirement:** L4
- **Regression Flag:** Planned Regression: Login S2 — empty email only logs in
- **Preconditions:** Fresh page.
- **Steps:**
  1. Leave **Email Address** empty; fill **Password** with `process.env.BOOKNOW_PASSWORD`.
  2. Click **Sign In**.
- **Expected Result:** Login error check passes.

#### [TC-LOGIN-09] Login rejects emails missing the @, the domain, or the local part
- **Category:** Negative
- **Requirement:** L2
- **Regression Flag:** Planned Regression: Login S6 — email format isn't checked
- **Preconditions:** Fresh page (reload before each data row).
- **Steps:**
  1. For each email in `guestbooknow.com` (no @), `guest@` (no domain), `@booknow.com` (no local part):
  2. Fill **Email Address** with the value and **Password** with `process.env.BOOKNOW_PASSWORD`.
  3. Click **Sign In**.
- **Expected Result:** For every row, the login error check passes.

#### [TC-LOGIN-10] Nav bar is hidden on the login page before authentication
- **Category:** Negative
- **Requirement:** L8
- **Regression Flag:** Planned Regression: Login S4 — `#main-navbar` is visible before login
- **Preconditions:** Fresh page.
- **Steps:**
  1. Do not log in. Observe the page.
- **Expected Result:** `getByRole('navigation')` / `#main-navbar` is hidden.

#### [TC-LOGIN-11] Nav "Rooms" link does not open the Rooms page before login
- **Category:** Negative
- **Requirement:** L9
- **Regression Flag:** Planned Regression: Login S7 — no auth guard in `showPage()`; visible nav lets the user click into Rooms
- **Preconditions:** Fresh page.
- **Steps:**
  1. If `#main-navbar` is visible (broken build), click `page.locator('#main-navbar').getByText('Rooms', { exact: true })`. On a build where the navbar is hidden, there is nothing to click and the step is skipped.
- **Expected Result:** `#page-login` stays visible; `#page-rooms` is hidden; the "Available Rooms" heading is not visible.

#### [TC-LOGIN-12] Login with an email that has no top-level domain
- **Category:** Edge
- **Requirement:** L2 — **OPEN QUESTION**
- **Open Question:** L2 says "contains @ and a domain". Does `guest@booknow` (no TLD) count as having a domain?
- **Regression Flag:** Open Question (`@open-question`): Login S6 — `guest@booknow` logs in (a deviation only if the answer is "TLD required")
- **Preconditions:** Fresh page.
- **Steps:**
  1. Fill **Email Address** with `guest@booknow` and **Password** with `process.env.BOOKNOW_PASSWORD`.
  2. Click **Sign In**.
- **Expected Result:** Proposed: login error check passes. To be confirmed.

#### [TC-LOGIN-13] Login with the valid email in uppercase
- **Category:** Edge
- **Requirement:** L5 — **OPEN QUESTION**
- **Open Question:** Is the email match case-insensitive? Spec gives only `guest@booknow.com`.
- **Regression Flag:** Open Question (`@open-question`): no proposed answer (current behavior: logs in; correct behavior unknown). Automated to check that exactly one outcome (logged in, or the login error) is shown
- **Preconditions:** Fresh page.
- **Steps:**
  1. Fill **Email Address** with `GUEST@BOOKNOW.COM` and **Password** with `process.env.BOOKNOW_PASSWORD`.
  2. Click **Sign In**.
- **Expected Result:** To be confirmed: either the Available Rooms heading is visible (case-insensitive) or the login error check passes (case-sensitive).

#### [TC-LOGIN-14] Login with the valid email padded with spaces
- **Category:** Edge
- **Requirement:** L5 — **OPEN QUESTION**
- **Open Question:** Should leading/trailing whitespace be trimmed from the email?
- **Regression Flag:** Open Question (`@open-question`): no proposed answer (current behavior: logs in; correct behavior unknown). Automated to check that exactly one outcome (logged in, or the login error) is shown
- **Preconditions:** Fresh page.
- **Steps:**
  1. Fill **Email Address** with ` guest@booknow.com ` (one leading and one trailing space) and **Password** with `process.env.BOOKNOW_PASSWORD`.
  2. Click **Sign In**.
- **Expected Result:** To be confirmed: Available Rooms heading visible (trimmed) or login error check passes (not trimmed).

#### [TC-LOGIN-15] Login rejects whitespace-only email and password
- **Category:** Edge
- **Requirement:** L4 — **OPEN QUESTION**
- **Open Question:** Does "empty" include whitespace-only values? (Not explored at login; inferred from Login S2.)
- **Regression Flag:** Open Question (`@open-question`): Login S2 — no empty-field check exists (a deviation if whitespace counts as empty)
- **Preconditions:** Fresh page.
- **Steps:**
  1. Fill **Email Address** with `   ` and **Password** with `   `.
  2. Click **Sign In**.
- **Expected Result:** Proposed: login error check passes.

#### [TC-LOGIN-16] Double-clicking Sign In with valid credentials lands on Available Rooms once
- **Category:** Edge
- **Requirement:** L6
- **Regression Flag:** None (not explored)
- **Preconditions:** Fresh page.
- **Steps:**
  1. Fill valid credentials from `process.env`.
  2. Double-click `getByRole('button', { name: 'Sign In' })`.
- **Expected Result:** "Available Rooms" heading visible, `#rooms-grid .room-card` count is 4 (not duplicated), `#login-error` hidden, `#page-login` hidden.

#### [TC-LOGIN-17] Nav bar stays hidden after a failed login attempt
- **Category:** Negative
- **Requirement:** L8, L7
- **Regression Flag:** Planned Regression: Login S3 / S4 — wrong password logs in and the navbar is visible regardless
- **Preconditions:** Fresh page.
- **Steps:**
  1. Fill `getByLabel('Email Address')` with `process.env.BOOKNOW_EMAIL` and `getByLabel('Password')` with `wrongpass123`.
  2. Click **Sign In**.
- **Expected Result:** Login error check passes and `getByRole('navigation')` / `#main-navbar` is hidden.

#### [TC-LOGIN-18] Reloading after login returns to the login page and locks protected pages again
- **Category:** Negative
- **Requirement:** L9 (state not persisted, per Technical Context)
- **Regression Flag:** Planned Regression: Login S7 — `showPage()` has no auth guard, so protected pages open after the reload
- **Preconditions:** Logged in.
- **Steps:**
  1. Call `page.reload()`.
  2. Run `page.evaluate(() => showPage('rooms'))`.
- **Expected Result:** After step 1: `#page-login` visible, `#page-rooms` hidden, `#main-navbar` hidden. After step 2: `#page-login` still visible, `#page-rooms` hidden.

#### [TC-LOGIN-19] A successful login marks the session as authenticated
- **Category:** Positive
- **Requirement:** L6, L9
- **Regression Flag:** Planned Regression: Login S7 — `buggyLogin()` never sets `isLoggedIn`, so it stays `false` after a valid login
- **Preconditions:** Fresh page.
- **Steps:**
  1. Log in with valid credentials as in TC-LOGIN-01.
  2. Read `page.evaluate(() => isLoggedIn)`.
- **Expected Result:** The value is `true`. (This reads an app global named in `CLAUDE.md`. It is the only way to see Surprise 7 directly; the visible effect is covered by TC-LOGIN-11/18.)

#### [TC-LOGIN-20] Valid login succeeds after a failed attempt without a reload
- **Category:** Edge
- **Requirement:** L6, L7
- **Regression Flag:** Planned Regression: Login S3 — the first (wrong) attempt already logs in, so the retry path can't be reached
- **Preconditions:** Fresh page.
- **Steps:**
  1. Fill **Email Address** with `process.env.BOOKNOW_EMAIL`, **Password** with `wrongpass123`, click **Sign In**.
  2. Assert the login error check passes.
  3. Fill **Password** with `process.env.BOOKNOW_PASSWORD`, click **Sign In**.
- **Expected Result:** After step 3: "Available Rooms" heading visible, `#page-login` hidden, `#login-error` hidden.

---

## Rooms

Status: APPROVED

#### [TC-ROOMS-01] Available Rooms page shows a grid of room cards after login
- **Category:** Positive
- **Requirement:** R1
- **Regression Flag:** None
- **Preconditions:** Logged in.
- **Steps:**
  1. Observe `#page-rooms`.
- **Expected Result:** "Available Rooms" heading visible; `#rooms-grid .room-card` has count 4 with names Deluxe Room, Superior Room, Family Suite, Penthouse Suite (current `ROOMS` fixture).

#### [TC-ROOMS-02] Every room card shows all required elements
- **Category:** Positive
- **Requirement:** R2
- **Regression Flag:** None (presence only; content defects are in TC-ROOMS-05 and TC-ROOMS-06)
- **Preconditions:** Logged in.
- **Steps:**
  1. For each of the 4 room names, take `card(name)`.
- **Expected Result:** Each card contains, all visible: room name (`.room-name`, exact text), non-empty description (`.room-desc`), an `<img>` (`.room-img-wrap img`), original price matching `/^\$\d+\/night$/`, discounted price matching `/^\$\d+\.\d{2}\/night$/`, discount badge matching `/^\d+% OFF$/`, availability badge (`.availability-badge`), and `getByRole('button', { name: 'Select Room' })`.

#### [TC-ROOMS-03] Selecting each room opens the booking form for that room
- **Category:** Positive
- **Requirement:** R4, B1
- **Regression Flag:** None
- **Preconditions:** Logged in (reload and log in before each data row).
- **Steps:**
  1. For each room name, click `card(name).getByRole('button', { name: 'Select Room' })`.
- **Expected Result:** "Complete Your Booking" heading visible and `#booking-summary .summary-room-name` has exact text equal to the selected room name.

#### [TC-ROOMS-04] Discounted price on each card equals price × (1 − discount% / 100)
- **Category:** Positive
- **Requirement:** R3
- **Regression Flag:** Planned Regression: Rooms S1 — `calcDiscountedBuggy` divides by 1000 (e.g. Deluxe shows $126.42)
- **Preconditions:** Logged in.
- **Steps:**
  1. For each card, read `.price-original` and the discount badge.
  2. Read `card(name).locator('.price-discounted')`.
- **Expected Result:** Discounted price text equals: Deluxe `$103.20/night`, Superior `$80.10/night`, Family Suite `$169.15/night`, Penthouse `$284.05/night` (each also equals the formula applied to the card's own price and badge).

#### [TC-ROOMS-05] Every room card image loads
- **Category:** Positive
- **Requirement:** R2
- **Regression Flag:** Planned Regression: Rooms S3 — Deluxe Room image URL returns 404
- **Preconditions:** Logged in.
- **Steps:**
  1. For each card, evaluate `naturalWidth` on `card(name).locator('.room-img-wrap img')`.
- **Expected Result:** `naturalWidth > 0` for all 4 images.

#### [TC-ROOMS-06] Every room card description is fully readable
- **Category:** Positive
- **Requirement:** R2
- **Regression Flag:** Planned Regression: Rooms S5 — Family Suite description is clipped mid-word (`overflow-bug` class)
- **Preconditions:** Logged in. Mouse moved off the cards.
- **Steps:**
  1. For each card, evaluate `scrollWidth` and `clientWidth` on `card(name).locator('.room-desc')`.
- **Expected Result:** `scrollWidth <= clientWidth` for every description (no hidden horizontal overflow). `toHaveText` alone is not enough because the DOM text is complete.

#### [TC-ROOMS-07] Browser tab title is "BookNow — Hotel Room Booking" on every page
- **Category:** Positive
- **Requirement:** R5
- **Regression Flag:** Planned Regression: Rooms S2 / Login S5 / Confirmation S10 — title is "Untitled"
- **Preconditions:** Fresh page.
- **Steps:**
  1. Check the title on the login page.
  2. Log in; check the title on Available Rooms.
  3. Select Superior Room; check the title on the booking form.
  4. Fill valid booking data, click **Book Now**; check the title on the confirmation page.
- **Expected Result:** `page` has title `BookNow — Hotel Room Booking` at every step.

#### [TC-ROOMS-08] Rooms page cannot be opened with showPage('rooms') before login
- **Category:** Negative
- **Requirement:** L9
- **Regression Flag:** Planned Regression: Login S7 — `showPage()` has no `isLoggedIn` check
- **Preconditions:** Fresh page.
- **Steps:**
  1. Run `page.evaluate(() => showPage('rooms'))`.
- **Expected Result:** `#page-login` visible; `#page-rooms` hidden.

#### [TC-ROOMS-09] Discounted prices keep two decimals, including trailing zeros
- **Category:** Edge
- **Requirement:** R3
- **Regression Flag:** Planned Regression: Rooms S1 — values are wrong (format is correct)
- **Preconditions:** Logged in.
- **Steps:**
  1. Read `.price-discounted` on the Deluxe Room and Superior Room cards (results with a trailing zero).
- **Expected Result:** Deluxe shows `$103.20/night` (not `$103.2`) and Superior shows `$80.10/night` (not `$80.1`).

#### [TC-ROOMS-10] Double-clicking Select Room opens the booking form for that room only
- **Category:** Edge
- **Requirement:** R4
- **Regression Flag:** None (not explored)
- **Preconditions:** Logged in.
- **Steps:**
  1. Double-click `card('Family Suite').getByRole('button', { name: 'Select Room' })`.
- **Expected Result:** "Complete Your Booking" heading visible; `.summary-room-name` is exactly `Family Suite`.

#### [TC-ROOMS-11] Nav "Rooms" link and logo return to the rooms grid from the booking form
- **Category:** Positive
- **Requirement:** NO REQUIREMENT
- **Regression Flag:** None (works on broken build)
- **Preconditions:** On booking form for Deluxe Room.
- **Steps:**
  1. Click `page.locator('#main-navbar').getByText('Rooms', { exact: true })`.
  2. Select Deluxe Room again, then click `page.locator('#main-navbar .navbar-brand')`.
- **Expected Result:** After each click, "Available Rooms" heading visible, `#rooms-grid .room-card` count 4, `#page-booking` hidden.

#### [TC-ROOMS-12] "Available" badge is styled as available
- **Category:** Positive
- **Requirement:** NO REQUIREMENT — **OPEN QUESTION**
- **Open Question:** The spec lists an availability badge but not its styling. Confirm that an "Available" badge must use the available (green) style.
- **Regression Flag:** Open Question (`@open-question`): Rooms S4 — all "Available" badges use `badge-unavailable` (red); styling is not in the spec
- **Preconditions:** Logged in.
- **Steps:**
  1. For each card, read `card(name).locator('.availability-badge')`.
- **Expected Result:** Proposed: every badge with text `Available` has class `badge-available` and not `badge-unavailable`.

#### [TC-ROOMS-13] Room images have descriptive alt text
- **Category:** Positive
- **Requirement:** NO REQUIREMENT (accessibility not specified)
- **Regression Flag:** Open Question (`@open-question`): Rooms S3 (Deluxe has no `alt`) and Rooms S6 (Family Suite `alt=""`); accessibility is not in the spec
- **Preconditions:** Logged in.
- **Steps:**
  1. For each card, query `card(name).getByRole('img', { name })`.
- **Expected Result:** Proposed: the image is found by role with accessible name equal to the room name for all 4 cards.

#### [TC-ROOMS-14] Nav "Rooms" link and logo are keyboard-reachable links
- **Category:** Positive
- **Requirement:** NO REQUIREMENT (accessibility not specified)
- **Regression Flag:** Open Question (`@open-question`): Rooms S7 / Confirmation S8 — `<a>` without `href` and clickable `div`; accessibility is not in the spec. Also fails on `booknow-fixed`
- **Preconditions:** Logged in.
- **Steps:**
  1. Query `getByRole('navigation').getByRole('link', { name: 'Rooms' })`.
  2. Press Tab repeatedly from the top of the page.
- **Expected Result:** Proposed: the "Rooms" link is found by role and both it and the logo receive focus via Tab.

#### [TC-ROOMS-15] Returning to the rooms page repeatedly never duplicates or drops cards
- **Category:** Edge
- **Requirement:** R1
- **Regression Flag:** None (not explored; `showPage('rooms')` re-runs `renderRooms()` on every visit, so repeated rendering is a real risk)
- **Preconditions:** Logged in.
- **Steps:**
  1. Repeat 3 times: click `card('Deluxe Room').getByRole('button', { name: 'Select Room' })`, then click `page.locator('#main-navbar').getByText('Rooms', { exact: true })`.
- **Expected Result:** After each return, `#rooms-grid .room-card` has count exactly 4, and each of Deluxe Room, Superior Room, Family Suite, Penthouse Suite matches exactly one card.

---

## Booking Form

Status: APPROVED

#### [TC-BOOK-01] Selecting a room opens the booking form with all guest and stay fields
- **Category:** Positive
- **Requirement:** B1, B2, B3
- **Regression Flag:** None
- **Preconditions:** On booking form for Deluxe Room.
- **Steps:**
  1. Observe `#page-booking`.
- **Expected Result:** Headings "Guest Details" and "Stay Details" visible; `#book-fname`, `#book-lname`, `#book-email`, `#book-phone`, `#book-checkin`, `#book-checkout`, `#book-guests` visible; label texts First Name, Last Name, Email Address, Phone Number, Check-in Date, Check-out Date, Number of Guests visible in `#page-booking`. (Use IDs, not `getByLabel`: labels aren't linked.)

#### [TC-BOOK-02] Booking summary shows room name, price per night, nights and estimated total
- **Category:** Positive
- **Requirement:** B9
- **Regression Flag:** None (presence only; values in TC-BOOK-03/04/05)
- **Preconditions:** On booking form for Superior Room.
- **Steps:**
  1. Observe `#booking-summary`.
- **Expected Result:** `getByRole('heading', { name: 'Booking Summary' })` visible; `.summary-room-name` = `Superior Room`; a `.summary-row` with "Price per night" visible; `#summary-nights` visible; `#summary-total` visible and matches `/^\$\d+\.\d{2}$/`.

#### [TC-BOOK-03] Summary price per night equals the room's discounted price
- **Category:** Positive
- **Requirement:** B9, R3
- **Regression Flag:** Planned Regression: Rooms S1 — wrong discount carries into the summary ($126.42)
- **Preconditions:** On booking form for Deluxe Room.
- **Steps:**
  1. Read `#booking-summary .summary-row` filtered by "Price per night".
- **Expected Result:** Row contains `$103.20`.

#### [TC-BOOK-04] Nights equal check-out minus check-in in days
- **Category:** Positive
- **Requirement:** B10
- **Regression Flag:** Planned Regression: Booking S2 — `buggyUpdateTotal()` is empty, nights frozen at 1
- **Preconditions:** On booking form for Deluxe Room.
- **Steps:**
  1. Fill `#book-checkin` with `2026-12-01`.
  2. Fill `#book-checkout` with `2026-12-04`.
- **Expected Result:** `#summary-nights` has text `3`. (Re-query the locator; the summary is re-rendered.)

#### [TC-BOOK-05] Estimated total equals discounted price per night × nights
- **Category:** Positive
- **Requirement:** B11
- **Regression Flag:** Planned Regression: Booking S2 (nights frozen) and Rooms S1 (wrong discount)
- **Preconditions:** On booking form for Deluxe Room.
- **Steps:**
  1. Fill `#book-checkin` with `2026-12-01` and `#book-checkout` with `2026-12-04`.
- **Expected Result:** `#summary-total` has text `$309.60` (3 × $103.20).

#### [TC-BOOK-06] Valid booking with allowed phone punctuation is accepted and confirmed
- **Category:** Positive
- **Requirement:** B6, C1
- **Regression Flag:** None
- **Preconditions:** On booking form for Superior Room.
- **Steps:**
  1. Fill `#book-fname` `Jane`, `#book-lname` `Doe`, `#book-email` `jane@example.com`, `#book-phone` `+44 (20) 7946-0958`, `#book-checkin` `2026-12-01`, `#book-checkout` `2026-12-04`, `#book-guests` `2`.
  2. Click `getByRole('button', { name: 'Book Now' })`.
- **Expected Result:** "Booking Confirmed!" heading visible; `#page-booking` hidden; all `#err-*` hidden.

#### [TC-BOOK-07] Empty submission is rejected with all seven per-field errors
- **Category:** Negative
- **Requirement:** B4
- **Regression Flag:** Planned Regression: Booking S1 — `buggyPlaceBooking()` only calls `showPage('confirm')`
- **Preconditions:** On booking form for Deluxe Room; all fields empty (clear `#book-guests` too).
- **Steps:**
  1. Click **Book Now**.
- **Expected Result:** "Complete Your Booking" heading still visible; "Booking Confirmed!" not visible; visible errors: `#err-fname` "First name is required", `#err-lname` "Last name is required", `#err-email` "Valid email is required", `#err-phone` "Phone number is required (digits only)", `#err-checkin` "Check-in date is required", `#err-checkout` "Check-out date must be after check-in", `#err-guests` "At least 1 guest is required".

#### [TC-BOOK-08] Each blank required field is rejected with its own error
- **Category:** Negative
- **Requirement:** B4
- **Regression Flag:** Planned Regression: Booking S1 — no validation at all
- **Preconditions:** On booking form for Deluxe Room (fresh login per data row).
- **Steps:**
  1. Fill valid booking data.
  2. Clear one field: `fname`, `lname`, `email`, `phone`, `checkin`, `checkout`, `guests` (one per row).
  3. Click **Book Now**.
- **Expected Result:** Stays on booking form; only the matching `#err-<field>` is visible, with its text from TC-BOOK-07; the other six `#err-*` are hidden.

#### [TC-BOOK-09] Booking rejects emails missing the @ or the domain
- **Category:** Negative
- **Requirement:** B5
- **Regression Flag:** Planned Regression: Booking S5 — email format isn't checked
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. For each value `johnexample.com`, `john@`: fill `#book-email`.
  2. Click **Book Now**.
- **Expected Result:** Stays on booking form; `#err-email` visible with "Valid email is required"; "Booking Confirmed!" not visible.

#### [TC-BOOK-10] Booking rejects phone numbers with letters or disallowed symbols
- **Category:** Negative
- **Requirement:** B6
- **Regression Flag:** Planned Regression: Booking S6 — phone format isn't checked
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. For each value `abcdefg`, `123#456*789`: fill `#book-phone`.
  2. Click **Book Now**.
- **Expected Result:** Stays on booking form; `#err-phone` visible; "Booking Confirmed!" not visible. (The markup only has "Phone number is required"; assert visibility, not wording, for format errors.)

#### [TC-BOOK-11] Booking rejects a phone number shorter than 7 characters
- **Category:** Negative
- **Requirement:** B6
- **Regression Flag:** Planned Regression: Booking S6 — `12345` accepted
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-phone` with `12345`.
  2. Click **Book Now**.
- **Expected Result:** Stays on booking form; `#err-phone` visible.

#### [TC-BOOK-12] Booking rejects a check-out date before the check-in date
- **Category:** Negative
- **Requirement:** B7
- **Regression Flag:** Planned Regression: Booking S3 — check-out before check-in confirmed
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-checkin` `2026-12-05` and `#book-checkout` `2026-12-01`.
  2. Click **Book Now**.
- **Expected Result:** Stays on booking form; `#err-checkout` visible; "Booking Confirmed!" not visible.

#### [TC-BOOK-13] Booking rejects a negative number of guests
- **Category:** Negative
- **Requirement:** B8
- **Regression Flag:** Planned Regression: Booking S4 — `-3` accepted (`min="1"` not enforced)
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-guests` with `-3`.
  2. Click **Book Now**.
- **Expected Result:** Stays on booking form; `#err-guests` visible with "At least 1 guest is required".

#### [TC-BOOK-14] Booking form cannot be opened with showPage('booking') before login
- **Category:** Negative
- **Requirement:** L9, B1
- **Regression Flag:** Planned Regression: Login S7 / Booking S12 — form opens without login, with an empty summary
- **Preconditions:** Fresh page.
- **Steps:**
  1. Run `page.evaluate(() => showPage('booking'))`.
- **Expected Result:** `#page-login` visible; `#page-booking` hidden.

#### [TC-BOOK-15] A booking with no selected room cannot be confirmed
- **Category:** Negative
- **Requirement:** B1 — **OPEN QUESTION**
- **Open Question:** B1 says the form is "reached by selecting a room" but not what happens if it is reached otherwise. Should the form be refused, or should submit be blocked? Also: the logged-in variant was not explored (S12 was seen without login).
- **Regression Flag:** Open Question (`@open-question`): Booking S12 — Book Now confirms with `selectedRoom = null`. On `booknow-fixed` it throws a JS error and shows no refusal
- **Preconditions:** Logged in (no room selected).
- **Steps:**
  1. Run `page.evaluate(() => showPage('booking'))`.
  2. If the form is shown, fill valid booking data and click **Book Now**.
- **Expected Result:** Proposed: "Booking Confirmed!" is never visible (either the form is refused or submission is rejected).

#### [TC-BOOK-16] Booking rejects check-out on the same day as check-in
- **Category:** Edge
- **Requirement:** B7
- **Regression Flag:** Planned Regression: Booking S3 — same-day check-out confirmed
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-checkin` and `#book-checkout` both with `2026-12-01`.
  2. Click **Book Now**.
- **Expected Result:** Stays on booking form; `#err-checkout` visible; "Booking Confirmed!" not visible.

#### [TC-BOOK-17] Check-out one day after check-in is accepted as one night
- **Category:** Edge
- **Requirement:** B7, B10, B11
- **Regression Flag:** Planned Regression: Rooms S1 — total uses the wrong discounted price
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-checkin` `2026-12-01` and `#book-checkout` `2026-12-02`.
  2. Check the summary, then click **Book Now**.
- **Expected Result:** `#summary-nights` = `1`, `#summary-total` = `$103.20`, `#err-checkout` hidden, and "Booking Confirmed!" visible after Book Now.

#### [TC-BOOK-18] Booking rejects zero guests
- **Category:** Edge
- **Requirement:** B8
- **Regression Flag:** Planned Regression: Booking S4 — `0` accepted
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-guests` with `0`.
  2. Click **Book Now**.
- **Expected Result:** Stays on booking form; `#err-guests` visible with "At least 1 guest is required".

#### [TC-BOOK-19] Booking accepts the minimum of one guest
- **Category:** Edge
- **Requirement:** B8
- **Regression Flag:** None
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-guests` with `1`.
  2. Click **Book Now**.
- **Expected Result:** "Booking Confirmed!" visible; `#err-guests` was not shown.

#### [TC-BOOK-20] Phone length boundary: 7 characters accepted, 6 rejected
- **Category:** Edge
- **Requirement:** B6
- **Regression Flag:** Planned Regression (row B only): Booking S6 — short phones accepted (explored with `12345`; the 6/7 boundary is not explored). Row A (7 characters accepted) passes on both builds, so it is not tagged `@regression`. Row B also covers TC-BOOK-11
- **Preconditions:** On booking form for Deluxe Room with valid booking data (fresh login per row).
- **Steps:**
  1. Row A: fill `#book-phone` with `1234567`, click **Book Now**.
  2. Row B: fill `#book-phone` with `123456`, click **Book Now**.
- **Expected Result:** Row A: "Booking Confirmed!" visible. Row B: stays on booking form, `#err-phone` visible.

#### [TC-BOOK-21] Booking rejects an email made of spaces only
- **Category:** Edge
- **Requirement:** B4, B5
- **Regression Flag:** Planned Regression: Booking S5 — spaces-only email accepted
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-email` with `     `.
  2. Click **Book Now**.
- **Expected Result:** Stays on booking form; `#err-email` visible with "Valid email is required".

#### [TC-BOOK-22] Booking rejects a phone number made of spaces only
- **Category:** Edge
- **Requirement:** B4, B6
- **Regression Flag:** Planned Regression: Booking S6 — spaces-only phone accepted
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-phone` with `       ` (7 spaces).
  2. Click **Book Now**.
- **Expected Result:** Stays on booking form; `#err-phone` visible. (B6 requires digits; spaces alone contain none.)

#### [TC-BOOK-23] Booking rejects whitespace-only first and last names
- **Category:** Edge
- **Requirement:** B4 — **OPEN QUESTION**
- **Open Question:** Does "required" treat whitespace-only values as empty?
- **Regression Flag:** Open Question (`@open-question`): Booking S7 — `"   "` names accepted (a deviation if whitespace counts as empty)
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-fname` and `#book-lname` with `   `.
  2. Click **Book Now**.
- **Expected Result:** Proposed: stays on booking form; `#err-fname` and `#err-lname` visible.

#### [TC-BOOK-24] Booking with an email that has no top-level domain
- **Category:** Edge
- **Requirement:** B5 — **OPEN QUESTION**
- **Open Question:** B5 says only "valid format". Is `john@example` (no TLD) valid?
- **Regression Flag:** Open Question (`@open-question`): Booking S5 — `john@example` accepted (a deviation if a TLD is required)
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-email` with `john@example`.
  2. Click **Book Now**.
- **Expected Result:** Proposed: stays on booking form; `#err-email` visible.

#### [TC-BOOK-25] Booking with a fractional number of guests
- **Category:** Edge
- **Requirement:** B8 — **OPEN QUESTION**
- **Open Question:** B8 sets only a minimum. Must guests be a whole number?
- **Regression Flag:** Open Question (`@open-question`): Booking S4 — `1.5` accepted (a deviation if whole numbers are required). Also accepted on `booknow-fixed`
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-guests` with `1.5`.
  2. Click **Book Now**.
- **Expected Result:** Proposed: stays on booking form; `#err-guests` visible.

#### [TC-BOOK-26] Nights and total recalculate when the check-out date changes
- **Category:** Edge
- **Requirement:** B10, B11
- **Regression Flag:** Planned Regression: Booking S2 (nights frozen) and Rooms S1 (wrong price)
- **Preconditions:** On booking form for Superior Room.
- **Steps:**
  1. Fill `#book-checkin` `2026-12-01`, `#book-checkout` `2026-12-04`.
  2. Change `#book-checkout` to `2026-12-06`.
- **Expected Result:** After step 1: `#summary-nights` = `3`, `#summary-total` = `$240.30`. After step 2: `#summary-nights` = `5`, `#summary-total` = `$400.50`.

#### [TC-BOOK-27] Summary does not invent a night count before dates are picked
- **Category:** Edge
- **Requirement:** B10 — **OPEN QUESTION**
- **Open Question:** What should Nights and Estimated Total show before both dates are set (empty, "—", 0)?
- **Regression Flag:** Open Question (`@open-question`): Booking S10 — Nights = 1 and a one-night total shown with no dates. Same on `booknow-fixed`
- **Preconditions:** On booking form for Deluxe Room; dates untouched.
- **Steps:**
  1. Read `#summary-nights` and `#summary-total`.
- **Expected Result:** Proposed: `#summary-nights` is not `1` and `#summary-total` is not a one-night price (exact placeholder to be confirmed).

#### [TC-BOOK-28] Double-clicking Book Now with valid data shows the confirmation once
- **Category:** Edge
- **Requirement:** C1
- **Regression Flag:** Planned Regression: Confirmation S1 — `#confirm-ref` doesn't exist in the broken build, so the one-reference check fails (the double-submit itself was not explored)
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Double-click `getByRole('button', { name: 'Book Now' })`.
- **Expected Result:** "Booking Confirmed!" visible; `#page-booking` hidden; on builds with a reference, exactly one `#confirm-ref` is present.

#### [TC-BOOK-29] Booking with very long field values
- **Category:** Edge
- **Requirement:** NO REQUIREMENT — **OPEN QUESTION**
- **Open Question:** The spec sets no maximum lengths. What are the limits for names, email and phone?
- **Regression Flag:** Open Question (`@open-question`): no proposed answer until limits are defined (Booking S5, S6, S7 observed all accepted; no `maxlength`). Automated to check that exactly one outcome (confirmed, or a field error) is shown
- **Preconditions:** On booking form for Deluxe Room with valid booking data (fresh login per row).
- **Steps:**
  1. Row A: fill `#book-fname` and `#book-lname` with 500 characters each.
  2. Row B: fill `#book-email` with a 300+ character local part `@example.com`.
  3. Row C: fill `#book-phone` with 300 digits.
  4. Click **Book Now** each time.
- **Expected Result:** To be confirmed once limits are defined.

#### [TC-BOOK-30] Booking with digit-only names
- **Category:** Edge
- **Requirement:** NO REQUIREMENT — **OPEN QUESTION**
- **Open Question:** Are names like `12345` acceptable?
- **Regression Flag:** Open Question (`@open-question`): no proposed answer (Booking S7: accepted; breaks nothing in the spec). Automated to check that exactly one outcome is shown
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-fname` and `#book-lname` with `12345`.
  2. Click **Book Now**.
- **Expected Result:** To be confirmed.

#### [TC-BOOK-31] Booking with a check-in date in the past
- **Category:** Edge
- **Requirement:** NO REQUIREMENT — **OPEN QUESTION**
- **Open Question:** Can a stay be booked in the past?
- **Regression Flag:** Open Question (`@open-question`): Booking S8 — past dates accepted (`2025-01-01` → `2025-01-03`). Also accepted on `booknow-fixed`
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-checkin` `2025-01-01` and `#book-checkout` `2025-01-03`.
  2. Click **Book Now**.
- **Expected Result:** Proposed: stays on booking form; `#err-checkin` visible.

#### [TC-BOOK-32] Booking with a very large number of guests
- **Category:** Edge
- **Requirement:** NO REQUIREMENT — **OPEN QUESTION**
- **Open Question:** Is there a maximum guest count or room capacity?
- **Regression Flag:** Open Question (`@open-question`): no proposed answer (Booking S4: `99` accepted). Automated to check that exactly one outcome is shown
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Fill `#book-guests` with `99`.
  2. Click **Book Now**.
- **Expected Result:** To be confirmed.

#### [TC-BOOK-33] Booking form fields are named by their visible labels
- **Category:** Positive
- **Requirement:** NO REQUIREMENT (accessibility not specified)
- **Regression Flag:** Open Question (`@open-question`): Booking S9 — labels have no `for`, date inputs and guests are unnamed; accessibility is not in the spec. Also fails on `booknow-fixed`
- **Preconditions:** On booking form for Deluxe Room.
- **Steps:**
  1. For each label text (First Name, Last Name, Email Address, Phone Number, Check-in Date, Check-out Date, Number of Guests), query `page.getByLabel(text)`.
- **Expected Result:** Proposed: each `getByLabel` resolves to exactly the matching `#book-*` input.

#### [TC-BOOK-34] Reloading the booking form returns to login and discards the entered data
- **Category:** Edge
- **Requirement:** NO REQUIREMENT (Technical Context: "Booking state in JavaScript variables — not persisted"; not an in-scope line)
- **Regression Flag:** None (matches exploration: a reload resets to login)
- **Preconditions:** On booking form for Deluxe Room with valid booking data.
- **Steps:**
  1. Call `page.reload()`.
  2. Log in again and select Deluxe Room.
- **Expected Result:** After step 1: `#page-login` visible, `#page-booking` hidden. After step 2: `#book-fname`, `#book-lname`, `#book-email`, `#book-phone`, `#book-checkin`, `#book-checkout` have value `''` and `#book-guests` has value `1`.

#### [TC-BOOK-35] Nights are correct across month, year, leap-day and DST boundaries
- **Category:** Edge
- **Requirement:** B10, B11
- **Regression Flag:** Planned Regression: Booking S2 (nights frozen at 1) and Rooms S1 (wrong price)
- **Preconditions:** On booking form for Deluxe Room (fresh login per row). Run with `test.use({ timezoneId: 'Europe/Berlin' })` so the DST row is deterministic.
- **Steps:**
  1. For each row, fill `#book-checkin` and `#book-checkout`:
     - Year boundary: `2026-12-30` → `2027-01-02`
     - Leap day: `2028-02-28` → `2028-03-01`
     - DST start (Berlin, 2027-03-28): `2027-03-27` → `2027-03-29`
- **Expected Result:** Year boundary: `#summary-nights` = `3`, `#summary-total` = `$309.60`. Leap day: `2`, `$206.40`. DST: `2`, `$206.40`.

#### [TC-BOOK-36] Switching to another room updates the summary to the new room's price and total
- **Category:** Edge
- **Requirement:** R4, B9, B11
- **Regression Flag:** Planned Regression: Rooms S1 (wrong price) and Booking S2 (nights frozen)
- **Preconditions:** On booking form for Deluxe Room.
- **Steps:**
  1. Fill `#book-checkin` `2026-12-01` and `#book-checkout` `2026-12-04`.
  2. Click `page.locator('#main-navbar').getByText('Rooms', { exact: true })`, then Select Room on Penthouse Suite.
  3. Fill `#book-checkin` `2026-12-01` and `#book-checkout` `2026-12-04` again (so the result doesn't depend on TC-CONF-10).
- **Expected Result:** `.summary-room-name` = `Penthouse Suite`; Price per night row contains `$284.05`; `#summary-nights` = `3`; `#summary-total` = `$852.15`; `#booking-summary` does not contain `Deluxe Room` or `$103.20`.

#### [TC-BOOK-37] Correcting a rejected field and resubmitting confirms the booking
- **Category:** Positive
- **Requirement:** B4, C1
- **Regression Flag:** Planned Regression: Booking S1 — the first (invalid) submission is already confirmed
- **Preconditions:** On booking form for Deluxe Room with valid booking data, then `#book-fname` cleared.
- **Steps:**
  1. Click **Book Now**.
  2. Fill `#book-fname` with `John`.
  3. Click **Book Now**.
- **Expected Result:** After step 1: "Complete Your Booking" visible and `#err-fname` visible with text "First name is required". After step 3: "Booking Confirmed!" visible.

#### [TC-BOOK-38] Double-clicking Book Now on an empty form still rejects it
- **Category:** Negative
- **Requirement:** B4
- **Regression Flag:** Planned Regression: Booking S1 — no validation, so the first click already confirms
- **Preconditions:** On booking form for Deluxe Room; all fields empty (clear `#book-guests` too).
- **Steps:**
  1. Double-click `getByRole('button', { name: 'Book Now' })`.
- **Expected Result:** "Complete Your Booking" visible; `#page-confirm` hidden; all seven `#err-*` visible with the texts listed in TC-BOOK-07.

---

## Confirmation

Status: APPROVED

#### [TC-CONF-01] Valid booking shows the confirmation page
- **Category:** Positive
- **Requirement:** C1
- **Regression Flag:** None
- **Preconditions:** On booking form for Superior Room with valid booking data.
- **Steps:**
  1. Click **Book Now**.
- **Expected Result:** `#page-confirm` visible with `getByRole('heading', { name: 'Booking Confirmed!' })`; `#page-booking` hidden.

#### [TC-CONF-02] Confirmation displays a booking reference in the BKN-###### format
- **Category:** Positive
- **Requirement:** C2
- **Regression Flag:** Planned Regression: Confirmation S1 — `#confirm-ref` doesn't exist in the broken build
- **Preconditions:** On booking form for Superior Room with valid booking data.
- **Steps:**
  1. Click **Book Now**.
  2. Read `#confirm-ref`.
- **Expected Result:** `#confirm-ref` visible with text matching `/BKN-\d{6}$/` (exactly 6 digits).

#### [TC-CONF-03] Confirmation summary matches the submitted booking
- **Category:** Positive
- **Requirement:** C3
- **Regression Flag:** Planned Regression: Confirmation S1 — `#confirm-summary` doesn't exist in the broken build
- **Preconditions:** On booking form for Superior Room with valid booking data.
- **Steps:**
  1. Click **Book Now**.
  2. Read each `#confirm-summary .confirm-row`.
- **Expected Result:** Guest row contains `John Smith`; Email `john@example.com`; Room `Superior Room`; Check-in `2026-12-01`; Check-out `2026-12-04`; Nights `3`; `.confirm-row.total-row` contains `$240.30` (3 × $80.10, equal to the form's Estimated Total).

#### [TC-CONF-04] Browse More Rooms returns to the Available Rooms page
- **Category:** Positive
- **Requirement:** C4
- **Regression Flag:** None
- **Preconditions:** On the confirmation page after a valid booking.
- **Steps:**
  1. Click `getByRole('button', { name: 'Browse More Rooms' })`.
- **Expected Result:** "Available Rooms" heading visible; `#rooms-grid .room-card` count 4; `#page-confirm` hidden.

#### [TC-CONF-05] An empty booking does not reach the confirmation page
- **Category:** Negative
- **Requirement:** C1, B4
- **Regression Flag:** Planned Regression: Confirmation S3 — "Booking Confirmed!" shown for an empty booking
- **Preconditions:** On booking form for Deluxe Room; all fields empty except Guests at default `1`.
- **Steps:**
  1. Click **Book Now**.
- **Expected Result:** `#page-confirm` hidden; "Booking Confirmed!" not visible; "Complete Your Booking" still visible.

#### [TC-CONF-06] An unauthenticated user cannot reach the confirmation by clicking through
- **Category:** Negative
- **Requirement:** L9
- **Regression Flag:** Planned Regression: Confirmation S4 — nav → Select Room → Book Now reaches "Booking Confirmed!" without login
- **Preconditions:** Fresh page.
- **Steps:**
  1. If visible, click the nav "Rooms" link (`#main-navbar` text `Rooms`).
  2. If the grid is shown, click Select Room on any card, then **Book Now** with the form empty.
- **Expected Result:** `#page-confirm` is never visible; `#page-login` remains visible.

#### [TC-CONF-07] Confirmation cannot be opened with showPage('confirm') before login
- **Category:** Negative
- **Requirement:** L9
- **Regression Flag:** Planned Regression: Login S7 — no auth guard in `showPage()`
- **Preconditions:** Fresh page.
- **Steps:**
  1. Run `page.evaluate(() => showPage('confirm'))`.
- **Expected Result:** `#page-login` visible; `#page-confirm` hidden.

#### [TC-CONF-08] Two consecutive bookings get different references
- **Category:** Edge
- **Requirement:** C2
- **Regression Flag:** Planned Regression: Confirmation S2 — identical confirmations; uniqueness blocked by S1
- **Preconditions:** On the confirmation page after a valid Superior Room booking.
- **Steps:**
  1. Store the text of `#confirm-ref`.
  2. Click **Browse More Rooms**, select Penthouse Suite, overwrite every field: `Anna` / `Lee` / `anna.lee@example.com` / `(555) 123-4567` / `2027-01-10` / `2027-01-15` / `3`.
  3. Click **Book Now**; re-query `#confirm-ref`.
- **Expected Result:** Both references match `/BKN-\d{6}$/`, and the second differs from the first.

#### [TC-CONF-09] Second booking's confirmation shows the second booking's data
- **Category:** Edge
- **Requirement:** C3
- **Regression Flag:** Planned Regression: Confirmation S1 / S2 — no summary; identical page text
- **Preconditions:** Same as TC-CONF-08, steps 1–3 completed.
- **Steps:**
  1. Re-query `#confirm-summary .confirm-row`.
- **Expected Result:** Guest `Anna Lee`; Email `anna.lee@example.com`; Room `Penthouse Suite`; Check-in `2027-01-10`; Check-out `2027-01-15`; Nights `5`; Total `$1420.25` (5 × $284.05). No row contains `John Smith` or `Superior Room`.

#### [TC-CONF-10] Booking form is empty when starting a new booking
- **Category:** Edge
- **Requirement:** NO REQUIREMENT — **OPEN QUESTION**
- **Open Question:** Should the booking form reset after a confirmed booking?
- **Regression Flag:** Open Question (`@open-question`): Confirmation S6 — all 7 fields keep the previous booking's values. Same on `booknow-fixed`
- **Preconditions:** On the confirmation page after a valid booking.
- **Steps:**
  1. Click **Browse More Rooms**, then Select Room on Penthouse Suite.
- **Expected Result:** Proposed: `#book-fname`, `#book-lname`, `#book-email`, `#book-phone`, `#book-checkin`, `#book-checkout` are empty and `#book-guests` is `1`.

#### [TC-CONF-11] Browser Back from the confirmation page stays in the app
- **Category:** Edge
- **Requirement:** NO REQUIREMENT — **OPEN QUESTION**
- **Open Question:** Should in-app navigation create history entries?
- **Regression Flag:** Open Question (`@open-question`): Confirmation S5 — Back goes to `about:blank`. Same on `booknow-fixed`
- **Preconditions:** On the confirmation page after a valid booking.
- **Steps:**
  1. Call `page.goBack()` (this case deliberately tests Back).
- **Expected Result:** Proposed: the page is still on `http://localhost:3000/` and shows the booking form or rooms page.

#### [TC-CONF-12] A logged-in user can log out
- **Category:** Positive
- **Requirement:** NO REQUIREMENT — **OPEN QUESTION**
- **Open Question:** Is a logout control in scope? (`#nav-user` exists but is always empty.)
- **Regression Flag:** None until answered (Confirmation S7: no logout control)
- **Preconditions:** Logged in.
- **Steps:**
  1. Look for a logout control in `#main-navbar`.
- **Expected Result:** To be confirmed.

#### [TC-CONF-13] Confirmation subtitle does not promise an email
- **Category:** Edge
- **Requirement:** NO REQUIREMENT — **OPEN QUESTION**
- **Open Question:** Email notifications are out of scope, but both builds mention email in the subtitle. Should the copy change?
- **Regression Flag:** Open Question (`@open-question`): Confirmation S9 — the subtitle mentions email; `booknow-fixed` also mentions email
- **Preconditions:** On the confirmation page after a valid booking.
- **Steps:**
  1. Read `#page-confirm .confirm-subtitle`.
- **Expected Result:** Proposed: subtitle text does not contain "email".

#### [TC-CONF-14] Confirmation shows guest names with HTML characters as plain text
- **Category:** Edge
- **Requirement:** C3
- **Regression Flag:** Planned Regression: Confirmation S1 — `#confirm-summary` doesn't exist in the broken build (HTML rendering itself not explored)
- **Preconditions:** On booking form for Superior Room with valid booking data.
- **Steps:**
  1. Fill `#book-fname` with `Anna` and `#book-lname` with `O'Brien <i>Test</i>`.
  2. Click **Book Now**.
- **Expected Result:** The Guest row of `#confirm-summary .confirm-row` contains the literal text `Anna O'Brien <i>Test</i>`, and `#confirm-summary i` has count 0. (The notes say the confirmation summary is built as `innerHTML`, so user input could be rendered as markup.)

---

## Coverage Gaps

### (a) Requirements with no cases

None. All 29 in-scope requirements have at least one case:

| Req | Cases |
|---|---|
| L1 | LOGIN-01 |
| L2 | LOGIN-09, LOGIN-12 |
| L3 | LOGIN-03 |
| L4 | LOGIN-06, 07, 08, 15 |
| L5 | LOGIN-01, 05, 13, 14 |
| L6 | LOGIN-01, 16, 19, 20 |
| L7 | LOGIN-04, 05, 17, 20 |
| L8 | LOGIN-02, 10, 17 |
| L9 | LOGIN-11, 18, 19, ROOMS-08, BOOK-14, CONF-06, CONF-07 |
| R1 | ROOMS-01, 15 |
| R2 | ROOMS-02, 05, 06 |
| R3 | ROOMS-04, 09, BOOK-03 |
| R4 | ROOMS-03, 10, BOOK-36 |
| R5 | ROOMS-07 |
| B1 | BOOK-01, 14, 15, ROOMS-03 |
| B2 | BOOK-01 |
| B3 | BOOK-01 |
| B4 | BOOK-07, 08, 21, 22, 23, 37, 38, CONF-05 |
| B5 | BOOK-09, 21, 24 |
| B6 | BOOK-06, 10, 11, 20, 22 |
| B7 | BOOK-12, 16, 17 |
| B8 | BOOK-13, 18, 19, 25 |
| B9 | BOOK-02, 03, 36 |
| B10 | BOOK-04, 17, 26, 27, 35 |
| B11 | BOOK-05, 17, 26, 35, 36 |
| C1 | CONF-01, 05, BOOK-06, BOOK-28, BOOK-37 |
| C2 | CONF-02, 08 |
| C3 | CONF-03, 09, 14 |
| C4 | CONF-04 |

Partially covered (assertions weaker than ideal until `booknow-fixed` is checked):
- **L7:** the login error wording is unknown, so cases assert visibility and non-empty text only.
- **B6:** the markup has no distinct phone-format message, so format cases assert `#err-phone` visibility only.
- **C3:** "total charged" is assumed to equal the form's Estimated Total.

### (b) App behavior seen in exploration that no requirement covers

| Behavior (exploration ref) | Case |
|---|---|
| "Available" badges styled red / `badge-unavailable` (Rooms S4) | ROOMS-12 |
| Missing / empty image alt text (Rooms S3, S6) | ROOMS-13 |
| Nav "Rooms" link and logo aren't real links, not keyboard-reachable (Rooms S7, Confirmation S8) | ROOMS-14 |
| Nav "Rooms" link and logo navigate back to the grid | ROOMS-11 |
| Labels not associated with booking inputs; error spans have no `role="alert"` / `aria-describedby` (Booking S9) | BOOK-33 |
| No maximum length on names, email, phone (Booking S5, S6, S7) | BOOK-29 |
| Digit-only names accepted (Booking S7) | BOOK-30 |
| Past check-in dates accepted (Booking S8) | BOOK-31 |
| 99 guests accepted; no capacity defined (Booking S4) | BOOK-32 |
| Booking form keeps previous booking's data (Confirmation S6) | CONF-10 |
| Browser Back leaves the app (Confirmation S5) | CONF-11 |
| No logout control; `#nav-user` always empty (Confirmation S7) | CONF-12 |
| Subtitle mentions email, which is out of scope (Confirmation S9) | CONF-13 |
| Email case sensitivity and whitespace trimming at login (Login negative-paths table) | LOGIN-13, LOGIN-14 (tagged L5 + OPEN QUESTION) |
| "Select dates above to calculate total" hint stays visible after dates are picked (Booking selectors, S2) | No case: hint not in spec |
| Pressing Enter in a booking field doesn't submit (no `<form>`) | No case: not a defect |
| Card lifts 3px on hover (intended) | No case: affects screenshots only |
| Reload resets to login page and discards entered data (Technical Context, not an in-scope line) | BOOK-34 (LOGIN-18 covers the auth side under L9) |

---

## Review Notes (2026-11-25)

Review of the draft against `requirements.md`, `qa-exploration-notes.md` and the test-case-design skill. Existing cases were not changed or deleted; problems are listed here for the tester to decide.

### Cases added in this review

| ID | Reason |
|---|---|
| TC-LOGIN-17 | L8 was checked before and after a *successful* login only, never after a failed one |
| TC-LOGIN-18 | Reload clears state (Technical Context); protected pages must be locked again |
| TC-LOGIN-19 | Login S7 (`isLoggedIn` never set) had no case that observes it directly |
| TC-LOGIN-20 | Failed attempt followed by a valid retry without a reload |
| TC-ROOMS-15 | `renderRooms()` runs on every visit; repeated visits could duplicate cards |
| TC-BOOK-34 | Reload mid-booking loses data (Technical Context) |
| TC-BOOK-35 | Night math across year, leap-day and DST boundaries |
| TC-BOOK-36 | Changing room mid-booking must reprice the summary (no stale room or price) |
| TC-BOOK-37 | Error → correction → successful resubmit recovery path |
| TC-BOOK-38 | Double-submit on an invalid form (no `<form>` element, the handler runs on every click) |
| TC-CONF-14 | Confirmation summary is built with `innerHTML`; guest input could render as markup |

### Flagged: category labels

| ID | Current | Suggested | Why |
|---|---|---|---|
| TC-LOGIN-10 | Negative | Positive | Checks intended initial state; nothing is submitted or rejected |
| TC-BOOK-26 | Edge | Positive | Normal recalculation flow, not a boundary |
| TC-CONF-08 | Edge | Positive | Core C2 behavior (uniqueness), not a boundary |
| TC-CONF-09 | Edge | Positive | Core C3 behavior on a second normal booking |
| TC-CONF-13 | Edge | Positive | Copy check, not a boundary |

### Flagged: duplicates and overlaps

- **TC-ROOMS-09 is fully covered by TC-ROOMS-04**, which already asserts the exact strings `$103.20/night` and `$80.10/night`. Merge or drop.
- **TC-CONF-05 and TC-BOOK-07** test the same action (empty Book Now). They differ only in whether Guests is cleared. Keep one or state the difference in the title.
- **TC-BOOK-06 and TC-CONF-01** are both "valid booking → confirmation". BOOK-06 adds phone punctuation, so consider renaming CONF-01 or making it reuse BOOK-06.
- **TC-BOOK-11 (`12345`) and TC-BOOK-20 row B (`123456`)** overlap. BOOK-20 is the stronger boundary.
- **TC-LOGIN-11, ROOMS-08, BOOK-14 and CONF-07** share one root cause (no guard in `showPage()`). This is intentional (one per protected page), but expect one bug to fail four cases.

### Flagged: expected results not exact or not deterministic

- **TC-LOGIN-04 to 09, 12, 15, 17, 20:** login error check uses `toHaveText(/\S/)` because the wording is unknown. **OPEN QUESTION:** what is the exact login error text? Confirm on `booknow-fixed`, then pin it.
- **TC-BOOK-10, 11, 20, 22:** assert `#err-phone` visible, no text. The only message in the markup is "Phone number is required", which is wrong for a format error. **OPEN QUESTION:** what is the phone-format message?
- **TC-BOOK-12, 16:** assert `#err-checkout` visible, no text. The only message is "Check-out date is required". **OPEN QUESTION:** what is the date-order message?
- **TC-BOOK-19:** "`#err-guests` was not shown" can't be checked after leaving the page. Assert `toBeHidden()` before clicking Book Now, or rely on confirmation alone.
- **TC-LOGIN-11, TC-CONF-06, TC-BOOK-15, TC-BOOK-28:** steps branch on the build ("if visible…", "on builds with a reference…"). On `booknow-fixed`, LOGIN-11 passes without clicking anything. Use one path: for LOGIN-11/CONF-06, click with `{ force: true }` or call `showPage`; for BOOK-28, always assert `#confirm-ref` count 1.
- **TC-ROOMS-14:** "Press Tab repeatedly" has no fixed count. Define it, e.g. Tab from `body` up to N times and assert both elements were focused.
- **TC-ROOMS-01:** count 4 comes from the `ROOMS` fixture, not the spec (R1 says only "grid of available rooms"). Acceptable, but mark it as a fixture assertion.
- **TC-CONF-12:** steps ("Look for a logout control") and expected ("To be confirmed") aren't checkable. Leave it unautomated until the open question is answered.
- **TC-CONF-09:** `$1420.25`. The thousands-separator format is unknown (`$1,420.25`?). **OPEN QUESTION.**
- **TC-CONF-03 / 09:** assume "Total Charged" = Estimated Total. **OPEN QUESTION** (already listed in Coverage Gaps).

### Flagged: cross-cutting risks

- **Hard-coded dates will soon be in the past.** The shared valid data uses `2026-12-01`, six days from today. If the BOOK-31 open question ends in "past dates are rejected", every case using valid booking data will start failing after 2026-12-01. Build dates relative to today in the fixture.
- **Spec questions with `Regression Flag: None`** (LOGIN-13, LOGIN-14, BOOK-29, 30, 32, CONF-12, CONF-13). Skill §4 says every documented deviation gets a Planned Regression flag. These are spec questions rather than defects, so `None` is defensible, but update the flag once each question is answered. **Resolved:** these cases (except CONF-12, which is not automated) and every case with a proposed open-question answer are now flagged Open Question (`@open-question`).
- **Format deviation:** every case adds a `Requirement:` line, and open-question cases add an `Open Question:` line. Neither field is in the skill schema; both were requested in the original design prompt. Update the skill if they should stay.
- **Implementation coupling:** TC-LOGIN-19 reads the `isLoggedIn` global. It will break if the variable is renamed.
