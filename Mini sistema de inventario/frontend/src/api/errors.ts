import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor';
    const message = error.response.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return 'Ocurrió un error inesperado';
}