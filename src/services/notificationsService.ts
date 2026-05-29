import type { ApiNotification, Notification, Role, ViewName } from '../types';
import { getRequest, patchRequest } from './api';

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('es-PE');
};

const targetTypeToView = (targetType?: string | null): ViewName | undefined => {
  if (targetType === 'ORDER') return 'orders';
  if (targetType === 'PURCHASE_REQUEST') return 'purchaseRequests';
  if (targetType === 'SALE') return 'sellerDashboard';
  if (targetType === 'CLAIM') return 'claims';
  return undefined;
};

const mapApiNotificationToNotification = (
  notification: ApiNotification,
  role: Role,
): Notification => ({
  id: notification.id,
  role,
  userId: notification.userId,
  title: notification.title,
  message: notification.message,
  createdAt: formatDate(notification.createdAt),
  read: notification.read,
  targetView: targetTypeToView(notification.targetType),
});

export async function getNotifications(role: Role) {
  const response = await getRequest<ApiNotification[]>('/notifications');
  return response.map((notification) => mapApiNotificationToNotification(notification, role));
}

export function markNotificationAsRead(id: string) {
  return patchRequest<ApiNotification>(`/notifications/${id}/read`);
}

export function markAllNotificationsAsRead() {
  return patchRequest('/notifications/read-all');
}
