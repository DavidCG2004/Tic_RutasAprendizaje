import type { AdminUserProgress } from '../api/admin.api';
import type { User } from '../types';
import { getRoleLabel } from './uiMaps';

/**
 * Carga dinámica de jsPDF y su plugin autoTable para mantener el bundle inicial liviano.
 */
const loadPdfModules = async () => {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  return { jsPDF, autoTable };
};

const BRAND_RED: [number, number, number] = [185, 28, 28]; // #b91c1c (rojo institucional)
const TEXT_DARK: [number, number, number] = [15, 23, 42]; // #0f172a
const TEXT_MUTED: [number, number, number] = [100, 116, 139]; // #64748b
const BG_LIGHT: [number, number, number] = [248, 250, 252]; // #f8fafc
const BORDER_COLOR: [number, number, number] = [226, 232, 240]; // #e2e8f0

const formatCurrentDate = (): string => {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
};

/**
 * Dibuja el membrete institucional superior de la Escuela Politécnica Nacional / ESFOT.
 */
const drawHeader = (doc: any, title: string, subtitle?: string): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Barra de acento superior
  doc.setFillColor(...BRAND_RED);
  doc.rect(0, 0, pageWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND_RED);
  doc.text('ESCUELA POLITÉCNICA NACIONAL', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('ESFOT • Plataforma Rutas de Aprendizaje', 14, 20);

  // Fecha a la derecha
  doc.setFontSize(8);
  doc.text(`Fecha de emisión: ${formatCurrentDate()}`, pageWidth - 14, 20, { align: 'right' });

  // Línea divisoria
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, 23, pageWidth - 14, 23);

  // Título principal del reporte
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...TEXT_DARK);
  doc.text(title, 14, 32);

  let currentY = 36;
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(subtitle, 14, currentY);
    currentY += 6;
  }

  return currentY;
};

/**
 * Agrega numeración de páginas en el pie de página de cada hoja generada.
 */
const applyPagination = (doc: any) => {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.text(
      'Documento informativo generado por la Plataforma Rutas ESFOT',
      14,
      pageHeight - 7
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 7, {
      align: 'right',
    });
  }
};

/**
 * Genera y descarga el reporte PDF individual de un estudiante con sus métricas y rutas.
 */
export const exportStudentProgressPdf = async (data: AdminUserProgress): Promise<void> => {
  const { jsPDF, autoTable } = await loadPdfModules();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const user = data.user;
  const progress = data.progress;
  const routes = progress?.routes || [];
  const completedRoutes = routes.filter((r) => (r.progress ?? 0) >= 100).length;

  let y = drawHeader(doc, 'REPORTE INDIVIDUAL DE PROGRESO ACADÉMICO');

  // Tarjeta de datos del estudiante
  const boxX = 14;
  const boxWidth = pageWidth - 28;
  const boxHeight = 28;

  doc.setFillColor(...BG_LIGHT);
  doc.setDrawColor(...BORDER_COLOR);
  doc.roundedRect(boxX, y, boxWidth, boxHeight, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);

  // Columna izquierda
  doc.setFont('helvetica', 'bold');
  doc.text('Estudiante:', boxX + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(user.name, boxX + 24, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Correo:', boxX + 4, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(user.email, boxX + 24, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('ID EPN:', boxX + 4, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(user.uniqueId || 'No asignado', boxX + 24, y + 21);

  // Columna derecha
  const colRightX = boxX + boxWidth / 2 + 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Carrera:', colRightX, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(user.career || 'No completada', colRightX + 18, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Semestre:', colRightX, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(user.semester ? `${user.semester}° Semestre` : 'N/A', colRightX + 18, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Estado:', colRightX, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(user.isActive ? 'Activo' : 'Inactivo', colRightX + 18, y + 21);

  y += boxHeight + 8;

  // Grid de Métricas Principales (4 mini-cards)
  const cardWidth = (boxWidth - 9) / 4;
  const cardHeight = 18;
  const kpis = [
    { label: 'PUNTOS / NIVEL', val: `${progress.points} pts`, sub: `Nivel ${progress.level}` },
    { label: 'RACHA DE ESTUDIO', val: `${progress.streak} días`, sub: 'Constancia' },
    { label: 'RUTAS COMPLETADAS', val: `${completedRoutes} / ${routes.length}`, sub: 'Avance' },
    {
      label: 'PROMEDIO GENERAL',
      val: progress.averageScore !== null ? `${progress.averageScore}%` : '—',
      sub: 'Evaluaciones',
    },
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = boxX + idx * (cardWidth + 3);
    doc.setFillColor(...BG_LIGHT);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(kpiX, y, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(kpi.label, kpiX + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BRAND_RED);
    doc.text(kpi.val, kpiX + 3, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(kpi.sub, kpiX + 3, y + 15);
  });

  y += cardHeight + 10;

  // Título de la tabla
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Rutas de Aprendizaje Inscritas (${routes.length})`, 14, y);
  y += 3;

  // Tabla de rutas
  const tableRows = routes.map((route, index) => [
    String(index + 1),
    route.title,
    route.category || 'General',
    `${route.progress ?? 0}%`,
    (route.progress ?? 0) >= 100 ? 'Completada' : (route.progress ?? 0) > 0 ? 'En progreso' : 'Iniciada',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Ruta de Aprendizaje', 'Categoría', 'Avance', 'Estado']],
    body: tableRows.length > 0 ? tableRows : [['—', 'Sin rutas inscritas aún', '—', '0%', '—']],
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_RED,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      textColor: TEXT_DARK,
      lineColor: BORDER_COLOR,
      lineWidth: 0.2,
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: BG_LIGHT,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 32 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 26, halign: 'center' },
    },
  });

  applyPagination(doc);

  const cleanId = (user.uniqueId || user.name).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`reporte_progreso_${cleanId}.pdf`);
};

/**
 * Genera y descarga el reporte PDF general consolidado de usuarios de la plataforma (Opción 1).
 */
export const exportGeneralUsersPdf = async (users: User[]): Promise<void> => {
  const { jsPDF, autoTable } = await loadPdfModules();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const totalUsers = users.length;
  const students = users.filter((u) => u.roles?.includes('STUDENT')).length;
  const admins = users.filter((u) => u.roles?.includes('ADMIN')).length;
  const activeCount = users.filter((u) => Boolean(u.isActive)).length;
  const lockedCount = users.filter((u) => Boolean(u.isLocked)).length;

  let y = drawHeader(
    doc,
    'REPORTE GENERAL DE USUARIOS DE LA PLATAFORMA',
    `Padrón de cuentas registradas • Total de registros: ${totalUsers}`
  );

  // Resumen ejecutivo (Barra de KPIs horizontales)
  const boxX = 14;
  const boxWidth = pageWidth - 28;
  const boxHeight = 14;

  doc.setFillColor(...BG_LIGHT);
  doc.setDrawColor(...BORDER_COLOR);
  doc.roundedRect(boxX, y, boxWidth, boxHeight, 2, 2, 'FD');

  const summaryItems = [
    `Total: ${totalUsers}`,
    `Estudiantes: ${students}`,
    `Administradores: ${admins}`,
    `Activos: ${activeCount}`,
    `Bloqueados: ${lockedCount}`,
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);

  const itemWidth = boxWidth / summaryItems.length;
  summaryItems.forEach((item, idx) => {
    const itemX = boxX + idx * itemWidth + itemWidth / 2;
    doc.text(item, itemX, y + 8.5, { align: 'center' });
  });

  y += boxHeight + 6;

  // Tabla completa de usuarios
  const tableRows = users.map((user, index) => {
    const role = (user.roles || []).map(getRoleLabel).join(', ') || 'Sin rol';
    const statusText = user.isLocked ? 'Bloqueado' : user.isActive ? 'Activo' : 'Inactivo';

    return [
      String(index + 1),
      user.name,
      user.email,
      user.uniqueId || '—',
      role,
      user.career || '—',
      user.semester ? `${user.semester}°` : '—',
      statusText,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Nombre', 'Correo Institucional', 'ID EPN', 'Rol', 'Carrera', 'Sem.', 'Estado']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_RED,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      textColor: TEXT_DARK,
      lineColor: BORDER_COLOR,
      lineWidth: 0.2,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: BG_LIGHT,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 46 },
      2: { cellWidth: 50 },
      3: { cellWidth: 26 },
      4: { cellWidth: 26 },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 22, halign: 'center' },
    },
  });

  applyPagination(doc);

  const dateSlug = new Date().toISOString().slice(0, 10);
  doc.save(`reporte_general_usuarios_${dateSlug}.pdf`);
};
