import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Chatbot from './Chatbot';

// Mock dependencies
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../../api/chat.api', () => ({
  sendChatMessage: vi.fn(),
  getChatSessions: vi.fn().mockResolvedValue({ sessions: [], total: 0, limit: 30, offset: 0 }),
  getChatSessionMessages: vi.fn().mockResolvedValue({ session: {}, messages: [] }),
}));

vi.mock('../../../api/graph.api', () => ({
  getModuleTopics: vi.fn().mockResolvedValue([]),
  getTopicGraphContext: vi.fn().mockResolvedValue(null),
}));

const mockFetchSessions = vi.fn();
const mockFetchMessages = vi.fn().mockResolvedValue([
  { id: 1, sender: 'STUDENT', content: 'Pregunta rehidratada', fileUrl: null, isChallenge: 0, createdAt: '' },
  { id: 2, sender: 'AI', content: 'Respuesta del tutor', fileUrl: null, isChallenge: 0, createdAt: '' },
]);
const mockClearError = vi.fn();

const mockHistoryReturn = {
  sessions: [
    {
      id: 101,
      moduleId: null,
      title: 'Sesión guardada',
      topic: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      moduleTitle: 'Módulo Introductorio',
      messageCount: 2,
      lastMessage: 'Hola tutor',
      lastMessageAt: '2024-01-01T00:00:00Z',
    },
  ],
  loadingSessions: false,
  loadingMessages: false,
  errorSessions: null,
  fetchSessions: mockFetchSessions,
  fetchMessages: mockFetchMessages,
  clearError: mockClearError,
};

vi.mock('../../../hooks/useChatHistory', () => ({
  useChatHistory: () => mockHistoryReturn,
}));

describe('Chatbot component with persistence drawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders history button in header and opens drawer when clicked', async () => {
    render(<Chatbot showChat={true} onClose={vi.fn()} />);

    const historyBtn = screen.getByLabelText('Ver historial de sesiones');
    expect(historyBtn).toBeInTheDocument();

    // El drawer arranca cerrado (-translate-x-full)
    const drawer = screen.getByLabelText('Historial de sesiones de chat');
    expect(drawer.className).toContain('-translate-x-full');

    fireEvent.click(historyBtn);

    // Ahora se abre (translate-x-0)
    expect(drawer.className).toContain('translate-x-0');
    expect(screen.getByText('Módulo Introductorio')).toBeInTheDocument();
  });

  it('rehydrates conversation messages when selecting a session from drawer', async () => {
    render(<Chatbot showChat={true} onClose={vi.fn()} />);

    // Abrir drawer
    fireEvent.click(screen.getByLabelText('Ver historial de sesiones'));

    // Click en la sesión
    fireEvent.click(screen.getByText('Módulo Introductorio'));

    await waitFor(() => {
      expect(screen.getByText('Pregunta rehidratada')).toBeInTheDocument();
      expect(screen.getByText('Respuesta del tutor')).toBeInTheDocument();
    });
  });

  it('resets messages when clicking + Nuevo in drawer', async () => {
    render(<Chatbot showChat={true} onClose={vi.fn()} />);

    // Abrir drawer y seleccionar sesión
    fireEvent.click(screen.getByLabelText('Ver historial de sesiones'));
    fireEvent.click(screen.getByText('Módulo Introductorio'));

    await waitFor(() => {
      expect(screen.getByText('Pregunta rehidratada')).toBeInTheDocument();
    });

    // Abrir de nuevo y dar click a + Nuevo
    fireEvent.click(screen.getByLabelText('Ver historial de sesiones'));
    fireEvent.click(screen.getByLabelText('Nueva sesión de chat'));

    expect(screen.queryByText('Pregunta rehidratada')).not.toBeInTheDocument();
  });

  it('renders new incoming AI messages and allows assigning them as challenge once typed', async () => {
    const { sendChatMessage } = await import('../../../api/chat.api');
    vi.mocked(sendChatMessage).mockResolvedValueOnce({
      success: true,
      sessionId: 101,
      reply: {
        id: 99,
        sender: 'AI',
        content: 'Aquí tienes un reto: escribe una función recursiva.',
        fileUrl: null,
        isChallenge: 1,
        createdAt: '',
      },
    } as any);

    const onAsignarNuevoReto = vi.fn();
    render(<Chatbot showChat={true} onClose={vi.fn()} onAsignarNuevoReto={onAsignarNuevoReto} onCodeEvaluated={vi.fn()} />);

    // Type user message
    const input = screen.getByPlaceholderText('Escribe tu consulta o pide un reto...');
    fireEvent.change(input, { target: { value: 'Dame un reto' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Dame un reto')).toBeInTheDocument();
    });

    // El typewriter arranca animando y ofrece el título de skip en el contenedor
    await waitFor(() => {
      expect(screen.getByTitle('Click para mostrar todo el texto')).toBeInTheDocument();
    });

    // Hacer click en la burbuja salta la animación al instante
    fireEvent.click(screen.getByTitle('Click para mostrar todo el texto'));

    expect(screen.getByText('Aquí tienes un reto: escribe una función recursiva.')).toBeInTheDocument();

    const assignBtn = await screen.findByRole('button', { name: /Asignar como reto/i });
    expect(assignBtn).toBeInTheDocument();

    fireEvent.click(assignBtn);
    expect(onAsignarNuevoReto).toHaveBeenCalledWith('Aquí tienes un reto: escribe una función recursiva.');
  });
});
