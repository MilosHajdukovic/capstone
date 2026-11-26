import { test, expect } from './fixtures';
import { ROOM_NAMES, type RoomName } from './pages/RoomsPage';

const TAB_TITLE = 'BookNow — Hotel Room Booking';

/** R3: price × (1 − discount% / 100), two decimals. */
const EXPECTED_DISCOUNTED: Record<RoomName, string> = {
  'Deluxe Room': '$103.20/night',
  'Superior Room': '$80.10/night',
  'Family Suite': '$169.15/night',
  'Penthouse Suite': '$284.05/night',
};

/** Upper bound on Tab presses for the keyboard-reachability check (TC-ROOMS-14). */
const MAX_TABS = 20;

test.describe('Available Rooms', () => {
  // ── Positive ────────────────────────────────────────────────────────────

  test('TC-ROOMS-01 shows a grid of room cards after login', async ({ authenticatedPage: _, roomsPage }) => {
    await expect(roomsPage.heading).toBeVisible();
    // Fixture assertion: the count and names come from the app's ROOMS data; R1 says only "grid of available rooms".
    await expect(roomsPage.cards).toHaveCount(4);
    for (const name of ROOM_NAMES) {
      await expect(roomsPage.card(name)).toHaveCount(1);
    }
  });

  test('TC-ROOMS-02 every room card shows all required elements', async ({ authenticatedPage: _, roomsPage }) => {
    for (const name of ROOM_NAMES) {
      await test.step(name, async () => {
        await expect(roomsPage.roomName(name)).toHaveText(name);
        await expect(roomsPage.description(name)).toHaveText(/\S/);
        await expect(roomsPage.image(name)).toBeVisible();
        await expect(roomsPage.originalPrice(name)).toHaveText(/^\$\d+\/night$/);
        await expect(roomsPage.discountedPrice(name)).toHaveText(/^\$\d+\.\d{2}\/night$/);
        await expect(roomsPage.discountBadge(name)).toHaveText(/^\d+% OFF$/);
        await expect(roomsPage.availabilityBadge(name)).toBeVisible();
        await expect(roomsPage.selectButton(name)).toBeVisible();
      });
    }
  });

  // One test per room, so each row gets a fresh login.
  for (const name of ROOM_NAMES) {
    test(`TC-ROOMS-03 selecting ${name} opens the booking form for that room`, async ({
      authenticatedPage: _,
      roomsPage,
      bookingPage,
    }) => {
      await roomsPage.selectRoom(name);

      await expect(bookingPage.heading).toBeVisible();
      await expect(bookingPage.summaryRoomName).toHaveText(name);
    });
  }

  // Merges TC-ROOMS-09 (two decimals with trailing zero): Deluxe $103.20 and Superior $80.10
  // are exact strings here, so a separate ROOMS-09 test would repeat the same assertions.
  test('TC-ROOMS-04 TC-ROOMS-09 @regression discounted price equals price × (1 − discount% / 100) to two decimals', async ({
    authenticatedPage: _,
    roomsPage,
  }) => {
    for (const name of ROOM_NAMES) {
      await expect(roomsPage.discountedPrice(name)).toHaveText(EXPECTED_DISCOUNTED[name]);
    }
  });

  test('TC-ROOMS-05 @regression every room card image loads', async ({ authenticatedPage: _, roomsPage }) => {
    for (const name of ROOM_NAMES) {
      await expect
        .poll(() => roomsPage.image(name).evaluate((img: HTMLImageElement) => img.naturalWidth), {
          message: `${name} image should load (naturalWidth > 0)`,
        })
        .toBeGreaterThan(0);
    }
  });

  test('TC-ROOMS-06 @regression every room card description is fully readable', async ({
    page,
    authenticatedPage: _,
    roomsPage,
  }) => {
    // Keep the mouse off the cards (cards lift on hover).
    await page.mouse.move(0, 0);

    for (const name of ROOM_NAMES) {
      // toHaveText is not enough: the DOM text is complete even when it is clipped on screen.
      // Both directions: a nowrap overflow clips sideways, a line clamp clips at the bottom.
      const desc = roomsPage.description(name);
      await expect
        .poll(() => desc.evaluate((el) => el.scrollWidth - el.clientWidth), {
          message: `${name} description should have no hidden horizontal overflow`,
        })
        .toBeLessThanOrEqual(0);
      await expect
        .poll(() => desc.evaluate((el) => el.scrollHeight - el.clientHeight), {
          message: `${name} description should have no hidden vertical overflow (clamped lines)`,
        })
        .toBeLessThanOrEqual(0);
    }
  });

  test('TC-ROOMS-07 @regression browser tab title is "BookNow — Hotel Room Booking" on every page', async ({
    page,
    loginPage,
    roomsPage,
    bookingPage,
    confirmPage,
    credentials,
    validBooking,
  }) => {
    // Starts logged out: the login page itself is one of the pages checked.
    await loginPage.goto();
    await expect(loginPage.section).toBeVisible();
    await expect(page).toHaveTitle(TAB_TITLE);

    await loginPage.login(credentials.email, credentials.password);
    await expect(roomsPage.heading).toBeVisible();
    await expect(page).toHaveTitle(TAB_TITLE);

    await roomsPage.selectRoom('Superior Room');
    await expect(bookingPage.heading).toBeVisible();
    await expect(page).toHaveTitle(TAB_TITLE);

    await bookingPage.fillForm(validBooking);
    await bookingPage.submit();
    await expect(confirmPage.heading).toBeVisible();
    await expect(page).toHaveTitle(TAB_TITLE);
  });

  test('TC-ROOMS-11 nav "Rooms" link and logo return to the rooms grid from the booking form', async ({
    openBookingForm,
    roomsPage,
    bookingPage,
    navBar,
  }) => {
    await openBookingForm('Deluxe Room');

    await navBar.goToRooms();
    await expect(roomsPage.heading).toBeVisible();
    await expect(roomsPage.cards).toHaveCount(4);
    await expect(bookingPage.section).toBeHidden();

    await roomsPage.selectRoom('Deluxe Room');
    await expect(bookingPage.heading).toBeVisible();

    await navBar.clickLogo();
    await expect(roomsPage.heading).toBeVisible();
    await expect(roomsPage.cards).toHaveCount(4);
    await expect(bookingPage.section).toBeHidden();
  });

  test('TC-ROOMS-12 @open-question "Available" badge is styled as available', async ({
    authenticatedPage: _,
    roomsPage,
  }) => {
    // OPEN QUESTION: the spec lists an availability badge but not its styling.
    // Proposed: an "Available" badge uses the available (green) style class.
    for (const name of ROOM_NAMES) {
      const badge = roomsPage.availabilityBadge(name);
      await expect(badge).toHaveText('Available');
      await expect(badge).toContainClass('badge-available');
      await expect(badge).not.toContainClass('badge-unavailable');
    }
  });

  test('TC-ROOMS-13 @open-question room images have descriptive alt text', async ({ authenticatedPage: _, roomsPage }) => {
    // OPEN QUESTION (no requirement; accessibility not specified). Proposed: each image is
    // exposed as role img with an accessible name containing the room name.
    for (const name of ROOM_NAMES) {
      await expect(roomsPage.card(name).getByRole('img', { name })).toBeVisible();
    }
  });

  test('TC-ROOMS-14 @open-question nav "Rooms" link and logo are keyboard-reachable links', async ({
    page,
    authenticatedPage: _,
    navBar,
  }) => {
    // OPEN QUESTION (no requirement; accessibility not specified). Proposed: the Rooms entry is a
    // real link and both it and the logo receive focus via Tab.
    await expect(navBar.navigation.getByRole('link', { name: 'Rooms' })).toBeVisible();

    // Defined Tab count (review note): start at the top of the page and press Tab up to MAX_TABS times.
    const focused = { roomsLink: false, logo: false };
    await page.locator('body').focus();
    for (let i = 0; i < MAX_TABS; i++) {
      await page.keyboard.press('Tab');
      focused.roomsLink ||= await navBar.roomsLink.evaluate((el) => el === document.activeElement);
      focused.logo ||= await navBar.logo.evaluate((el) => el === document.activeElement);
    }
    expect(focused, `Rooms link and logo should both receive focus within ${MAX_TABS} Tab presses`).toEqual({
      roomsLink: true,
      logo: true,
    });
  });

  // ── Negative ────────────────────────────────────────────────────────────

  test('TC-ROOMS-08 @regression rooms page cannot be opened with showPage("rooms") before login', async ({
    page,
    loginPage,
    roomsPage,
  }) => {
    await loginPage.goto();

    await page.evaluate(() => showPage('rooms'));

    await expect(loginPage.section).toBeVisible();
    await expect(roomsPage.section).toBeAttached(); // toBeHidden alone passes if the section is gone
    await expect(roomsPage.section).toBeHidden();
  });

  // ── Edge ────────────────────────────────────────────────────────────────

  test('TC-ROOMS-10 double-clicking Select Room opens the booking form for that room only', async ({
    authenticatedPage: _,
    roomsPage,
    bookingPage,
  }) => {
    await roomsPage.doubleClickSelectRoom('Family Suite');

    await expect(bookingPage.heading).toBeVisible();
    await expect(bookingPage.summaryRoomName).toHaveText('Family Suite');
  });

  test('TC-ROOMS-15 returning to the rooms page repeatedly never duplicates or drops cards', async ({
    authenticatedPage: _,
    roomsPage,
    bookingPage,
    navBar,
  }) => {
    for (let visit = 1; visit <= 3; visit++) {
      await test.step(`visit ${visit}`, async () => {
        await roomsPage.selectRoom('Deluxe Room');
        await expect(bookingPage.heading).toBeVisible();
        await navBar.goToRooms();

        await expect(roomsPage.heading).toBeVisible();
        await expect(roomsPage.cards).toHaveCount(4);
        for (const name of ROOM_NAMES) {
          await expect(roomsPage.card(name)).toHaveCount(1);
        }
      });
    }
  });
});
