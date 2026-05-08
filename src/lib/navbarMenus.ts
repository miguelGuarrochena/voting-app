// Tiny event bus for coordinating the three navbar dropdowns: Crear,
// Username and Language. They live in different components
// (Navbar.tsx + ThemeLanguageSwitcher.tsx) so a regular shared state would
// require lifting both into a parent or a context. A custom DOM event
// keeps the wiring local — each menu announces when it opens, and any
// other open menu listens and closes itself.
//
// Usage:
//   announceNavbarMenuOpen('create');
//   const off = onNavbarMenuOpen((menu) => {
//     if (menu !== 'language') setShowLanguageMenu(false);
//   });
//   off(); // remove listener on cleanup

export type NavbarMenu = 'create' | 'user' | 'language' | 'mobile';

const EVENT_NAME = 'pickly:navbar-menu-open';

export function announceNavbarMenuOpen(menu: NavbarMenu) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<NavbarMenu>(EVENT_NAME, { detail: menu })
  );
}

export function onNavbarMenuOpen(
  handler: (menu: NavbarMenu) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<NavbarMenu>).detail;
    if (detail) handler(detail);
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
