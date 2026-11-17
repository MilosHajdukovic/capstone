# QA Exploration Notes

## Table of Contents

1. [Login](#login)
2. [Available Rooms](#available-rooms)
3. [Booking Form](#booking-form)
4. [Confirmation Page](#confirmation-page)
5. [Requirements Coverage](#requirements-coverage)

---

## Login

Explored on 2026-11-14 against `booknow-broken`, served at http://localhost:3000, using the Playwright MCP browser (Chromium).
Spec reference: `requirements.md`, section "Login Page".

### Flows

#### Happy path: valid login
1. Open `http://localhost:3000/`. The login section (`#page-login`) is the only visible page, under the "Welcome Back" heading.
2. Fill **Email Address** with `guest@booknow.com` (in tests, use `process.env.BOOKNOW_EMAIL`).
3. Fill **Password** with `stay2026` (in tests, use `process.env.BOOKNOW_PASSWORD`).
4. Click **Sign In**.
5. The app shows the **Available Rooms** page (`#page-rooms`, heading "Available Rooms", 4 room cards in `#rooms-grid`).

Notes for test design:
- This is a single-page app, so the URL stays `http://localhost:3000/` after login. Assert on visible content, not on the URL.
- A reload resets all state to the login page. Each test has to log in through the UI.

#### Negative paths: invalid credentials and formats (explored 2026-11-17)
For each row: reload, fill both fields, click **Sign In**. Expected per spec: stay on `#page-login` with `#login-error` visible.

| Email | Password | Case | Result on `booknow-broken` |
|---|---|---|---|
| `guestbooknow.com` | `stay2026` | no `@` | Logged in, no error |
| `guest@` | `stay2026` | no domain | Logged in, no error |
| `guest@booknow` | `stay2026` | no TLD | Logged in, no error |
| `@booknow.com` | `stay2026` | no local part | Logged in, no error |
| `wrong@booknow.com` | `stay2026` | wrong email, right password | Logged in, no error |
| `GUEST@BOOKNOW.COM` | `stay2026` | uppercase email | Logged in (spec doesn't say whether email is case-insensitive: **spec question**) |
| ` guest@booknow.com ` | `stay2026` | padded with spaces | Logged in (trimming not specified: **spec question**) |
| `guest@booknow.com` | *(empty)* | empty password only | Logged in, no error |
| *(empty)* | `stay2026` | empty email only | Logged in, no error |
| `guest@booknow.com` | `stay2026` | valid | Logged in |

In every case, including the valid one, `isLoggedIn` was still `false` afterwards, and the nav bar was visible both before and after.

#### Protected pages without logging in (explored 2026-11-17)
1. Open a fresh page and don't log in.
2. Call `showPage('rooms')`, `showPage('booking')` and `showPage('confirm')` from the console. Or click **Rooms** in the nav bar, which is already visible.
3. Expected: each call is refused and the login page stays visible.
4. Actual: all three sections become visible. See Surprise 7.

### Selectors

| Element | Recommended locator | Fallback | Notes |
|---|---|---|---|
| Email field | `page.getByLabel('Email Address')` | `page.locator('#login-user')` | `<label for="login-user">` is properly associated. |
| Password field | `page.getByLabel('Password')` | `page.locator('#login-pass')` | **Don't use `getByRole('textbox', { name: 'Password' })`.** It matches only because the broken app uses `type="text"`. A correct `type="password"` input has no `textbox` role, so that locator would break on the fixed app. `getByLabel` works on both. |
| Sign In button | `page.getByRole('button', { name: 'Sign In' })` | `page.locator('#page-login button')` | It's the only button in the login section. |
| Error message | `page.locator('#login-error')` | none | It has no `role="alert"` or `aria-live`, so there's no role-based option. It's hidden with the `hidden` class and empty when not shown. I never saw it displayed, because every attempt logged in (see Surprises). Its text is unknown, so assert on visibility and non-empty text rather than an exact string. |
| Post-login check | `page.getByRole('heading', { name: 'Available Rooms' })` | `page.locator('#page-rooms')` | Use it to confirm the redirect. |
| Nav bar | `page.getByRole('navigation')` | `page.locator('#main-navbar')` | Should be hidden before login. |

### Surprises

#### 1. Password input isn't masked (High)
- **Did:** Typed `stay2026` into the Password field.
- **Expected:** Masked characters (`type="password"`), as the spec requires: "Password field must mask input characters".
- **Actual:** The value showed in plain text. The input is `type="text"`. Screenshot: `.playwright-mcp/login-filled.png`.
- **Breaks:** "Password field must mask input characters" (Login Page).

#### 2. Empty fields log you in (High)
- **Did:** Reloaded the page and clicked Sign In with both fields empty.
- **Expected:** An error message, staying on the login page. The spec says: "Empty fields must be rejected with an error message".
- **Actual:** The app went to the Available Rooms page. `#login-error` stayed hidden and empty. Neither input has `required`, so there's no browser validation either. Screenshot: `.playwright-mcp/login-empty-fields.png`. On 2026-11-17, an empty email only and an empty password only also logged in.
- **Breaks:** "Empty fields must be rejected with an error message" (Login Page).

#### 3. Wrong password logs you in (Critical)
- **Did:** Reloaded and entered `guest@booknow.com` / `wrongpass123`, then clicked Sign In.
- **Expected:** An error message, staying on the login page. The spec says: "Failed login shows an error message and stays on the login page".
- **Actual:** The app went to the Available Rooms page with no error. The button calls `buggyLogin()` in `app.js`. It does compare the credentials, but the "wrong" branch also calls `showPage('rooms')`, so the comparison has no effect. On 2026-11-17, `wrong@booknow.com` / `stay2026` (wrong email, right password) also logged in.
- **Breaks:** "Failed login shows an error message and stays on the login page" (Login Page).

#### 4. Nav bar visible before login (Medium)
- **Did:** Loaded the page without logging in.
- **Expected:** The nav bar hidden until the user is authenticated. The spec says: "The top navigation bar is hidden until the user is authenticated".
- **Actual:** `#main-navbar` (BookNow / Rooms) is visible on the login page (`display: flex`). The navbar never starts with the `hidden` class, so `buggyLogin()` removing it changes nothing.
- **Breaks:** "The top navigation bar is hidden until the user is authenticated" (Login Page).

#### 5. Page title is "Untitled" (Medium)
- **Did:** Loaded the page.
- **Expected:** "BookNow — Hotel Room Booking".
- **Actual:** `document.title` is "Untitled". This was first labelled "not in spec", but the current `requirements.md` does specify the title (see [Available Rooms, Surprise 2](#2-browser-tab-title-is-untitled-medium)).
- **Breaks:** "Browser tab title: 'BookNow — Hotel Room Booking'" (Available Rooms).

#### 6. Email format isn't checked at login (High)
- **Did:** Signed in with `guestbooknow.com`, `guest@`, `guest@booknow` and `@booknow.com`, each with password `stay2026`.
- **Expected:** Each rejected with an error, staying on the login page.
- **Actual:** All four logged in. `#login-error` never appeared. The field is `type="text"` with no `required`, so the browser doesn't check the format either.
- **Breaks:** "Email must be a valid format (contains @ and a domain)" (Login Page).

#### 7. No auth guard: login never sets `isLoggedIn` (Critical)
- **Did:** On a fresh page, without logging in, called `showPage('rooms')`, `showPage('booking')` and `showPage('confirm')`. Also read `isLoggedIn` after each login attempt in the table above.
- **Expected:** Protected sections refused until login, and `isLoggedIn` set to `true` after a valid login.
- **Actual:** All three sections opened without logging in. `showPage()` has no `isLoggedIn` check, and `buggyLogin()` never sets `isLoggedIn`, so it stays `false` even after a valid login. The visible nav bar (Surprise 4) means a user can reach Rooms by clicking, with no console needed. See also [Confirmation Page, Surprise 4](#4-confirmation-is-reachable-without-logging-in-critical).
- **Breaks:** "Protected pages (rooms, booking, confirmation) are unreachable without logging in" (Login Page).

### Not yet explored
- The error message text and appearance. **Untestable on `booknow-broken`:** it's blocked by Surprises 2, 3 and 6, because no input ever shows `#login-error`. Check it on `booknow-fixed`.
- Whether `guest@booknow.com` / `stay2026` are the *only* accepted credentials. **Untestable** while every input logs in (Surprise 3).
- Email case-insensitivity and whitespace trimming: **spec questions**, see the negative-paths table.

---

## Available Rooms

Explored on 2026-11-17 against `booknow-broken`, served at http://localhost:3000, using the Playwright MCP browser (Chromium).
Spec reference: `requirements.md`, section "Available Rooms (Search Results)".

### Flows

#### Happy path: log in and select a room
1. Open `http://localhost:3000/`. The login section (`#page-login`) is shown.
2. Fill **Email Address** with `process.env.BOOKNOW_EMAIL` and **Password** with `process.env.BOOKNOW_PASSWORD`.
3. Click **Sign In**.
4. The app shows the **Available Rooms** page (`#page-rooms`): heading "Available Rooms", subtitle "Choose from our selection of rooms and suites", and 4 room cards in `#rooms-grid`, in this order: Deluxe Room, Superior Room, Family Suite, Penthouse Suite.
5. In the card for the room you want, click **Select Room**.
6. The app shows the booking form (`#page-booking`, heading "Complete Your Booking"). The Booking Summary shows the selected room's name, its discounted price per night, Nights = 1, and an Estimated Total equal to one night.

#### Back to the rooms grid
- From the booking form, click **Rooms** in the nav bar or the **BookNow** logo. Both show `#page-rooms` again, and the grid is re-rendered (`showPage('rooms')` calls `renderRooms()`).

Notes for test design:
- The URL stays `http://localhost:3000/` throughout, and no history entries are pushed. Assert on visible sections and headings, not on the URL, and don't use `page.goBack()` to move between sections.
- I checked all 4 buttons. Each opened the booking form for the matching room, so routing is correct. Only the price is wrong (see Surprises 1).
- Hovering a card lifts it by 3px (`.room-card:hover { transform: translateY(-3px) }`). This is intended, not a bug. Keep it in mind for screenshot comparisons, and move the mouse away before taking one.

### Selectors

Scope room-level locators to a card. Every card has the same "Select Room" button text and the same "Available" badge, so page-level role or text locators return 4 matches.

```ts
const rooms = page.locator('#rooms-grid');
const card = (name: string) => rooms.locator('.room-card').filter({ hasText: name });
```

| Element | Recommended locator | Fallback | Notes |
|---|---|---|---|
| Rooms page heading | `page.getByRole('heading', { name: 'Available Rooms' })` | `page.locator('#page-rooms h2')` | Use it to confirm you're on the rooms page. |
| Rooms grid | `page.locator('#rooms-grid')` | `page.locator('#page-rooms .rooms-grid')` | It's a plain `div` with no role or label, so the ID is the only stable hook. It's a CSS grid with 3 columns at 1200px width. |
| Room card | `card('Deluxe Room')`, i.e. `page.locator('#rooms-grid .room-card').filter({ hasText: 'Deluxe Room' })` | `page.locator('#rooms-grid .room-card').nth(0)` | **No role, label or ID.** It's a `div.room-card`, so class plus text filter is the best option. Use `toHaveCount(4)` to check the number of cards. |
| Room name | `card(name).getByText(name, { exact: true })` | `card(name).locator('.room-name')` | **Not a heading.** It's a `div.room-name`, so `getByRole('heading')` won't find it. On the rooms page `getByText('Deluxe Room')` is unique, but the same name also appears in the (hidden) booking summary, so scope it to `#rooms-grid`. |
| Room description | `card(name).locator('.room-desc')` | `card(name).getByText('Comfortable room with', { exact: false })` | No role or ID. Asserting on the full text with `toHaveText` passes even for the clipped Family Suite text (Surprise 5), so check for visual overflow separately. |
| Room image | `card(name).getByRole('img', { name })` | `card(name).locator('.room-img-wrap img')` | The role locator works only for Superior and Penthouse. Deluxe has no `alt` and Family Suite has `alt=""` (presentational), so they have no accessible name. Use the CSS fallback to check that every image loaded: `naturalWidth > 0`. |
| Original price | `card(name).locator('.price-original')` | `card(name).getByText(/^\$\d+\/night$/)` | Format `$129/night`, struck through. No role or ID. |
| Discounted price | `card(name).locator('.price-discounted')` | `card(name).getByText(/^\$\d+\.\d{2}\/night$/)` | Format `$126.42/night`. No role or ID. Compare it against `price × (1 − discount / 100)`, worked out from the original price and the badge, or from a fixture. |
| Discount badge | `card(name).getByText(/^\d+% OFF$/)` | `card(name).locator('.badge-discount')` | Format `20% OFF`. |
| Availability badge | `card(name).getByText('Available', { exact: true })` | `card(name).locator('.availability-badge')` | The text is the same on every card. To check the colour, assert on the class (`badge-available` vs `badge-unavailable`) or the computed `color`. |
| Select Room button | `card(name).getByRole('button', { name: 'Select Room' })` | `page.getByRole('button', { name: 'Select Room' }).nth(i)` | Calls `selectRoom(id)`. Unscoped, the role locator matches 4 buttons. |
| Booking page check | `page.getByRole('heading', { name: 'Complete Your Booking' })` | `page.locator('#page-booking')` | Use it to confirm the redirect after selecting a room. Read the selected room from the Booking Summary (`#page-booking`) and the price from `#summary-total`. |
| Nav "Rooms" link | `page.locator('#main-navbar').getByText('Rooms', { exact: true })` | `page.locator('#main-navbar .nav-links a')` | **No link role.** It's an `<a>` without `href`, so `getByRole('link', { name: 'Rooms' })` finds nothing. |
| Nav logo | `page.locator('#main-navbar .navbar-brand')` | `page.locator('#main-navbar').getByText('BookNow')` | A clickable `div` with no role. Its text is split ("Book" + `<span>Now</span>`), so prefer the class. |

### Surprises

#### 1. Discounted prices are wrong on every card (High)
- **Did:** Compared each card's discounted price with the spec formula `price × (1 − discount% / 100)`, shown to two decimals.
- **Expected:** Deluxe $103.20, Superior $80.10, Family Suite $169.15, Penthouse $284.05.
- **Actual:** Deluxe $126.42, Superior $88.11, Family Suite $196.01, Penthouse $297.50. Each card subtracts a tenth of the advertised discount ("20% OFF" gives 2% off). `calcDiscountedBuggy` in `app.js` divides by `1000` instead of `100`. The wrong price carries into the booking summary's "Price per night" and "Estimated Total" (seen for all 4 rooms), so the booking total is affected too.
- **Breaks:** "Discounted price = price × (1 − discount% / 100), shown to two decimals" (Available Rooms). Knock-on effect: "Estimated total = discounted price per night × number of nights" (Booking Form).

| Room | Price | Badge | Shown | Expected |
|---|---|---|---|---|
| Deluxe Room | $129 | 20% OFF | $126.42 | $103.20 |
| Superior Room | $89 | 10% OFF | $88.11 | $80.10 |
| Family Suite | $199 | 15% OFF | $196.01 | $169.15 |
| Penthouse Suite | $299 | 5% OFF | $297.50 | $284.05 |

#### 2. Browser tab title is "Untitled" (Medium)
- **Did:** Read `document.title` on the rooms page after login.
- **Expected:** "BookNow — Hotel Room Booking". The spec says: "Browser tab title: 'BookNow — Hotel Room Booking'".
- **Actual:** "Untitled" (`<title>Untitled</title>` in `index.html`). The same finding is in [Login, Surprise 5](#5-page-title-is-untitled-medium), now re-labelled as a spec deviation.
- **Breaks:** "Browser tab title: 'BookNow — Hotel Room Booking'" (Available Rooms).

#### 3. Deluxe Room image doesn't load (Medium)
- **Did:** Looked at the Deluxe Room card and checked its `<img>`.
- **Expected:** A room image on every card, as the spec requires.
- **Actual:** The image URL is `https://images.unsplash.com/BROKEN_LINK_404/hotel-deluxe.jpg`, which returns a 404, so the card shows a grey box with a broken-image icon (`naturalWidth` = 0). The `<img>` has no `alt` attribute at all, although the room data includes `imgAlt: "Deluxe Room"`. Screenshot: `.playwright-mcp/page-2026-11-17T13-53-26-185Z.png`.
- **Breaks:** "Each card: room name, description, image, …" (Available Rooms).

#### 4. "Available" badges are styled as unavailable (Medium)
- **Did:** Looked at the availability badge on each card.
- **Expected:** An availability badge that matches its meaning: green for "Available".
- **Actual:** All 4 badges say "Available" but have the class `badge-unavailable`, which shows red text (`rgb(220, 38, 38)`) on pink. A green `.badge-available` style exists in the CSS but isn't used.
- **Breaks:** No spec line directly. The spec lists an "availability badge" on each card but doesn't say what colour it should be. Report it as a UI defect: the colour contradicts the badge text.

#### 5. Family Suite description is cut off (Medium)
- **Did:** Read the Family Suite card.
- **Expected:** The full description, or a clear truncation (ellipsis) with the text still readable some other way.
- **Actual:** The text stays on one line and is clipped mid-word ("Generous family suite with two bedrooms, a spaci"), with no ellipsis. Only about 301px of its roughly 1546px width is visible. The element has the class `overflow-bug` (`white-space: nowrap; overflow: hidden; text-overflow: clip`). The other cards wrap normally. The DOM text is complete, so a `toHaveText` check won't catch this. Compare `scrollWidth` with `clientWidth`, or use a screenshot.
- **Breaks:** "Each card: room name, description, …" (Available Rooms). The description is there, but the user can't read it.

#### 6. Family Suite image has empty alt text (Low, accessibility)
- **Did:** Checked the alt text of each card image.
- **Expected:** Descriptive alt text, as on Superior ("Superior Room") and Penthouse ("Penthouse Suite").
- **Actual:** Family Suite has `alt=""` (its `imgAlt` is empty in `ROOMS`), so screen readers skip the image as decorative.
- **Breaks:** Nothing in the spec (accessibility isn't specified). The image itself renders.

#### 7. Nav "Rooms" link and logo aren't real links (Low, accessibility)
- **Did:** Clicked **Rooms** in the nav bar to go back to the grid.
- **Expected:** A link (`role="link"`) that works from the keyboard.
- **Actual:** It works on click, but it's an `<a onclick>` with no `href`, so it has no link role and can't be reached with Tab. Playwright MCP couldn't find it by role and fell back to `#main-navbar div` filtered by text. The **BookNow** logo is a clickable `div` with the same problem.
- **Breaks:** Nothing in the spec (accessibility isn't specified).

#### What matched the spec
- Checked on 2026-11-17: all 4 cards have a name, a non-empty description, an `<img>`, an original price, a discounted price, a discount badge, an availability badge and a **Select Room** button. The only gaps are the content problems in Surprises 3 and 5.
- Each **Select Room** button opens the booking form for the matching room.

### Not yet explored
- ~~Opening the rooms page without logging in.~~ Done on 2026-11-17: it opens. See [Login, Surprise 7](#7-no-auth-guard-login-never-sets-isloggedin-critical).
- Comparing the same cards on `booknow-fixed`, to confirm the expected prices, badge colours and images.
- Grid layout at other viewport widths. Responsive design is out of scope for Sprint 1, so this is low priority.

---

## Booking Form

Explored on 2026-11-17 against `booknow-broken`, served at http://localhost:3000, using the Playwright MCP browser (Chromium).
Spec reference: `requirements.md`, section "Booking Form".

### Flows

#### Happy path: log in, select a room, fill the form, book
1. Open `http://localhost:3000/`. The login section (`#page-login`) is shown.
2. Fill **Email Address** with `process.env.BOOKNOW_EMAIL` and **Password** with `process.env.BOOKNOW_PASSWORD`.
3. Click **Sign In**. The **Available Rooms** page (`#page-rooms`) shows 4 cards.
4. In the card for the room you want (e.g. Deluxe Room), click **Select Room**.
5. The booking form (`#page-booking`) is shown, with the heading "Complete Your Booking", two groups ("Guest Details" and "Stay Details"), and a **Booking Summary** panel on the right.
6. Under Guest Details, fill:
   - **First Name**: `John`
   - **Last Name**: `Smith`
   - **Email Address**: `john@example.com`
   - **Phone Number**: `+1 234 567 8900`
7. Under Stay Details, fill:
   - **Check-in Date**: `2026-12-01`
   - **Check-out Date**: `2026-12-04`
   - **Number of Guests**: `2` (default is `1`)
8. Check the Booking Summary. Expected: Nights = 3, Estimated Total = discounted price × 3. (In the broken build it stays at 1 night; see Surprise 2.)
9. Click **Book Now**.
10. The confirmation page (`#page-confirm`) is shown, with the heading "Booking Confirmed!".

#### Negative path: rejected submission (expected per spec)
1. Do steps 1–5 above.
2. Leave one or more fields blank or invalid, and click **Book Now**.
3. Expected: you stay on `#page-booking`, and the matching `#err-<field>` message becomes visible under each bad field. (In the broken build every submission goes to confirmation; see Surprise 1.)

Notes for test design:
- The URL stays `http://localhost:3000/` throughout. Assert on visible sections and headings, not on the URL.
- Set dates with `fill('YYYY-MM-DD')`. Typing them with the keyboard follows the browser's locale order (day/month), so `12102026` became `2026-10-12`. That's an input artefact, not an app bug.
- `fill('abc')` on Number of Guests throws `Cannot type text into input[type=number]`. To test "letters in a numeric field", assert the value stays numeric, or use `pressSequentially` and check that the value is unchanged.
- The `#err-*` spans are always in the DOM, hidden with the `hidden` class. Assert with `toBeVisible()` / `toBeHidden()`, not `toHaveCount`.
- The Booking Summary is re-rendered as `innerHTML` every time the booking page is shown, so re-query the summary locators after navigating instead of reusing element handles.
- Not tested: whether field values carry over when you leave the form and select another room without reloading. `selectRoom()` doesn't clear the inputs, so this is worth a test.

### Selectors

**Labels are not linked to inputs.** Every `<label>` has no `for`, and none wraps its input, so `getByLabel()` finds nothing. The text fields' accessible names come from their placeholders, and the two date inputs have **no accessible name at all**. For those, the `#book-*` IDs are the only reliable hook.

| Element | Recommended locator | Fallback | Notes |
|---|---|---|---|
| Page heading | `page.getByRole('heading', { name: 'Complete Your Booking' })` | `page.locator('#page-booking h2')` | Use it to confirm you're on the booking form. |
| "Guest Details" heading | `page.getByRole('heading', { name: 'Guest Details' })` | `page.locator('#page-booking h3').nth(0)` | `h3`. |
| "Stay Details" heading | `page.getByRole('heading', { name: 'Stay Details' })` | `page.locator('#page-booking h3').nth(1)` | `h3`. |
| Field labels | `page.locator('#page-booking').getByText('First Name', { exact: true })` (same pattern for each label) | `page.locator('#page-booking label')` | **Not associated with inputs** (see above). Label texts: First Name, Last Name, Email Address, Phone Number, Check-in Date, Check-out Date, Number of Guests. Use these only to assert that the label text is shown. |
| First Name input | `page.locator('#book-fname')` | `page.getByPlaceholder('John')` | `getByLabel('First Name')` **does not work**. Accessible name is "John" (the placeholder). `type="text"`, no `required`, no `maxlength`. |
| Last Name input | `page.locator('#book-lname')` | `page.getByPlaceholder('Smith')` | Same as First Name. |
| Email input | `page.locator('#book-email')` | `page.getByPlaceholder('john@example.com')` | `type="text"` (not `email`), so the browser doesn't check the format either. |
| Phone input | `page.locator('#book-phone')` | `page.getByPlaceholder('+1 234 567 8900')` | `type="text"`, no pattern. |
| Check-in Date input | `page.locator('#book-checkin')` | `page.locator('#page-booking input[type="date"]').nth(0)` | **No accessible name, no placeholder.** Role is textbox but unnamed, so `getByRole` can't single it out. `type="date"`, no `min`. Has `onchange="buggyUpdateTotal()"`. |
| Check-out Date input | `page.locator('#book-checkout')` | `page.locator('#page-booking input[type="date"]').nth(1)` | Same as Check-in. |
| Number of Guests input | `page.getByRole('spinbutton')` | `page.locator('#book-guests')` | The only spinbutton on the page, but unnamed. Prefer the ID if more number fields are added. `type="number"`, `value="1"`, `min="1"` (not enforced). |
| Book Now button | `page.getByRole('button', { name: 'Book Now' })` | `page.locator('#page-booking .btn-book-buggy')` | Unique. No ID. Not inside a `<form>`, so pressing Enter in a field does **not** submit. |
| First Name error | `page.locator('#err-fname')` | `page.getByText('First name is required')` | Text: "First name is required". Hidden by default. No `role="alert"` or `aria-describedby` link to the input. |
| Last Name error | `page.locator('#err-lname')` | `page.getByText('Last name is required')` | Text: "Last name is required". |
| Email error | `page.locator('#err-email')` | `page.getByText('Valid email is required')` | Text: "Valid email is required". Used for both empty and invalid email. |
| Phone error | `page.locator('#err-phone')` | `page.getByText('Phone number is required')` | Text: "Phone number is required". The same text would be shown for a bad format, which is misleading. |
| Check-in error | `page.locator('#err-checkin')` | `page.getByText('Check-in date is required')` | Text: "Check-in date is required". |
| Check-out error | `page.locator('#err-checkout')` | `page.getByText('Check-out date is required')` | Text: "Check-out date is required". No separate message for "check-out must be after check-in" in the markup. |
| Guests error | `page.locator('#err-guests')` | `page.getByText('At least 1 guest is required')` | Text: "At least 1 guest is required". |
| Booking Summary panel | `page.locator('#booking-summary')` | `page.locator('#page-booking .summary-panel')` | Plain `div`. Contents are injected by `renderBookingSummary()`. |
| Summary heading | `page.getByRole('heading', { name: 'Booking Summary' })` | `page.locator('#booking-summary h3')` | |
| Summary room name | `page.locator('#booking-summary .summary-room-name')` | `page.locator('#booking-summary').getByText('Deluxe Room', { exact: true })` | **Not a heading, no ID.** |
| Summary price per night | `page.locator('#booking-summary .summary-row').filter({ hasText: 'Price per night' })` | `page.locator('#booking-summary .summary-row').nth(0)` | **No ID** on the value span. Assert with `toContainText('$126.42')`, or take the row's last `span`. |
| Summary nights | `page.locator('#summary-nights')` | `page.locator('#booking-summary .summary-row').filter({ hasText: 'Nights' }).locator('span').last()` | Stable ID. |
| Summary estimated total | `page.locator('#summary-total')` | `page.locator('#booking-summary .summary-row.total span').last()` | Stable ID. Format `$126.42`. |
| Summary hint | `page.getByText('Select dates above to calculate total')` | `page.locator('#booking-summary p')` | Always shown, even after dates are picked. |
| Confirmation check | `page.getByRole('heading', { name: 'Booking Confirmed!' })` | `page.locator('#page-confirm')` | Use it to confirm the redirect after Book Now. |

### Surprises

#### 1. No validation at all: every submission is confirmed (Critical)
- **Did:** Clicked **Book Now** with all fields blank (Guests cleared too), then with all fields blank except Guests = 1, then with each of the 7 fields blank in turn while the others were valid.
- **Expected:** Stay on the booking form, with the matching `#err-<field>` message shown under each empty field.
- **Actual:** Every run went straight to "Booking Confirmed!", and no error message ever became visible. `buggyPlaceBooking()` in `app.js` contains only `showPage('confirm')`, so it never checks the fields.
- **Breaks:** "All fields required — empty submission rejected with per-field errors" (Booking Form).

#### 2. Nights and Estimated Total never update from the dates (Critical)
- **Did:** Picked check-in `2026-12-01` and check-out `2026-12-04` on Deluxe Room. I tried `fill()`, tabbing out of the field, and typing with the keyboard. Repeated on all 4 rooms.
- **Expected:** Nights = 3, Estimated Total = 3 × $126.42 = $379.26, and the "Select dates above…" hint goes away.
- **Actual:** Nights stays `1`, the total stays one night's price ($126.42 / $88.11 / $196.01 / $297.50), and the hint stays up. The date inputs call `buggyUpdateTotal()` on change, but that function is empty, and the summary always uses a hard-coded `_frozenNights = 1`.
- The Price per night shown is also wrong (it carries over the discount bug from the rooms page; see [Available Rooms, Surprise 1](#1-discounted-prices-are-wrong-on-every-card-high)), so the total is wrong twice over.
- **Breaks:** "Number of nights = check-out minus check-in (in days)" and "Estimated total = discounted price per night × number of nights" (Booking Form).

#### 3. Check-out on or before check-in is accepted (High)
- **Did:** Submitted check-in `2026-12-01` / check-out `2026-12-01` (same day), and check-in `2026-12-05` / check-out `2026-12-01` (check-out first).
- **Expected:** Rejected with a check-out error, because the spec says check-out must be **after** check-in.
- **Actual:** Both confirmed. The summary showed 1 night for both.
- **Breaks:** "Check-out date must be **after** the check-in date" (Booking Form).

#### 4. Invalid Number of Guests is accepted (High)
- **Did:** Submitted Guests = `0`, `-3` and `1.5`.
- **Expected:** Rejected, because the spec sets a minimum of 1 and guests should be a whole number.
- **Actual:** All confirmed, with no error. The input has `min="1"`, but nothing enforces it because there's no form submit and no JS check.
- `99` guests was also accepted. No room capacity is shown or defined in the spec, so that's a **spec question**, not a defect.
- **Breaks:** "Number of Guests: minimum 1" (Booking Form), for `0` and `-3`. For `1.5`, the spec doesn't say guests must be whole numbers, so that part is a spec question.

#### 5. Email format isn't checked (High)
- **Did:** Submitted `johnexample.com` (no @), `john@` (no domain), `john@example` (no TLD), spaces only, and a 300+ character local part.
- **Expected:** Rejected with "Valid email is required".
- **Actual:** All confirmed. The field is `type="text"`, so the browser doesn't check it either.
- **Breaks:** "Email: valid format" (Booking Form). The spaces-only case also breaks "All fields required".

#### 6. Phone format and length aren't checked (High)
- **Did:** Submitted `abcdefg` (letters), `12345` (under 7 characters), spaces only, `123#456*789` (characters outside the allowed digits, spaces, `+`, `-` and parentheses), and 300 digits.
- **Expected:** All rejected, per the spec rule: digits with spaces, `+`, `-` and parentheses allowed, at least 7 characters.
- **Actual:** All confirmed.
- **Breaks:** "Phone: digits (spaces, +, -, parentheses allowed), at least 7 characters" (Booking Form). The spec sets no maximum length, so the 300-digit case is a spec question.

#### 7. Whitespace-only and very long names are accepted (Medium)
- **Did:** Submitted First Name and Last Name as `"   "`, as `12345`, and as 500 characters each.
- **Expected:** Whitespace-only rejected as empty. Some sensible maximum length.
- **Actual:** All confirmed. No `maxlength` on any input. The spec doesn't set a length limit, so the long-input part is a spec question; whitespace-only should be treated as blank.
- **Breaks:** "All fields required — empty submission rejected with per-field errors" (Booking Form), for whitespace-only names. Long names and digit-only names break nothing in the spec.

#### 8. Past check-in date is accepted (Question)
- **Did:** Submitted check-in `2025-01-01` / check-out `2025-01-03`.
- **Expected:** Probably rejected. You can't book a stay in the past, and the date inputs have no `min` to block it.
- **Actual:** Confirmed. The spec doesn't explicitly forbid past dates, so raise it as a question for the product owner.
- **Breaks:** Nothing in the spec (**spec question**).

#### 9. Labels aren't linked to their inputs (Medium, accessibility and testability)
- **Did:** Inspected the accessibility tree of the form.
- **Expected:** Each input named by its visible label ("First Name", "Check-in Date"…), so `getByLabel()` works.
- **Actual:** The `<label>` elements have no `for` attribute and don't wrap the inputs. The text fields are named by their placeholders ("John", "Smith"…), and the two date inputs and the guests spinbutton have no name at all. The error spans aren't linked to inputs (`aria-describedby`) and have no `role="alert"`.
- **Breaks:** Nothing in the spec (accessibility isn't specified). The spec's field list is met visually.

#### 10. The summary shows "1 night" before any dates are picked (Low)
- **Did:** Opened the booking form without touching the dates.
- **Expected:** Nights and Estimated Total empty or "—" until both dates are set, matching the "Select dates above to calculate total" hint.
- **Actual:** Nights = 1 and Estimated Total = one night's price from the start, which contradicts the hint shown under it.
- **Breaks:** "Number of nights = check-out minus check-in (in days)" (Booking Form). With no dates, there's nothing to subtract, so "1" is invented.

#### 11. Confirmation shows no reference or summary (High, confirmation-page scope)
- **Did:** Made a valid booking (Superior Room, Jane Doe, `jane@example.com`, `+44 (20) 7946-0958`, 2 guests).
- **Expected:** A `BKN-` + 6-digit reference and a summary (guest name, email, room, dates, nights, total).
- **Actual:** Only "✓ Booking Confirmed! Your reservation has been placed. Check your email for details." and **Browse More Rooms**. `#confirm-ref` and `#confirm-summary` don't exist in the broken build's `index.html` (they exist in `booknow-fixed`). Details belong in the confirmation-page notes.
- **Breaks:** "Displays a unique booking reference in the format `BKN-` followed by 6 digits" and "Summary: guest name, email, room, check-in, check-out, nights, total charged" (Confirmation Page).

#### 12. Booking form opens and confirms with no room selected (Low)
- **Did (2026-11-17):** On a fresh page, without logging in or selecting a room, called `showPage('booking')`, then clicked **Book Now** with the form empty.
- **Expected:** The booking form is reachable only by selecting a room (and only after login).
- **Actual:** The form opened with an **empty** Booking Summary (`selectedRoom` is `null`). Book Now still went to "Booking Confirmed!". No console errors. It's reachable only from the console, not by clicking, so the severity is Low, but a confirmation was shown for a booking with no room at all.
- **Breaks:** "Reached by selecting a room" (Booking Form) and "Protected pages (rooms, booking, confirmation) are unreachable without logging in" (Login Page).

---

## Confirmation Page

Explored on 2026-11-17 against `booknow-broken`, served at http://localhost:3000, using the Playwright MCP browser (Chromium).
Spec reference: `requirements.md`, section "Confirmation Page".

### Flows

#### Happy path: log in, book, confirm, browse more rooms
1. Open `http://localhost:3000/`. The login section (`#page-login`) is shown.
2. Fill **Email Address** with `process.env.BOOKNOW_EMAIL` and **Password** with `process.env.BOOKNOW_PASSWORD`.
3. Click **Sign In**. The **Available Rooms** page (`#page-rooms`) shows 4 cards.
4. In the Superior Room card, click **Select Room**. The booking form (`#page-booking`) opens with the heading "Complete Your Booking".
5. Fill the form:
   - **First Name**: `John`
   - **Last Name**: `Smith`
   - **Email Address**: `john@example.com`
   - **Phone Number**: `+1 234 567 8900`
   - **Check-in Date**: `2026-12-01`
   - **Check-out Date**: `2026-12-04`
   - **Number of Guests**: `2`
6. Note the Booking Summary values (room name, price per night, nights, estimated total) so you can compare them with the confirmation.
7. Click **Book Now**.
8. The confirmation page (`#page-confirm`) is shown, with the heading "Booking Confirmed!".
9. Expected per spec: a `BKN-` + 6-digit reference, and summary rows for guest name, email, room, check-in, check-out, nights and total charged that match steps 5–6. (In the broken build none of these are rendered; see Surprise 1.)
10. Click **Browse More Rooms**. The Available Rooms page is shown again with 4 cards.

#### Second booking: check that the reference is unique
1. From step 10 above, click **Select Room** on Penthouse Suite.
2. Overwrite every field (the form keeps the previous values; see Surprise 6):
   - `Anna` / `Lee` / `anna.lee@example.com` / `(555) 123-4567`
   - `2027-01-10` → `2027-01-15`, Guests `3`
3. Click **Book Now**.
4. Expected: a new reference that differs from the first one, and summary rows showing Anna Lee's data and Penthouse Suite.

#### Negative path: confirmation without a valid booking (expected per spec)
1. Open `http://localhost:3000/` and **do not** log in.
2. Click **Rooms** in the navbar, then **Select Room** on any card, leave the form empty, and click **Book Now**.
3. Expected: the protected pages are unreachable, and an empty form is rejected, so the confirmation page is never shown. (In the broken build every step succeeds; see Surprises 3 and 4.)

Notes for test design:
- The URL stays `http://localhost:3000/` on every page. Assert on visible sections and headings, not on the URL.
- A reload resets the app to the login page, so every test must log in through the UI.
- Pages are switched without browser history entries, so `page.goBack()` from the confirmation page leaves the app (`about:blank`). Don't use it to navigate inside the app.
- In `booknow-fixed`, the reference text is `Booking Reference: BKN-123456`. Match it with a regex such as `/BKN-\d{6}$/` rather than an exact string.
- To compare two confirmations, read `#confirm-ref` after the first booking, then compare it after the second. Re-query the locator each time, because the summary is re-rendered as `innerHTML` on every booking.

### Selectors

**Nothing on the confirmation page has an ID except the section itself.** In `booknow-broken`, `#confirm-ref` and `#confirm-summary` are **missing from the markup**. The locators for them below come from `booknow-fixed`, which uses the same structure. Tests that target them will fail on the broken build, and that failure is the finding.

| Element | Recommended locator | Fallback | Notes |
|---|---|---|---|
| Confirmation section | `page.locator('#page-confirm')` | `page.locator('section.page:not(.hidden)')` | Stable ID. Hidden with the `hidden` class when you're on another page, so assert `toBeVisible()`. |
| Check icon | `page.locator('#page-confirm .confirm-icon')` | `page.locator('#page-confirm').getByText('✓')` | **No role, no label, no ID.** Purely decorative `div`. |
| Heading | `page.getByRole('heading', { name: 'Booking Confirmed!' })` | `page.locator('#page-confirm h2')` | `h2`, unique. Use it to confirm you're on the confirmation page. |
| Subtitle | `page.getByText('Your reservation has been placed. Check your email for details.')` | `page.locator('#page-confirm .confirm-subtitle')` | **No ID.** The text differs in `booknow-fixed` ("A confirmation has been sent to your email address."), so prefer the class when one test must run on both builds. |
| Booking reference | `page.locator('#confirm-ref')` | `page.locator('#page-confirm').getByText(/BKN-\d{6}/)` | **Missing in the broken build.** In the fixed build it's a `p` with the text `Booking Reference: BKN-xxxxxx`. No role. |
| Summary box | `page.locator('#confirm-summary')` | `page.locator('#page-confirm .confirm-summary-box')` | **Missing in the broken build.** In the fixed build it contains an `h4` "Booking Details" and 7 `.confirm-row` divs. |
| Summary heading | `page.getByRole('heading', { name: 'Booking Details' })` | `page.locator('#confirm-summary h4')` | Fixed build only. |
| Summary row: Guest | `page.locator('#confirm-summary .confirm-row').filter({ hasText: 'Guest' })` | `page.locator('#confirm-summary .confirm-row').nth(0)` | Fixed build only. **No ID on any row or value span.** Value is `First Last`. Assert with `toContainText('John Smith')`. |
| Summary row: Email | `page.locator('#confirm-summary .confirm-row').filter({ hasText: 'Email' })` | `.confirm-row` `.nth(1)` | Fixed build only. |
| Summary row: Room | `page.locator('#confirm-summary .confirm-row').filter({ hasText: 'Room' })` | `.confirm-row` `.nth(2)` | Fixed build only. |
| Summary row: Check-in | `page.locator('#confirm-summary .confirm-row').filter({ hasText: 'Check-in' })` | `.confirm-row` `.nth(3)` | Fixed build only. Shown as `YYYY-MM-DD`. |
| Summary row: Check-out | `page.locator('#confirm-summary .confirm-row').filter({ hasText: 'Check-out' })` | `.confirm-row` `.nth(4)` | Fixed build only. Shown as `YYYY-MM-DD`. `hasText` matches substrings, so if a value could contain another row's label (e.g. a room named "Guest Room"), use the `nth` fallback. |
| Summary row: Nights | `page.locator('#confirm-summary .confirm-row').filter({ hasText: 'Nights' })` | `.confirm-row` `.nth(5)` | Fixed build only. |
| Summary row: Total Charged | `page.locator('#confirm-summary .confirm-row.total-row')` | `.confirm-row` `.filter({ hasText: 'Total Charged' })` | Fixed build only. Format `$379.26`. |
| Browse More Rooms button | `page.getByRole('button', { name: 'Browse More Rooms' })` | `page.locator('#page-confirm .btn-primary')` | Unique. No ID. Calls `showPage('rooms')`. |
| Navbar | `page.getByRole('navigation')` | `page.locator('#main-navbar')` | Stable ID. Visible before login in the broken build (see [Login, Surprise 4](#4-nav-bar-visible-before-login-medium)). |
| Navbar brand "BookNow" | `page.locator('#main-navbar .navbar-brand')` | `page.getByRole('navigation').getByText('BookNow')` | **No role, no ID.** Clickable `div` that goes to the rooms page. Not keyboard-focusable. |
| Navbar "Rooms" link | `page.getByRole('navigation').getByText('Rooms', { exact: true })` | `page.locator('#main-navbar .nav-links a')` | **No `href`, so no link role**: `getByRole('link', { name: 'Rooms' })` finds nothing. Not keyboard-focusable. |
| Navbar user | `page.locator('#nav-user')` | none | Always hidden and empty in the broken build. |
| Logout | none | none | **No logout control exists** anywhere in the app. |

### Surprises

#### 1. No booking reference and no booking summary (Critical)
- **Did:** Made a valid booking: Superior Room, John Smith, `john@example.com`, `+1 234 567 8900`, `2026-12-01` → `2026-12-04`, 2 guests. Then read the whole confirmation page.
- **Expected:** A `BKN-` + 6-digit reference, and a summary with guest name, email, room, check-in, check-out, nights and total charged that matches the form and its Booking Summary.
- **Actual:** Only the ✓ icon, "Booking Confirmed!", the subtitle and **Browse More Rooms**. `#confirm-ref` and `#confirm-summary` don't exist in the broken `index.html`. `buggyPlaceBooking()` only calls `showPage('confirm')` and never builds a booking record (there is no `lastBooking` global). None of the entered data can be checked.
- **Breaks:** "Displays a unique booking reference in the format `BKN-` followed by 6 digits" and "Summary: guest name, email, room, check-in, check-out, nights, total charged" (Confirmation Page).

#### 2. Two different bookings give identical confirmations (High)
- **Did:** Clicked **Browse More Rooms**, then booked Penthouse Suite for Anna Lee, `anna.lee@example.com`, `(555) 123-4567`, `2027-01-10` → `2027-01-15`, 3 guests.
- **Expected:** A different reference from the first booking, and a summary showing the new guest, room and dates.
- **Actual:** The page text was word-for-word the same as the first confirmation. There is no reference to compare, so uniqueness can't be checked.
- **Breaks:** "Displays a **unique** booking reference…" (Confirmation Page). Uniqueness itself is **untestable** until the reference exists (blocked by Surprise 1).

#### 3. Confirmation is shown for an empty, invalid booking (Critical)
- **Did:** Cleared every field on the booking form (Guests left at the default `1`) and clicked **Book Now**.
- **Expected:** Stay on the booking form with per-field errors. The spec says the confirmation is shown after a *successful* booking.
- **Actual:** "Booking Confirmed!" was shown, and no `#err-*` message became visible. This is the same root cause as [Booking Form, Surprise 1](#1-no-validation-at-all-every-submission-is-confirmed-critical), but from the confirmation side: the page tells the user an empty booking was "placed".
- **Breaks:** "Shown after a successful booking" (Confirmation Page), because it's also shown after a failed one. Root cause: "All fields required — empty submission rejected with per-field errors" (Booking Form).

#### 4. Confirmation is reachable without logging in (Critical)
- **Did:** Loaded a fresh page, didn't log in, clicked **Rooms** in the navbar, clicked **Select Room**, then **Book Now** with an empty form.
- **Expected:** The rooms, booking and confirmation pages are unreachable without logging in (spec, Login Page section).
- **Actual:** All three pages opened, ending on "Booking Confirmed!". `showPage()` has no auth check, and `isLoggedIn` stayed `false` throughout, even after a successful login earlier in the session.
- **Breaks:** "Protected pages (rooms, booking, confirmation) are unreachable without logging in" (Login Page). Same root cause as [Login, Surprise 7](#7-no-auth-guard-login-never-sets-isloggedin-critical).

#### 5. Browser Back leaves the app (Medium)
- **Did:** Pressed the browser Back button on the confirmation page.
- **Expected:** Go back to the booking form or the rooms page.
- **Actual:** The browser went to `about:blank`. Pages are switched without adding history entries, so the app has only one entry. Not covered by the spec, but it's a usability problem.
- **Breaks:** Nothing in the spec.

#### 6. The booking form keeps the previous booking's data (Medium)
- **Did:** After the first confirmation, clicked **Browse More Rooms**, then **Select Room** on Penthouse Suite.
- **Expected:** An empty form for a new booking (only Guests defaulting to `1`).
- **Actual:** All 7 fields still held John Smith's values from the first booking. `selectRoom()` never clears the inputs. This closes the "not tested" item in the [Booking Form](#booking-form) test design notes. Not in the spec, but a user could easily resubmit someone else's details.
- **Breaks:** Nothing in the spec.

#### 7. No logout control (Medium)
- **Did:** Looked for a way to log out in the navbar and on every page.
- **Expected:** A logout link or button once the user is authenticated. `#nav-user` suggests the logged-in user's name was meant to be shown.
- **Actual:** The navbar has only the "BookNow" brand and a "Rooms" link. `#nav-user` is always hidden and empty. The spec doesn't require logout, so raise it as a **spec question**. The only way to "log out" is a page reload.
- **Breaks:** Nothing in the spec (**spec question**).

#### 8. Navbar items aren't real links (Low, accessibility and testability)
- **Did:** Clicked **Rooms** and the **BookNow** brand from the confirmation page, and inspected them in the accessibility tree.
- **Expected:** Real links, reachable with the keyboard.
- **Actual:** Both go to Available Rooms, which is fine. But "Rooms" is an `<a>` with no `href` and the brand is a `div` with `onclick`, so both appear as "generic" in the accessibility tree, `getByRole('link')` can't find them, and they can't be focused with Tab.
- **Breaks:** Nothing in the spec (accessibility isn't specified).

#### 9. Subtitle promises an email (Low, copy)
- **Did:** Read the subtitle.
- **Expected:** No mention of email, because "Email confirmation notifications" is out of scope for Sprint 1.
- **Actual:** "Your reservation has been placed. Check your email for details." No email is sent. `booknow-fixed` also mentions email ("A confirmation has been sent to your email address."), so raise it as a **spec question** rather than a broken-build defect.
- **Breaks:** No in-scope requirement. The copy contradicts the Out of Scope item "Email confirmation notifications".

#### 10. Browser tab title is "Untitled" (Low)
- **Did:** Checked the page title on the confirmation page (and on every other page).
- **Expected:** "BookNow — Hotel Room Booking" (spec, Available Rooms section).
- **Actual:** "Untitled". It's the same document for every page, so this belongs with the rooms-page findings; listed here because it's also visible on confirmation.
- **Breaks:** "Browser tab title: 'BookNow — Hotel Room Booking'" (Available Rooms).

#### What matched the spec
- The confirmation page is shown after **Book Now** with valid data, with the heading "Booking Confirmed!".
- **Browse More Rooms** returns to the Available Rooms page (4 cards), and a new booking works afterwards.
- Reloading on the confirmation page returns to the login page, which is expected because all state is in memory.
- No console errors or warnings during the whole run.

---

## Requirements Coverage

Checked on 2026-11-17 against `booknow-broken`. Every in-scope line of `requirements.md` is listed. "Findings" link to the Surprises above.

### Login Page

| # | Requirement | Covered | Result | Findings |
|---|---|---|---|---|
| L1 | Users log in with email and password | Yes | PASS | The form has both fields, and valid credentials reach Rooms. |
| L2 | Email must be a valid format (contains @ and a domain) | Yes (2026-11-17) | FAIL | Login S6 |
| L3 | Password field must mask input characters | Yes | FAIL | Login S1 |
| L4 | Empty fields must be rejected with an error message | Yes | FAIL | Login S2 |
| L5 | Valid credentials: `guest@booknow.com` / `stay2026` | Yes | PASS* | These credentials log in. *Untestable whether they're the **only** accepted ones (blocked by Login S3). |
| L6 | Successful login redirects to the Available Rooms page | Yes | PASS | |
| L7 | Failed login shows an error message and stays on the login page | Yes | FAIL | Login S3. Error text and look are untestable (blocked). |
| L8 | The top navigation bar is hidden until the user is authenticated | Yes | FAIL | Login S4 |
| L9 | Protected pages (rooms, booking, confirmation) are unreachable without logging in | Yes (2026-11-17) | FAIL | Login S7, Booking S12, Confirmation S4 |

### Available Rooms

| # | Requirement | Covered | Result | Findings |
|---|---|---|---|---|
| R1 | Grid of available rooms | Yes | PASS | 4 cards in `#rooms-grid`. |
| R2 | Each card: room name, description, image, price per night, discounted price, discount badge, availability badge, "Select Room" button | Yes (all 4 cards re-checked 2026-11-17) | FAIL | Rooms S3 (broken Deluxe image), Rooms S5 (clipped description). Badge colour: Rooms S4 (not a spec line). |
| R3 | Discounted price = price × (1 − discount% / 100), shown to two decimals | Yes | FAIL | Rooms S1. The two-decimal format is correct. The value is wrong. |
| R4 | Selecting a room opens the booking form for that room | Yes | PASS | All 4 buttons route correctly. |
| R5 | Browser tab title: "BookNow — Hotel Room Booking" | Yes | FAIL | Rooms S2, Login S5, Confirmation S10 |

### Booking Form

| # | Requirement | Covered | Result | Findings |
|---|---|---|---|---|
| B1 | Reached by selecting a room | Yes | PASS* | *Also reachable with no room from the console (Booking S12, Low). |
| B2 | Guest Details: First Name, Last Name, Email, Phone | Yes | PASS | Fields present. Labels aren't linked (Booking S9, not a spec line). |
| B3 | Stay Details: Check-in Date, Check-out Date, Number of Guests | Yes | PASS | |
| B4 | All fields required — empty submission rejected with per-field errors | Yes | FAIL | Booking S1, S7. Showing per-field errors is untestable (blocked). Messages known only from markup. |
| B5 | Email: valid format | Yes | FAIL | Booking S5 |
| B6 | Phone: digits (spaces, +, -, parentheses allowed), at least 7 characters | Yes | FAIL | Booking S6 |
| B7 | Check-out date must be **after** the check-in date | Yes | FAIL | Booking S3 |
| B8 | Number of Guests: minimum 1 | Yes | FAIL | Booking S4 |
| B9 | Booking summary shows: room name, price per night, number of nights, estimated total | Yes | PASS | All four items are shown. Their **values** are wrong (R3, B10, B11). |
| B10 | Number of nights = check-out minus check-in (in days) | Yes | FAIL | Booking S2, S10 |
| B11 | Estimated total = discounted price per night × number of nights | Yes | FAIL | Booking S2, Rooms S1 |

### Confirmation Page

| # | Requirement | Covered | Result | Findings |
|---|---|---|---|---|
| C1 | Shown after a successful booking | Yes | PASS* | *Also shown after an invalid booking (Confirmation S3, root cause B4). |
| C2 | Displays a unique booking reference in the format `BKN-` followed by 6 digits | Yes | FAIL | Confirmation S1, S2. Uniqueness is untestable (no reference). |
| C3 | Summary: guest name, email, room, check-in, check-out, nights, total charged | Yes | FAIL | Confirmation S1. The values can't be checked (blocked). |
| C4 | "Browse More Rooms" returns to the Available Rooms page | Yes | PASS | |

### Summary

- **Requirements:** 29 in scope, all 29 checked. No coverage gaps remain.
- **PASS: 11** (L1, L5, L6, R1, R4, B1, B2, B3, B9, C1, C4). Three of these come with a caveat: L5, B1 and C1 pass as written, but a related bug weakens them.
- **FAIL: 18** (L2, L3, L4, L7, L8, L9, R2, R3, R5, B4, B5, B6, B7, B8, B10, B11, C2, C3).
- **Still untestable on `booknow-broken`. Verify each on `booknow-fixed`:**
  - Login error message text and appearance. Blocked by L4, L7 and L2: the error never appears.
  - Whether only the documented credentials are accepted. Blocked by L7.
  - Per-field booking error display and wording. Blocked by B4: validation never runs.
  - Correct nights and total for a real date range. Blocked by B10: `buggyUpdateTotal()` is a no-op. We know the result is wrong, but not whether the formula would be right.
  - Uniqueness and format of the booking reference, and whether the confirmation summary matches the form. Blocked by C2 and C3: the elements don't exist.
- **Spec questions** (not counted as failures): email case and whitespace at login, max field lengths, guest capacity (99) and fractional guests, past check-in dates, logout control, the subtitle mentioning email.
