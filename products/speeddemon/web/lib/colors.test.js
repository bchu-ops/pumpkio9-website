import { lighten, driverColors } from './colors';

test('lighten(0) leaves the colour unchanged and lighten(1) gives white', () => {
  expect(lighten('#2383e2', 0)).toBe('#2383e2');
  expect(lighten('#2383e2', 1)).toBe('#ffffff');
});

test('lighten mixes each channel toward 255 by the given fraction', () => {
  expect(lighten('#000000', 0.5)).toBe('#808080'); // round(127.5) = 128
  expect(lighten('#ff0000', 0.5)).toBe('#ff8080');
});

test('lighten keeps leading zeros (always #rrggbb)', () => {
  expect(lighten('#000000', 0)).toBe('#000000');
  expect(lighten('#0000ff', 0)).toBe('#0000ff');
  expect(lighten('#0a0b0c', 0)).toBe('#0a0b0c');
});

test('driverColors lowercases valid 6-digit hex team colours', () => {
  expect(driverColors('FF0000', '00FF00')).toEqual({ a: '#ff0000', b: '#00ff00' });
});

test('missing or malformed colours fall back to the defaults', () => {
  expect(driverColors(undefined, null)).toEqual({ a: '#2383e2', b: '#e2554f' });
  expect(driverColors('#ff0000', 'xyz')).toEqual({ a: '#2383e2', b: '#e2554f' });
  expect(driverColors('12345', '1234567')).toEqual({ a: '#2383e2', b: '#e2554f' });
});

test('teammates (same colour) get a lighter second colour', () => {
  const { a, b } = driverColors('3671c6', '3671C6');
  expect(a).toBe('#3671c6');
  expect(b).toBe(lighten('#3671c6', 0.55));
  expect(b).not.toBe(a);
});

test('two drivers: no c key; third arg (even invalid) adds c', () => {
  expect(driverColors('ff0000', '00ff00')).not.toHaveProperty('c');
  expect(driverColors('ff0000', '00ff00', undefined)).not.toHaveProperty('c');
  expect(driverColors('ff0000', '00ff00', null).c).toBe('#2ea043');
});

test('third driver on the same team as a or b is lightened by 0.3', () => {
  expect(driverColors('ff0000', '00ff00', 'ff0000').c).toBe(lighten('#ff0000', 0.3));
  expect(driverColors('ff0000', '00ff00', '00ff00').c).toBe(lighten('#00ff00', 0.3));
});

test('all three drivers always get distinct colours', () => {
  const combos = [
    ['ff0000', 'ff0000', 'ff0000'],
    ['2ea043', '2ea043', 'ffffff'],
    [undefined, undefined, undefined],
    ['2383e2', 'e2554f', '2ea043'],
  ];
  combos.forEach(([x, y, z]) => {
    const { a, b, c } = driverColors(x, y, z);
    expect(new Set([a, b, c]).size).toBe(3);
  });
});

test('a white teammate pair cannot be lightened further, so b equals a (documented limit)', () => {
  const { a, b } = driverColors('ffffff', 'ffffff');
  expect(a).toBe('#ffffff');
  expect(b).toBe('#ffffff');
});
