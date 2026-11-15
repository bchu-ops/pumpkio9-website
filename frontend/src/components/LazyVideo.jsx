import React, { useEffect, useRef, useState } from 'react';

// Defers loading/playing a video until it scrolls near the viewport,
// instead of downloading immediately on page load.
function LazyVideo({ src, ...videoProps }) {
  const containerRef = useRef(null);
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
      {isNearViewport && <video src={src} {...videoProps} />}
    </div>
  );
}

export default LazyVideo;
