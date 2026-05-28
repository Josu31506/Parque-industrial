import type { Notification, Role } from '../types';
import styles from './NotificationsView.module.css';

type NotificationsViewProps = {
  notifications: Notification[];
  role: Role;
  onOpenNotification: (notification: Notification) => void;
  onMarkAllRead: () => void;
};

const roleLabels: Record<Role, string> = {
  customer: 'cliente',
  seller: 'productor',
  admin: 'admin/asesor',
};

export default function NotificationsView({
  notifications,
  role,
  onOpenNotification,
  onMarkAllRead,
}: NotificationsViewProps) {
  const visibleNotifications = notifications.filter((notification) => notification.role === role);

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <span className={styles.kicker}></span>
          <h1>Notificaciones de {roleLabels[role]}</h1>
          <p>Eventos simulados del flujo de compra, venta y reclamos.</p>
        </div>

        <div className={styles.actions}>
          <button className="primaryButton" type="button" onClick={onMarkAllRead}>
            Marcar como leidas
          </button>
        </div>

        {visibleNotifications.length === 0 ? (
          <div className={styles.empty}>No tienes notificaciones por ahora.</div>
        ) : (
          <div className={styles.list}>
            {visibleNotifications.map((notification) => (
              <article className={`${styles.card} ${notification.read ? styles.read : ''}`} key={notification.id}>
                <div>
                  <h2>{notification.title}</h2>
                  <p>{notification.message}</p>
                  <span>{notification.createdAt}</span>
                </div>
                {notification.targetView && (
                  <button className="primaryButton" type="button" onClick={() => onOpenNotification(notification)}>
                    Abrir
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
