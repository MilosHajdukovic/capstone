import { test as base, expect, type Page } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { RoomsPage, type RoomName } from './pages/RoomsPage';
import { BookingPage, type BookingData } from './pages/BookingPage';
import { ConfirmPage } from './pages/ConfirmPage';
import { NavBar } from './pages/NavBar';
import { stay } from './support/dates';

export interface Credentials {
  email: string;
  password: string;
}

/** Reads credentials from .env (loaded by playwright.config.ts). No defaults: fail fast. */
export function getCredentials(): Credentials {
  const email = process.env.BOOKNOW_EMAIL;
  const password = process.env.BOOKNOW_PASSWORD;
  if (!email || !password) {
    throw new Error('Set BOOKNOW_EMAIL and BOOKNOW_PASSWORD in .env (see .env.example)');
  }
  return { email, password };
}

/** Check-in 30 days from today, 3 nights. Relative so the data never falls into the past. */
export const VALID_STAY_START_IN_DAYS = 30;
export const VALID_STAY_NIGHTS = 3;

interface BookNowFixtures {
  /**
   * Auto fixture: collects uncaught page errors and fails the test if any occurred,
   * so a test can't pass just because the app crashed before doing the wrong thing.
   */
  failOnPageErrors: void;
  credentials: Credentials;
  loginPage: LoginPage;
  roomsPage: RoomsPage;
  bookingPage: BookingPage;
  confirmPage: ConfirmPage;
  navBar: NavBar;
  /**
   * The test's `page`, logged in through the UI and showing Available Rooms.
   * BookNow keeps auth in JS globals (a reload logs you out), so this runs
   * for every test. No storageState.
   */
  authenticatedPage: Page;
  /** The draft's "Valid booking data", with dates relative to today (3 nights). */
  validBooking: BookingData;
  /** Logs in (via authenticatedPage), selects `room` and waits for the booking form. */
  openBookingForm: (room: RoomName) => Promise<void>;
  /** Books Superior Room with `validBooking` and waits for the confirmation page. Gives the data used. */
  confirmedBooking: BookingData;
}

export const test = base.extend<BookNowFixtures>({
  failOnPageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use();
      expect(errors, 'uncaught JavaScript errors in the app').toEqual([]);
    },
    { auto: true },
  ],
  credentials: async ({}, use) => {
    await use(getCredentials());
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  roomsPage: async ({ page }, use) => {
    await use(new RoomsPage(page));
  },
  bookingPage: async ({ page }, use) => {
    await use(new BookingPage(page));
  },
  confirmPage: async ({ page }, use) => {
    await use(new ConfirmPage(page));
  },
  navBar: async ({ page }, use) => {
    await use(new NavBar(page));
  },
  authenticatedPage: async ({ page, loginPage, roomsPage, credentials }, use) => {
    await loginPage.goto();
    await loginPage.login(credentials.email, credentials.password);
    await expect(roomsPage.heading).toBeVisible();
    await use(page);
  },
  validBooking: async ({}, use) => {
    const { checkIn, checkOut } = stay(VALID_STAY_START_IN_DAYS, VALID_STAY_NIGHTS);
    await use({
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@example.com',
      phone: '+1 234 567 8900',
      checkIn,
      checkOut,
      guests: '2',
    });
  },
  openBookingForm: async ({ authenticatedPage: _loggedIn, roomsPage, bookingPage }, use) => {
    await use(async (room) => {
      await roomsPage.selectRoom(room);
      await expect(bookingPage.heading).toBeVisible();
    });
  },
  confirmedBooking: async ({ openBookingForm, bookingPage, confirmPage, validBooking }, use) => {
    await openBookingForm('Superior Room');
    await bookingPage.fillForm(validBooking);
    await bookingPage.submit();
    await expect(confirmPage.heading).toBeVisible();
    await use(validBooking);
  },
});

export { expect };
