const FALLBACK = { a: '#2383e2', b: '#e2554f', c: '#2ea043' };

const hex = (c) => (c && /^[0-9a-f]{6}$/i.test(c) ? `#${c.toLowerCase()}` : null);

// Mix a #rrggbb colour toward white by `amount` (0..1).
export function lighten(color, amount) {
  const n = parseInt(color.slice(1), 16);
  const mix = (v) => Math.round(v + (255 - v) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Team colours per driver; a teammate gets a lighter shade so lines stay
 * distinct. The third driver is optional.
 */
export function driverColors(teamA, teamB, teamC) {
  const a = hex(teamA) || FALLBACK.a;
  let b = hex(teamB) || FALLBACK.b;
  if (b === a) b = lighten(b, 0.55);
  if (teamC === undefined) return { a, b };
  let c = hex(teamC) || FALLBACK.c;
  if (c === a || c === b) c = lighten(c, 0.3);
  if (c === a || c === b) c = FALLBACK.c;
  return { a, b, c };
}
