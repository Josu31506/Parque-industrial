import styles from './OrdersView.module.css';

const formatMoney = (value) => `S/. ${value.toLocaleString('es-PE')}`;

export default function OrdersView({ orders, onNavigate, onTrackOrder }) {
  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <span className={styles.kicker}>Pedidos</span>
          <h1>Mis pedidos</h1>
          <p>Consulta el estado de tus pedidos y revisa su seguimiento.</p>
        </div>

        {orders.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📦</div>

            <h2>Aún no tienes pedidos registrados</h2>

            <p>
              Cuando realices una compra, tus pedidos aparecerán aquí para que puedas
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
                  </div>
                </div>

                <div className={styles.amountBox}>
                  <span>Total</span>
                  <strong>{formatMoney(order.total)}</strong>
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
          </div>
        )}
      </section>
    </main>
  );
}