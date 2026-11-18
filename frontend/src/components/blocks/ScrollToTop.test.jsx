import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';

const STORAGE_KEY = 'scroll-positions';

function renderAt(url) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ScrollToTop />
    </MemoryRouter>,
  );
}

let scrollTo;

beforeEach(() => {
  sessionStorage.clear();
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => {
  scrollTo.mockRestore();
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
});

test("a fresh load of another page does not inherit the previous page's scroll position", () => {
  // Every freshly loaded page has location.key "default", so the old key collided across pages.
  const first = renderAt('/experiences/scale-ai');
  Object.defineProperty(window, 'scrollY', { value: 400, configurable: true });
  window.dispatchEvent(new Event('scroll'));
  first.unmount();
  scrollTo.mockClear();

  renderAt('/projects/hearts-cards-game');
  expect(scrollTo).toHaveBeenCalledWith(0, 0);
  expect(scrollTo).not.toHaveBeenCalledWith(0, 400);
});

test("reloading the same page restores that page's own position", () => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ '/projects/hearts-cards-game|default': 300 }));
  renderAt('/projects/hearts-cards-game');
  expect(scrollTo).toHaveBeenCalledWith(0, 300);
});

test('the query string is part of the page identity', () => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ '/projects|default': 250 }));
  renderAt('/projects?a=1');
  expect(scrollTo).toHaveBeenCalledWith(0, 0);
  expect(scrollTo).not.toHaveBeenCalledWith(0, 250);
});

test('with no saved position the page starts at the top', () => {
  renderAt('/interests');
  expect(scrollTo).toHaveBeenCalledWith(0, 0);
});
