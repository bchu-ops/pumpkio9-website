// Pure edits for the series flowsheet. units[0] is the source and the last unit
// is the sink; both stay put. A "slot" is the array index a unit is inserted at,
// so valid slots run from 1 (right after the source) to units.length - 1 (just before the sink).

const MV_TYPES = new Set(['valve', 'heater', 'hx']);

export const clampSlot = (units, slot) => Math.max(1, Math.min(units.length - 1, slot));

export function insertUnit(units, unit, slot) {
  const at = clampSlot(units, slot);
  return [...units.slice(0, at), unit, ...units.slice(at)];
}

/** Move a unit to a slot measured in the original array (the gap the user dropped it in). */
export function moveUnit(units, id, slot) {
  const from = units.findIndex((u) => u.id === id);
  if (from <= 0 || from >= units.length - 1) return units;
  const rest = units.filter((u) => u.id !== id);
  const at = slot > from ? slot - 1 : slot;
  return insertUnit(rest, units[from], at);
}

/** Remove a unit and any loop that measured or moved it. Source and sink can't be removed. */
export function removeUnit(units, loops, id) {
  const i = units.findIndex((u) => u.id === id);
  if (i <= 0 || i >= units.length - 1) return { units, loops };
  const touches = (l) => l.mv === id || l.pv?.split('.')[0] === id;
  return { units: units.filter((u) => u.id !== id), loops: loops.filter((l) => !touches(l)) };
}

/**
 * A new PID loop measuring the temperature leaving `pvId`. It moves that unit if it
 * can (valve, heater, exchanger), else the nearest one upstream, else downstream.
 */
export function loopFor(units, pvId, sp) {
  const i = units.findIndex((u) => u.id === pvId);
  const can = (u) => u && MV_TYPES.has(u.type);
  let mv = can(units[i]) ? units[i] : null;
  for (let k = i - 1; !mv && k >= 0; k -= 1) if (can(units[k])) mv = units[k];
  for (let k = i + 1; !mv && k < units.length; k += 1) if (can(units[k])) mv = units[k];
  return { enabled: true, pv: `${pvId}.T`, mv: mv?.id ?? null, sp, Kc: 0.05, tauI: 120, reverse: false };
}
