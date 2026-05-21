import styles from './ProductCard.module.css';

const badgeClassByType = {
  nuevo: styles.newBadge,
  oferta: styles.offerBadge,
  eco: styles.ecoBadge,
};

const getImageStyle = (image) => {
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
}) {
  const normalizedBadge = badge?.toLowerCase() ?? '';
  const badgeType = normalizedBadge.includes('sostenible')
    ? 'eco'
    : normalizedBadge === 'oferta'
      ? 'oferta'
      : 'nuevo';

  return (
    <article className={styles.card}>
      {badge && <span className={`${styles.badge} ${badgeClassByType[badgeType]}`}>{badge}</span>}

      <div
        className={styles.image}
        style={getImageStyle(image)}
        role="img"
        aria-label={title}
      />

      <div className={styles.info}>
        <p className={styles.storeName}>{storeName}</p>
        <h3>{title}</h3>
        <p className={styles.rating}>
          ★★★★★ <span>{rating}</span>
        </p>
        <div className={styles.priceRow}>
          <span className={styles.price}>{price}</span>
          {oldPrice && <span className={styles.oldPrice}>{oldPrice}</span>}
        </div>
        <button className="primaryButton" type="button">Vista rápida</button>
      </div>
    </article>
  );
}
