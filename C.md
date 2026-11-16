Fase 1 — bajo coste, alto impacto (1–2 días)
- Mover la navegación de pestañas a la URL: /dashboard/:tab, /admin/:tab. Usa useParams en lugar de useState<StudentTab>. Arregla deep-linking, back-button y refresh.
- Unificar imports a @/ y usar @/api (el barrel ya está hecho).
- Eliminar el fallback a localStorage en httpClient.ts y en persistUserPatch, o documentarlo como decisión.
Fase 2 — el cambio estructural que más valor aporta (3–5 días)
- Extraer custom hooks de feature (useStudentDashboard, useRouteDetails, useChatSession) que devuelvan { data, loading, error, refetch }. Los contenedores bajan de 435 líneas a ~80 y el fetching deja de estar duplicado.
- Alternativa superior: introducir TanStack Query y borrar los useEffect de carga. Te da caché, deduplicación, refetch, estados de error y menos código.
- Sustituir prop drilling por contextos de feature (RouteDetailContext) o por composición de children.