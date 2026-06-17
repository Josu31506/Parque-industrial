import styles from './OrderSuccessView.module.css';
import type { Order, ViewName } from '../types';
import { formatOrderNumber } from '../utils/displayNames';

type OrderSuccessViewProps = {
  order: Order | undefined;
  onNavigate: (view: ViewName) => void;
};

const formatMoney = (value: number) => `S/. ${value.toLocaleString('es-PE')}`;

export default function OrderSuccessView({
  order,
  onNavigate,
}: OrderSuccessViewProps) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.icon}>✓</span>
        <h1>¡Compra realizada con exito!</h1>
        <p>Tu pedido ha sido registrado correctamente.</p>

        {order && (
          <div className={styles.facts}>
            <p>
              <span>Pedido</span>
              <strong>{formatOrderNumber(order.orderNumber, order.id)}</strong>
            </p>
            <p>
              <span>Fecha</span>
              <strong>{order.date}</strong>
            </p>
            <p>
              <span>Total</span>
              <strong>{formatMoney(order.total)}</strong>
            </p>
            <p>
              <span>Estado</span>
              <strong>{order.status}</strong>
            </p>
            {order.paidAmount !== undefined && (
              <p>
                <span>Monto pagado</span>
                <strong>{formatMoney(order.paidAmount)}</strong>
              </p>
            )}
            {order.remainingAmount !== undefined && order.remainingAmount > 0 && (
              <p>
                <span>Saldo pendiente</span>
                <strong>{formatMoney(order.remainingAmount)}</strong>
              </p>
            )}
            {order.fundsStatus && (
              <p>
                <span>Fondos</span>
                <strong>{order.fundsStatus}</strong>
              </p>
            )}
          </div>
        )}

        <p>
          El pago sera retenido por la plataforma hasta la entrega conforme del producto.
        </p>

        <div className={styles.actions}>
          <button
            className="primaryButton"
            type="button"
            onClick={() => onNavigate('orders')}
          >
            Ver mis pedidos
          </button>
          <button
            className="accentButton"
            type="button"
            onClick={() => onNavigate('home')}
          >
            Volver al inicio
          </button>
        </div>
      </section>
    </main>
  );
}
