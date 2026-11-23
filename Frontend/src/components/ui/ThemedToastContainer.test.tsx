import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ThemedToastContainer from './ThemedToastContainer';
import { ThemeContext } from '@/context/ThemeContext';

vi.mock('react-toastify', async () => {
  const actual = await vi.importActual<typeof import('react-toastify')>('react-toastify');
  return {
    ...actual,
    ToastContainer: (props: any) => (
      <div data-testid="toast-container" data-theme={props.theme} data-autoclose={props.autoClose}>
        {props.children}
      </div>
    ),
  };
});

describe('ThemedToastContainer', () => {
  it('se inicializa con autoClose en 5000ms y tema claro por defecto', () => {
    const { getByTestId } = render(
      <ThemeContext.Provider
        value={{
          theme: 'light',
          setTheme: vi.fn(),
          toggleTheme: vi.fn(),
        }}
      >
        <ThemedToastContainer />
      </ThemeContext.Provider>
    );

    const container = getByTestId('toast-container');
    expect(container.getAttribute('data-autoclose')).toBe('5000');
    expect(container.getAttribute('data-theme')).toBe('light');
  });

  it('cambia reactivamente el tema a oscuro cuando el contexto es dark', () => {
    const { getByTestId } = render(
      <ThemeContext.Provider
        value={{
          theme: 'dark',
          setTheme: vi.fn(),
          toggleTheme: vi.fn(),
        }}
      >
        <ThemedToastContainer />
      </ThemeContext.Provider>
    );

    const container = getByTestId('toast-container');
    expect(container.getAttribute('data-theme')).toBe('dark');
  });
});
