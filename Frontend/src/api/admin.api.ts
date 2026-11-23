import httpClient from './httpClient';
import type { User } from '../types';

/**
 * Roles que el backend reconoce realmente (ver `checkRoles` en `src/routes`).
 * `RoleManager` muestra además una tarjeta MODERATOR, pero ningún endpoint la
 * usa, así que no forma parte de este tipo.
 */
export type AdminRoleName = 'STUDENT' | 'ADMIN';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  roleName: AdminRoleName;
  career: string;
  semester: number;
  uniqueId: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  roleName?: AdminRoleName;
  career?: string;
  semester?: number;
  uniqueId?: string;
}

/** `POST|PUT /admin/users[/:id]` → `{ message, user }` */
export interface AdminUserMutationResponse {
  message: string;
  user?: Partial<User>;
}

/** `PATCH /admin/users/:id/status` y `POST /admin/unlock/:id` → `{ message }` */
export interface AdminActionResponse {
  message: string;
}

/**
 * `GET /admin/users` devuelve los ids como números (SQLite INTEGER PK) y los
 * booleanos como INTEGER (0 o 1). Se normalizan en la frontera para que el resto
 * de la app consuma tipos limpios según el contrato de User.
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await httpClient.get<User[]>('/admin/users');
  return response.data.map((user) => ({
    ...user,
    id: String(user.id),
    isActive: Boolean(user.isActive),
    isLocked: Boolean(user.isLocked),
  }));
};

export const createUser = async (userData: CreateUserPayload): Promise<AdminUserMutationResponse> => {
  const response = await httpClient.post<AdminUserMutationResponse>('/admin/users', userData);
  return response.data;
};

export const updateUser = async (
  id: string,
  userData: UpdateUserPayload
): Promise<AdminUserMutationResponse> => {
  const response = await httpClient.put<AdminUserMutationResponse>(`/admin/users/${id}`, userData);
  return response.data;
};

export const toggleUserStatus = async (id: string): Promise<AdminActionResponse> => {
  const response = await httpClient.patch<AdminActionResponse>(`/admin/users/${id}/status`);
  return response.data;
};

export const unlockUser = async (id: string): Promise<AdminActionResponse> => {
  const response = await httpClient.post<AdminActionResponse>(`/admin/unlock/${id}`);
  return response.data;
};

export interface AdminUserProgress {
  user: User & { career?: string | null; semester?: number | null; uniqueId?: string | null };
  progress: {
    points: number;
    level: number;
    streak: number;
    modulesCompleted: number;
    modulesPassed: number;
    averageScore: number | null;
    routesEnrolled: number;
    averageProgress: number;
    routes: Array<{ id: string; title: string; category?: string | null; progress: number; enrolledAt: string }>;
  };
}

/** `:id` acepta el id numérico o el ID único EPN de 9 dígitos (RR-005). */
export const getUserProgress = async (id: string): Promise<AdminUserProgress> => {
  const response = await httpClient.get<AdminUserProgress>(`/admin/users/${id}/progress`);
  return response.data;
};

/**
 * Elimina una ruta inscrita específica de un estudiante (Admin testing).
 * DELETE /admin/users/:userId/enrollments/:routeId
 */
export const deleteStudentEnrollment = async (
  userId: string,
  routeId: string
): Promise<AdminActionResponse> => {
  const response = await httpClient.delete<AdminActionResponse>(
    `/admin/users/${userId}/enrollments/${routeId}`
  );
  return response.data;
};

/**
 * Elimina todas las rutas inscritas de un estudiante (Admin testing reset).
 * DELETE /admin/users/:userId/enrollments
 */
export const resetStudentEnrollments = async (
  userId: string
): Promise<AdminActionResponse> => {
  const response = await httpClient.delete<AdminActionResponse>(
    `/admin/users/${userId}/enrollments`
  );
  return response.data;
};