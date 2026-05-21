import styles from './OrderSuccessView.module.css';

const formatMoney = (value) => `S/. ${value.toLocaleString('es-PE')}`;

export default function OrderSuccessView({ order, onNavigate }) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.icon}>✓</span>
        <h1>¡Compra realizada con exito!</h1>
        <p>Tu pedido ha sido registrado correctamente.</p>

        {order && (
          <div className={styles.facts}>
            <p><span>Numero de pedido</span><strong>{order.id}</strong></p>
            <p><span>Fecha</span><strong>{order.date}</strong></p>
            <p><span>Total</span><strong>{formatMoney(order.total)}</strong></p>
            <p><span>Estado</span><strong>{order.status}</strong></p>
          </div>
        )}

        <div className={styles.actions}>
          <button className="primaryButton" type="button" onClick={() => onNavigate('orders')}>
            Ver mis pedidos
          </button>
          <button className="accentButton" type="button" onClick={() => onNavigate('home')}>
            Volver al inicio
          </button>
        </div>
      </section>
    </main>
  );
}
