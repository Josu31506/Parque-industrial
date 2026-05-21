import { products } from '../data/catalog.js';
import styles from './CartView.module.css';

const SHIPPING_COST = 10;

const getImageStyle = (image) => {
  if (!image) return {};

  return image.includes('gradient')
    ? { background: image }
    : { backgroundImage: `url(${image})` };
};

const formatMoney = (value) => `S/. ${value.toLocaleString('es-PE')}`;

export default function CartView({
  cartItems,
  currentUser,
  onCheckout,
  onDecrease,
  onIncrease,
  onNavigate,
  onRemove,
  onConfirmPurchase,
}) {
  const items = cartItems
    .map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.productId),
    }))
    .filter((item) => item.product);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.numericPrice * item.quantity,
    0
  );

  const shipping = items.length > 0 ? SHIPPING_COST : 0;
  const total = subtotal + shipping;

  return (
    <main className={styles.page}>
      <section className={`${styles.layout} container`}>
        <div className={styles.cartContent}>
          <div className={styles.heading}>
            <span className={styles.kicker}>Carrito</span>
            <h1>Carrito de compras</h1>
            <p>Revisa tus productos seleccionados antes de continuar con el pedido.</p>
          </div>

          {items.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🛒</div>

              <h2>Tu carrito está vacío</h2>

              <p>
                Explora los productos disponibles y agrega tus favoritos para continuar
                con tu pedido.
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
            <div className={styles.items}>
              {items.map(({ product, quantity }) => (
                <article className={styles.item} key={product.id}>
                  <div
                    className={styles.thumb}
                    style={getImageStyle(product.image)}
                    aria-label={product.title}
                  />

                  <div className={styles.itemInfo}>
                    <span className={styles.storeName}>{product.storeName}</span>
                    <h2>{product.title}</h2>
                    <strong>{product.price}</strong>
                  </div>

                  <div className={styles.quantity}>
                    <button
                      type="button"
                      onClick={() => onDecrease(product.id)}
                      aria-label="Disminuir cantidad"
                    >
                      −
                    </button>

                    <span>{quantity}</span>

                    <button
                      type="button"
                      onClick={() => onIncrease(product.id)}
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>

                  <button
                    className={styles.removeButton}
                    type="button"
                    onClick={() => onRemove(product.id)}
                  >
                    Eliminar
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className={styles.summary}>
          <div className={styles.summaryHeader}>
            <span>Resumen</span>
            <h2>Detalle del pedido</h2>
          </div>

          <div className={styles.summaryRows}>
            <p>
              <span>Subtotal</span>
              <strong>{formatMoney(subtotal)}</strong>
            </p>

            <p>
              <span>Envío</span>
              <strong>{formatMoney(shipping)}</strong>
            </p>

            <p className={styles.total}>
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
            </p>
          </div>

          {!currentUser ? (
            <button
              className="primaryButton"
              type="button"
              disabled={!items.length}
              onClick={onCheckout}
            >
              Ir a pagar
            </button>
          ) : (
            <button
              className="primaryButton"
              type="button"
              disabled={!items.length}
              onClick={() => onConfirmPurchase(total)}
            >
              Confirmar pedido
            </button>
          )}

          <button
            className="accentButton"
            type="button"
            onClick={() => onNavigate('home')}
          >
            Seguir comprando
          </button>

          <p className={styles.helpText}>
            El pago es simulado para fines de prueba. Tu pedido se registrará
            automáticamente al confirmar.
          </p>
        </aside>
      </section>
    </main>
  );
}