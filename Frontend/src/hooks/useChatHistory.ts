import { useState, useCallback } from 'react';
import { getChatSessions, getChatSessionMessages } from '../api/chat.api';
import { getApiErrorMessage } from '../api/errors';
import type { ChatSession, ChatHistoryMessage } from '../types';

export interface UseChatHistoryReturn {
  sessions: ChatSession[];
  loadingSessions: boolean;
  loadingMessages: boolean;
  errorSessions: string | null;
  fetchSessions: (moduleId?: string | number) => Promise<void>;
  fetchMessages: (sessionId: number) => Promise<ChatHistoryMessage[]>;
  clearError: () => void;
}

export const useChatHistory = (): UseChatHistoryReturn => {
  const [sessions, setSessions]               = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorSessions, setErrorSessions]     = useState<string | null>(null);

  const fetchSessions = useCallback(async (moduleId?: string | number) => {
    setLoadingSessions(true);
    setErrorSessions(null);
    try {
      const data = await getChatSessions({ moduleId, limit: 30 });
      setSessions(data.sessions);
    } catch (err) {
      setErrorSessions(getApiErrorMessage(err, 'No se pudieron cargar las sesiones.'));
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const fetchMessages = useCallback(async (sessionId: number): Promise<ChatHistoryMessage[]> => {
    setLoadingMessages(true);
    try {
      const data = await getChatSessionMessages(sessionId);
      return data.messages;
    } catch (err) {
      console.error(getApiErrorMessage(err, 'No se pudieron cargar los mensajes.'));
      return [];
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const clearError = useCallback(() => setErrorSessions(null), []);

  return { sessions, loadingSessions, loadingMessages, errorSessions, fetchSessions, fetchMessages, clearError };
};
