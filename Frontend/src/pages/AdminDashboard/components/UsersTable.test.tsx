import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UsersTable from './UsersTable';
import type { User } from '../../../types';

const BASE_USER: User = {
  id: '1',
  name: 'Juan Perez',
  email: 'juan.perez@epn.edu.ec',
  roles: ['STUDENT'],
  uniqueId: '202310123',
  isActive: true,
  isLocked: false,
};

describe('UsersTable', () => {
  it('renderiza la lista de usuarios y no muestra ceros (0) cuando isLocked es falsy o 0 numérico', () => {
    const rawUserWithZero = {
      ...BASE_USER,
      // Simulamos la respuesta cruda de SQLite con INTEGER 0
      isActive: 1 as unknown as boolean,
      isLocked: 0 as unknown as boolean,
    };

    render(
      <UsersTable
        users={[rawUserWithZero]}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onUnlock={vi.fn()}
      />
    );

    expect(screen.getAllByText('Juan Perez').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.queryByText('Bloqueado')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /desbloquear/i })).not.toBeInTheDocument();

    // Verificamos que no haya un '0' residual en las celdas de estado o acciones
    const statusCell = screen.getByText('Activo').closest('td');
    expect(statusCell).toHaveTextContent('Activo');
    expect(statusCell?.textContent).not.toContain('0');

    const actionsCell = screen.getByRole('button', { name: /desactivar a juan perez/i }).closest('td');
    expect(actionsCell?.textContent).not.toContain('0');
  });

  it('muestra el badge Bloqueado y el botón Desbloquear cuando isLocked es true o 1', () => {
    const lockedUser: User = {
      ...BASE_USER,
      id: '2',
      name: 'Maria Gomez',
      isLocked: true,
    };

    const onUnlock = vi.fn();

    render(
      <UsersTable
        users={[lockedUser]}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onUnlock={onUnlock}
      />
    );

    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
    const unlockBtn = screen.getByRole('button', { name: /desbloquear a maria gomez/i });
    expect(unlockBtn).toBeInTheDocument();

    fireEvent.click(unlockBtn);
    expect(onUnlock).toHaveBeenCalledWith('2');
  });

  it('solicita confirmación modal antes de desactivar al usuario y permite cancelar o confirmar', () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();

    render(
      <UsersTable
        users={[BASE_USER]}
        onEdit={onEdit}
        onToggleStatus={onToggle}
        onUnlock={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /desactivar a juan perez/i });
    fireEvent.click(toggleBtn);

    // No se llama directamente sin confirmar
    expect(onToggle).not.toHaveBeenCalled();

    // Se despliega el modal de confirmación
    expect(screen.getByText('¿Desactivar usuario?')).toBeInTheDocument();
    expect(screen.getByText(/¿Confirmas que deseas desactivar la cuenta de/i)).toBeInTheDocument();

    // Cancelar cierra el modal sin alterar el estado
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelBtn);
    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.queryByText('¿Desactivar usuario?')).not.toBeInTheDocument();

    // Abrir nuevamente y confirmar
    fireEvent.click(toggleBtn);
    const confirmBtn = screen.getByRole('button', { name: /sí, desactivar/i });
    fireEvent.click(confirmBtn);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('1');
    expect(screen.queryByText('¿Desactivar usuario?')).not.toBeInTheDocument();

    // Editar sigue operando directamente
    const editBtn = screen.getByRole('button', { name: /editar a juan perez/i });
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(BASE_USER);
  });

  it('solicita confirmación modal con copy adecuado para activar un usuario inactivo', () => {
    const onToggle = vi.fn();
    const inactiveUser: User = {
      ...BASE_USER,
      id: '3',
      name: 'Carlos Ruiz',
      isActive: false,
    };

    render(
      <UsersTable
        users={[inactiveUser]}
        onEdit={vi.fn()}
        onToggleStatus={onToggle}
        onUnlock={vi.fn()}
      />
    );

    const activateBtn = screen.getByRole('button', { name: /activar a carlos ruiz/i });
    fireEvent.click(activateBtn);

    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.getByText('¿Activar usuario?')).toBeInTheDocument();
    expect(screen.getByText(/¿Confirmas que deseas activar la cuenta de/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /sí, activar/i });
    fireEvent.click(confirmBtn);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('3');
  });
});
