import styles from './OrdersView.module.css';

const formatMoney = (value) => `S/. ${value.toLocaleString('es-PE')}`;

export default function OrdersView({ orders, onNavigate, onTrackOrder }) {
  return (
    <main className={styles.page}>
      <section className="container">
        <div className={styles.heading}>
          <h1>Mis pedidos</h1>
          <p>Consulta tus compras y revisa el seguimiento.</p>
        </div>

        {orders.length === 0 ? (
          <div className={styles.empty}>
            <p>Aun no tienes pedidos registrados.</p>
            <button className="primaryButton" type="button" onClick={() => onNavigate('home')}>
              Explorar productos
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {orders.map((order) => (
              <article className={styles.card} key={order.id}>
                <div>
                  <h2>{order.id}</h2>
                  <p>{order.date}</p>
                </div>
                <strong>{formatMoney(order.total)}</strong>
                <span>{order.status}</span>
                <button className="primaryButton" type="button" onClick={() => onTrackOrder(order.id)}>
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
