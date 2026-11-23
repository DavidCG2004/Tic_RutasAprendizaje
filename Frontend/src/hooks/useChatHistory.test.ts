import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatHistory } from './useChatHistory';
import type { ChatHistoryMessage } from '../types';

vi.mock('../api/chat.api', () => ({
  getChatSessions: vi.fn(),
  getChatSessionMessages: vi.fn(),
}));

import { getChatSessions, getChatSessionMessages } from '../api/chat.api';
const mockGetSessions = vi.mocked(getChatSessions);
const mockGetMessages = vi.mocked(getChatSessionMessages);

const mockSession = {
  id: 1,
  moduleId: null,
  title: 'Test session',
  topic: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  moduleTitle: null,
  messageCount: 3,
  lastMessage: 'Hola',
  lastMessageAt: '2024-01-01T01:00:00Z',
};

const mockMessage: ChatHistoryMessage = {
  id: 10,
  sender: 'AI',
  content: 'Hola, soy el tutor.',
  fileUrl: null,
  isChallenge: 0,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('useChatHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with empty state', () => {
    const { result } = renderHook(() => useChatHistory());
    expect(result.current.sessions).toEqual([]);
    expect(result.current.loadingSessions).toBe(false);
    expect(result.current.loadingMessages).toBe(false);
    expect(result.current.errorSessions).toBeNull();
  });

  it('fetchSessions populates sessions on success', async () => {
    mockGetSessions.mockResolvedValueOnce({
      sessions: [mockSession],
      total: 1,
      limit: 30,
      offset: 0,
    });

    const { result } = renderHook(() => useChatHistory());

    await act(async () => {
      await result.current.fetchSessions();
    });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].id).toBe(1);
    expect(result.current.loadingSessions).toBe(false);
  });

  it('fetchSessions sets error on failure', async () => {
    mockGetSessions.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useChatHistory());

    await act(async () => {
      await result.current.fetchSessions();
    });

    expect(result.current.errorSessions).toBeTruthy();
    expect(result.current.sessions).toEqual([]);
  });

  it('fetchMessages returns messages on success', async () => {
    mockGetMessages.mockResolvedValueOnce({
      session: { id: 1, moduleId: null, title: null, topic: null },
      messages: [mockMessage],
    });

    const { result } = renderHook(() => useChatHistory());

    let messages: ChatHistoryMessage[] = [];
    await act(async () => {
      messages = await result.current.fetchMessages(1);
    });

    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Hola, soy el tutor.');
    expect(result.current.loadingMessages).toBe(false);
  });

  it('fetchMessages returns empty array on failure', async () => {
    mockGetMessages.mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useChatHistory());

    let messages: ChatHistoryMessage[] = [];
    await act(async () => {
      messages = await result.current.fetchMessages(999);
    });

    expect(messages).toEqual([]);
  });

  it('clearError resets errorSessions', async () => {
    mockGetSessions.mockRejectedValueOnce(new Error('err'));

    const { result } = renderHook(() => useChatHistory());
    await act(async () => { await result.current.fetchSessions(); });
    expect(result.current.errorSessions).toBeTruthy();

    act(() => { result.current.clearError(); });
    expect(result.current.errorSessions).toBeNull();
  });
});
