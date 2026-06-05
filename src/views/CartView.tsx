import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { CartItem, Product, User, ViewName } from '../types';
import styles from './CartView.module.css';

type CartViewProps = {
  cartItems: CartItem[];
  products: Product[];
  currentUser: User | null;
  cartNotice?: string;
  onCheckout: () => void;
  onDecrease: (productId: string) => void;
  onIncrease: (productId: string) => void;
  onNavigate: (view: ViewName) => void;
  onRemove: (productId: string) => void;
  onRequestCartQuote: (productId: string, additionalProductTitles: string[]) => void;
  onPayNow: (total: number) => void;
  onRequestPurchase: (total: number) => void;
};

type CartProductItem = CartItem & { product: Product };

const SHIPPING_COST = 10;

const availabilityLabels = {
  IN_STOCK: 'Stock disponible',
  MADE_TO_ORDER: 'Requiere confirmacion',
};

const getAvailabilityLabel = (product: Product) => (
  product.requiresConfirmation ? 'Requiere confirmacion' : availabilityLabels[product.availabilityType] ?? 'Requiere confirmacion'
);

const getImageStyle = (image?: string): CSSProperties => {
  if (!image) return {};
  return image.includes('gradient') ? { background: image } : { backgroundImage: `url(${image})` };
};

const formatMoney = (value: number) => `S/. ${value.toLocaleString('es-PE')}`;

export default function CartView({
  cartItems,
  products,
  currentUser,
  cartNotice,
  onCheckout,
  onDecrease,
  onIncrease,
  onNavigate,
  onRemove,
  onRequestCartQuote,
  onPayNow,
  onRequestPurchase,
}: CartViewProps) {
  const [showQuoteSelection, setShowQuoteSelection] = useState(false);
  const [selectedQuoteProductIds, setSelectedQuoteProductIds] = useState<string[]>([]);
  const items: CartProductItem[] = cartItems
    .map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.productId),
    }))
    .filter((item): item is CartProductItem => Boolean(item.product));

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.numericPrice * item.quantity,
    0,
  );

  const shipping = items.length > 0 ? SHIPPING_COST : 0;
  const total = subtotal + shipping;
  const hasRequiresConfirmation = items.some((item) => (
    item.product.requiresConfirmation === true
    || item.product.availabilityType === 'MADE_TO_ORDER'
  ));
  const canPayNow = items.length > 0 && !hasRequiresConfirmation;

  const openQuoteForProducts = (productsToQuote: Product[]) => {
    const [primaryProduct, ...additionalProducts] = productsToQuote;
    if (!primaryProduct) return;
    onRequestCartQuote(primaryProduct.id, additionalProducts.map((product) => product.title));
  };

  const toggleQuoteProduct = (productId: string) => {
    setSelectedQuoteProductIds((current) => (
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    ));
  };

  const handleSelectedQuote = () => {
    openQuoteForProducts(
      items
        .filter((item) => selectedQuoteProductIds.includes(item.product.id))
        .map((item) => item.product),
    );
  };

  const handlePrimaryAction = () => {
    if (!items.length) return;

    if (!currentUser) {
      onCheckout();
      return;
    }

    if (hasRequiresConfirmation) {
      onRequestPurchase(total);
      return;
    }

    onPayNow(total);
  };

  const primaryLabel = hasRequiresConfirmation
      ? 'Solicitar compra'
      : currentUser
        ? 'Pagar ahora'
        : 'Ir a pagar';

  return (
    <main className={styles.page}>
      <section className={`${styles.layout} container`}>
        <div className={styles.cartContent}>
          <div className={styles.heading}>
            <h1>Carrito de compras</h1>
            <p>Revisa tus productos seleccionados antes de continuar con el pedido.</p>
          </div>

          {items.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🛒</div>
              <h2>Tu carrito esta vacio</h2>
              <p>
                Explora los productos disponibles y agrega tus favoritos para continuar
                con tu pedido.
              </p>
              <button className="primaryButton" type="button" onClick={() => onNavigate('home')}>
                Explorar productos
              </button>
            </div>
          ) : (
            <div className={styles.items}>
              {items.map(({ product, quantity }) => (
                <article className={styles.item} key={product.id}>
                  {showQuoteSelection && (
                    <label className={styles.quoteCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedQuoteProductIds.includes(product.id)}
                        onChange={() => toggleQuoteProduct(product.id)}
                      />
                      <span>Seleccionar para cotizar</span>
                    </label>
                  )}
                  <div
                    className={styles.thumb}
                    style={getImageStyle(product.image)}
                    aria-label={product.title}
                  />

                  <div className={styles.itemInfo}>
                    <span className={styles.storeName}>{product.storeName}</span>
                    <h2>{product.title}</h2>
                    <strong>{product.price}</strong>
                    <span className={`${styles.availability} ${styles[product.availabilityType]}`}>
                      {getAvailabilityLabel(product)}
                    </span>
                  </div>

                  <div className={styles.quantity}>
                    <button type="button" onClick={() => onDecrease(product.id)} aria-label="Disminuir cantidad">
                      −
                    </button>
                    <span>{quantity}</span>
                    <button type="button" onClick={() => onIncrease(product.id)} aria-label="Aumentar cantidad">
                      +
                    </button>
                  </div>

                  <button className={styles.removeButton} type="button" onClick={() => onRemove(product.id)}>
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
            <p><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></p>
            <p><span>Envio</span><strong>{formatMoney(shipping)}</strong></p>
            <p className={styles.total}><span>Total</span><strong>{formatMoney(total)}</strong></p>
          </div>

          {cartNotice && <p className={styles.notice}>{cartNotice}</p>}

          {hasRequiresConfirmation && (
            <p className={styles.notice}>
              Esta compra requiere confirmacion del productor antes de pagar.
            </p>
          )}

          {canPayNow && (
            <p className={styles.notice}>
              El pago sera retenido por la plataforma hasta la entrega conforme del producto.
            </p>
          )}

          {items.length > 0 && (
            <div className={styles.quoteBox}>
              <strong>¿Quieres modificar medidas, color o acabado de algun producto?</strong>
              <button
                className="accentButton"
                type="button"
                onClick={() => setShowQuoteSelection((current) => !current)}
              >
                {showQuoteSelection ? 'Ocultar seleccion' : 'Cotizar productos del carrito'}
              </button>
              {showQuoteSelection && (
                <button
                  className="primaryButton"
                  type="button"
                  disabled={selectedQuoteProductIds.length === 0}
                  onClick={handleSelectedQuote}
                >
                  Cotizar productos seleccionados
                </button>
              )}
            </div>
          )}

          <button
            className="primaryButton"
            type="button"
            disabled={!items.length}
            onClick={handlePrimaryAction}
          >
            {primaryLabel}
          </button>

          <button className="accentButton" type="button" onClick={() => onNavigate('home')}>
            Seguir comprando
          </button>

          <p className={styles.helpText}>
            El pago es simulado para fines de prueba. Las solicitudes y ventas se guardan
            temporalmente en el estado de la aplicacion.
          </p>
        </aside>
      </section>
    </main>
  );
}
