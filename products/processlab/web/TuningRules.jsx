import React, { useState } from 'react';
import ParamSlider from './ParamSlider';
import { cohenCoon, simcPI } from './lib/tuning';

const num = (v) => (v === undefined ? '—' : Number(v.toPrecision(3)));

/**
 * Model-based tuning for the first-order-plus-dead-time process: settings from K, τ, θ
 * that can be applied to the controller with one click.
 */
export default function TuningRules({ p, onApply }) {
  const [tauC, setTauC] = useState(null); // null = follow θ (SIMC's recommended τc = θ)
  if (p.model !== 'first') {
    return (
      <section className="tr-section" aria-label="Tuning rules">
        <h3 className="tr-heading">Tuning rules</h3>
        <p className="pb-empty">Tuning rules here use a first-order-plus-dead-time model. Switch the process model to First order to see them.</p>
      </section>
    );
  }
  const K = p.K;
  const tau = p.tau;
  const theta = p.deadTime;
  const tc = tauC ?? Math.max(theta, 0.1);
  const rows = [
    { id: 'cc-pi', name: 'Cohen–Coon PI', r: cohenCoon({ K, tau, theta, type: 'PI' }), why: 'Fast, aggressive (quarter-decay target)' },
    { id: 'cc-pid', name: 'Cohen–Coon PID', r: cohenCoon({ K, tau, theta, type: 'PID' }), why: 'Fastest, least robust' },
    { id: 'simc', name: 'SIMC PI', r: simcPI({ K, tau, theta, tauC: tc }), why: `Robust; closed-loop time constant τc = ${num(tc)} s` },
  ];
  return (
    <section className="tr-section" aria-label="Tuning rules">
      <h3 className="tr-heading">Tuning rules from K = {num(K)}, τ = {num(tau)} s, θ = {num(theta)} s</h3>
      <div className="pb-scroll">
        <table className="pb-table">
          <thead>
            <tr><th scope="col" className="pb-left">Rule</th><th scope="col">Kc</th><th scope="col">τI [s]</th><th scope="col">τD [s]</th><th scope="col"><span className="sr-only">Apply</span></th></tr>
          </thead>
          <tbody>
            {rows.map(({ id, name, r, why }) => (
              <tr key={id}>
                <th scope="row" className="pb-left">{name}<div className="tr-why">{why}</div></th>
                {r ? (
                  <>
                    <td>{num(r.Kc)}</td>
                    <td>{num(r.tauI)}</td>
                    <td>{num(r.tauD)}</td>
                    <td><button type="button" className="cl-chip" onClick={() => onApply({ Kc: r.Kc, tauI: r.tauI, tauD: r.tauD ?? 0, useI: true })}>Apply</button></td>
                  </>
                ) : (
                  <td colSpan={4} className="pb-left">Needs dead time θ &gt; 0</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="tr-tauc">
        <ParamSlider id="tr-tauc" label="SIMC τc (smaller = faster, less robust)" unit="s" value={tc} min={0.1} max={20} log onChange={setTauC} />
      </div>
      <p className="pb-empty">
        Cohen–Coon: Kc = (τ/Kθ)(0.9 + θ/12τ) for PI. SIMC (Skogestad 2003): Kc = τ/(K(τc + θ)), τI = min(τ, 4(τc + θ)); τc = θ is the recommended default.
        Apply a row, then compare overshoot and settling time in the readouts above.
      </p>
    </section>
  );
}
