import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard/ProductCard';
import type { CatalogFilter, Category, Producer, Product, ProductType } from '../types';
import styles from './CatalogView.module.css';

type CatalogViewProps = {
  catalogError?: string;
  categories: Category[];
  initialFilter: CatalogFilter | null;
  isLoadingCatalog?: boolean;
  onProductSelect: (productId: string) => void;
  producers: Producer[];
  products: Product[];
  quoteMode?: boolean;
};

const normalize = (value: string) => value.trim().toLowerCase();

export default function CatalogView({
  catalogError,
  categories,
  initialFilter,
  isLoadingCatalog,
  onProductSelect,
  producers,
  products,
  quoteMode = false,
}: CatalogViewProps) {
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
  ), [producers]);

  const filteredProducts = products.filter((product) => {
    const text = normalize(`${product.title} ${product.storeName} ${product.category ?? ''}`);
    const matchesQuery = query ? text.includes(normalize(query)) : true;
    const matchesCategory = category
      ? product.category === category || product.categoryId === category
      : true;
    const matchesType = productType ? product.type === productType : true;
    const matchesProducer = producer
      ? product.producerId === producer || product.storeName === producer
      : true;

    return matchesQuery && matchesCategory && matchesType && matchesProducer;
  }).sort((left, right) => {
    if (!quoteMode) return 0;
    const quotePriority = (product: Product) => (
      product.customizable ? 0 : 1
    );
    return quotePriority(left) - quotePriority(right);
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
          <h1>Catalogo de productos</h1>
          <p>
            Encuentra muebles, decoracion y productos sostenibles de productores locales.
          </p>
          {quoteMode && (
            <p className={styles.modeNotice}>
              Selecciona el producto que deseas personalizar. Mostramos primero los productos preparados para cotizacion.
            </p>
          )}
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

        {isLoadingCatalog && <p>Cargando productos...</p>}
        {catalogError && <p>{catalogError}</p>}

        {!isLoadingCatalog && filteredProducts.length > 0 ? (
          <div className={styles.productGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                storeName={producers.find((item) => item.id === product.producerId)?.name ?? product.storeName}
                onClick={() => onProductSelect(product.id)}
              />
            ))}
          </div>
        ) : !isLoadingCatalog ? (
          <div className={styles.empty}>
            <h2>No encontramos productos con esos filtros</h2>
            <p>Prueba con otra categoria, productora o termino de busqueda.</p>
            <button className="primaryButton" type="button" onClick={clearFilters}>
              Ver todos los productos
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
