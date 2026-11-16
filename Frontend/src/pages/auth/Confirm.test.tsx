import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { verifyAccount } from '../../api/auth.api';
import Confirm from './Confirm';

vi.mock('../../api/auth.api', () => ({
  verifyAccount: vi.fn(),
}));

const mockVerify = vi.mocked(verifyAccount);

const renderConfirm = (token = 'tok-confirm') =>
  render(
    <MemoryRouter initialEntries={[`/confirm/${token}`]}>
      <ToastContainer />
      <Routes>
        <Route path="/confirm/:token" element={<Confirm />} />
        <Route path="/login" element={<div>pantalla de login</div>} />
      </Routes>
    </MemoryRouter>
  );

const clickVerify = () =>
  screen.getByRole('button', { name: /verificar mi cuenta|verificando/i }).click();

/** Texto visible en el contenedor global de toasts de react-toastify. */
const toastText = (): string =>
  document.querySelector('.Toastify__toast-container')?.textContent ?? '';

describe('Confirm — feedback dentro de la tarjeta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el panel de éxito y no emite toast', async () => {
    mockVerify.mockResolvedValueOnce({ message: 'Cuenta verificada con éxito' });

    renderConfirm();
    clickVerify();

    await waitFor(() => {
      expect(screen.getByText('¡Todo listo!')).toBeTruthy();
    });
    expect(toastText()).not.toContain('Cuenta verificada con éxito');
  });

  it('muestra el mensaje del backend dentro de la tarjeta cuando el enlace falla', async () => {
    mockVerify.mockRejectedValueOnce({
      response: { status: 400, data: { message: 'El token es inválido o ha expirado' } },
    });

    renderConfirm();
    clickVerify();

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain(
        'El token es inválido o ha expirado'
      );
    });
    expect(toastText()).not.toContain('El token es inválido o ha expirado');
  });

  it('redirige a /login tras 2.5 segundos', async () => {
    vi.useFakeTimers();
    mockVerify.mockResolvedValueOnce({ message: 'Cuenta verificada con éxito' });

    renderConfirm();

    // `act` async vacía la cola de microtask para que el `await` de la API
    // resuelva y se programe el `setTimeout`. Con fake timers `waitFor` se
    // queda esperando un reloj que no avanza solo.
    await act(async () => {
      clickVerify();
    });

    expect(mockVerify).toHaveBeenCalled();
    expect(screen.queryByText('pantalla de login')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText('pantalla de login')).toBeTruthy();
  });
});
