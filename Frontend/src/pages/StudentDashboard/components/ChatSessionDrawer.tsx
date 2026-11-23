import { useState } from 'react';
import type { ChatSession } from '../../../types';

interface ChatSessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  loading: boolean;
  error: string | null;
  activeSessionId: number | null;
  onSelectSession: (session: ChatSession) => void;
  onNewSession: () => void;
}

const SkeletonCard = () => (
  <div className="p-3 mx-2 rounded-xl animate-pulse">
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-surface-200 dark:bg-surface-700 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-full" />
        <div className="h-2.5 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
      </div>
    </div>
  </div>
);

const ChatSessionDrawer = ({
  isOpen,
  onClose,
  sessions,
  loading,
  error,
  activeSessionId,
  onSelectSession,
  onNewSession,
}: ChatSessionDrawerProps) => {
  const [query, setQuery] = useState('');

  const filtered = sessions.filter((s) =>
    (s.moduleTitle ?? 'Chat general').toLowerCase().includes(query.toLowerCase()) ||
    (s.lastMessage ?? '').toLowerCase().includes(query.toLowerCase())
  );

  const formatDate = (dateStr: string | null, fallback: string): string => {
    if (!dateStr) return fallback;
    return new Date(dateStr).toLocaleDateString('es-EC');
  };

  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col w-full sm:w-72
        bg-surface-50 dark:bg-surface-950
        border-r border-surface-200 dark:border-surface-800
        transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      aria-label="Historial de sesiones de chat"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 p-4 flex items-center justify-between text-white shrink-0">
        <button
          onClick={onClose}
          aria-label="Cerrar historial"
          className="text-white/80 hover:text-white hover:bg-white/15 p-1.5 rounded-lg transition-colors focus:outline-hidden"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-semibold text-sm">Historial</span>
        <button
          onClick={() => { onNewSession(); onClose(); }}
          aria-label="Nueva sesión de chat"
          className="text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors focus:outline-hidden"
        >
          + Nuevo
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-surface-200 dark:border-surface-800 shrink-0">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar sesión..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-100 dark:bg-surface-800
              border border-surface-200 dark:border-surface-700
              text-surface-900 dark:text-surface-100
              placeholder:text-surface-400
              focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
              transition-all"
          />
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading && error && (
          <p className="text-red-500 text-xs text-center px-4 py-6">{error}</p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-surface-400 text-xs text-center px-4 py-10">
            No tenés conversaciones guardadas aún.
          </p>
        )}

        {!loading && !error && filtered.map((session) => {
          const isActive = session.id === activeSessionId;
          const icon = session.moduleId === null ? '💬' : '📂';
          const title = session.moduleTitle ?? 'Chat general';
          const preview = session.lastMessage ?? 'Sin mensajes aún';
          const dateStr = formatDate(session.lastMessageAt ?? session.createdAt, '');
          const meta = `${dateStr}${dateStr ? ' · ' : ''}${session.messageCount} msgs`;

          return (
            <button
              key={session.id}
              onClick={() => onSelectSession(session)}
              className={`w-full text-left px-3 py-2.5 mx-0 flex items-start gap-2.5 transition-colors
                ${isActive
                  ? 'border-l-4 border-brand-600 bg-brand-50 dark:bg-brand-500/10'
                  : 'border-l-4 border-transparent hover:bg-surface-100 dark:hover:bg-surface-800'
                }`}
            >
              <span className="text-base shrink-0 mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-surface-800 dark:text-surface-200 truncate">
                  {title}
                </p>
                <p className="text-[11px] text-surface-500 dark:text-surface-400 line-clamp-2 mt-0.5 leading-snug">
                  {preview}
                </p>
                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">
                  {meta}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChatSessionDrawer;
