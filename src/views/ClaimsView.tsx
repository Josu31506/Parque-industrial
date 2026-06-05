import type { Claim, Order, Role } from '../types';
import { getOrderDisplayName } from '../utils/displayNames';
import styles from './ClaimsView.module.css';

type ClaimsViewProps = {
  claims: Claim[];
  orders: Order[];
  role: Role;
  onResolveClaim: (claimId: string, status: 'RESOLVED' | 'REJECTED') => void;
};

export default function ClaimsView({
  claims,
  orders,
  role,
  onResolveClaim,
}: ClaimsViewProps) {
  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>{role === 'admin' ? 'Reclamos abiertos' : 'Mis reclamos'}</h1>
          <p>El pago permanece retenido cuando existe un reclamo activo.</p>
        </div>

        {claims.length === 0 ? (
          <div className={styles.empty}>No hay reclamos registrados.</div>
        ) : (
          <div className={styles.list}>
            {claims.map((claim) => {
              const order = orders.find((item) => item.id === claim.orderId);

              return (
                <article className={styles.card} key={claim.id}>
                  <div>
                    <h2>{claim.reason}</h2>
                    <p>{getOrderDisplayName(order)} · {claim.createdAt}</p>
                  </div>
                  <span className={styles.status}>{claim.status}</span>
                  <p className={styles.description}>{claim.description}</p>
                  {order && <p className={styles.notice}>Fondos del pedido: {order.fundsStatus ?? 'HELD'}</p>}

                  {role === 'admin' && claim.status !== 'RESOLVED' && claim.status !== 'REJECTED' && (
                    <div className={styles.actions}>
                      <button className="primaryButton" type="button" onClick={() => onResolveClaim(claim.id, 'RESOLVED')}>
                        Resolver
                      </button>
                      <button className="accentButton" type="button" onClick={() => onResolveClaim(claim.id, 'REJECTED')}>
                        Rechazar
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
