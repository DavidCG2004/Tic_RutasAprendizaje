import httpClient from './httpClient';
import type { AssessmentData, AssessmentType, ChatMessageRow, ChatSession, ChatSessionDetail } from '../types';

export interface SendChatMessagePayload {
  message: string;
  moduleId?: string;
  topicId?: string;
  sessionId?: string;
  routeId?: string;
}

export interface SendChatMessageResponse {
  /** `ChatSession.id` es INTEGER en SQLite, así que llega como número. */
  sessionId: string | number;
  /** Fila de `ChatMessage`, no un string: el texto está en `.content`. */
  reply: ChatMessageRow;
}

export interface AssessmentPayload {
  moduleId: string;
  type?: AssessmentType;
}

/** El backend devuelve el JSON crudo generado por Gemini. */
export type AssessmentResponse = AssessmentData;

const sendMessage = async (
  payload: SendChatMessagePayload
): Promise<SendChatMessageResponse> => {
  const response = await httpClient.post<SendChatMessageResponse>('/chat/send', payload);
  return response.data;
};

/** `POST /chat/send` con el contexto GraphRAG (topicId) incluido. */
export const sendChatMessage = sendMessage;

const getAssessment = async (
  payload: AssessmentPayload
): Promise<AssessmentResponse> => {
  const response = await httpClient.post<AssessmentResponse>('/chat/assessment', payload);
  return response.data;
};

export const generateAssessment = getAssessment;

export interface GetSessionsParams {
  moduleId?: string | number;
  limit?: number;
  offset?: number;
}

export interface GetSessionsResponse {
  sessions: ChatSession[];
  total: number;
  limit: number;
  offset: number;
}

/** GET /api/chat/sessions */
export const getChatSessions = async (
  params: GetSessionsParams = {}
): Promise<GetSessionsResponse> => {
  const response = await httpClient.get<GetSessionsResponse>('/chat/sessions', { params });
  return response.data;
};

/** GET /api/chat/sessions/:id/messages */
export const getChatSessionMessages = async (
  sessionId: number
): Promise<ChatSessionDetail> => {
  const response = await httpClient.get<ChatSessionDetail>(
    `/chat/sessions/${sessionId}/messages`
  );
  return response.data;
};