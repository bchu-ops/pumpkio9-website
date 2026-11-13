import React from 'react';
import { enthalpy } from './units';

const f = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—');

/** Stream table + per-block heat duties + overall energy balance (final time step). */
export default function StreamTable({ units, names, streams, duties, balance }) {
  const rows = units.filter((u) => streams[u.id]);
  const kW = (w) => f(w / 1000, 2);
  const accumulation = balance.in + balance.added - balance.removed - balance.losses - balance.vented - balance.out;
  return (
    <section className="pb-tables" aria-label="Stream table and energy balance">
      <h2 className="pb-units-title">Streams (end of run)</h2>
      <div className="pb-scroll">
        <table className="pb-table">
          <thead>
            <tr><th scope="col">Leaving</th><th scope="col" className="pb-left">Fluid</th><th scope="col">ṁ [kg/s]</th><th scope="col">T [°C]</th><th scope="col">Vapor [%]</th><th scope="col">ρ [kg/m³]</th><th scope="col">cp [kJ/kg·K]</th><th scope="col">Enthalpy flow [kW]</th></tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const s = streams[u.id];
              return (
                <tr key={u.id}>
                  <th scope="row">{names[u.id]}</th>
                  <td className="pb-left">{s.fluid.name}</td>
                  <td>{f(s.m, 3)}</td>
                  <td>{f(s.T)}</td>
                  <td>{f(s.x * 100)}</td>
                  <td>{f(s.fluid.rho, 0)}</td>
                  <td>{f(s.fluid.cp / 1000, 3)}</td>
                  <td>{kW(s.m * enthalpy(s.fluid, s.T, s.x))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h2 className="pb-units-title">Energy balance [kW] (reference: liquid at 0 °C)</h2>
      <div className="pb-scroll">
        <table className="pb-table">
          <thead><tr><th scope="col">Block</th><th scope="col">Heat added (+) / removed (−)</th><th scope="col">Wall heat loss</th><th scope="col">Vapor vented</th></tr></thead>
          <tbody>
            {units.filter((u) => duties[u.id] && (duties[u.id].Q || duties[u.id].loss || duties[u.id].vent)).map((u) => (
              <tr key={u.id}><th scope="row">{names[u.id]}</th><td>{kW(duties[u.id].Q)}</td><td>{kW(duties[u.id].loss)}</td><td>{kW(duties[u.id].vent)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="pb-balance">
        In {kW(balance.in)} + added {kW(balance.added)} = out {kW(balance.out)} + removed {kW(balance.removed)} + wall losses {kW(balance.losses)} + vented {kW(balance.vented)} + stored {kW(accumulation)}
      </p>
    </section>
  );
}
