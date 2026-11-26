/**
 * Globals defined by BookNow's app.js (classic script, global scope).
 * Declared so page.evaluate(() => showPage('rooms')) type-checks.
 * Coupling note: these names come from the app's code, so a rename breaks the tests that use them.
 */
declare global {
  const isLoggedIn: boolean;
  function showPage(name: 'login' | 'rooms' | 'booking' | 'confirm'): void;
  function selectRoom(roomId: number): void;
}

export {};
