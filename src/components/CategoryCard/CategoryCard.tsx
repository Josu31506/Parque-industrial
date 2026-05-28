import type { CSSProperties } from 'react';
import type { Category } from '../../types';
import styles from './CategoryCard.module.css';

type CategoryCardProps = Required<Pick<Category, 'name'>> & Pick<Category, 'image' | 'rating' | 'reviews'>;

const getImageStyle = (image?: string): CSSProperties => {
  if (!image) return {};
  return image.includes('gradient') ? { background: image } : { backgroundImage: `url(${image})` };
};

export default function CategoryCard({ name, rating, reviews, image }: CategoryCardProps) {
  return (
    <article className={styles.card}>
      <div
        className={styles.image}
        style={getImageStyle(image)}
        role="img"
        aria-label={`Categoria ${name}`}
      />
      <h3>{name}</h3>
      <p className={styles.rating}>
        ★★★★★ <span>{rating} ({reviews} resenas)</span>
      </p>
    </article>
  );
}
