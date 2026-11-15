/** `Notification` schema in docs/spec/openapi.yaml. */
export type NotificationType = 'low_stock' | 'order_created' | 'order_status' | 'message' | 'rating';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  page: number;
  limit: number;
  total: number;
  unreadCount: number;
  data: AppNotification[];
}
