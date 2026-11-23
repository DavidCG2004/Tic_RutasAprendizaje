import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatSessionDrawer from './ChatSessionDrawer';
import type { ChatSession } from '../../../types';

const makeSession = (overrides: Partial<ChatSession> = {}): ChatSession => ({
  id: 1,
  moduleId: null,
  title: null,
  topic: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  moduleTitle: null,
  messageCount: 5,
  lastMessage: 'Última consulta aquí',
  lastMessageAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  sessions: [],
  loading: false,
  error: null,
  activeSessionId: null,
  onSelectSession: vi.fn(),
  onNewSession: vi.fn(),
};

describe('ChatSessionDrawer', () => {
  it('renders hidden when isOpen is false', () => {
    const { container } = render(<ChatSessionDrawer {...defaultProps} isOpen={false} />);
    const drawer = container.firstChild as HTMLElement;
    expect(drawer.className).toContain('-translate-x-full');
  });

  it('renders visible when isOpen is true', () => {
    const { container } = render(<ChatSessionDrawer {...defaultProps} />);
    const drawer = container.firstChild as HTMLElement;
    expect(drawer.className).toContain('translate-x-0');
  });

  it('shows skeleton cards when loading', () => {
    const { container } = render(<ChatSessionDrawer {...defaultProps} loading={true} />);
    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThanOrEqual(3);
  });

  it('shows empty state when no sessions', () => {
    render(<ChatSessionDrawer {...defaultProps} sessions={[]} />);
    expect(screen.getByText(/No tenés conversaciones guardadas aún/)).toBeInTheDocument();
  });

  it('shows error message when error is set', () => {
    render(<ChatSessionDrawer {...defaultProps} error="Error de red" />);
    expect(screen.getByText('Error de red')).toBeInTheDocument();
  });

  it('renders session cards', () => {
    const sessions = [
      makeSession({ id: 1, moduleTitle: 'Módulo JS', lastMessage: 'Hola!' }),
      makeSession({ id: 2, moduleId: 42, moduleTitle: 'Módulo Python', lastMessage: 'Pregunta sobre listas' }),
    ];
    render(<ChatSessionDrawer {...defaultProps} sessions={sessions} />);
    expect(screen.getByText('Módulo JS')).toBeInTheDocument();
    expect(screen.getByText('Módulo Python')).toBeInTheDocument();
  });

  it('calls onSelectSession when clicking a session', () => {
    const onSelect = vi.fn();
    const session = makeSession({ moduleTitle: 'Módulo Test' });
    render(<ChatSessionDrawer {...defaultProps} sessions={[session]} onSelectSession={onSelect} />);
    fireEvent.click(screen.getByText('Módulo Test'));
    expect(onSelect).toHaveBeenCalledWith(session);
  });

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn();
    render(<ChatSessionDrawer {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Cerrar historial'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onNewSession and onClose when clicking + Nuevo', () => {
    const onNew = vi.fn();
    const onClose = vi.fn();
    render(<ChatSessionDrawer {...defaultProps} onNewSession={onNew} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Nueva sesión de chat'));
    expect(onNew).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('filters sessions by search query', () => {
    const sessions = [
      makeSession({ id: 1, moduleTitle: 'JavaScript básico' }),
      makeSession({ id: 2, moduleTitle: 'Python avanzado' }),
    ];
    render(<ChatSessionDrawer {...defaultProps} sessions={sessions} />);
    const input = screen.getByPlaceholderText('Buscar sesión...');
    fireEvent.change(input, { target: { value: 'python' } });
    expect(screen.getByText('Python avanzado')).toBeInTheDocument();
    expect(screen.queryByText('JavaScript básico')).not.toBeInTheDocument();
  });

  it('highlights active session', () => {
    const session = makeSession({ id: 5, moduleTitle: 'Activa' });
    const { container } = render(
      <ChatSessionDrawer {...defaultProps} sessions={[session]} activeSessionId={5} />
    );
    const btn = container.querySelector('button.border-brand-600');
    expect(btn).not.toBeNull();
  });

  it('shows chat-general icon for session without moduleId', () => {
    const session = makeSession({ moduleId: null, moduleTitle: null });
    render(<ChatSessionDrawer {...defaultProps} sessions={[session]} />);
    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  it('shows folder icon for session with moduleId', () => {
    const session = makeSession({ moduleId: 3, moduleTitle: 'Módulo con icono' });
    render(<ChatSessionDrawer {...defaultProps} sessions={[session]} />);
    expect(screen.getByText('📂')).toBeInTheDocument();
  });
});
