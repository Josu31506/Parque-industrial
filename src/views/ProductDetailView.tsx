import type { CSSProperties } from 'react';
import { useState } from 'react';
import { getProducerById } from '../data/catalog';
import type { Product } from '../types';
import styles from './ProductDetailView.module.css';

type ProductDetailViewProps = {
  product: Product | undefined;
  cartMessage?: string;
  onAddToCart: (productId: string) => void;
  onBack: () => void;
};

const getImageStyle = (image?: string): CSSProperties => {
  if (!image) return {};
  return image.includes('gradient') ? { background: image } : { backgroundImage: `url(${image})` };
};

export default function ProductDetailView({
  cartMessage,
  onAddToCart,
  onBack,
  product,
}: ProductDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'producer'>('description');
  const producer = getProducerById(product?.producerId);

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

          <p className={styles.storeName}>{product.storeName}</p>
          <h1>{product.title}</h1>
          <p className={styles.rating}>★★★★★ <span>{product.rating}</span></p>

          <div className={styles.priceRow}>
            <strong>{product.price}</strong>
            {product.oldPrice && <span>{product.oldPrice}</span>}
          </div>

          <div className={styles.tabs} role="tablist" aria-label="Informacion del producto">
            <button
              className={activeTab === 'description' ? styles.active : undefined}
              type="button"
              onClick={() => setActiveTab('description')}
            >
              Descripcion
            </button>

            <button
              className={activeTab === 'producer' ? styles.active : undefined}
              type="button"
              onClick={() => setActiveTab('producer')}
            >
              Productora
            </button>
          </div>

          <div className={styles.tabPanel}>
            {activeTab === 'description' && <p>{product.description}</p>}

            {activeTab === 'producer' && (
              <div>
                <h2>{producer?.name}</h2>
                <p>{producer?.description}</p>
                <small>{producer?.type} · {producer?.location}</small>
              </div>
            )}
          </div>

          {cartMessage && <p className={styles.confirmation}>{cartMessage}</p>}

          <div className={styles.actions}>
            <button className="primaryButton" type="button" onClick={onBack}>Volver</button>
            <button
              className={isEco ? styles.ecoButton : 'accentButton'}
              type="button"
              onClick={() => onAddToCart(product.id)}
            >
              Agregar al carrito
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
