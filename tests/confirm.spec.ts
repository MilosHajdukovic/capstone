import { test, expect } from './fixtures';
import type { BookingData } from './pages/BookingPage';
import { stay } from './support/dates';

const REFERENCE_FORMAT = /BKN-\d{6}$/;

test.describe('Confirmation', () => {
  // Cases that start on the confirmation page request `confirmedBooking` (Superior Room, valid data).

  // ── Positive ────────────────────────────────────────────────────────────

  test('TC-CONF-01 valid booking with the standard guest data shows the confirmation page', async ({
    confirmedBooking: _,
    bookingPage,
    confirmPage,
  }) => {
    await expect(confirmPage.section).toBeVisible();
    await expect(confirmPage.heading).toBeVisible();
    await expect(bookingPage.section).toBeHidden();
  });

  test('TC-CONF-02 @regression confirmation displays a booking reference in the BKN-###### format', async ({
    confirmedBooking: _,
    confirmPage,
  }) => {
    await expect(confirmPage.bookingReference).toBeVisible();
    await expect(confirmPage.bookingReference).toHaveText(REFERENCE_FORMAT);
  });

  test('TC-CONF-03 @regression confirmation summary matches the submitted booking', async ({
    confirmedBooking: booking,
    confirmPage,
  }) => {
    await expect(confirmPage.row('Guest')).toContainText('John Smith');
    await expect(confirmPage.row('Email')).toContainText(booking.email);
    await expect(confirmPage.row('Room')).toContainText('Superior Room');
    await expect(confirmPage.row('Check-in')).toContainText(booking.checkIn);
    await expect(confirmPage.row('Check-out')).toContainText(booking.checkOut);
    await expect(confirmPage.row('Nights')).toContainText('3');
    // OPEN QUESTION: "total charged" is assumed to equal the form's Estimated Total.
    await expect(confirmPage.row('Total Charged')).toContainText('$240.30'); // 3 × $80.10
  });

  test('TC-CONF-04 Browse More Rooms returns to the Available Rooms page', async ({
    confirmedBooking: _,
    roomsPage,
    confirmPage,
  }) => {
    await confirmPage.browseMoreRooms();

    await expect(roomsPage.heading).toBeVisible();
    await expect(roomsPage.cards).toHaveCount(4);
    await expect(confirmPage.section).toBeHidden();
  });

  test.describe('second booking', () => {
    const secondStay = stay(45, 5);
    const secondBooking: BookingData = {
      firstName: 'Anna',
      lastName: 'Lee',
      email: 'anna.lee@example.com',
      phone: '(555) 123-4567',
      ...secondStay,
      guests: '3',
    };

    test('TC-CONF-08 @regression two consecutive bookings get different references', async ({
      confirmedBooking: _,
      roomsPage,
      bookingPage,
      confirmPage,
    }) => {
      await expect(confirmPage.bookingReference).toHaveText(REFERENCE_FORMAT);
      const firstReference = await confirmPage.bookingReference.textContent();

      await confirmPage.browseMoreRooms();
      await roomsPage.selectRoom('Penthouse Suite');
      await bookingPage.fillForm(secondBooking);
      await bookingPage.submit();

      await expect(confirmPage.heading).toBeVisible();
      await expect(confirmPage.bookingReference).toHaveText(REFERENCE_FORMAT);
      await expect(confirmPage.bookingReference).not.toHaveText(firstReference ?? '');
    });

    test('TC-CONF-09 @regression second booking confirmation shows the second booking data', async ({
      confirmedBooking: _,
      roomsPage,
      bookingPage,
      confirmPage,
    }) => {
      await confirmPage.browseMoreRooms();
      await roomsPage.selectRoom('Penthouse Suite');
      await bookingPage.fillForm(secondBooking);
      await bookingPage.submit();
      await expect(confirmPage.heading).toBeVisible();

      await expect(confirmPage.row('Guest')).toContainText('Anna Lee');
      await expect(confirmPage.row('Email')).toContainText(secondBooking.email);
      await expect(confirmPage.row('Room')).toContainText('Penthouse Suite');
      await expect(confirmPage.row('Check-in')).toContainText(secondStay.checkIn);
      await expect(confirmPage.row('Check-out')).toContainText(secondStay.checkOut);
      await expect(confirmPage.row('Nights')).toContainText('5');
      // OPEN QUESTION: thousands-separator format ($1420.25 vs $1,420.25) and whether
      // "total charged" equals the Estimated Total. Asserting the draft's value.
      await expect(confirmPage.row('Total Charged')).toContainText('$1420.25'); // 5 × $284.05
      await expect(confirmPage.summaryRows.filter({ hasText: 'John Smith' })).toHaveCount(0);
      await expect(confirmPage.summaryRows.filter({ hasText: 'Superior Room' })).toHaveCount(0);
    });
  });

  // ── Negative ────────────────────────────────────────────────────────────

  test(
    'TC-CONF-05 @regression an empty booking with Guests left at the default 1 does not reach the confirmation page',
    async ({ openBookingForm, bookingPage, confirmPage }) => {
      // Differs from TC-BOOK-07: Guests keeps its default value of 1 instead of being cleared.
      await openBookingForm('Deluxe Room');

      await bookingPage.submit();

      // The field error is what changes; the other checks were already true before the click.
      await expect(bookingPage.fieldError('fname')).toBeVisible();
      await expect(bookingPage.heading).toBeVisible();
      await expect(confirmPage.section).toBeAttached(); // toBeHidden alone passes if the section is gone
      await expect(confirmPage.section).toBeHidden();
    },
  );

  test(
    'TC-CONF-06 @regression an unauthenticated user cannot reach the confirmation by clicking through',
    async ({ page, loginPage, bookingPage, confirmPage, navBar }) => {
      await loginPage.goto();

      // One path on every build (review note): fire each step's click handler even when the
      // element is hidden. selectRoom(2) stands in for "Select Room" because the grid is only
      // rendered when the rooms page actually opens.
      // The trigger targets must exist, or "still on login" would pass without anything being clicked.
      await expect(navBar.roomsLinkIncludingHidden).toHaveCount(1);
      await expect(bookingPage.bookNowButtonIncludingHidden).toHaveCount(1);
      await navBar.triggerRoomsLink();
      await page.evaluate(() => selectRoom(2));
      await bookingPage.triggerSubmit();

      await expect(confirmPage.section).toBeAttached(); // toBeHidden alone passes if the section is gone
      await expect(confirmPage.section).toBeHidden();
      await expect(loginPage.section).toBeVisible();
    },
  );

  test(
    'TC-CONF-07 @regression confirmation cannot be opened with showPage("confirm") before login',
    async ({ page, loginPage, confirmPage }) => {
      await loginPage.goto();

      await page.evaluate(() => showPage('confirm'));

      await expect(loginPage.section).toBeVisible();
      await expect(confirmPage.section).toBeAttached(); // toBeHidden alone passes if the section is gone
      await expect(confirmPage.section).toBeHidden();
    },
  );

  // ── Edge ────────────────────────────────────────────────────────────────

  test('TC-CONF-10 @open-question booking form is empty when starting a new booking', async ({
    confirmedBooking: _,
    roomsPage,
    bookingPage,
    confirmPage,
  }) => {
    await confirmPage.browseMoreRooms();
    await roomsPage.selectRoom('Penthouse Suite');
    await expect(bookingPage.heading).toBeVisible();

    // OPEN QUESTION: should the form reset after a confirmed booking? Proposed: yes.
    for (const input of [
      bookingPage.firstNameInput,
      bookingPage.lastNameInput,
      bookingPage.emailInput,
      bookingPage.phoneInput,
      bookingPage.checkInInput,
      bookingPage.checkOutInput,
    ]) {
      await expect(input).toHaveValue('');
    }
    await expect(bookingPage.guestsInput).toHaveValue('1');
  });

  test('TC-CONF-11 @open-question browser Back from the confirmation page stays in the app', async ({
    confirmedBooking: _,
    page,
    baseURL,
    roomsPage,
    bookingPage,
  }) => {
    // This case deliberately tests the browser Back button.
    await page.goBack();

    // OPEN QUESTION: should in-app navigation create history entries?
    // Proposed: still on the app, showing the booking form or the rooms page.
    await expect(page).toHaveURL(`${baseURL}/`);
    await expect(bookingPage.heading.or(roomsPage.heading).filter({ visible: true }).first()).toBeVisible();
  });

  test('TC-CONF-13 @open-question confirmation subtitle does not promise an email', async ({ confirmedBooking: _, confirmPage }) => {
    // OPEN QUESTION: email notifications are out of scope; should the copy change? Proposed: yes.
    await expect(confirmPage.subtitle).toBeVisible();
    await expect(confirmPage.subtitle).not.toContainText(/email/i);
  });

  test(
    'TC-CONF-14 @regression confirmation shows guest names with HTML characters as plain text',
    async ({ openBookingForm, bookingPage, confirmPage, validBooking }) => {
      const lastName = "O'Brien <i>Test</i>";
      await openBookingForm('Superior Room');
      await bookingPage.fillForm({ ...validBooking, firstName: 'Anna', lastName });

      await bookingPage.submit();

      await expect(confirmPage.heading).toBeVisible();
      await expect(confirmPage.row('Guest')).toContainText(`Anna ${lastName}`);
      await expect(confirmPage.bookingSummary.locator('i')).toHaveCount(0);
    },
  );

  // TC-CONF-12 (logout) is intentionally not automated: its steps and expected result
  // are not checkable until the open question "Is a logout control in scope?" is answered.
});
