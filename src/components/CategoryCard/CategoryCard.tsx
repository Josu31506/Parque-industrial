import { memo, useEffect, useState } from 'react';
import type { Category } from '../../types';
import styles from './CategoryCard.module.css';

type CategoryCardProps = Required<Pick<Category, 'name'>> &
  Pick<Category, 'image' | 'rating' | 'reviews'> & {
    onClick?: () => void;
  };

const fallbackImage = `data:image/svg+xml,${encodeURIComponent([
  '<svg xmlns="http://www.w3.org/2000/svg" width="560" height="360" viewBox="0 0 560 360">',
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
  '<stop offset="0%" stop-color="#e59866"/><stop offset="100%" stop-color="#f7eee8"/>',
  '</linearGradient></defs>',
  '<rect width="560" height="360" fill="url(#g)"/>',
  '<circle cx="280" cy="145" r="58" fill="#0f2c59" opacity=".13"/>',
  '<rect x="168" y="226" width="224" height="26" rx="13" fill="#0f2c59" opacity=".16"/>',
  '</svg>',
].join(''))}`;

const resolveImageSource = (image?: string) => {
  if (!image || image.includes('gradient')) return fallbackImage;
  return image;
};

function CategoryCard({
  name,
  rating,
  reviews,
  image,
  onClick,
}: CategoryCardProps) {
  const safeName = name || 'Categoria';
  const [imageSource, setImageSource] = useState(() => resolveImageSource(image));

  useEffect(() => {
    setImageSource(resolveImageSource(image));
  }, [image]);

  return (
    <article className={styles.card}>
      <button
        className={styles.cardButton}
        type="button"
        onClick={onClick}
        aria-label={`Ver categoria ${safeName}`}
      >
        <span className={styles.imageFrame}>
          <img
            className={styles.image}
            src={imageSource}
            alt={`Categoria ${safeName}`}
            width="560"
            height="360"
            loading="lazy"
            decoding="async"
            onError={() => setImageSource(fallbackImage)}
          />
        </span>
        <h3>{safeName}</h3>
        <p className={styles.rating}>
          ★★★★★ <span>{rating} ({reviews} reseñas)</span>
        </p>
      </button>
    </article>
  );
}

export default memo(CategoryCard, (previous, next) => (
  previous.image === next.image
  && previous.name === next.name
  && previous.rating === next.rating
  && previous.reviews === next.reviews
));
