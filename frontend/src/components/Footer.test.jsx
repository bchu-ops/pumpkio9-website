import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

beforeEach(() => {
  global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
});

test('footer is a contentinfo landmark with the links section id', () => {
  const { container } = render(<MemoryRouter><Footer /></MemoryRouter>);
  expect(screen.getByRole('contentinfo')).toHaveClass('footer-container');
  expect(container.querySelector('#footer-links')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Gmail' })).toBeInTheDocument();
});
