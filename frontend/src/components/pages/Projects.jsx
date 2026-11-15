import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicFile } from '../../App';
import './Projects.css';

const CODE = 'https://github.com/bchu-ops/pumpkio9-website/tree/main/products';

// Interactive products that run on this site, in menu order.
export const PRODUCTS = [
  {
    name: 'My Spotify',
    path: '/Spotify',
    code: `${CODE}/spotify`,
    icon: 'fab fa-spotify',
    summary: "What I've been listening to on Spotify, refreshed every hour.",
    points: ['Recently played tracks with when I played them', 'Top tracks and artists over 4 weeks, 6 months and all time'],
  },
  {
    name: 'Speed Demon',
    path: '/speed-demon',
    code: `${CODE}/speeddemon`,
    icon: 'fas fa-flag-checkered',
    summary: 'Formula 1 lap telemetry explorer built on the open OpenF1 data.',
    points: ['Line up two or three drivers’ laps by track position', 'Speed, throttle, brake, gear and the gap, with corner-by-corner notes'],
  },
  {
    name: 'Process Lab',
    path: '/process-lab',
    code: `${CODE}/processlab`,
    icon: 'fas fa-flask',
    summary: 'Process control and thermodynamics you can change and watch respond.',
    points: ['Tune a PID loop live and see overshoot, rise and settling time', 'Drag equipment into a process, pick fluids and materials, follow the energy balance'],
  },
];

const PAPER_PREFIX = /^Paper\s*&\s*Presentation\s*[—-]\s*/i;

const imageOf = (row) => (row.image ? publicFile(`images/covers/projects/${row.image}`) : null);
const yearOf = (row) => (row.date?.start ? row.date.start.slice(0, 4) : null);
const toolsOf = (row) => (row.tools || '').split(',').map((t) => t.trim()).filter(Boolean);
const newestFirst = (a, b) => (b.date?.start || '').localeCompare(a.date?.start || '');

function ProductCard({ product }) {
  return (
    <li className="pj-product">
      <div className="pj-product-head">
        <i className={`${product.icon} pj-product-icon`} aria-hidden="true" />
        <h3>{product.name}</h3>
      </div>
      <p className="pj-summary">{product.summary}</p>
      <ul className="pj-points">
        {product.points.map((p) => <li key={p}>{p}</li>)}
      </ul>
      <div className="pj-actions">
        <Link className="pj-button pj-button-primary" to={product.path}>Open {product.name}</Link>
        <a className="pj-button" href={product.code} target="_blank" rel="noopener noreferrer">Code</a>
      </div>
    </li>
  );
}

function WorkCard({ row, section }) {
  const image = imageOf(row);
  const year = yearOf(row);
  const tools = toolsOf(row).slice(0, 6);
  const external = row.link && !row.link.includes('bchu-ops.github.io/pumpkio9-website') ? row.link : null;
  return (
    <li className="pj-card">
      <Link to={`/${section}/${row.slug}`} className={`pj-card-link${image ? '' : ' pj-no-cover'}`}>
        {image && <img className="pj-cover" src={image} alt="" loading="lazy" />}
        <div className="pj-card-body">
          <h3>{row.title}</h3>
          {year && <span className="pj-year">{year}</span>}
          <p>{(row.description || '').replace(PAPER_PREFIX, '')}</p>
        </div>
      </Link>
      {tools.length > 0 && (
        <ul className="pj-tags" aria-label="Tools">
          {tools.map((t) => <li key={t}>{t}</li>)}
        </ul>
      )}
      {external && (
        <a className="pj-external" href={external} target="_blank" rel="noopener noreferrer">Code on GitHub</a>
      )}
    </li>
  );
}

function useCollections() {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    let live = true;
    fetch(publicFile('notion/collections.json'))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => live && setState({ status: 'ready', data }))
      .catch(() => live && setState({ status: 'error' }));
    return () => { live = false; };
  }, []);
  return state;
}

export default function Projects() {
  const collections = useCollections();
  const projects = collections.data ? [...collections.data.projects].sort(newestFirst) : [];
  const papers = collections.data ? collections.data.papers : [];

  return (
    <main className="pj-page">
      <header className="pj-header">
        <h1>Projects</h1>
        <p>Things I&apos;ve built, from interactive tools on this site to software projects and chemical engineering research.</p>
        <nav className="pj-jump" aria-label="Sections">
          <a href="#live">On this site</a>
          <a href="#projects">Projects</a>
          <a href="#papers">Papers</a>
        </nav>
      </header>

      <section id="live" className="pj-section" aria-labelledby="live-title">
        <h2 id="live-title">On this site</h2>
        <ul className="pj-products">
          {PRODUCTS.map((p) => <ProductCard key={p.name} product={p} />)}
        </ul>
      </section>

      {collections.status === 'loading' && <p className="pj-status">Loading projects…</p>}
      {collections.status === 'error' && <p className="pj-status">Projects couldn&apos;t load right now. Try refreshing the page.</p>}

      {collections.status === 'ready' && (
        <>
          <section id="projects" className="pj-section" aria-labelledby="projects-title">
            <h2 id="projects-title">Projects</h2>
            <ul className="pj-grid">
              {projects.map((row) => <WorkCard key={row.id} row={row} section="projects" />)}
            </ul>
          </section>
          <section id="papers" className="pj-section" aria-labelledby="papers-title">
            <h2 id="papers-title">Papers &amp; presentations</h2>
            <ul className="pj-grid">
              {papers.map((row) => <WorkCard key={row.id} row={row} section="papers" />)}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
