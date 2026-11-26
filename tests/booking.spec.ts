import { test, expect } from './fixtures';
import {
  BOOKING_FIELDS,
  BOOKING_LABELS,
  EMPTY_FORM,
  type BookingField,
  type BookingPage,
  type GuestDetails,
} from './pages/BookingPage';
import type { ConfirmPage } from './pages/ConfirmPage';
import {
  addDays,
  daysFromToday,
  nextDstStartStay,
  nextLeapDayStay,
  nextYearBoundaryStay,
  stay,
} from './support/dates';

/** Required-field messages (TC-BOOK-07), as shown by booknow-fixed. */
const REQUIRED_MESSAGES: Record<BookingField, string> = {
  fname: 'First name is required',
  lname: 'Last name is required',
  email: 'Valid email is required',
  phone: 'Phone number is required (digits only)',
  checkin: 'Check-in date is required',
  checkout: 'Check-out date must be after check-in',
  guests: 'At least 1 guest is required',
};

/** Maps each field ID to its key in GuestDetails, for clearing one field at a time. */
const FIELD_KEYS: Record<BookingField, keyof GuestDetails> = {
  fname: 'firstName',
  lname: 'lastName',
  email: 'email',
  phone: 'phone',
  checkin: 'checkIn',
  checkout: 'checkOut',
  guests: 'guests',
};

/** Submission was rejected: still on the booking form, no confirmation shown. */
async function expectBookingRejected(bookingPage: BookingPage, confirmPage: ConfirmPage) {
  await expect(bookingPage.heading).toBeVisible();
  await expect(confirmPage.heading).toBeHidden();
}

async function expectAllRequiredErrors(bookingPage: BookingPage) {
  for (const field of BOOKING_FIELDS) {
    await expect(bookingPage.fieldError(field)).toBeVisible();
    await expect(bookingPage.fieldError(field)).toHaveText(REQUIRED_MESSAGES[field]);
  }
}

test.describe('Booking Form', () => {
  // ── Positive ────────────────────────────────────────────────────────────

  test('TC-BOOK-01 selecting a room opens the booking form with all guest and stay fields', async ({
    openBookingForm,
    bookingPage,
  }) => {
    await openBookingForm('Deluxe Room');

    await expect(bookingPage.guestDetailsHeading).toBeVisible();
    await expect(bookingPage.stayDetailsHeading).toBeVisible();
    for (const field of BOOKING_FIELDS) {
      await expect(bookingPage.input(field)).toBeVisible();
    }
    // Labels are not linked to inputs (see TC-BOOK-33), so check their visible text only.
    for (const text of BOOKING_LABELS) {
      await expect(bookingPage.label(text)).toBeVisible();
    }
  });

  test('TC-BOOK-02 booking summary shows room name, price per night, nights and estimated total', async ({
    openBookingForm,
    bookingPage,
  }) => {
    await openBookingForm('Superior Room');

    await expect(bookingPage.summaryHeading).toBeVisible();
    await expect(bookingPage.summaryRoomName).toHaveText('Superior Room');
    await expect(bookingPage.summaryPricePerNight).toHaveText(/Price per night\s*\$\d+\.\d{2}/);
    await expect(bookingPage.summaryNights).toHaveText(/^\d+$/);
    await expect(bookingPage.summaryTotal).toHaveText(/^\$\d+\.\d{2}$/);
  });

  test('TC-BOOK-03 @regression summary price per night equals the room discounted price', async ({
    openBookingForm,
    bookingPage,
  }) => {
    await openBookingForm('Deluxe Room');

    await expect(bookingPage.summaryPricePerNight).toContainText('$103.20');
  });

  test('TC-BOOK-04 @regression nights equal check-out minus check-in in days', async ({
    openBookingForm,
    bookingPage,
  }) => {
    await openBookingForm('Deluxe Room');
    const { checkIn, checkOut } = stay(30, 3);

    await bookingPage.fillForm({ checkIn, checkOut });

    await expect(bookingPage.summaryNights).toHaveText('3');
  });

  test('TC-BOOK-05 @regression estimated total equals discounted price per night × nights', async ({
    openBookingForm,
    bookingPage,
  }) => {
    await openBookingForm('Deluxe Room');
    const { checkIn, checkOut } = stay(30, 3);

    await bookingPage.fillForm({ checkIn, checkOut });

    await expect(bookingPage.summaryTotal).toHaveText('$309.60'); // 3 × $103.20
  });

  test('TC-BOOK-06 valid booking with allowed phone punctuation is accepted and confirmed', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Superior Room');

    await bookingPage.fillForm({
      ...validBooking,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '+44 (20) 7946-0958',
    });
    await bookingPage.submit();

    await expect(confirmPage.heading).toBeVisible();
    await expect(bookingPage.section).toBeHidden();
    // No #err-* checks here: once the booking section is hidden they are hidden whatever
    // the app did. Reaching the confirmation is the proof that validation passed.
  });

  test('TC-BOOK-26 @regression nights and total recalculate when the check-out date changes', async ({
    openBookingForm,
    bookingPage,
  }) => {
    await openBookingForm('Superior Room');
    const { checkIn, checkOut } = stay(30, 3);

    await bookingPage.fillForm({ checkIn, checkOut });
    await expect(bookingPage.summaryNights).toHaveText('3');
    await expect(bookingPage.summaryTotal).toHaveText('$240.30'); // 3 × $80.10

    await bookingPage.checkOutInput.fill(addDays(checkIn, 5));
    await expect(bookingPage.summaryNights).toHaveText('5');
    await expect(bookingPage.summaryTotal).toHaveText('$400.50'); // 5 × $80.10
  });

  test('TC-BOOK-33 @open-question booking form fields are named by their visible labels', async ({
    openBookingForm,
    bookingPage,
  }) => {
    await openBookingForm('Deluxe Room');

    // OPEN QUESTION (no requirement; accessibility not specified).
    // Proposed: getByLabel(<label text>) resolves to exactly the matching input.
    const expected: Record<(typeof BOOKING_LABELS)[number], BookingField> = {
      'First Name': 'fname',
      'Last Name': 'lname',
      'Email Address': 'email',
      'Phone Number': 'phone',
      'Check-in Date': 'checkin',
      'Check-out Date': 'checkout',
      'Number of Guests': 'guests',
    };
    for (const [text, field] of Object.entries(expected)) {
      const byLabel = bookingPage.section.getByLabel(text, { exact: true });
      await expect(byLabel, `getByLabel('${text}') should find #book-${field}`).toHaveId(`book-${field}`);
    }
  });

  test('TC-BOOK-37 @regression correcting a rejected field and resubmitting confirms the booking', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, firstName: '' });

    await bookingPage.submit();
    await expect(bookingPage.heading).toBeVisible();
    await expect(bookingPage.fieldError('fname')).toBeVisible();
    await expect(bookingPage.fieldError('fname')).toHaveText(REQUIRED_MESSAGES.fname);

    await bookingPage.firstNameInput.fill('John');
    await bookingPage.submit();
    await expect(confirmPage.heading).toBeVisible();
  });

  // ── Negative ────────────────────────────────────────────────────────────

  test('TC-BOOK-07 @regression empty submission (Guests cleared too) is rejected with all seven per-field errors', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm(EMPTY_FORM);

    await bookingPage.submit();

    await expectBookingRejected(bookingPage, confirmPage);
    await expectAllRequiredErrors(bookingPage);
  });

  // One test per field, so each row gets a fresh login.
  for (const field of BOOKING_FIELDS) {
    test(`TC-BOOK-08 @regression blank ${field} is rejected with its own error only`, async ({
      openBookingForm,
      bookingPage,
      confirmPage,
      validBooking,
    }) => {
      await openBookingForm('Deluxe Room');
      await bookingPage.fillForm({ ...validBooking, [FIELD_KEYS[field]]: '' });

      await bookingPage.submit();

      await expectBookingRejected(bookingPage, confirmPage);
      await expect(bookingPage.fieldError(field)).toBeVisible();
      await expect(bookingPage.fieldError(field)).toHaveText(REQUIRED_MESSAGES[field]);
      for (const other of BOOKING_FIELDS.filter((f) => f !== field)) {
        await expect(bookingPage.fieldError(other)).toBeHidden();
      }
    });
  }

  for (const email of ['johnexample.com', 'john@']) {
    test(`TC-BOOK-09 @regression rejects email "${email}" (missing @ or domain)`, async ({
      openBookingForm,
      bookingPage,
      confirmPage,
      validBooking,
    }) => {
      await openBookingForm('Deluxe Room');
      await bookingPage.fillForm({ ...validBooking, email });

      await bookingPage.submit();

      await expectBookingRejected(bookingPage, confirmPage);
      await expect(bookingPage.fieldError('email')).toBeVisible();
      await expect(bookingPage.fieldError('email')).toHaveText(REQUIRED_MESSAGES.email);
    });
  }

  for (const phone of ['abcdefg', '123#456*789']) {
    test(`TC-BOOK-10 @regression rejects phone "${phone}" (letters or disallowed symbols)`, async ({
      openBookingForm,
      bookingPage,
      confirmPage,
      validBooking,
    }) => {
      await openBookingForm('Deluxe Room');
      await bookingPage.fillForm({ ...validBooking, phone });

      await bookingPage.submit();

      await expectBookingRejected(bookingPage, confirmPage);
      // OPEN QUESTION: phone-format error wording is not specified; assert visibility only.
      await expect(bookingPage.fieldError('phone')).toBeVisible();
    });
  }

  // TC-BOOK-11 (`12345`) is merged into TC-BOOK-20 row B (`123456`), the stronger boundary.

  test('TC-BOOK-12 @regression rejects a check-out date before the check-in date', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    const checkIn = daysFromToday(34);
    await bookingPage.fillForm({ ...validBooking, checkIn, checkOut: addDays(checkIn, -4) });

    await bookingPage.submit();

    await expectBookingRejected(bookingPage, confirmPage);
    // OPEN QUESTION: date-order error wording is not specified; assert visibility only.
    await expect(bookingPage.fieldError('checkout')).toBeVisible();
  });

  test('TC-BOOK-13 @regression rejects a negative number of guests', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, guests: '-3' });

    await bookingPage.submit();

    await expectBookingRejected(bookingPage, confirmPage);
    await expect(bookingPage.fieldError('guests')).toBeVisible();
    await expect(bookingPage.fieldError('guests')).toHaveText(REQUIRED_MESSAGES.guests);
  });

  test('TC-BOOK-14 @regression booking form cannot be opened with showPage("booking") before login', async ({
    page,
    loginPage,
    bookingPage,
  }) => {
    await loginPage.goto();

    await page.evaluate(() => showPage('booking'));

    await expect(loginPage.section).toBeVisible();
    await expect(bookingPage.section).toBeAttached(); // toBeHidden alone passes if the section is gone
    await expect(bookingPage.section).toBeHidden();
  });

  test('TC-BOOK-15 @open-question a booking with no selected room cannot be confirmed', async ({
    page,
    authenticatedPage: _,
    loginPage,
    roomsPage,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    // OPEN QUESTION: should the form be refused, or should submit be blocked? Proposed:
    // "Booking Confirmed!" is never shown. One path on every build (review note): when logged in,
    // showPage('booking') shows the form on both builds, so always fill and submit.
    await page.evaluate(() => showPage('booking'));
    await bookingPage.fillForm(validBooking);
    await bookingPage.submit();

    await expect(confirmPage.section).toBeAttached(); // toBeHidden alone passes if the section is gone
    await expect(confirmPage.section).toBeHidden();
    // "Not confirmed" must come from a real refusal: the user is sent away from the form or sees
    // a field error. A JS crash is not a refusal (the failOnPageErrors fixture fails the test on one).
    const refusal = loginPage.section.or(roomsPage.section).or(bookingPage.section.locator('.field-error'));
    await expect(refusal.filter({ visible: true }).first()).toBeVisible();
  });

  test('TC-BOOK-38 @regression double-clicking Book Now on an empty form still rejects it', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm(EMPTY_FORM);

    await bookingPage.doubleClickSubmit();

    await expect(bookingPage.heading).toBeVisible();
    await expect(confirmPage.section).toBeHidden();
    await expectAllRequiredErrors(bookingPage);
  });

  // ── Edge ────────────────────────────────────────────────────────────────

  test('TC-BOOK-16 @regression rejects check-out on the same day as check-in', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, checkOut: validBooking.checkIn });

    await bookingPage.submit();

    await expectBookingRejected(bookingPage, confirmPage);
    // OPEN QUESTION: date-order error wording is not specified; assert visibility only.
    await expect(bookingPage.fieldError('checkout')).toBeVisible();
  });

  test('TC-BOOK-17 @regression check-out one day after check-in is accepted as one night', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, checkOut: addDays(validBooking.checkIn, 1) });

    await expect(bookingPage.summaryNights).toHaveText('1');
    await expect(bookingPage.summaryTotal).toHaveText('$103.20');
    await expect(bookingPage.fieldError('checkout')).toBeHidden();

    await bookingPage.submit();
    await expect(confirmPage.heading).toBeVisible();
  });

  test('TC-BOOK-18 @regression rejects zero guests', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, guests: '0' });

    await bookingPage.submit();

    await expectBookingRejected(bookingPage, confirmPage);
    await expect(bookingPage.fieldError('guests')).toBeVisible();
    await expect(bookingPage.fieldError('guests')).toHaveText(REQUIRED_MESSAGES.guests);
  });

  test('TC-BOOK-19 accepts the minimum of one guest', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, guests: '1' });

    await bookingPage.submit();

    // Review note: "#err-guests was not shown" can't be checked after leaving the page,
    // so the confirmation itself is the outcome.
    await expect(confirmPage.heading).toBeVisible();
  });

  test('TC-BOOK-20 phone boundary row A: 7 characters are accepted', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, phone: '1234567' });

    await bookingPage.submit();

    await expect(confirmPage.heading).toBeVisible();
  });

  test('TC-BOOK-20 TC-BOOK-11 @regression phone boundary row B: 6 characters are rejected', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, phone: '123456' });

    await bookingPage.submit();

    await expectBookingRejected(bookingPage, confirmPage);
    // OPEN QUESTION: phone-format error wording is not specified; assert visibility only.
    await expect(bookingPage.fieldError('phone')).toBeVisible();
  });

  test('TC-BOOK-21 @regression rejects an email made of spaces only', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, email: '     ' });

    await bookingPage.submit();

    await expectBookingRejected(bookingPage, confirmPage);
    await expect(bookingPage.fieldError('email')).toBeVisible();
    await expect(bookingPage.fieldError('email')).toHaveText(REQUIRED_MESSAGES.email);
  });

  test('TC-BOOK-22 @regression rejects a phone number made of spaces only', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, phone: '       ' });

    await bookingPage.submit();

    await expectBookingRejected(bookingPage, confirmPage);
    // OPEN QUESTION: phone-format error wording is not specified; assert visibility only.
    await expect(bookingPage.fieldError('phone')).toBeVisible();
  });

  test('TC-BOOK-23 @open-question rejects whitespace-only first and last names', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, firstName: '   ', lastName: '   ' });

    await bookingPage.submit();

    // OPEN QUESTION: does "required" treat whitespace-only values as empty? Proposed: yes.
    await expectBookingRejected(bookingPage, confirmPage);
    await expect(bookingPage.fieldError('fname')).toBeVisible();
    await expect(bookingPage.fieldError('lname')).toBeVisible();
  });

  test('TC-BOOK-24 @open-question rejects an email with no top-level domain', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, email: 'john@example' });

    await bookingPage.submit();

    // OPEN QUESTION: is a TLD required for a "valid format" email (B5)? Proposed: yes.
    await expectBookingRejected(bookingPage, confirmPage);
    await expect(bookingPage.fieldError('email')).toBeVisible();
  });

  test('TC-BOOK-25 @open-question rejects a fractional number of guests', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm({ ...validBooking, guests: '1.5' });

    await bookingPage.submit();

    // OPEN QUESTION: must guests be a whole number? Proposed: yes.
    await expectBookingRejected(bookingPage, confirmPage);
    await expect(bookingPage.fieldError('guests')).toBeVisible();
  });

  test('TC-BOOK-27 @open-question summary does not invent a night count before dates are picked', async ({
    openBookingForm,
    bookingPage,
  }) => {
    await openBookingForm('Deluxe Room');

    // OPEN QUESTION: what should Nights and Estimated Total show before both dates are set?
    // Proposed: not a one-night value (exact placeholder to be confirmed).
    // Positive checks first: a not.* assertion alone also passes if the element is missing.
    await expect(bookingPage.summaryNights).toBeVisible();
    await expect(bookingPage.summaryTotal).toBeVisible();
    await expect(bookingPage.summaryNights).not.toHaveText('1');
    await expect(bookingPage.summaryTotal).not.toHaveText('$103.20');
  });

  test('TC-BOOK-28 @regression double-clicking Book Now with valid data shows the confirmation once', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm(validBooking);

    await bookingPage.doubleClickSubmit();

    await expect(confirmPage.heading).toBeVisible();
    await expect(bookingPage.section).toBeHidden();
    // One path on every build (review note): always expect exactly one booking reference.
    await expect(confirmPage.bookingReference).toHaveCount(1);
  });

  // OPEN QUESTION (TC-BOOK-29, 30, 32): no limits or rules are defined, so the expected result is
  // "to be confirmed". Until answered, each test checks the app reaches exactly one defined outcome:
  // the booking is confirmed, or the changed field shows its error (not both, not neither).
  for (const row of [
    { id: 'TC-BOOK-29', title: 'row A: 500-character names', data: { firstName: 'A'.repeat(500), lastName: 'B'.repeat(500) }, field: 'fname' },
    { id: 'TC-BOOK-29', title: 'row B: 300+ character email local part', data: { email: `${'j'.repeat(310)}@example.com` }, field: 'email' },
    { id: 'TC-BOOK-29', title: 'row C: 300-digit phone', data: { phone: '1'.repeat(300) }, field: 'phone' },
    { id: 'TC-BOOK-30', title: 'digit-only names', data: { firstName: '12345', lastName: '12345' }, field: 'fname' },
    { id: 'TC-BOOK-32', title: 'very large number of guests (99)', data: { guests: '99' }, field: 'guests' },
  ] satisfies { id: string; title: string; data: GuestDetails; field: BookingField }[]) {
    test(`${row.id} @open-question booking with ${row.title}`, async ({ openBookingForm, bookingPage, confirmPage, validBooking }) => {
      await openBookingForm('Deluxe Room');
      await bookingPage.fillForm({ ...validBooking, ...row.data });

      await bookingPage.submit();

      await expect(confirmPage.heading.or(bookingPage.fieldError(row.field)).filter({ visible: true })).toHaveCount(1);
    });
  }

  test('TC-BOOK-31 @open-question rejects a check-in date in the past', async ({
    openBookingForm,
    bookingPage,
    confirmPage,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    const checkIn = daysFromToday(-30);
    await bookingPage.fillForm({ ...validBooking, checkIn, checkOut: addDays(checkIn, 2) });

    await bookingPage.submit();

    // OPEN QUESTION: can a stay be booked in the past? Proposed: no.
    await expectBookingRejected(bookingPage, confirmPage);
    await expect(bookingPage.fieldError('checkin')).toBeVisible();
  });

  test('TC-BOOK-34 reloading the booking form returns to login and discards the entered data', async ({
    page,
    openBookingForm,
    loginPage,
    roomsPage,
    bookingPage,
    credentials,
    validBooking,
  }) => {
    await openBookingForm('Deluxe Room');
    await bookingPage.fillForm(validBooking);

    await page.reload();
    await expect(loginPage.section).toBeVisible();
    await expect(bookingPage.section).toBeHidden();

    await loginPage.login(credentials.email, credentials.password);
    await roomsPage.selectRoom('Deluxe Room');
    await expect(bookingPage.heading).toBeVisible();
    for (const field of BOOKING_FIELDS.filter((f) => f !== 'guests')) {
      await expect(bookingPage.input(field)).toHaveValue('');
    }
    await expect(bookingPage.guestsInput).toHaveValue('1');
  });

  test.describe('TC-BOOK-35 night math across calendar boundaries', () => {
    // Berlin time so the summer-time row crosses a real clock change.
    test.use({ timezoneId: 'Europe/Berlin' });

    for (const [label, dates, nights, total] of [
      ['year boundary', nextYearBoundaryStay(), '3', '$309.60'],
      ['leap day', nextLeapDayStay(), '2', '$206.40'],
      ['DST start (Europe/Berlin)', nextDstStartStay(), '2', '$206.40'],
    ] as const) {
      test(`TC-BOOK-35 @regression nights are correct across the ${label} (${dates.checkIn} → ${dates.checkOut})`, async ({
        openBookingForm,
        bookingPage,
      }) => {
        await openBookingForm('Deluxe Room');

        await bookingPage.fillForm(dates);

        await expect(bookingPage.summaryNights).toHaveText(nights);
        await expect(bookingPage.summaryTotal).toHaveText(total);
      });
    }
  });

  test('TC-BOOK-36 @regression switching to another room updates the summary to the new room price and total', async ({
    openBookingForm,
    roomsPage,
    bookingPage,
    navBar,
  }) => {
    await openBookingForm('Deluxe Room');
    const { checkIn, checkOut } = stay(30, 3);
    await bookingPage.fillForm({ checkIn, checkOut });

    await navBar.goToRooms();
    await roomsPage.selectRoom('Penthouse Suite');
    await expect(bookingPage.heading).toBeVisible();
    // Set the dates again so the result doesn't depend on TC-CONF-10 (form reset).
    await bookingPage.setDates(checkIn, checkOut);

    await expect(bookingPage.summaryRoomName).toHaveText('Penthouse Suite');
    await expect(bookingPage.summaryPricePerNight).toContainText('$284.05');
    await expect(bookingPage.summaryNights).toHaveText('3');
    await expect(bookingPage.summaryTotal).toHaveText('$852.15'); // 3 × $284.05
    await expect(bookingPage.summaryPanel).not.toContainText('Deluxe Room');
    await expect(bookingPage.summaryPanel).not.toContainText('$103.20');
  });
});
