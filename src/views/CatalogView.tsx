import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard/ProductCard';
import { categories, getProducerById, producers, products } from '../data/catalog';
import type { CatalogFilter, ProductType } from '../types';
import styles from './CatalogView.module.css';

type CatalogViewProps = {
  initialFilter: CatalogFilter | null;
  onProductSelect: (productId: string) => void;
};

const normalize = (value: string) => value.trim().toLowerCase();

export default function CatalogView({ initialFilter, onProductSelect }: CatalogViewProps) {
  const [query, setQuery] = useState(initialFilter?.query ?? '');
  const [category, setCategory] = useState(initialFilter?.category ?? '');
  const [productType, setProductType] = useState<ProductType | ''>(initialFilter?.type ?? '');
  const [producer, setProducer] = useState(initialFilter?.producer ?? '');

  useEffect(() => {
    setQuery(initialFilter?.query ?? '');
    setCategory(initialFilter?.category ?? '');
    setProductType(initialFilter?.type ?? '');
    setProducer(initialFilter?.producer ?? '');
  }, [initialFilter]);

  const producerOptions = useMemo(() => (
    producers.map((item) => ({
      value: item.id,
      label: item.name,
    }))
  ), []);

  const filteredProducts = products.filter((product) => {
    const text = normalize(`${product.title} ${product.storeName} ${product.category ?? ''}`);
    const matchesQuery = query ? text.includes(normalize(query)) : true;
    const matchesCategory = category ? product.category === category : true;
    const matchesType = productType ? product.type === productType : true;
    const matchesProducer = producer
      ? product.producerId === producer || product.storeName === producer
      : true;

    return matchesQuery && matchesCategory && matchesType && matchesProducer;
  });

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setProductType('');
    setProducer('');
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <span className={styles.kicker}></span>
          <h1>Catalogo de productos</h1>
          <p>
            Encuentra muebles, decoracion y productos sostenibles de productores locales.
          </p>
        </div>

        <div className={styles.filters} aria-label="Filtros del catalogo">
          <label className={styles.searchBox}>
            <span>Buscar</span>
            <input
              type="search"
              value={query}
              onChange={handleQueryChange}
              placeholder="Buscar por producto, tienda o categoria"
            />
          </label>

          <label>
            <span>Categoria</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Todas</option>
              {categories.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Sostenibles</span>
            <select
              value={productType}
              onChange={(event) => setProductType(event.target.value as ProductType | '')}
            >
              <option value="">Todos</option>
              <option value="eco">Solo sostenibles</option>
              <option value="featured">Destacados</option>
            </select>
          </label>

          <label>
            <span>Productora</span>
            <select value={producer} onChange={(event) => setProducer(event.target.value)}>
              <option value="">Todas</option>
              {producerOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <button className={styles.clearButton} type="button" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>

        <div className={styles.resultBar}>
          <strong>{filteredProducts.length}</strong>
          <span>
            {filteredProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className={styles.productGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                storeName={getProducerById(product.producerId)?.name ?? product.storeName}
                onClick={() => onProductSelect(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <h2>No encontramos productos con esos filtros</h2>
            <p>Prueba con otra categoria, productora o termino de busqueda.</p>
            <button className="primaryButton" type="button" onClick={clearFilters}>
              Ver todos los productos
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
