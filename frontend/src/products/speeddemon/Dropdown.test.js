import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Dropdown from './Dropdown';

const options = [
  { value: '1', label: 'VER', hint: 'Red Bull Racing', swatch: '#4781d7' },
  { value: '4', label: 'NOR', hint: 'McLaren', swatch: '#f47600' },
  { value: '16', label: 'LEC', hint: 'Ferrari', swatch: '#e8002d' },
];

function setup(props = {}) {
  const onChange = jest.fn();
  render(<Dropdown label="Driver A" value="1" options={options} onChange={onChange} {...props} />);
  return { onChange, button: screen.getByRole('combobox', { name: /Driver A/ }) };
}

it('shows the selected option on the button', () => {
  const { button } = setup();
  expect(button).toHaveTextContent('VER');
  expect(button).toHaveAttribute('aria-expanded', 'false');
});

it('opens a listbox and picks an option by click', () => {
  const { button, onChange } = setup();
  fireEvent.click(button);
  expect(screen.getByRole('listbox')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('option', { name: /NOR/ }));
  expect(onChange).toHaveBeenCalledWith('4');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

it('supports arrow keys, Enter and Escape', () => {
  const { button, onChange } = setup();
  fireEvent.keyDown(button, { key: 'ArrowDown' });
  const list = screen.getByRole('listbox');
  fireEvent.keyDown(list, { key: 'ArrowDown' });
  fireEvent.keyDown(list, { key: 'Enter' });
  expect(onChange).toHaveBeenCalledWith('4');

  fireEvent.keyDown(button, { key: 'ArrowDown' });
  fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

it('filters long lists by typing', () => {
  const { button, onChange } = setup({ searchable: true });
  fireEvent.click(button);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ferr' } });
  expect(screen.getAllByRole('option')).toHaveLength(1);
  fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' });
  expect(onChange).toHaveBeenCalledWith('16');
});

it('closes when clicking outside', () => {
  const { button } = setup();
  fireEvent.click(button);
  fireEvent.mouseDown(document.body);
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

it('does nothing when disabled', () => {
  const { button } = setup({ disabled: true });
  fireEvent.click(button);
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
