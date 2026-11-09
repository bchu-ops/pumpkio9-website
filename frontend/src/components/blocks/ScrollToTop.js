import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Start every new page at the top. Keeps in-page #anchor links working.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
