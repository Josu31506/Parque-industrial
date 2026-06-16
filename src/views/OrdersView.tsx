import styles from './OrdersView.module.css';
import type { Order, ViewName } from '../types';

type OrdersViewProps = {
  orders: Order[];
  onNavigate: (view: ViewName) => void;
  onPageChange?: (page: number) => void;
  onTrackOrder: (orderId: string) => void;
  pageInfo?: { page: number; total: number; totalPages: number };
};

const formatMoney = (value: number) => `S/. ${value.toLocaleString('es-PE')}`;

export default function OrdersView({
  orders,
  onNavigate,
  onPageChange,
  onTrackOrder,
  pageInfo,
}: OrdersViewProps) {
  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>Mis pedidos</h1>
          <p>Consulta el estado de tus pedidos y revisa su seguimiento.</p>
        </div>

        {orders.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📦</div>

            <h2>Aun no tienes pedidos registrados</h2>

            <p>
              Cuando realices una compra, tus pedidos apareceran aqui para que puedas
              revisar su estado y seguimiento.
            </p>

            <button
              className="primaryButton"
              type="button"
              onClick={() => onNavigate('home')}
            >
              Explorar productos
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {orders.map((order, index) => (
              <article className={styles.card} key={order.id}>
                <div className={styles.orderInfo}>
                  <div className={styles.orderIcon}>📦</div>

                  <div>
                    <h2>Pedido {index + 1}</h2>
                    <p>Pedido realizado el {order.date}</p>
                    {order.estimatedDeliveryDate && (
                      <p>Entrega estimada: {order.estimatedDeliveryDate}</p>
                    )}
                    <p>Fondos: {order.fundsStatus ?? 'HELD'}</p>
                  </div>
                </div>

                <div className={styles.amountBox}>
                  <span>Total</span>
                  <strong>{formatMoney(order.total)}</strong>
                  {order.paidAmount !== undefined && <small>Pagado: {formatMoney(order.paidAmount)}</small>}
                </div>

                <span className={styles.statusBadge}>{order.status}</span>

                <button
                  className="primaryButton"
                  type="button"
                  onClick={() => onTrackOrder(order.id)}
                >
                  Ver seguimiento
                </button>
              </article>
            ))}
            {pageInfo && onPageChange && pageInfo.totalPages > 1 && (
              <div className={styles.pagination}>
                <button type="button" disabled={pageInfo.page <= 1} onClick={() => onPageChange(pageInfo.page - 1)}>
                  Anterior
                </button>
                <span>Pagina {pageInfo.page} de {pageInfo.totalPages}</span>
                <button type="button" disabled={pageInfo.page >= pageInfo.totalPages} onClick={() => onPageChange(pageInfo.page + 1)}>
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
