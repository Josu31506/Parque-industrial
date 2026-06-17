import type { FormEvent } from 'react';
import { useState } from 'react';
import type { Order, OrderStatus, Sale, ViewName } from '../types';
import { getOrderDisplayName } from '../utils/displayNames';
import styles from './OrderTrackingView.module.css';

type OrderTrackingViewProps = {
  order: Order | undefined;
  sales: Sale[];
  onConfirmReceived: (orderId: string) => void;
  onCreateClaim: (orderId: string, reason: string, description: string) => void;
  onNavigate: (view: ViewName) => void;
};

const steps: OrderStatus[] = [
  'Pedido confirmado',
  'En preparación',
  'En camino',
  'Entregado',
];

const getCompletedSteps = (status: OrderStatus | undefined) => {
  if (status === 'Pedido confirmado') return 0;
  if (status === 'En preparación') return 1;
  if (status === 'En camino') return 2;
  if (status === 'Entregado') return 3;

  return 1;
};

const producerStatusLabel = (status: Sale['status']) => {
  if (status === 'NEW_SALE') return 'Pendiente';
  if (status === 'IN_PREPARATION') return 'En preparacion';
  if (status === 'READY_FOR_DISPATCH') return 'Listo para despacho';
  if (status === 'DISPATCHED') return 'Despachado';
  if (status === 'DELIVERED') return 'Entregado';
  return 'En preparacion';
};

export default function OrderTrackingView({
  order,
  sales,
  onConfirmReceived,
  onCreateClaim,
  onNavigate,
}: OrderTrackingViewProps) {
  const [showClaimForm, setShowClaimForm] = useState(false);
  const completedStepIndex = getCompletedSteps(order?.status);
  const orderSales = order ? sales.filter((sale) => sale.orderId === order.id) : [];
  const readyProducers = orderSales.filter((sale) => sale.status === 'READY_FOR_DISPATCH' || sale.status === 'DISPATCHED' || sale.status === 'DELIVERED').length;
  const canConfirmReceived = order?.apiStatus === 'DISPATCHED';
  const isInClaim = order?.apiStatus === 'IN_CLAIM' || order?.fundsStatus === 'HELD_BY_CLAIM';
  const claimDeadline = order?.claimDeadlineAt ? new Date(order.claimDeadlineAt) : null;
  const canReportProblem = Boolean(
    order
    && order.apiStatus === 'DELIVERED'
    && order.fundsStatus !== 'RELEASED'
    && order.fundsStatus !== 'HELD_BY_CLAIM'
    && (!claimDeadline || new Date() <= claimDeadline),
  );
  const isClaimDeadlineExpired = Boolean(
    order
    && order.apiStatus === 'DELIVERED'
    && claimDeadline
    && new Date() > claimDeadline,
  );

  const handleClaimSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order) return;

    const formData = new FormData(event.currentTarget);
    const reason = String(formData.get('reason') ?? 'Otro');
    const description = String(formData.get('description') ?? '');
    onCreateClaim(order.id, reason, description);
    setShowClaimForm(false);
    event.currentTarget.reset();
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>Estado de tu pedido</h1>

          <p>
            {order
              ? `Tu pedido se encuentra actualmente en estado: ${order.status}.`
              : 'No pudimos encontrar la informacion de este pedido.'}
          </p>
        </div>

        {order ? (
          <>
            <div className={styles.card}>
              <div className={styles.summary}>
                <div>
                  <span className={styles.label}>Pedido</span>
                  <strong>{getOrderDisplayName(order)}</strong>
                </div>

                <div>
                  <span className={styles.label}>Entrega estimada</span>
                  <strong>{order.estimatedDeliveryDate ?? 'Pendiente'}</strong>
                </div>

                <div>
                  <span className={styles.label}>Productores listos</span>
                  <strong>{readyProducers} de {orderSales.length || order.producerGroups?.length || 0}</strong>
                </div>

                <div>
                  <span className={styles.label}>Fondos</span>
                  <strong className={styles.status}>{order.fundsStatus ?? 'HELD'}</strong>
                </div>
              </div>

              <div className={styles.timeline}>
                {isInClaim && (
                  <p className={styles.claimNotice}>Este pedido tiene un reclamo activo. Los fondos permaneceran retenidos hasta resolverlo.</p>
                )}
                {isClaimDeadlineExpired && (
                  <p className={styles.claimNotice}>El plazo para reportar problemas de este pedido vencio.</p>
                )}
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

            <div className={styles.producerGrid}>
              {(orderSales.length > 0 ? orderSales : order.producerGroups ?? []).map((group) => (
                <article className={styles.producerCard} key={group.producerId}>
                  <div className={styles.producerHeader}>
                    <h2>{group.producerName}</h2>
                    <span>{'status' in group ? producerStatusLabel(group.status) : 'En preparacion'}</span>
                  </div>
                  <div className={styles.productList}>
                    {group.items.map((item) => (
                      <p key={item.productId}><span>{item.title}</span><strong>x{item.quantity}</strong></p>
                    ))}
                  </div>
                  <p><strong>Fecha comprometida:</strong> {group.readyDate ?? 'Pendiente'}</p>
                  <p><strong>Observacion:</strong> {group.observation ?? 'Sin observacion'}</p>
                </article>
              ))}
            </div>

            {showClaimForm && (
              <form className={styles.claimForm} onSubmit={handleClaimSubmit}>
                <h2>Reportar problema</h2>
                <select name="reason" required>
                  <option value="Producto danado">Producto dañado</option>
                  <option value="Producto no corresponde">Producto no corresponde</option>
                  <option value="Medidas incorrectas">Medidas incorrectas</option>
                  <option value="Color/acabado incorrecto">Color/acabado incorrecto</option>
                  <option value="No llego el producto">No llego el producto</option>
                  <option value="Otro">Otro</option>
                </select>
                <textarea name="description" placeholder="Describe brevemente el problema" required />
                <button className="primaryButton" type="submit">Registrar reclamo</button>
              </form>
            )}
          </>
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
          {order && (
            <>
              {canConfirmReceived && (
                <button className="primaryButton" type="button" onClick={() => onConfirmReceived(order.id)}>
                  Confirmar recepcion
                </button>
              )}
              {canReportProblem && (
                <button className="accentButton" type="button" onClick={() => setShowClaimForm((current) => !current)}>
                  Reportar problema
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
