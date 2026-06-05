import type { PaymentOption, PurchaseRequest, ViewName } from '../types';
import styles from './PurchaseRequestDetailView.module.css';

type PurchaseRequestDetailViewProps = {
  request: PurchaseRequest | undefined;
  onCancel: (requestId: string) => void;
  onContinueConfirmed: (requestId: string) => void;
  onNavigate: (view: ViewName) => void;
  onPay: (requestId: string, paymentOption: PaymentOption) => void;
};

const formatMoney = (value: number) => `S/. ${value.toLocaleString('es-PE')}`;

export default function PurchaseRequestDetailView({
  request,
  onCancel,
  onContinueConfirmed,
  onNavigate,
  onPay,
}: PurchaseRequestDetailViewProps) {
  if (!request) {
    return (
      <main className={styles.page}>
        <section className={`${styles.empty} container`}>
          <h1>Solicitud no encontrada</h1>
          <button className="primaryButton" type="button" onClick={() => onNavigate('purchaseRequests')}>
            Volver a solicitudes
          </button>
        </section>
      </main>
    );
  }

  const confirmedGroups = request.groupsByProducer.filter((group) => group.status === 'CONFIRMED');
  const rejectedGroups = request.groupsByProducer.filter((group) => group.status === 'REJECTED');
  const isReadyToPay = request.status === 'READY_TO_PAY';
  const isPartial = confirmedGroups.length > 0 && rejectedGroups.length > 0;

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>Detalle de solicitud de compra</h1>
          <p>Estado general: <strong>{request.status}</strong></p>
        </div>

        <div className={styles.summary}>
          <p><span>Total</span><strong>{formatMoney(request.total)}</strong></p>
          <p><span>Creada</span><strong>{request.createdAt}</strong></p>
          <p><span>Delivery</span><strong>{request.deliveryDays} dias</strong></p>
          <p><span>Entrega estimada</span><strong>{request.estimatedDeliveryDate ?? 'Pendiente'}</strong></p>
        </div>

        <div className={styles.groups}>
          {request.groupsByProducer.map((group) => (
            <article className={styles.groupCard} key={group.producerId}>
              <div className={styles.groupHeader}>
                <div>
                  <h2>{group.producerName}</h2>
                  <p>{group.items.length} productos incluidos</p>
                </div>
                <span className={styles.status}>{group.status}</span>
              </div>

              <div className={styles.items}>
                {group.items.map((item) => (
                  <p key={item.productId}>
                    <span>{item.title}</span>
                    <strong>x{item.quantity}</strong>
                  </p>
                ))}
              </div>

              <div className={styles.groupFacts}>
                <p><span>Listo estimado</span><strong>{group.readyDate ?? 'Pendiente'}</strong></p>
                <p><span>Observacion</span><strong>{group.observation ?? 'Sin observacion'}</strong></p>
              </div>
            </article>
          ))}
        </div>

        {isReadyToPay && (
          <div className={styles.paymentBox}>
            <h2>Tu solicitud esta lista para pago.</h2>
            <p>El pago sera retenido por la plataforma hasta la entrega conforme del producto.</p>
            <div className={styles.actions}>
              <button className="primaryButton" type="button" onClick={() => onPay(request.id, 'FULL_PAYMENT')}>
                Pagar 100%
              </button>
              <button className="accentButton" type="button" onClick={() => onPay(request.id, 'HALF_ADVANCE')}>
                Pagar adelanto 50%
              </button>
            </div>
          </div>
        )}

        {isPartial && (
          <div className={styles.paymentBox}>
            <h2>Solicitud parcialmente confirmada</h2>
            <p>Puedes continuar solo con productos confirmados, cancelar o esperar confirmacion.</p>
            <div className={styles.actions}>
              <button className="primaryButton" type="button" onClick={() => onContinueConfirmed(request.id)}>
                Continuar solo con productos confirmados
              </button>
              <button className="accentButton" type="button" onClick={() => onCancel(request.id)}>
                Cancelar solicitud
              </button>
            </div>
          </div>
        )}

        {!isReadyToPay && !isPartial && (
          <div className={styles.actions}>
            <button className="primaryButton" type="button" onClick={() => onNavigate('purchaseRequests')}>
              Volver a solicitudes
            </button>
            <button className="accentButton" type="button" onClick={() => onCancel(request.id)}>
              Cancelar solicitud
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
