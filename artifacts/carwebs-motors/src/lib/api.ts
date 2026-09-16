/** Production API origin. Override with VITE_API_BASE_URL for local backends. */
export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'https://car.bengalurutechcommunity.com'
).replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}
