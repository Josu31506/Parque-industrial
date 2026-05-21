import styles from './OrderTrackingView.module.css';

const steps = [
  'Pedido confirmado',
  'En preparación',
  'En camino',
  'Entregado',
];

const getCompletedSteps = (status) => {
  if (status === 'Pedido confirmado') return 0;
  if (status === 'En preparación') return 1;
  if (status === 'En camino') return 2;
  if (status === 'Entregado') return 3;

  return 1;
};

export default function OrderTrackingView({ order, onNavigate }) {
  const completedStepIndex = getCompletedSteps(order?.status);

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <span className={styles.kicker}>Seguimiento</span>

          <h1>Estado de tu pedido</h1>

          <p>
            {order
              ? `Tu pedido se encuentra actualmente en estado: ${order.status}.`
              : 'No pudimos encontrar la información de este pedido.'}
          </p>
        </div>

        {order ? (
          <div className={styles.card}>
            <div className={styles.summary}>
              <div>
                <span className={styles.label}>Pedido</span>
                <strong>Pedido en proceso</strong>
              </div>

              <div>
                <span className={styles.label}>Fecha</span>
                <strong>{order.date}</strong>
              </div>

              <div>
                <span className={styles.label}>Estado actual</span>
                <strong className={styles.status}>{order.status}</strong>
              </div>
            </div>

            <div className={styles.timeline}>
              {steps.map((step, index) => {
                const isDone = index <= completedStepIndex;
                const isCurrent = index === completedStepIndex;

                return (
                  <article
                    className={`${styles.step} ${isDone ? styles.done : ''} ${
                      isCurrent ? styles.current : ''
                    }`}
                    key={step}
                  >
                    <div className={styles.marker}>
                      {isDone ? '✓' : index + 1}
                    </div>

                    <div className={styles.stepContent}>
                      <h2>{step}</h2>

                      <p>
                        {isCurrent
                          ? 'Este es el estado actual de tu pedido.'
                          : isDone
                            ? 'Etapa completada.'
                            : 'Pendiente.'}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.empty}>
            <p>Pedido no encontrado.</p>
          </div>
        )}

        <div className={styles.actions}>
          <button
            className="primaryButton"
            type="button"
            onClick={() => onNavigate('orders')}
          >
            Volver a pedidos
          </button>
        </div>
      </section>
    </main>
  );
}