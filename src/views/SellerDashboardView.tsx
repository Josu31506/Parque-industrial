import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import imageCompression from 'browser-image-compression';
import type { ProductFormInput } from '../services/productsService';
import { uploadProductImage } from '../services/uploadsService';
import type { Category, Producer, Product, PurchaseRequest, PurchaseRequestGroup, Quote, Sale } from '../types';
import { getCategoryDisplayName, getSaleDisplayName } from '../utils/displayNames';
import {
  getActiveLabel,
  getConfirmationLabel,
  getFundsStatusLabel,
  getProductTypeLabel,
  getPurchaseRequestGroupStatusLabel,
  getSaleStatusLabel,
} from '../utils/statusLabels';
import styles from './SellerDashboardView.module.css';

type SellerDashboardTab = 'summary' | 'products' | 'create' | 'requests' | 'sales' | 'quotes';

type SellerDashboardViewProps = {
  activeProducerId: string;
  categories: Category[];
  error?: string;
  initialEditProductId?: string | null;
  initialTab?: SellerDashboardTab;
  isLoading?: boolean;
  products: Product[];
  producers: Producer[];
  quotes: Quote[];
  requests: PurchaseRequest[];
  sales: Sale[];
  onConfirmRequest: (requestId: string, producerId: string, readyDate: string, observation: string) => void;
  onCreateProduct: (data: ProductFormInput) => Promise<Product>;
  onClearEditProduct?: () => void;
  onDeleteProduct: (productId: string) => Promise<Product>;
  onRefresh: () => void;
  onMarkSaleDispatched: (saleId: string) => Promise<void>;
  onMarkSaleInPreparation: (saleId: string) => Promise<void>;
  onMarkSaleReady: (saleId: string) => Promise<void>;
  onTabChange?: (tab: SellerDashboardTab) => void;
  onViewProduct: (productId: string) => void;
  onRejectRequest: (requestId: string, producerId: string, observation: string) => void;
  onUpdateProduct: (productId: string, data: ProductFormInput) => Promise<Product>;
};

type ProductFormProps = {
  categories: Category[];
  initialProduct?: Product;
  producerId: string;
  onCancelEdit: () => void;
  onCreateProduct: (data: ProductFormInput) => Promise<Product>;
  onSaved: (message: string) => void;
  onUpdateProduct: (productId: string, data: ProductFormInput) => Promise<Product>;
};

const formatMoney = (value: number) => `S/. ${value.toLocaleString('es-PE')}`;
const SELLER_TAB_STORAGE_KEY = 'sellerDashboardActiveTab';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_PRODUCT_PRICE = 999999.99;
const SKIP_COMPRESSION_SIZE = 500 * 1024;
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const isDevelopment = import.meta.env.DEV;

const getInputValue = (formData: FormData, name: string) => (
  String(formData.get(name) ?? '').trim()
);

const timeStart = (label: string) => {
  if (isDevelopment) console.time(label);
};

const timeEnd = (label: string) => {
  if (isDevelopment) console.timeEnd(label);
};

const validSellerTabs: SellerDashboardTab[] = ['summary', 'products', 'create', 'requests', 'sales', 'quotes'];

const isSellerDashboardTab = (value: string | null): value is SellerDashboardTab => (
  Boolean(value && validSellerTabs.includes(value as SellerDashboardTab))
);

const getPersistedSellerTab = (fallback: SellerDashboardTab) => {
  const storedTab = localStorage.getItem(SELLER_TAB_STORAGE_KEY);
  return isSellerDashboardTab(storedTab) ? storedTab : fallback;
};

const compressImage = async (file: File): Promise<File> => {
  if (file.size <= SKIP_COMPRESSION_SIZE) return file;

  const compressedFile = await imageCompression(file, {
    fileType: 'image/webp',
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  });

  const normalizedName = file.name.replace(/\.[^.]+$/, '.webp');
  return new File([compressedFile], normalizedName, { type: 'image/webp', lastModified: Date.now() });
};

function ProductForm({
  categories,
  initialProduct,
  producerId,
  onCancelEdit,
  onCreateProduct,
  onSaved,
  onUpdateProduct,
}: ProductFormProps) {
  const initialRequiresConfirmation = initialProduct?.requiresConfirmation === true
    || initialProduct?.availabilityType === 'MADE_TO_ORDER';
  const [saleMode, setSaleMode] = useState<'direct' | 'confirmation'>(
    initialRequiresConfirmation ? 'confirmation' : 'direct',
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialProduct?.image ?? '');
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const isSubmitting = isOptimizingImage || isUploadingImage || isSavingProduct;

  useEffect(() => {
    const nextRequiresConfirmation = initialProduct?.requiresConfirmation === true
      || initialProduct?.availabilityType === 'MADE_TO_ORDER';
    setSaleMode(nextRequiresConfirmation ? 'confirmation' : 'direct');
    setSelectedImage(null);
    setPreviewUrl(initialProduct?.image ?? '');
    setStatusMessage('');
    setError('');
  }, [initialProduct?.id, initialProduct?.availabilityType, initialProduct?.image]);

  useEffect(() => () => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleSaleModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSaleMode(event.target.value as 'direct' | 'confirmation');
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError('');

    if (!file) {
      setSelectedImage(null);
      setPreviewUrl(initialProduct?.image ?? '');
      return;
    }

    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      setError('Solo puedes subir imagenes JPG, PNG o WEBP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('La imagen no debe superar 5 MB.');
      event.target.value = '';
      return;
    }

    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    timeStart('total-product-submit');
    setIsSavingProduct(true);
    setStatusMessage('Preparando informacion del producto...');
    setError('');

    const priceText = getInputValue(formData, 'numericPrice');
    const price = Number(priceText);
    const stockValue = getInputValue(formData, 'stock');
    const dispatchValue = getInputValue(formData, 'estimatedDispatchDays');
    let imageUrl = initialProduct?.image ?? '';

    try {
      if (!Number.isFinite(price) || price <= 0 || price > MAX_PRODUCT_PRICE) {
        setError('El precio debe estar entre S/ 0.01 y S/ 999,999.99.');
        return;
      }

      if (!/^\d+(\.\d{1,2})?$/.test(priceText)) {
        setError('El precio solo puede tener hasta 2 decimales.');
        return;
      }

      if (saleMode === 'direct' && (!stockValue || Number(stockValue) < 0)) {
        setError('El stock es obligatorio para productos en stock.');
        return;
      }

      if (saleMode === 'confirmation' && (!dispatchValue || Number(dispatchValue) <= 0)) {
        setError('Indica los dias estimados de preparacion.');
        return;
      }

      if (!imageUrl && !selectedImage) {
        setError('Selecciona una imagen clara del producto.');
        return;
      }

      if (selectedImage) {
        setIsOptimizingImage(true);
        setStatusMessage('Optimizando imagen...');
        timeStart('optimize-image');
        const imageToUpload = await compressImage(selectedImage);
        timeEnd('optimize-image');
        setIsOptimizingImage(false);

        setIsUploadingImage(true);
        setStatusMessage('Subiendo imagen optimizada...');
        timeStart('upload-image');
        const uploadedImage = await uploadProductImage(imageToUpload);
        timeEnd('upload-image');
        imageUrl = uploadedImage.url;
        setIsUploadingImage(false);
      }

      const data: ProductFormInput = {
        availabilityType: saleMode === 'direct' ? 'IN_STOCK' : 'MADE_TO_ORDER',
        badge: getInputValue(formData, 'badge') || undefined,
        categoryId: getInputValue(formData, 'categoryId') || undefined,
        colors: getInputValue(formData, 'colors')
          .split(',')
          .map((color) => color.trim())
          .filter(Boolean),
        customizable: formData.get('customizable') === 'on',
        description: getInputValue(formData, 'description'),
        dimensions: getInputValue(formData, 'dimensions') || undefined,
        estimatedDispatchDays: dispatchValue ? Number(dispatchValue) : null,
        finish: getInputValue(formData, 'finish') || undefined,
        imageUrl,
        isActive: formData.get('isActive') === 'on',
        materials: getInputValue(formData, 'materials') || undefined,
        numericPrice: price,
        producerId,
        requiresConfirmation: saleMode === 'confirmation',
        stock: saleMode === 'direct' ? Number(stockValue) : null,
        title: getInputValue(formData, 'title'),
        type: getInputValue(formData, 'type') as ProductFormInput['type'],
      };

      setIsSavingProduct(true);
      setStatusMessage('Guardando informacion del producto...');
      timeStart('save-product');
      if (initialProduct) {
        await onUpdateProduct(initialProduct.id, data);
        timeEnd('save-product');
        onSaved('Producto actualizado correctamente.');
      } else {
        await onCreateProduct(data);
        timeEnd('save-product');
        onSaved('Producto publicado correctamente.');
        form.reset();
        setSaleMode('direct');
        setSelectedImage(null);
        setPreviewUrl('');
      }
    } catch (requestError) {
      const fallbackMessage = selectedImage
        ? 'No se pudo subir la imagen o guardar el producto. Intenta con una imagen mas liviana.'
        : 'No se pudo guardar el producto.';
      setError(requestError instanceof Error ? requestError.message : fallbackMessage);
    } finally {
      timeEnd('total-product-submit');
      setIsOptimizingImage(false);
      setIsUploadingImage(false);
      setIsSavingProduct(false);
      setStatusMessage('');
    }
  };

  return (
    <form className={styles.productForm} onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <div>
          <h2>{initialProduct ? 'Editar producto' : 'Subir producto'}</h2>
          <p>El producto se asociara a tu productora automaticamente.</p>
        </div>
        {initialProduct && (
          <button className={styles.ghostButton} type="button" onClick={onCancelEdit}>
            Cancelar edicion
          </button>
        )}
      </div>

      <div className={styles.formSection}>
        <h3>Informacion basica</h3>
        <div className={styles.formGridWide}>
        <label>
          <span>Titulo del producto</span>
          <input name="title" required defaultValue={initialProduct?.title ?? ''} />
        </label>
        <label>
          <span>Categoria</span>
          <select name="categoryId" required defaultValue={initialProduct?.categoryId ?? ''}>
            <option value="" disabled>Selecciona categoria</option>
            {categories.map((category) => (
              <option key={category.id ?? category.name} value={category.id ?? category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.full}>
          <span>Descripcion</span>
          <textarea name="description" required defaultValue={initialProduct?.description ?? ''} />
        </label>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3>Precio y stock</h3>
        <div className={styles.formGridWide}>
        <label>
          <span>Precio</span>
          <input
            name="numericPrice"
            type="number"
            min="0.01"
            max="999999.99"
            step="0.01"
            required
            defaultValue={initialProduct?.numericPrice ?? ''}
          />
        </label>
        {saleMode === 'direct' && (
          <label>
            <span>Stock</span>
            <input name="stock" type="number" min="0" required defaultValue={initialProduct?.stock ?? ''} />
          </label>
        )}
        {saleMode === 'confirmation' && (
          <label>
            <span>Dias estimados</span>
            <input name="estimatedDispatchDays" type="number" min="1" required defaultValue={initialProduct?.estimatedDispatchDays ?? ''} />
          </label>
        )}
        </div>
      </div>

      <div className={styles.formSection}>
        <h3>Imagen del producto</h3>
        <div className={styles.uploadBox}>
          <div className={styles.previewBox}>
            {previewUrl ? <img src={previewUrl} alt="Vista previa del producto" /> : <span>Sin imagen</span>}
          </div>
          <div className={styles.uploadCopy}>
            <strong>{initialProduct ? 'Cambiar imagen' : 'Seleccionar imagen'}</strong>
            <p>Sube una imagen clara del producto en JPG, PNG o WEBP. Maximo 5 MB.</p>
            <input
              accept="image/jpeg,image/png,image/webp"
              disabled={isSubmitting}
              name="productImage"
              type="file"
              onChange={handleImageChange}
            />
            {isOptimizingImage && <small>Optimizando imagen...</small>}
            {isUploadingImage && <small>Subiendo imagen...</small>}
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3>Configuracion de venta</h3>
        <div className={styles.formGridWide}>
        <label>
          <span>Badge</span>
          <select name="badge" defaultValue={initialProduct?.badge ?? ''}>
            <option value="">Sin badge</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Oferta">Oferta</option>
            <option value="Producto sostenible">Producto sostenible</option>
            <option value="Personalizable">Personalizable</option>
          </select>
        </label>
        <label>
          <span>Tipo de producto</span>
          <select name="type" defaultValue={initialProduct?.type ?? 'normal'}>
            <option value="featured">Destacado</option>
            <option value="eco">Sostenible</option>
            <option value="normal">Regular</option>
          </select>
        </label>
        <label>
          <span>Tipo de venta</span>
          <select name="saleMode" value={saleMode} onChange={handleSaleModeChange}>
            <option value="direct">Compra directa con stock</option>
            <option value="confirmation">Requiere confirmacion</option>
          </select>
        </label>
        <label>
          <span>Dimensiones</span>
          <input name="dimensions" defaultValue={initialProduct?.technicalDetails?.dimensions ?? ''} />
        </label>
        <label>
          <span>Materiales</span>
          <input name="materials" defaultValue={initialProduct?.technicalDetails?.materials ?? ''} />
        </label>
        <label>
          <span>Colores disponibles</span>
          <input name="colors" placeholder="Natural, blanco, nogal" defaultValue={initialProduct?.technicalDetails?.colors?.join(', ') ?? ''} />
        </label>
        <label>
          <span>Acabado</span>
          <input name="finish" defaultValue={initialProduct?.technicalDetails?.finish ?? ''} />
        </label>
        </div>
      </div>

      <div className={styles.checkGrid}>
        <label>
          <input name="customizable" type="checkbox" defaultChecked={initialProduct?.customizable ?? false} />
          <span>Personalizable</span>
        </label>
        <label>
          <input name="isActive" type="checkbox" defaultChecked={initialProduct?.isActive !== false} />
          <span>Producto activo</span>
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {statusMessage && <p className={styles.progressMessage}>{statusMessage}</p>}

      <div className={styles.actions}>
        <button className="primaryButton" type="submit" disabled={isSubmitting}>
          {isOptimizingImage && 'Optimizando imagen...'}
          {isUploadingImage && 'Subiendo imagen...'}
          {isSavingProduct && !isOptimizingImage && !isUploadingImage && 'Guardando producto...'}
          {!isSubmitting && 'Guardar producto'}
        </button>
      </div>
    </form>
  );
}

export default function SellerDashboardView({
  activeProducerId,
  categories,
  error,
  initialEditProductId,
  initialTab = 'summary',
  isLoading = false,
  products,
  producers,
  quotes,
  requests,
  sales,
  onConfirmRequest,
  onCreateProduct,
  onClearEditProduct,
  onDeleteProduct,
  onRefresh,
  onMarkSaleDispatched,
  onMarkSaleInPreparation,
  onMarkSaleReady,
  onTabChange,
  onViewProduct,
  onRejectRequest,
  onUpdateProduct,
}: SellerDashboardViewProps) {
  const [tab, setTab] = useState<SellerDashboardTab>(() => getPersistedSellerTab(initialTab));
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [readyDates, setReadyDates] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [productPendingDeleteId, setProductPendingDeleteId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [pendingSaleAction, setPendingSaleAction] = useState<{
    label: string;
    saleId: string;
    run: () => Promise<void>;
  } | null>(null);
  const [loadingSaleId, setLoadingSaleId] = useState<string | null>(null);

  useEffect(() => {
    if (isSellerDashboardTab(localStorage.getItem(SELLER_TAB_STORAGE_KEY))) return;
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    localStorage.setItem(SELLER_TAB_STORAGE_KEY, tab);
    onTabChange?.(tab);
  }, [onTabChange, tab]);

  useEffect(() => {
    if (!initialEditProductId) return;
    setEditingProductId(initialEditProductId);
    setMessage('');
    setActiveTab('create');
  }, [initialEditProductId]);

  const producer = useMemo(
    () => producers.find((item) => item.id === activeProducerId),
    [activeProducerId, producers],
  );
  const sellerProducts = products;
  const sellerRequests = useMemo(
    () => requests
      .flatMap((request) => request.groupsByProducer.map((group) => ({ request, group })))
      .filter((entry): entry is { request: PurchaseRequest; group: PurchaseRequestGroup } => Boolean(entry.group)),
    [requests],
  );
  const sellerSales = sales;
  const editingProduct = sellerProducts.find((product) => product.id === editingProductId);

  useEffect(() => {
    if (!editingProductId) return;
    const productExists = products.some((product) => product.id === editingProductId);
    if (!productExists || editingProduct) return;
    setMessage('No tienes permiso para editar este producto.');
    setEditingProductId(null);
    onClearEditProduct?.();
    setActiveTab('products');
  }, [editingProduct, editingProductId, onClearEditProduct, products]);

  const setActiveTab = (nextTab: SellerDashboardTab) => {
    setTab(nextTab);
  };

  const summary = useMemo(() => ({
    activeProducts: sellerProducts.filter((product) => product.isActive !== false).length,
    customizableProducts: sellerProducts.filter((product) => product.customizable).length,
    outOfStockProducts: sellerProducts.filter((product) => product.availabilityType === 'IN_STOCK' && (product.stock ?? 0) <= 0).length,
    pendingRequests: sellerRequests.filter((entry) => entry.group.status === 'PENDING').length,
    pendingSales: sellerSales.filter((sale) => sale.status === 'NEW_SALE' || sale.status === 'IN_PREPARATION').length,
    totalProducts: sellerProducts.length,
  }), [sellerProducts, sellerRequests, sellerSales]);

  const openEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setMessage('');
    setActiveTab('create');
  };

  const handleSaved = (nextMessage: string) => {
    setMessage(nextMessage);
    setEditingProductId(null);
    onClearEditProduct?.();
    setActiveTab('products');
  };

  const requestSaleAction = (saleId: string, label: string, run: () => Promise<void>) => {
    setMessage('');
    setPendingSaleAction({ saleId, label, run });
  };

  const confirmSaleAction = async () => {
    if (!pendingSaleAction) return;
    setLoadingSaleId(pendingSaleAction.saleId);

    try {
      await pendingSaleAction.run();
      setPendingSaleAction(null);
    } catch (saleError) {
      setMessage(saleError instanceof Error ? saleError.message : 'No se pudo cambiar el estado de la venta.');
      setPendingSaleAction(null);
    } finally {
      setLoadingSaleId(null);
    }
  };

  const confirmDeleteProduct = async (productId: string) => {
    setDeletingProductId(productId);
    setMessage('');

    try {
      await onDeleteProduct(productId);
      setMessage('Producto eliminado correctamente.');
      setProductPendingDeleteId(null);
    } catch (deleteError) {
      const errorMessage = deleteError instanceof Error
        ? deleteError.message
        : 'No se pudo eliminar el producto. Intentalo nuevamente.';
      setMessage(errorMessage);
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>Panel productor</h1>
          <p>{producer ? `Gestion de ${producer.name}` : 'Gestiona productos, solicitudes y ventas de tu productora.'}</p>
        </div>

        <div className={styles.tabs}>
          <button className={tab === 'summary' ? styles.active : undefined} type="button" onClick={() => setActiveTab('summary')}>Resumen</button>
          <button className={tab === 'products' ? styles.active : undefined} type="button" onClick={() => setActiveTab('products')}>Mis productos</button>
          <button className={tab === 'create' ? styles.active : undefined} type="button" onClick={() => { setEditingProductId(null); setActiveTab('create'); }}>Subir producto</button>
          <button className={tab === 'requests' ? styles.active : undefined} type="button" onClick={() => setActiveTab('requests')}>Solicitudes de compra</button>
          <button className={tab === 'sales' ? styles.active : undefined} type="button" onClick={() => setActiveTab('sales')}>Ventas</button>
          <button className={tab === 'quotes' ? styles.active : undefined} type="button" onClick={() => setActiveTab('quotes')}>Cotizaciones</button>
        </div>

        {message && <p className={styles.success}>{message}</p>}
        {isLoading && <p className={styles.progressMessage}>Cargando panel productor...</p>}
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button type="button" onClick={onRefresh}>Reintentar</button>
          </div>
        )}

        {tab === 'summary' && (
          <div className={styles.summaryGrid}>
            <article><span>Total publicados</span><strong>{summary.totalProducts}</strong></article>
            <article><span>Productos activos</span><strong>{summary.activeProducts}</strong></article>
            <article><span>Sin stock</span><strong>{summary.outOfStockProducts}</strong></article>
            <article><span>Ventas pendientes</span><strong>{summary.pendingSales}</strong></article>
            <article><span>Solicitudes pendientes</span><strong>{summary.pendingRequests}</strong></article>
            <article><span>Personalizables</span><strong>{summary.customizableProducts}</strong></article>
          </div>
        )}

        {tab === 'products' && (
          <div className={styles.productsGrid}>
            {!isLoading && sellerProducts.length === 0 ? (
              <div className={styles.empty}>Aun no tienes productos publicados.</div>
            ) : sellerProducts.map((product) => {
              const isPendingDelete = productPendingDeleteId === product.id;
              const isDeleting = deletingProductId === product.id;

              return (
              <article className={styles.productCard} key={product.id}>
                <div className={styles.productImageWrap}>
                  {product.image ? (
                    <img className={styles.productImage} src={product.image} alt={product.title} />
                  ) : (
                    <span className={styles.imagePlaceholder}>Sin imagen</span>
                  )}
                </div>
                <div className={styles.cardBadges}>
                  <span className={`${styles.badge} ${product.isActive === false ? styles.badgeInactive : styles.badgeActive}`}>
                    {getActiveLabel(product.isActive)}
                  </span>
                  <span className={styles.badge}>
                    {getConfirmationLabel(product.requiresConfirmation)}
                  </span>
                  {product.customizable && <span className={styles.badge}>Personalizable</span>}
                </div>
                <div className={styles.productBody}>
                  {product.badge && <span className={styles.productBadge}>{product.badge}</span>}
                  <h2 className={styles.productTitle}>{product.title}</h2>
                  <p className={styles.productMeta}>{getCategoryDisplayName(undefined, product.category)}</p>
                  <strong className={styles.productPrice}>{product.price}</strong>
                </div>
                <div className={styles.productFacts}>
                  <p><span>Stock</span><strong>{product.stock === undefined ? 'No aplica' : `${product.stock} unidades`}</strong></p>
                  <p><span>Tipo de venta</span><strong>{getConfirmationLabel(product.requiresConfirmation)}</strong></p>
                  {product.estimatedDispatchDays && (
                    <p><span>Dias estimados</span><strong>{product.estimatedDispatchDays}</strong></p>
                  )}
                </div>
                <p className={styles.productDescription}>{product.description}</p>
                {isPendingDelete ? (
                  <div className={styles.deleteConfirm}>
                    <strong>¿Eliminar este producto?</strong>
                    <p>Esta accion retirara el producto del catalogo.</p>
                    <div className={styles.confirmActions}>
                      <button type="button" disabled={isDeleting} onClick={() => setProductPendingDeleteId(null)}>
                        Cancelar
                      </button>
                      <button
                        className={styles.deleteButton}
                        type="button"
                        disabled={isDeleting}
                        onClick={() => void confirmDeleteProduct(product.id)}
                      >
                        {isDeleting ? 'Eliminando...' : 'Si, eliminar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.cardActions}>
                    <button className="primaryButton" type="button" onClick={() => openEditProduct(product)}>
                      Editar producto
                    </button>
                    <button className={styles.deleteButton} type="button" onClick={() => setProductPendingDeleteId(product.id)}>
                      Eliminar producto
                    </button>
                    <button className={`${styles.ghostButton} ${styles.detailButton}`} type="button" onClick={() => onViewProduct(product.id)}>
                      Ver detalle
                    </button>
                  </div>
                )}
              </article>
              );
            })}
          </div>
        )}

        {tab === 'create' && (
          <ProductForm
            categories={categories}
            initialProduct={editingProduct}
            producerId={activeProducerId}
            onCancelEdit={() => {
              setEditingProductId(null);
              onClearEditProduct?.();
              setActiveTab('products');
            }}
            onCreateProduct={onCreateProduct}
            onSaved={handleSaved}
            onUpdateProduct={onUpdateProduct}
          />
        )}

        {tab === 'requests' && (
          <div className={styles.list}>
            {!isLoading && sellerRequests.length === 0 ? (
              <div className={styles.empty}>No hay solicitudes de compra para tus productos.</div>
            ) : sellerRequests.map(({ request, group }) => {
              const key = `${request.id}-${group.producerId}`;
              return (
                <article className={styles.card} key={key}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>Solicitud de {group.items.length} producto(s)</h2>
                      <p>{request.customerName || 'Cliente registrado'}</p>
                      <p>Fecha: {request.createdAt}</p>
                    </div>
                    <span className={styles.status}>{getPurchaseRequestGroupStatusLabel(group.status)}</span>
                  </div>

                  <div className={styles.items}>
                    {group.items.map((item) => (
                      <p key={item.productId}><span>{item.title}</span><strong>x{item.quantity}</strong></p>
                    ))}
                  </div>

                  {group.status === 'PENDING' ? (
                    <div className={styles.formGrid}>
                      <input
                        type="date"
                        value={readyDates[key] ?? ''}
                        onChange={(event) => setReadyDates((current) => ({ ...current, [key]: event.target.value }))}
                      />
                      <input
                        type="text"
                        placeholder="Observacion opcional"
                        value={observations[key] ?? ''}
                        onChange={(event) => setObservations((current) => ({ ...current, [key]: event.target.value }))}
                      />
                      <button
                        className="primaryButton"
                        type="button"
                        onClick={() => onConfirmRequest(request.id, group.producerId, readyDates[key] || new Date().toISOString().slice(0, 10), observations[key] ?? '')}
                      >
                        Confirmar
                      </button>
                      <button
                        className="accentButton"
                        type="button"
                        onClick={() => onRejectRequest(request.id, group.producerId, observations[key] || 'No disponible en la fecha solicitada.')}
                      >
                        Rechazar
                      </button>
                    </div>
                  ) : (
                    <div className={styles.groupFacts}>
                      <p><span>Fecha lista</span><strong>{group.readyDate ?? 'Pendiente'}</strong></p>
                      <p><span>Observacion</span><strong>{group.observation ?? 'Sin observacion'}</strong></p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {tab === 'sales' && (
          <div className={styles.list}>
            {!isLoading && sellerSales.length === 0 ? (
              <div className={styles.empty}>Aun no tienes ventas confirmadas.</div>
            ) : sellerSales.map((sale) => {
              const canMarkInPreparation = sale.status === 'NEW_SALE';
              const canMarkReady = sale.status === 'IN_PREPARATION';
              const canMarkDispatched = sale.status === 'READY_FOR_DISPATCH';
              const isLoadingSale = loadingSaleId === sale.id;

              return (
              <article className={styles.card} key={sale.id}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2>{getSaleDisplayName(sale)}</h2>
                    <p>Fecha: {sale.createdAt}</p>
                  </div>
                  <span className={styles.status}>{getSaleStatusLabel(sale.status)}</span>
                </div>

                <div className={styles.items}>
                  {sale.items.map((item) => (
                    <p key={item.productId}><span>{item.title}</span><strong>x{item.quantity}</strong></p>
                  ))}
                </div>

                <div className={styles.moneyGrid}>
                  <p><span>Bruto</span><strong>{formatMoney(sale.grossAmount)}</strong></p>
                  <p><span>Comision</span><strong>{formatMoney(sale.commissionAmount)}</strong></p>
                  <p><span>Neto</span><strong>{formatMoney(sale.netAmount)}</strong></p>
                  <p><span>Fondos</span><strong>{getFundsStatusLabel(sale.fundsStatus)}</strong></p>
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.statusActionButton}
                    disabled={!canMarkInPreparation || isLoadingSale}
                    type="button"
                    onClick={() => requestSaleAction(sale.id, 'En preparación', () => onMarkSaleInPreparation(sale.id))}
                  >
                    {isLoadingSale && canMarkInPreparation ? 'Actualizando...' : 'En preparación'}
                  </button>
                  <button
                    className={styles.statusActionButton}
                    disabled={!canMarkReady || isLoadingSale}
                    type="button"
                    onClick={() => requestSaleAction(sale.id, 'Lista para despacho', () => onMarkSaleReady(sale.id))}
                  >
                    {isLoadingSale && canMarkReady ? 'Actualizando...' : 'Lista para despacho'}
                  </button>
                  <button
                    className={styles.statusActionButton}
                    disabled={!canMarkDispatched || isLoadingSale}
                    type="button"
                    onClick={() => requestSaleAction(sale.id, 'Despachada', () => onMarkSaleDispatched(sale.id))}
                  >
                    {isLoadingSale && canMarkDispatched ? 'Actualizando...' : 'Despachada'}
                  </button>
                </div>
                {sale.status === 'DISPATCHED' && (
                  <p className={styles.helperText}>Una vez despachado, el cliente confirmara la recepcion del pedido.</p>
                )}
                {sale.status === 'DELIVERED' && (
                  <p className={styles.helperText}>Venta entregada y confirmada por el cliente.</p>
                )}
              </article>
              );
            })}
          </div>
        )}

        {tab === 'quotes' && (
          <div className={styles.list}>
            {!isLoading && !error && quotes.length === 0 ? (
              <div className={styles.empty}>Aun no tienes cotizaciones asociadas a tus productos.</div>
            ) : quotes.map((quote) => (
              <article className={styles.card} key={quote.id}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2>{quote.title}</h2>
                    <p>{quote.description}</p>
                  </div>
                  <span className={styles.status}>{quote.status}</span>
                </div>
                <div className={styles.groupFacts}>
                  <p><span>Producto</span><strong>{quote.product?.title ?? 'Producto base'}</strong></p>
                  <p><span>Cantidad</span><strong>{quote.quantity}</strong></p>
                  <p><span>Creada</span><strong>{quote.createdAt}</strong></p>
                  <p><span>Cliente</span><strong>{quote.customer?.name ?? 'Cliente registrado'}</strong></p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {pendingSaleAction && (
        <div className={styles.modalOverlay} role="presentation">
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="sale-status-title">
            <h2 id="sale-status-title">Confirmar cambio de estado</h2>
            <p>
              ¿Seguro que deseas cambiar el estado de esta venta a "{pendingSaleAction.label}"?
              Esta acción no se podrá revertir.
            </p>
            <div className={styles.modalActions}>
              <button type="button" disabled={Boolean(loadingSaleId)} onClick={() => setPendingSaleAction(null)}>
                Cancelar
              </button>
              <button type="button" disabled={Boolean(loadingSaleId)} onClick={() => void confirmSaleAction()}>
                {loadingSaleId ? 'Confirmando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
