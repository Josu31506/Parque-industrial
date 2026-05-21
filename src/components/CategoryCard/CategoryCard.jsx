import styles from './CategoryCard.module.css';

export default function CategoryCard({ name, rating, reviews, image }) {
  const imageStyle = image?.includes('gradient')
    ? { background: image }
    : { backgroundImage: `url(${image})` };

  return (
    <article className={styles.card}>
      <div
        className={styles.image}
        style={imageStyle}
        role="img"
        aria-label={`Categoría ${name}`}
      />
      <h3>{name}</h3>
      <p className={styles.rating}>
        ★★★★★ <span>{rating} ({reviews} reseñas)</span>
      </p>
    </article>
  );
}
