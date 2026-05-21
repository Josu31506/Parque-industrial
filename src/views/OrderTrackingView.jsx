import styles from './OrderTrackingView.module.css';

const steps = ['Pedido confirmado', 'En preparacion', 'En camino', 'Entregado'];

export default function OrderTrackingView({ order, onNavigate }) {
  return (
    <main className={styles.page}>
      <section className="container">
        <div className={styles.heading}>
          <h1>Seguimiento del pedido</h1>
          <p>{order ? `${order.id} · ${order.status}` : 'Pedido no encontrado'}</p>
        </div>

        <div className={styles.timeline}>
          {steps.map((step, index) => (
            <article className={`${styles.step} ${index <= 1 ? styles.done : ''}`} key={step}>
              <span>{index + 1}</span>
              <h2>{step}</h2>
            </article>
          ))}
        </div>

        <button className="primaryButton" type="button" onClick={() => onNavigate('orders')}>
          Volver a pedidos
        </button>
      </section>
    </main>
  );
}
