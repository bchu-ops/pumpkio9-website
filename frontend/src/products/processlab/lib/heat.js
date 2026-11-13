/**
 * Heat-transfer helpers (SI).
 * Series thermal resistances for a plane wall: 1/U = 1/h_in + Σ t_j/k_j + 1/h_out.
 * Thin-wall approximation is used for tanks and pipes (wall thin vs. diameter).
 */
export function wallU({ hIn, hOut, layers = [] }) {
  const r = 1 / hIn + layers.reduce((sum, { t, k }) => sum + (t > 0 ? t / k : 0), 0) + 1 / hOut;
  return 1 / r;
}

/**
 * Steady outlet temperature of N perfectly mixed cells in series losing heat to ambient.
 * Per cell: m·cp·(T_{i−1} − T_i) = (UA/N)·(T_i − T_amb). As N → ∞ this tends to the
 * plug-flow result T_amb + (T_in − T_amb)·exp(−UA/(m·cp)).
 */
export function pipeCellsOutlet({ Tin, Tamb, UA, mcp, cells }) {
  return Tamb + (Tin - Tamb) / (1 + UA / cells / mcp) ** cells;
}
