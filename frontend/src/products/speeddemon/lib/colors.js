const FALLBACK = { a: '#2383e2', b: '#e2554f' };

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

/** Team colours for both drivers; teammates get a lighter shade for B. */
export function driverColors(teamA, teamB) {
  const a = hex(teamA) || FALLBACK.a;
  let b = hex(teamB) || FALLBACK.b;
  if (a === b) b = lighten(b, 0.55);
  return { a, b };
}
