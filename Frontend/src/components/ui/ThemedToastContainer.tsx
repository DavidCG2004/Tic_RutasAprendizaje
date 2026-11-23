import { ToastContainer } from 'react-toastify';
import { useTheme } from '@/hooks/useTheme';

/**
 * Contenedor corporativo de notificaciones (React-Toastify).
 *
 * Sincronizado reactivamente con el tema activo (claro/oscuro),
 * duración estándar de 5 segundos para lectura óptima del usuario,
 * pausa al posar el cursor y límite de apilamiento para evitar sobrecarga visual.
 */
const ThemedToastContainer = () => {
  const { theme } = useTheme();

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme === 'dark' ? 'dark' : 'light'}
      limit={4}
      aria-live="polite"
    />
  );
};

export default ThemedToastContainer;
