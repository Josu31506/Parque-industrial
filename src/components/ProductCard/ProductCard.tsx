import type { CSSProperties } from 'react';
import type { Product } from '../../types';
import { getCategoryDisplayName, getProducerDisplayName } from '../../utils/displayNames';
import styles from './ProductCard.module.css';

type ProductCardProps = Pick<
  Product,
  | 'badge'
  | 'category'
  | 'image'
  | 'oldPrice'
  | 'price'
  | 'rating'
  | 'storeName'
  | 'title'
> & {
  onClick?: () => void;
};

const badgeClassByType = {
  nuevo: styles.newBadge,
  oferta: styles.offerBadge,
  eco: styles.ecoBadge,
};

const getImageStyle = (image?: string): CSSProperties => {
  if (!image) return {};
  return image.includes('gradient') ? { background: image } : { backgroundImage: `url(${image})` };
};

export default function ProductCard({
  badge,
  category,
  image,
  storeName,
  title,
  rating,
  price,
  oldPrice,
  onClick,
}: ProductCardProps) {
  const safeTitle = title || 'Producto sin nombre';
  const safePrice = price || 'Precio no disponible';
  const safeStoreName = storeName || 'Productor no asignado';
  const normalizedBadge = badge?.toLowerCase() ?? '';
  const badgeType = normalizedBadge.includes('sostenible')
    ? 'eco'
    : normalizedBadge === 'oferta'
      ? 'oferta'
      : 'nuevo';

  return (
    <article className={styles.card}>
      {badge && <span className={`${styles.badge} ${badgeClassByType[badgeType]}`}>{badge}</span>}

      <button
        className={styles.imageButton}
        type="button"
        onClick={onClick}
        aria-label={`Ver detalle de ${safeTitle}`}
      >
        <span className={styles.image} style={getImageStyle(image)} />
      </button>

      <div className={styles.info}>
        <p className={styles.storeName}>{getProducerDisplayName({ name: safeStoreName })}</p>
        <p className={styles.category}>{getCategoryDisplayName(undefined, category)}</p>
        <button className={styles.titleButton} type="button" onClick={onClick}>
          <h3>{safeTitle}</h3>
        </button>
        <p className={styles.rating}>
          ***** <span>{rating}</span>
        </p>
        <div className={styles.priceRow}>
          <span className={styles.price}>{safePrice}</span>
          {oldPrice && <span className={styles.oldPrice}>{oldPrice}</span>}
        </div>
        <button className="primaryButton" type="button" onClick={onClick}>Ver producto</button>
      </div>
    </article>
  );
}
