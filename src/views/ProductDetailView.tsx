import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { reviews as mockReviews } from '../data/reviews';
import { createReview, getProductReviews, getReviewEligibility } from '../services/reviewsService';
import type { Producer, Product, ReviewEligibility, ReviewsSummary, User } from '../types';
import { getCategoryDisplayName, getProducerDisplayName } from '../utils/displayNames';
import styles from './ProductDetailView.module.css';

type DetailTab = 'description' | 'technical' | 'producer' | 'model3d' | 'reviews';

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
  isLoading?: boolean;
};

const reviewPageSize = 5;

const getImageStyle = (image?: string): CSSProperties => {
  if (!image) return {};
  return image.includes('gradient') ? { background: image } : { backgroundImage: `url(${image})` };
};

const getValue = (value: string | undefined) => value ?? 'No especificado';

const emptyReviewsSummary: ReviewsSummary = {
  averageRating: null,
  totalReviews: 0,
};

const demoModelByProductHint = [
  {
    hints: ['sofa-modular-lino-gris', 'sofa modular', 'escritorio de madera recuperada'],
    url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
  },
  {
    hints: ['mesa-comedor-extensible', 'mesa de comedor', 'comedor de roble personalizado'],
    url: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
  },
  {
    hints: ['banco-madera-recuperada', 'banco de madera recuperada'],
    url: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
  },
];

const getProductModel3dUrl = (product: Product | undefined) => {
  if (!product) return undefined;
  return product.model3dUrl || undefined;
};

const renderStars = (rating: number) => (
  Array.from({ length: 5 }, (_, index) => (index < Math.round(rating) ? '★' : '☆')).join('')
);

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
  isLoading = false,
}: ProductDetailViewProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('description');
  const [reviewPage, setReviewPage] = useState(0);
  const [productReviews, setProductReviews] = useState(() => (
    mockReviews.filter((review) => review.productId === product?.id)
  ));
  const [reviewsSummary, setReviewsSummary] = useState<ReviewsSummary>(emptyReviewsSummary);
  const [totalReviewPages, setTotalReviewPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedReviewOrderId, setSelectedReviewOrderId] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState(false);
  const modelViewerRef = useRef<any>(null);
  const productModel3dUrl = useMemo(() => getProductModel3dUrl(product), [product]);

  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const handleLoad = () => {
      setModelLoading(false);
      setModelError(false);
    };

    const handleError = () => {
      setModelLoading(false);
      setModelError(true);
    };

    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);

    // Reset loading and error states when model source changes
    setModelLoading(true);
    setModelError(false);

    return () => {
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
    };
  }, [productModel3dUrl, activeTab]);

  useEffect(() => {
    setActiveTab('description');
    setReviewPage(0);
    setReviewEligibility(null);
    setShowReviewForm(false);
    setSelectedRating(0);
    setSelectedReviewOrderId('');
    setReviewComment('');
    setReviewError('');
    setReviewSuccess('');
  }, [product?.id]);

  const fallbackReviews = useMemo(() => (
    mockReviews.filter((review) => review.productId === product?.id)
  ), [product?.id]);

  useEffect(() => {
    if (!product?.id) return;

    let ignore = false;
    setReviewsLoading(true);

    getProductReviews(product.id, reviewPage + 1, reviewPageSize)
      .then((response) => {
        if (ignore) return;
        setProductReviews(response.items);
        setReviewsSummary(response.summary);
        setTotalReviewPages(response.totalPages);
      })
      .catch(() => {
        if (ignore) return;
        const average = fallbackReviews.length > 0
          ? fallbackReviews.reduce((total, review) => total + review.rating, 0) / fallbackReviews.length
          : null;
        setProductReviews(fallbackReviews.slice(
          reviewPage * reviewPageSize,
          reviewPage * reviewPageSize + reviewPageSize,
        ));
        setReviewsSummary({
          averageRating: average,
          totalReviews: fallbackReviews.length,
        });
        setTotalReviewPages(Math.max(1, Math.ceil(fallbackReviews.length / reviewPageSize)));
      })
      .finally(() => {
        if (!ignore) setReviewsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [fallbackReviews, product?.id, reviewPage]);

  useEffect(() => {
    if (activeTab !== 'reviews' || !product?.id || currentUser?.role !== 'CLIENT') return;

    let ignore = false;
    setEligibilityLoading(true);
    setReviewEligibility(null);

    getReviewEligibility(product.id)
      .then((eligibility) => {
        if (ignore) return;
        setReviewEligibility(eligibility);
        setSelectedReviewOrderId(eligibility.eligibleOrders[0]?.orderId ?? '');
      })
      .catch((error) => {
        if (ignore) return;
        setReviewEligibility({
          canReview: false,
          reason: error instanceof Error
            ? error.message
            : 'Podrás reseñar este producto cuando completes una compra entregada.',
          eligibleOrders: [],
        });
      })
      .finally(() => {
        if (!ignore) setEligibilityLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, currentUser?.role, product?.id]);

  useEffect(() => {
    if (activeTab !== 'model3d' || !productModel3dUrl) return;

    void import('@google/model-viewer');
  }, [activeTab, productModel3dUrl]);

  if (isLoading) {
    return (
      <main className={styles.page}>
        <section className={`${styles.empty} container`}>
          <h1>Cargando producto...</h1>
        </section>
      </main>
    );
  }

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
  const averageRating = reviewsSummary.averageRating ?? product.rating;
  const visibleReviews = productReviews;
  const details = product.technicalDetails;
  const reviewCount = reviewsSummary.totalReviews;

  const resetReviewForm = () => {
    setShowReviewForm(false);
    setSelectedRating(0);
    setReviewComment('');
    setReviewError('');
  };

  const handleSubmitReview = async () => {
    setReviewError('');
    setReviewSuccess('');

    if (currentUser?.role !== 'CLIENT') {
      setReviewError('Solo los clientes pueden dejar reseñas.');
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
      setReviewError('Selecciona una calificación de 1 a 5 estrellas.');
      return;
    }

    if (reviewComment.length > 500) {
      setReviewError('El comentario no debe superar 500 caracteres.');
      return;
    }

    if (!selectedReviewOrderId) {
      setReviewError('Solo puedes reseñar productos comprados y entregados.');
      return;
    }

    setReviewSubmitLoading(true);

    try {
      const createdReview = await createReview({
        productId: product.id,
        orderId: selectedReviewOrderId,
        rating: selectedRating,
        comment: reviewComment.trim() || undefined,
      });
      const previousTotal = reviewsSummary.totalReviews;
      const previousAverage = reviewsSummary.averageRating ?? 0;
      const nextTotal = previousTotal + 1;
      const nextAverage = ((previousAverage * previousTotal) + createdReview.rating) / nextTotal;

      setProductReviews((currentReviews) => [createdReview, ...currentReviews].slice(0, reviewPageSize));
      setReviewsSummary({ averageRating: nextAverage, totalReviews: nextTotal });
      setTotalReviewPages(Math.max(1, Math.ceil(nextTotal / reviewPageSize)));
      setReviewEligibility((currentEligibility) => {
        if (!currentEligibility) return currentEligibility;
        const eligibleOrders = currentEligibility.eligibleOrders.filter((order) => order.orderId !== selectedReviewOrderId);
        return {
          canReview: eligibleOrders.length > 0,
          reason: eligibleOrders.length > 0
            ? undefined
            : 'Ya registraste una reseña para este producto en tus pedidos entregados.',
          eligibleOrders,
        };
      });
      setReviewSuccess('Reseña publicada correctamente.');
      resetReviewForm();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'No se pudo publicar la reseña.');
    } finally {
      setReviewSubmitLoading(false);
    }
  };

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
            <button className={activeTab === 'model3d' ? styles.active : undefined} type="button" onClick={() => setActiveTab('model3d')}>
              Vista 3D
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

            {activeTab === 'model3d' && (
              <div className={styles.modelPanel}>
                {productModel3dUrl ? (
                  modelError ? (
                    <div className={styles.modelUnavailable}>
                      <h2>No se pudo cargar este modelo 3D.</h2>
                      <p>Verifica que el archivo sea un GLB válido y que contenga una escena 3D.</p>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      {modelLoading && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(238, 243, 248, 0.85)',
                            zIndex: 2,
                            borderRadius: '8px',
                          }}
                        >
                          <p style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            Cargando modelo 3D...
                          </p>
                        </div>
                      )}
                      <model-viewer
                        ref={modelViewerRef}
                        className={styles.modelViewer}
                        src={productModel3dUrl}
                        alt={`Vista 3D de ${product.title}`}
                        camera-controls
                        auto-rotate
                        shadow-intensity="0.8"
                        exposure="1"
                        reveal="auto"
                        camera-orbit="0deg 70deg 105%"
                        min-camera-orbit="auto auto 65%"
                        max-camera-orbit="auto auto 180%"
                      />
                      {!modelLoading && <p style={{ marginTop: '8px' }}>Arrastra para rotar el modelo y usa zoom para revisar detalles.</p>}
                    </div>
                  )
                ) : (
                  <div className={styles.modelUnavailable}>
                    <h2>Vista 3D no disponible</h2>
                    <p>Este producto aún no tiene vista 3D disponible.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className={styles.reviewsPanel}>
                <div className={styles.reviewsSummary}>
                  <div>
                    <span>Calificacion promedio</span>
                    <strong>{averageRating ? averageRating.toFixed(1) : 'Sin calificacion'}</strong>
                  </div>
                  <p className={styles.rating}>
                    {averageRating ? renderStars(averageRating) : '☆☆☆☆☆'}
                    {averageRating && <span> {averageRating.toFixed(1)}</span>}
                  </p>
                  <span>
                    {reviewCount === 1
                      ? '1 reseña registrada'
                      : `${reviewCount} reseñas registradas`}
                  </span>
                </div>

                <div className={styles.reviewGate}>
                  {!currentUser && (
                    <p>Inicia sesion como cliente para reseñar productos que hayas comprado.</p>
                  )}
                  {currentUser && currentUser.role !== 'CLIENT' && (
                    <p>Solo los clientes pueden dejar reseñas.</p>
                  )}
                  {currentUser?.role === 'CLIENT' && eligibilityLoading && (
                    <p>Validando si puedes reseñar este producto...</p>
                  )}
                  {currentUser?.role === 'CLIENT' && !eligibilityLoading && reviewEligibility?.canReview && !showReviewForm && (
                    <button className={styles.reviewButton} type="button" onClick={() => setShowReviewForm(true)}>
                      Dejar reseña
                    </button>
                  )}
                  {currentUser?.role === 'CLIENT' && !eligibilityLoading && reviewEligibility && !reviewEligibility.canReview && (
                    <p>{reviewEligibility.reason ?? 'Podrás reseñar este producto cuando completes una compra entregada.'}</p>
                  )}
                  {reviewSuccess && <p className={styles.reviewMessage}>{reviewSuccess}</p>}
                </div>

                {showReviewForm && (
                  <form className={styles.reviewForm} onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmitReview();
                  }}>
                    <h3>Dejar reseña</h3>
                    <label>
                      Calificacion
                      <span className={styles.ratingSelector} aria-label="Selecciona una calificacion">
                        {[1, 2, 3, 4, 5].map((ratingValue) => (
                          <button
                            aria-label={`${ratingValue} estrellas`}
                            className={`${styles.starButton} ${selectedRating >= ratingValue ? styles.starActive : ''}`}
                            key={ratingValue}
                            type="button"
                            onClick={() => setSelectedRating(ratingValue)}
                          >
                            ★
                          </button>
                        ))}
                      </span>
                    </label>

                    {reviewEligibility && reviewEligibility.eligibleOrders.length > 1 && (
                      <label>
                        Selecciona el pedido
                        <select value={selectedReviewOrderId} onChange={(event) => setSelectedReviewOrderId(event.target.value)}>
                          {reviewEligibility.eligibleOrders.map((order) => (
                            <option key={order.orderId} value={order.orderId}>
                              Pedido {order.orderNumber ? `#${order.orderNumber}` : order.orderId.slice(0, 8)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <label>
                      Comentario
                      <textarea
                        className={styles.reviewTextarea}
                        maxLength={500}
                        placeholder="Cuentanos como fue tu experiencia con este producto..."
                        value={reviewComment}
                        onChange={(event) => setReviewComment(event.target.value)}
                      />
                    </label>
                    <small>{reviewComment.length}/500 caracteres</small>
                    {reviewError && <p className={styles.reviewError}>{reviewError}</p>}
                    <div className={styles.reviewActions}>
                      <button type="button" onClick={resetReviewForm}>Cancelar</button>
                      <button type="submit" disabled={reviewSubmitLoading}>
                        {reviewSubmitLoading ? 'Publicando...' : 'Publicar reseña'}
                      </button>
                    </div>
                  </form>
                )}

                {reviewsLoading && <p>Cargando reseñas...</p>}
                {visibleReviews.length > 0 ? (
                  <div className={styles.reviewList}>
                    {visibleReviews.map((review) => (
                      <article className={styles.reviewCard} key={review.id}>
                        <div>
                          <strong>{review.userName}</strong>
                          <span>{review.date}</span>
                        </div>
                        <p className={styles.rating}>{renderStars(review.rating)} <span>{review.rating}</span></p>
                        {review.verified && <span className={styles.verifiedBadge}>Compra verificada</span>}
                        <p>{review.comment}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  !reviewsLoading && <p>Este producto aun no tiene reseñas.</p>
                )}

                {reviewCount > reviewPageSize && (
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
