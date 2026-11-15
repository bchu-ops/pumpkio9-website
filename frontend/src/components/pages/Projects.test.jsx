import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Projects from './Projects';

const collections = {
  experiences: [],
  projects: [
    { id: 'a', title: 'Older Project', slug: 'older', section: 'projects', image: 'a.png', description: 'Old one', tools: 'Java, SQL', date: { start: '2022-01-01' }, link: 'https://github.com/x/older' },
    { id: 'b', title: 'Newer Project', slug: 'newer', section: 'projects', description: 'New one', tools: 'React', date: { start: '2025-07-01' }, link: 'https://bchu-ops.github.io/pumpkio9-website/' },
  ],
  papers: [
    { id: 'p', title: 'A Paper', slug: 'a-paper', section: 'papers', description: 'Paper & Presentation — Reactor design', tools: 'Aspen Plus' },
  ],
};

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => collections });
});

const renderPage = () => render(<MemoryRouter><Projects /></MemoryRouter>);

test('live products are listed in menu order with open and code links', () => {
  renderPage();
  const live = screen.getByRole('region', { name: 'On this site' });
  const names = within(live).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
  expect(names).toEqual(['My Spotify', 'Speed Demon', 'Process Lab']);
  expect(within(live).getByRole('link', { name: 'Open My Spotify' })).toHaveAttribute('href', '/Spotify');
  expect(within(live).getAllByRole('link', { name: 'Code' })[1]).toHaveAttribute('href', expect.stringContaining('/products/speeddemon'));
});

test('projects load newest first with tools, and papers drop the boilerplate prefix', async () => {
  renderPage();
  const projects = await screen.findByRole('region', { name: 'Projects' });
  const titles = within(projects).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
  expect(titles).toEqual(['Newer Project', 'Older Project']);
  expect(within(projects).getByText('Java')).toBeInTheDocument();
  // External code link only for links that leave this site
  expect(within(projects).getAllByRole('link', { name: 'Code on GitHub' })).toHaveLength(1);
  const papers = screen.getByRole('region', { name: 'Papers & presentations' });
  expect(within(papers).getByText('Reactor design')).toBeInTheDocument();
  expect(within(papers).getByRole('link', { name: /A Paper/ })).toHaveAttribute('href', '/papers/a-paper');
});

test('shows a message when projects cannot load', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
  renderPage();
  expect(await screen.findByText(/couldn.t load right now/)).toBeInTheDocument();
});
