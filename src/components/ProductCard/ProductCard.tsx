import { memo, useEffect, useState } from 'react';
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

const fallbackImage = `data:image/svg+xml,${encodeURIComponent([
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">',
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
  '<stop offset="0%" stop-color="#d9c7b5"/><stop offset="100%" stop-color="#f3eee8"/>',
  '</linearGradient></defs>',
  '<rect width="640" height="480" fill="url(#g)"/>',
  '<path d="M150 310h340v34H150zM188 238h264v72H188zM220 180h200v58H220z" fill="#0f2c59" opacity=".16"/>',
  '<text x="320" y="388" text-anchor="middle" font-family="Segoe UI, Arial" font-size="24" font-weight="700" fill="#0f2c59" opacity=".55">Parque Industrial Conecta</text>',
  '</svg>',
].join(''))}`;

const resolveImageSource = (image?: string) => {
  if (!image || image.includes('gradient')) return fallbackImage;
  return image;
};

function ProductCard({
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
  const [imageSource, setImageSource] = useState(() => resolveImageSource(image));
  const safeTitle = title || 'Producto sin nombre';
  const safePrice = price || 'Precio no disponible';
  const safeStoreName = storeName || 'Productor no asignado';
  const normalizedBadge = badge?.toLowerCase() ?? '';
  const badgeType = normalizedBadge.includes('sostenible')
    ? 'eco'
    : normalizedBadge === 'oferta'
      ? 'oferta'
      : 'nuevo';

  useEffect(() => {
    setImageSource(resolveImageSource(image));
  }, [image]);

  return (
    <article className={styles.card}>
      {badge && <span className={`${styles.badge} ${badgeClassByType[badgeType]}`}>{badge}</span>}

      <button
        className={styles.imageButton}
        type="button"
        onClick={onClick}
        aria-label={`Ver detalle de ${safeTitle}`}
      >
        <span className={styles.imageFrame}>
          <img
            className={styles.image}
            src={imageSource}
            alt={safeTitle}
            width="640"
            height="480"
            loading="lazy"
            decoding="async"
            onError={() => setImageSource(fallbackImage)}
          />
        </span>
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

export default memo(ProductCard, (previous, next) => (
  previous.badge === next.badge
  && previous.category === next.category
  && previous.image === next.image
  && previous.oldPrice === next.oldPrice
  && previous.price === next.price
  && previous.rating === next.rating
  && previous.storeName === next.storeName
  && previous.title === next.title
));
