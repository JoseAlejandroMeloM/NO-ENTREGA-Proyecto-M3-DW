import { api, post } from './client';

// Fired after any read/read-all so the bell and the page stay in sync without a shared store.
export const NOTIFICATIONS_CHANGED = 'cn:notifications-changed';
const changed = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));

export async function markRead(id: string) {
  await api<null>(`/notifications/${id}/read`, { method: 'PATCH' });
  changed();
}

export async function markAllRead() {
  await post<null>('/notifications/read-all', {});
  changed();
}
