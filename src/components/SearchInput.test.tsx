import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  afterEach(cleanup);

  it('forwards typing and clears an existing query', () => {
    const onChange = vi.fn();
    render(<SearchInput placeholder="Tìm kiếm" value="nước mắm" onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'gạo' } });
    expect(onChange).toHaveBeenLastCalledWith('gạo');

    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('does not render a clear button for an empty query', () => {
    render(<SearchInput placeholder="Tìm kiếm" value="" onChange={vi.fn()} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
