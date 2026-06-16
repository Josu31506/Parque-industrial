import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { reviews } from '../data/reviews';
import type { Producer, Product, User } from '../types';
import { getCategoryDisplayName, getProducerDisplayName } from '../utils/displayNames';
import styles from './ProductDetailView.module.css';

type DetailTab = 'description' | 'technical' | 'producer' | 'reviews';

type ProductDetailViewProps = {
  product: Product | undefined;
  producer?: Producer;
  cartMessage?: string;
  currentUser: User | null;
  onAddToCart: (productId: string) => void;
  onBack: () => void;
  onEditProduct: (productId: string) => void;
  onProducerSelect: (producerId: string) => void;
  onRequestQuote: (productId: string) => void;
  sellerProducerId?: string;
};

const reviewPageSize = 3;

const getImageStyle = (image?: string): CSSProperties => {
  if (!image) return {};
  return image.includes('gradient') ? { background: image } : { backgroundImage: `url(${image})` };
};

const getValue = (value: string | undefined) => value ?? 'No especificado';

export default function ProductDetailView({
  cartMessage,
  currentUser,
  onAddToCart,
  onBack,
  onEditProduct,
  onProducerSelect,
  onRequestQuote,
  product,
  producer,
  sellerProducerId,
}: ProductDetailViewProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('description');
  const [reviewPage, setReviewPage] = useState(0);

  useEffect(() => {
    setActiveTab('description');
    setReviewPage(0);
  }, [product?.id]);

  const productReviews = useMemo(() => (
    reviews.filter((review) => review.productId === product?.id)
  ), [product?.id]);

  if (!product) {
    return (
      <main className={styles.page}>
        <section className={`${styles.empty} container`}>
          <h1>Producto no encontrado</h1>
          <button className="primaryButton" type="button" onClick={onBack}>Volver</button>
        </section>
      </main>
    );
  }

  const isEco = product.type === 'eco';
  const hasAvailableStock = Number(product.stock ?? 0) > 0;
  const requiresCustomQuote = product.availabilityType === 'CUSTOM_QUOTE';
  const requiresConfirmation = !requiresCustomQuote && (
    product.requiresConfirmation === true
    || product.availabilityType === 'MADE_TO_ORDER'
  );
  const canAddDirectly = product.availabilityType === 'IN_STOCK' && hasAvailableStock && !requiresConfirmation;
  const canRequestPurchase = requiresConfirmation;
  const isOutOfStock = !hasAvailableStock && !requiresConfirmation && !requiresCustomQuote;
  const isSeller = currentUser?.role === 'SELLER';
  const isClientOrGuest = !currentUser || currentUser.role === 'CLIENT';
  const sellerOwnsProduct = isSeller && product.producerId === sellerProducerId;
  const averageRating = productReviews.length > 0
    ? productReviews.reduce((total, review) => total + review.rating, 0) / productReviews.length
    : product.rating;
  const totalReviewPages = Math.max(1, Math.ceil(productReviews.length / reviewPageSize));
  const visibleReviews = productReviews.slice(
    reviewPage * reviewPageSize,
    reviewPage * reviewPageSize + reviewPageSize,
  );
  const details = product.technicalDetails;

  return (
    <main className={`${styles.page} ${isEco ? styles.ecoPage : ''}`}>
      <section className={`${styles.layout} container`}>
        <div className={styles.imagePanel} style={getImageStyle(product.image)} />

        <article className={styles.infoPanel}>
          {product.badge && (
            <span className={`${styles.badge} ${isEco ? styles.ecoBadge : ''}`}>
              {product.badge}
            </span>
          )}

          <p className={styles.storeName}>{getProducerDisplayName(producer ?? { name: product.storeName })}</p>
          <p>{getCategoryDisplayName(undefined, product.category)}</p>
          <h1>{product.title}</h1>
          <p className={styles.rating}>★★★★★ <span>{averageRating?.toFixed(1)}</span></p>

          <div className={styles.priceRow}>
            <strong>{product.price}</strong>
            {product.oldPrice && <span>{product.oldPrice}</span>}
          </div>

          <div className={styles.tabs} role="tablist" aria-label="Informacion del producto">
            <button className={activeTab === 'description' ? styles.active : undefined} type="button" onClick={() => setActiveTab('description')}>
              Descripcion
            </button>
            <button className={activeTab === 'technical' ? styles.active : undefined} type="button" onClick={() => setActiveTab('technical')}>
              Ficha tecnica
            </button>
            <button className={activeTab === 'producer' ? styles.active : undefined} type="button" onClick={() => setActiveTab('producer')}>
              Productora
            </button>
            <button className={activeTab === 'reviews' ? styles.active : undefined} type="button" onClick={() => setActiveTab('reviews')}>
              Reseñas
            </button>
          </div>

          <div className={styles.tabPanel}>
            {activeTab === 'description' && <p>{product.description}</p>}

            {activeTab === 'technical' && (
              <div className={styles.technicalGrid}>
                <div><span>Dimensiones</span><strong>{getValue(details?.dimensions)}</strong></div>
                <div><span>Materiales</span><strong>{getValue(details?.materials)}</strong></div>
                <div><span>Colores</span><strong>{details?.colors?.join(', ') ?? 'No especificado'}</strong></div>
                <div><span>Acabado</span><strong>{getValue(details?.finish)}</strong></div>
                <div><span>Disponibilidad</span><strong>{getValue(details?.availability)}</strong></div>
                <div><span>Entrega estimada</span><strong>{getValue(details?.estimatedDelivery)}</strong></div>
                <div>
                  <span>Personalizable</span>
                  <strong>
                    {details?.customizable === undefined
                      ? 'No especificado'
                      : details.customizable
                        ? 'Si'
                        : 'No'}
                  </strong>
                </div>
              </div>
            )}

            {activeTab === 'producer' && (
              <div className={styles.producerPanel}>
                <h2>{producer?.name ?? product.storeName}</h2>
                <p>{producer?.description ?? 'Informacion de productora no especificada.'}</p>
                {producer && <small>{producer.type} - {producer.location}</small>}
                {producer && (
                  <button className="primaryButton" type="button" onClick={() => onProducerSelect(producer.id)}>
                    Ver perfil de productora
                  </button>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className={styles.reviewsPanel}>
                <div className={styles.reviewSummary}>
                  <strong>{averageRating?.toFixed(1) ?? 'Sin calificacion'}</strong>
                  <span>
                    {productReviews.length === 1
                      ? '1 reseña registrada'
                      : `${productReviews.length} reseñas registradas`}
                  </span>
                </div>

                {visibleReviews.length > 0 ? (
                  <div className={styles.reviewList}>
                    {visibleReviews.map((review) => (
                      <article className={styles.reviewItem} key={review.id}>
                        <div>
                          <strong>{review.userName}</strong>
                          <span>{review.date}</span>
                        </div>
                        <p className={styles.rating}>★★★★★ <span>{review.rating}</span></p>
                        <p>{review.comment}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p>Este producto aun no tiene reseñas.</p>
                )}

                {productReviews.length > reviewPageSize && (
                  <div className={styles.reviewActions}>
                    <button type="button" disabled={reviewPage === 0} onClick={() => setReviewPage((page) => Math.max(0, page - 1))}>
                      Anterior
                    </button>
                    <span>Pagina {reviewPage + 1} de {totalReviewPages}</span>
                    <button type="button" disabled={reviewPage + 1 >= totalReviewPages} onClick={() => setReviewPage((page) => Math.min(totalReviewPages - 1, page + 1))}>
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {cartMessage && <p className={styles.confirmation}>{cartMessage}</p>}

          <div className={styles.actions}>
            <button className="primaryButton" type="button" onClick={onBack}>Volver</button>
            {sellerOwnsProduct && (
              <button className="accentButton" type="button" onClick={() => onEditProduct(product.id)}>
                Editar producto
              </button>
            )}
            {isOutOfStock && isClientOrGuest && <p className={styles.stockNotice}>Sin stock disponible</p>}
            {isClientOrGuest && (
              <>
                {canAddDirectly && (
                  <button className={isEco ? styles.ecoButton : 'accentButton'} type="button" onClick={() => onAddToCart(product.id)}>
                    Añadir al carrito
                  </button>
                )}
                {canRequestPurchase && (
                  <button className={isEco ? styles.ecoButton : 'accentButton'} type="button" onClick={() => onAddToCart(product.id)}>
                    Solicitar compra
                  </button>
                )}
                <button className="primaryButton" type="button" onClick={() => onRequestQuote(product.id)}>
                  Solicitar cotización
                </button>
              </>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
