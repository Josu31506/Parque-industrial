import type { CSSProperties } from 'react';
import type { Product } from '../../types';
import styles from './ProductCard.module.css';

type ProductCardProps = Pick<
  Product,
  'badge' | 'image' | 'storeName' | 'title' | 'rating' | 'price' | 'oldPrice'
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
  image,
  storeName,
  title,
  rating,
  price,
  oldPrice,
  onClick,
}: ProductCardProps) {
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
        aria-label={`Ver detalle de ${title}`}
      >
        <span className={styles.image} style={getImageStyle(image)} />
      </button>

      <div className={styles.info}>
        <p className={styles.storeName}>{storeName}</p>
        <button className={styles.titleButton} type="button" onClick={onClick}>
          <h3>{title}</h3>
        </button>
        <p className={styles.rating}>
          ★★★★★ <span>{rating}</span>
        </p>
        <div className={styles.priceRow}>
          <span className={styles.price}>{price}</span>
          {oldPrice && <span className={styles.oldPrice}>{oldPrice}</span>}
        </div>
        <button className="primaryButton" type="button" onClick={onClick}>Vista rapida</button>
      </div>
    </article>
  );
}
