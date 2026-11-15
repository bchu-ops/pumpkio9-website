import { clampSlot, insertUnit, loopFor, moveUnit, removeUnit } from './editFlowsheet';

const u = (id, type = 'pipe') => ({ id, type, params: {} });
const line = [u('src', 'source'), u('a', 'valve'), u('b', 'pipe'), u('c', 'tank'), u('snk', 'sink')];
const ids = (us) => us.map((x) => x.id).join(' ');

test('slots stay between source and sink', () => {
  expect(clampSlot(line, 0)).toBe(1);
  expect(clampSlot(line, 99)).toBe(4);
});

test('insert puts the unit in the gap', () => {
  expect(ids(insertUnit(line, u('n'), 2))).toBe('src a n b c snk');
  expect(ids(insertUnit(line, u('n'), 0))).toBe('src n a b c snk');
  expect(ids(insertUnit(line, u('n'), 9))).toBe('src a b c n snk');
});

test('move uses the gap in the original order', () => {
  expect(ids(moveUnit(line, 'a', 4))).toBe('src b c a snk'); // dropped before the sink
  expect(ids(moveUnit(line, 'c', 1))).toBe('src c a b snk'); // dropped after the source
  expect(ids(moveUnit(line, 'b', 2))).toBe('src a b c snk'); // own gap: no change
  expect(ids(moveUnit(line, 'src', 3))).toBe(ids(line)); // source is fixed
});

test('remove drops the unit and loops that use it', () => {
  const loops = [{ pv: 'c.T', mv: 'a' }, { pv: 'b.T', mv: 'x' }, { pv: 'c.level', mv: 'z' }];
  const out = removeUnit(line, loops, 'a');
  expect(ids(out.units)).toBe('src b c snk');
  expect(out.loops).toEqual([{ pv: 'b.T', mv: 'x' }, { pv: 'c.level', mv: 'z' }]);
  expect(removeUnit(line, loops, 'snk').units).toBe(line);
});

test('new loop moves the measured unit, else the nearest upstream, else downstream', () => {
  expect(loopFor(line, 'a', 40).mv).toBe('a');
  expect(loopFor(line, 'c', 40)).toMatchObject({ pv: 'c.T', mv: 'a', sp: 40, enabled: true });
  const noUp = [u('src', 'source'), u('p'), u('h', 'heater'), u('snk', 'sink')];
  expect(loopFor(noUp, 'p', 1).mv).toBe('h');
  expect(loopFor([u('src', 'source'), u('p'), u('snk', 'sink')], 'p', 1).mv).toBeNull();
});
