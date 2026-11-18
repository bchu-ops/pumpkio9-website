import React, { useEffect, useRef, useState } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => !!window.matchMedia?.(REDUCED_MOTION).matches);
  useEffect(() => {
    const query = window.matchMedia?.(REDUCED_MOTION);
    if (!query?.addEventListener) return undefined;
    const onChange = (e) => setReduced(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// Defers loading/playing a video until it scrolls near the viewport,
// instead of downloading immediately on page load. For visitors who prefer
// reduced motion it never autoplays or loops: it shows the first frame with
// controls so they can opt in to playing it.
function LazyVideo({ src, ...videoProps }) {
  const containerRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {isNearViewport &&
        (reducedMotion ? (
          <video
            src={src}
            {...videoProps}
            autoPlay={false}
            loop={false}
            controls
            preload="metadata"
          />
        ) : (
          <video src={src} {...videoProps} />
        ))}
    </div>
  );
}

export default LazyVideo;
