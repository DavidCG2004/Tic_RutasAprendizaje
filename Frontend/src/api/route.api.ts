import httpClient from './httpClient';
import { normalizeEnrollment, normalizeRoute, normalizeRoutes } from './normalize';
import type {
  CompleteModulePayload,
  CompleteModuleResponse,
  EnrollResponse,
  LearningRoute,
  RawLearningRoute,
  RoutePayload,
} from '../types';

/**
 * Respuesta de los endpoints que persisten una ruta: el backend devuelve
 * `{ message, route }`, no la ruta suelta.
 */
export interface RouteMutationResponse {
  message: string;
  route: LearningRoute;
}

export const getRoutes = async (): Promise<LearningRoute[]> => {
  const response = await httpClient.get<RawLearningRoute[]>('/routes');
  return normalizeRoutes(response.data);
};

export const createRoute = async (routeData: RoutePayload): Promise<RouteMutationResponse> => {
  const response = await httpClient.post<{ message: string; route: RawLearningRoute }>(
    '/routes',
    routeData
  );
  return { ...response.data, route: normalizeRoute(response.data.route) };
};

export const deleteRoute = async (id: string): Promise<void> => {
  await httpClient.delete(`/routes/${id}`);
};

export const getRouteById = async (id: string): Promise<LearningRoute> => {
  const response = await httpClient.get<RawLearningRoute>(`/routes/${id}`);
  return normalizeRoute(response.data);
};

export const updateRoute = async (
  id: string,
  routeData: RoutePayload
): Promise<RouteMutationResponse> => {
  const response = await httpClient.put<{ message: string; route: RawLearningRoute }>(
    `/routes/${id}`,
    routeData
  );
  return { ...response.data, route: normalizeRoute(response.data.route) };
};

export const getMyRoutes = async (): Promise<LearningRoute[]> => {
  const response = await httpClient.get<RawLearningRoute[]>('/routes/my-routes');
  return normalizeRoutes(response.data);
};

export const enrollRoute = async (routeId: string): Promise<EnrollResponse> => {
  const response = await httpClient.post<EnrollResponse>(`/routes/${routeId}/enroll`);
  // `enrollment` es la fila cruda de Turso: sus ids llegan como número.
  return {
    ...response.data,
    enrollment: response.data.enrollment
      ? normalizeEnrollment(response.data.enrollment)
      : response.data.enrollment,
  };
};

export const completeModule = async (
  data: CompleteModulePayload
): Promise<CompleteModuleResponse> => {
  const response = await httpClient.post<CompleteModuleResponse>('/routes/complete-module', data);
  return response.data;
};

// ─── Evaluaciones de Módulo (RR-008) ──────────────────────────────────────────

export interface ModuleAssessmentItem {
  id: string | number;
  moduleId: string | number;
  type: string;
  content: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleAssessmentsResponse {
  module: { id: string | number; title: string; routeId: string | number };
  assessments: ModuleAssessmentItem[];
  total: number;
}

export const getModuleAssessments = async (
  moduleId: string
): Promise<ModuleAssessmentsResponse> => {
  const response = await httpClient.get<ModuleAssessmentsResponse>(
    `/routes/modules/${moduleId}/assessments`
  );
  return response.data;
};

// ─── Generación de Ruta con IA a partir de Material / Tema ───────────────────

export interface GenerateRoutePayload {
  topic: string;
  difficulty?: string;
  additionalContext?: string;
  subjectId?: string | number;
  file?: File;
}

export const generateRouteWithAI = async (
  payload: GenerateRoutePayload
): Promise<RouteMutationResponse> => {
  const formData = new FormData();
  formData.append('topic', payload.topic);
  if (payload.difficulty) formData.append('difficulty', payload.difficulty);
  if (payload.additionalContext) formData.append('additionalContext', payload.additionalContext);
  if (payload.subjectId) formData.append('subjectId', String(payload.subjectId));
  if (payload.file) formData.append('file', payload.file);

  const response = await httpClient.post<{ message: string; route: RawLearningRoute }>(
    '/routes/generate',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return { ...response.data, route: normalizeRoute(response.data.route) };
};

/** POST /routes/resources/:id/open — registra que el alumno abrió un recurso. */
export const openResource = async (resourceId: string): Promise<{ message: string; resourceId: number }> => {
  const response = await httpClient.post<{ message: string; resourceId: number }>(
    `/routes/resources/${resourceId}/open`
  );
  return response.data;
};
