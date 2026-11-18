import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

const renderNavbar = (props = {}) =>
  render(<MemoryRouter><Navbar {...props} /></MemoryRouter>);

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

test('renders the top-level nav links', () => {
  renderNavbar();
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: 'Interests' })).toHaveAttribute('href', '/interests');
  expect(screen.getByRole('button', { name: /Products/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Links' })).toBeInTheDocument();
});

test('hamburger button toggles aria-expanded and the menu class', () => {
  const { container } = renderNavbar();
  const toggle = screen.getByRole('button', { name: 'Toggle menu' });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(container.querySelector('.nav-menu')).not.toHaveClass('active');
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(container.querySelector('.nav-menu')).toHaveClass('active');
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('Links anchors to #footer-links and scrolls to that element', () => {
  const footerLinks = document.createElement('div');
  footerLinks.id = 'footer-links';
  footerLinks.scrollIntoView = vi.fn();
  document.body.appendChild(footerLinks);
  try {
    renderNavbar();
    const link = screen.getByRole('link', { name: 'Links' });
    expect(link).toHaveAttribute('href', '#footer-links');
    fireEvent.click(link);
    expect(footerLinks.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  } finally {
    footerLinks.remove();
  }
});

test('Links falls back to the bottom ref when the footer is absent', () => {
  const bottomRef = { current: { scrollIntoView: vi.fn() } };
  renderNavbar({ bottomRef });
  fireEvent.click(screen.getByRole('link', { name: 'Links' }));
  expect(bottomRef.current.scrollIntoView).toHaveBeenCalled();
});

test('Products dropdown opens, exposes aria state, and closes on outside click', () => {
  renderNavbar();
  const toggle = screen.getByRole('button', { name: /Products/ });
  expect(toggle).toHaveAttribute('aria-haspopup', 'true');
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('link', { name: 'Speed Demon' })).not.toBeInTheDocument();
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('link', { name: 'My Spotify' })).toHaveAttribute('href', '/spotify');
  expect(screen.getByRole('link', { name: 'Speed Demon' })).toHaveAttribute('href', '/speed-demon');
  expect(screen.getByRole('link', { name: 'Process Lab' })).toHaveAttribute('href', '/process-lab');
  fireEvent.mouseDown(document.body);
  expect(screen.queryByRole('link', { name: 'Speed Demon' })).not.toBeInTheDocument();
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
