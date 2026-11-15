import { useEffect } from 'react';

/**
 * Load a Google Fonts stylesheet once, only on the product pages that use it,
 * so the home page doesn't pay for fonts it never shows.
 */
export default function useFonts(href) {
  useEffect(() => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, [href]);
}
