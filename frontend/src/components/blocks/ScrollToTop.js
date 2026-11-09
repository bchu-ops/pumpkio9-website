import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const STORAGE_KEY = 'scroll-positions';
const RETRY_MS = 50;
const MAX_WAIT_MS = 2500;

const readPositions = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const savePosition = (key, y) => {
  try {
    const positions = { ...readPositions(), [key]: y };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Storage unavailable (private mode): back navigation just starts at the top.
  }
};

// Content (Notion cards, pages) loads after navigation, so keep retrying
// until the target exists or the page is tall enough, then give up quietly.
const retryUntil = (attempt) => {
  const start = Date.now();
  let timer;
  const tick = () => {
    if (attempt() || Date.now() - start > MAX_WAIT_MS) return;
    timer = setTimeout(tick, RETRY_MS);
  };
  tick();
  return () => clearTimeout(timer);
};

/**
 * Scroll behaviour on navigation:
 * - Back/forward: return to where the visitor was on that page.
 * - Link with a #hash (e.g. breadcrumb "Experiences"): scroll to that section.
 * - Any other navigation: start at the top.
 */
export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Remember the current page's position while the visitor scrolls.
  useEffect(() => {
    const onScroll = () => savePosition(location.key, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.key]);

  useLayoutEffect(() => {
    const { key, hash } = location;
    const saved = readPositions()[key];

    if (navigationType === 'POP' && typeof saved === 'number') {
      return retryUntil(() => {
        const reachable = document.documentElement.scrollHeight - window.innerHeight >= saved;
        window.scrollTo(0, saved);
        return reachable;
      });
    }

    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      return retryUntil(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ block: 'start' });
        return Boolean(el);
      });
    }

    window.scrollTo(0, 0);
    return undefined;
  }, [location, navigationType]);

  return null;
}
