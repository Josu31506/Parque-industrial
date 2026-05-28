import type { PurchaseRequest, ViewName } from '../types';
import styles from './PurchaseRequestsView.module.css';

type PurchaseRequestsViewProps = {
  requests: PurchaseRequest[];
  onNavigate: (view: ViewName) => void;
  onOpenRequest: (requestId: string) => void;
};

const formatMoney = (value: number) => `S/. ${value.toLocaleString('es-PE')}`;

export default function PurchaseRequestsView({
  requests,
  onNavigate,
  onOpenRequest,
}: PurchaseRequestsViewProps) {
  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <span className={styles.kicker}></span>
          <h1>Mis solicitudes de compra</h1>
          <p>Revisa las compras que esperan confirmacion de los productores.</p>
        </div>

        {requests.length === 0 ? (
          <div className={styles.empty}>
            <h2>Aun no tienes solicitudes de compra.</h2>
            <p>Agrega productos bajo pedido al carrito para iniciar una solicitud.</p>
            <button className="primaryButton" type="button" onClick={() => onNavigate('catalog')}>
              Explorar productos
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {requests.map((request, index) => (
              <article className={styles.card} key={request.id}>
                <div>
                  <span className={styles.code}>Solicitud SC-{String(index + 1).padStart(3, '0')}</span>
                  <h2>{request.items.length} productos solicitados</h2>
                  <p>Creada el {request.createdAt}</p>
                </div>

                <div className={styles.meta}>
                  <span>Total</span>
                  <strong>{formatMoney(request.total)}</strong>
                </div>

                <div className={styles.meta}>
                  <span>Productores</span>
                  <strong>{request.groupsByProducer.length}</strong>
                </div>

                <span className={styles.status}>{request.status}</span>

                {request.estimatedDeliveryDate && (
                  <p className={styles.delivery}>Entrega estimada: {request.estimatedDeliveryDate}</p>
                )}

                <button className="primaryButton" type="button" onClick={() => onOpenRequest(request.id)}>
                  Ver detalle
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
