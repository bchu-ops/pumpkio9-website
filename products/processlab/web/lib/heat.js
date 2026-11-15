/**
 * Heat-transfer helpers (SI).
 * Plane wall (tanks, exchanger plates): 1/U = 1/h_in + Σ t_j/k_j + 1/h_out (Incropera eq. 3.19).
 * Pipes use cylindrical layers instead (cylinderUA), since insulation is often as thick as the pipe radius.
 */
export function wallU({ hIn, hOut, layers = [] }) {
  const r = 1 / hIn + layers.reduce((sum, { t, k }) => sum + (t > 0 ? t / k : 0), 0) + 1 / hOut;
  return 1 / r;
}

/**
 * UA of a cylindrical wall with layers, per Incropera eq. 3.33:
 * 1/UA = 1/(h_in·2π·r_in·L) + Σ ln(r_{j+1}/r_j)/(2π·k_j·L) + 1/(h_out·2π·r_out·L).
 */
export function cylinderUA({ hIn, hOut, rIn, length, layers = [] }) {
  let r = rIn;
  let res = 1 / (hIn * 2 * Math.PI * rIn * length);
  layers.forEach(({ t, k }) => {
    if (t <= 0) return;
    res += Math.log((r + t) / r) / (2 * Math.PI * k * length);
    r += t;
  });
  res += 1 / (hOut * 2 * Math.PI * r * length);
  return 1 / res;
}

/**
 * Steady outlet temperature of N perfectly mixed cells in series losing heat to ambient.
 * Per cell: m·cp·(T_{i−1} − T_i) = (UA/N)·(T_i − T_amb). As N → ∞ this tends to the
 * plug-flow result T_amb + (T_in − T_amb)·exp(−UA/(m·cp)).
 */
export function pipeCellsOutlet({ Tin, Tamb, UA, mcp, cells }) {
  return Tamb + (Tin - Tamb) / (1 + UA / cells / mcp) ** cells;
}
