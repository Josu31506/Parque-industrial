import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import imageCompression from 'browser-image-compression';
import type { ProductFormInput } from '../services/productsService';
import { uploadProductImage } from '../services/uploadsService';
import type { Category, Producer, Product, PurchaseRequest, PurchaseRequestGroup, Quote, Sale, SellerEarnings } from '../types';
import { formatOrderNumber, getCategoryDisplayName, getSaleDisplayName } from '../utils/displayNames';
import {
  getActiveLabel,
  getConfirmationLabel,
  getFundsStatusLabel,
  getProductTypeLabel,
  getPurchaseRequestGroupStatusLabel,
  getSaleStatusLabel,
} from '../utils/statusLabels';
import styles from './SellerDashboardView.module.css';

type PersistedSellerDashboardTab = 'summary' | 'products' | 'create' | 'requests' | 'sales' | 'quotes' | 'earnings' | 'profile';
type SellerDashboardTab = PersistedSellerDashboardTab | 'quoteResponse';

type SellerDashboardViewProps = {
  activeProducerId: string;
  categories: Category[];
  error?: string;
  initialEditProductId?: string | null;
  initialTab?: PersistedSellerDashboardTab;
  isLoading?: boolean;
  products: Product[];
  producers: Producer[];
  quotes: Quote[];
  requests: PurchaseRequest[];
  sales: Sale[];
  earnings?: SellerEarnings | null;
  onConfirmRequest: (requestId: string, producerId: string, readyDate: string, observation: string) => void;
  onCreateProduct: (data: ProductFormInput) => Promise<Product>;
  onClearEditProduct?: () => void;
  onDeleteProduct: (productId: string) => Promise<Product>;
  onRefresh: () => void;
  onMarkSaleDispatched: (saleId: string) => Promise<void>;
  onMarkSaleInPreparation: (saleId: string) => Promise<void>;
  onMarkSaleReady: (saleId: string) => Promise<void>;
  onRespondQuote: (quoteId: string, data: { quotedPrice: number; quotedDeliveryDays: number; sellerComment?: string; validUntil?: string }) => Promise<void>;
  onTabChange?: (tab: PersistedSellerDashboardTab) => void;
  onUpdateProducerProfile: (data: Record<string, string>) => Promise<void>;
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

const validSellerTabs: PersistedSellerDashboardTab[] = ['summary', 'products', 'create', 'requests', 'sales', 'quotes', 'earnings', 'profile'];

const isSellerDashboardTab = (value: string | null): value is PersistedSellerDashboardTab => (
  Boolean(value && validSellerTabs.includes(value as PersistedSellerDashboardTab))
);

const getPersistedSellerTab = (fallback: PersistedSellerDashboardTab) => {
  const storedTab = localStorage.getItem(SELLER_TAB_STORAGE_KEY);
  return isSellerDashboardTab(storedTab) ? storedTab : fallback;
};

const canRespondQuote = (quote: Quote) => (
  quote.status === 'PENDING_REVIEW'
  || quote.status === 'IN_COORDINATION'
  || quote.status === 'CONSULTING_PRODUCER'
);

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
  earnings,
  onConfirmRequest,
  onCreateProduct,
  onClearEditProduct,
  onDeleteProduct,
  onRefresh,
  onMarkSaleDispatched,
  onMarkSaleInPreparation,
  onMarkSaleReady,
  onRespondQuote,
  onTabChange,
  onUpdateProducerProfile,
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
  const [respondingQuoteId, setRespondingQuoteId] = useState<string | null>(null);
  const [quoteResponseError, setQuoteResponseError] = useState('');
  const [quoteResponseLoading, setQuoteResponseLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (isSellerDashboardTab(localStorage.getItem(SELLER_TAB_STORAGE_KEY))) return;
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (tab === 'quoteResponse') return;
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
  const respondingQuote = quotes.find((quote) => quote.id === respondingQuoteId);

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

  const openQuoteResponse = (quoteId: string) => {
    setRespondingQuoteId(quoteId);
    setQuoteResponseError('');
    setMessage('');
    setActiveTab('quoteResponse');
  };

  const closeQuoteResponse = () => {
    setRespondingQuoteId(null);
    setQuoteResponseError('');
    setActiveTab('quotes');
  };

  const handleRespondQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!respondingQuoteId) return;
    const formData = new FormData(event.currentTarget);
    const quotedPriceText = getInputValue(formData, 'quotedPrice');
    const quotedPrice = Number(quotedPriceText);
    const quotedDeliveryDays = Number(getInputValue(formData, 'quotedDeliveryDays'));
    const validUntil = getInputValue(formData, 'validUntil');
    const sellerComment = getInputValue(formData, 'sellerComment');
    const proposalScope = getInputValue(formData, 'proposalScope');
    const materialNotes = getInputValue(formData, 'materialNotes');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setQuoteResponseError('');

    if (!Number.isFinite(quotedPrice) || quotedPrice <= 0 || quotedPrice > MAX_PRODUCT_PRICE) {
      setQuoteResponseError('El precio debe estar entre S/ 0.01 y S/ 999,999.99.');
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(quotedPriceText)) {
      setQuoteResponseError('El precio solo puede tener hasta 2 decimales.');
      return;
    }

    if (!Number.isInteger(quotedDeliveryDays) || quotedDeliveryDays < 1) {
      setQuoteResponseError('El plazo de entrega debe ser de al menos 1 dia.');
      return;
    }

    if (sellerComment.length > 600 || proposalScope.length > 600 || materialNotes.length > 600) {
      setQuoteResponseError('Los comentarios deben tener como maximo 600 caracteres.');
      return;
    }

    if (validUntil) {
      const validUntilDate = new Date(`${validUntil}T00:00:00`);
      if (validUntilDate < today) {
        setQuoteResponseError('La validez de la propuesta no puede ser una fecha pasada.');
        return;
      }
    }

    try {
      setQuoteResponseLoading(true);
      await onRespondQuote(respondingQuoteId, {
        quotedPrice,
        quotedDeliveryDays,
        sellerComment: [
          sellerComment,
          proposalScope ? `Incluye: ${proposalScope}` : '',
          materialNotes ? `Materiales/acabados: ${materialNotes}` : '',
        ].filter(Boolean).join('\n\n') || undefined,
        validUntil: validUntil || undefined,
      });
      setRespondingQuoteId(null);
      setQuoteResponseError('');
      setMessage('Cotizacion respondida correctamente.');
      setActiveTab('quotes');
    } catch (quoteError) {
      setQuoteResponseError(quoteError instanceof Error ? quoteError.message : 'No se pudo responder la cotizacion.');
    } finally {
      setQuoteResponseLoading(false);
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSavingProfile(true);
    setMessage('');

    try {
      await onUpdateProducerProfile({
        businessName: getInputValue(formData, 'businessName'),
        type: getInputValue(formData, 'type'),
        location: getInputValue(formData, 'location'),
        description: getInputValue(formData, 'description'),
        imageUrl: getInputValue(formData, 'imageUrl'),
        phone: getInputValue(formData, 'phone'),
        bankName: getInputValue(formData, 'bankName'),
        bankAccountNumber: getInputValue(formData, 'bankAccountNumber'),
        bankAccountType: getInputValue(formData, 'bankAccountType'),
        cci: getInputValue(formData, 'cci'),
        accountHolderName: getInputValue(formData, 'accountHolderName'),
      });
      setMessage('Perfil de productora actualizado correctamente.');
    } catch (profileError) {
      setMessage(profileError instanceof Error ? profileError.message : 'No se pudo actualizar el perfil.');
    } finally {
      setSavingProfile(false);
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
          <button className={tab === 'earnings' ? styles.active : undefined} type="button" onClick={() => setActiveTab('earnings')}>Ingresos</button>
          <button className={tab === 'profile' ? styles.active : undefined} type="button" onClick={() => setActiveTab('profile')}>Perfil de productora</button>
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
                  {quote.quotedPrice && <p><span>Precio respondido</span><strong>{formatMoney(quote.quotedPrice)}</strong></p>}
                  {quote.quotedDeliveryDays && <p><span>Plazo</span><strong>{quote.quotedDeliveryDays} dias</strong></p>}
                </div>
                {canRespondQuote(quote) && (
                  <div className={styles.actions}>
                    <button className="primaryButton" type="button" onClick={() => openQuoteResponse(quote.id)}>
                      Gestionar cotizacion
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {tab === 'quoteResponse' && (
          <div className={styles.quoteResponsePage}>
            <div className={styles.quoteResponseHeader}>
              <button className={styles.secondaryButton} type="button" onClick={closeQuoteResponse}>
                Volver a cotizaciones
              </button>
              <div>
                <h2>Responder cotizacion</h2>
                <p>Revisa la solicitud del cliente y envia una propuesta clara.</p>
              </div>
            </div>

            {!respondingQuote ? (
              <div className={styles.empty}>
                No encontramos la cotizacion seleccionada.
              </div>
            ) : (
              <div className={styles.quoteResponseLayout}>
                <article className={styles.quoteSummaryCard}>
                  <span className={styles.kicker}>Solicitud del cliente</span>
                  <h3>{respondingQuote.title}</h3>
                  <p>{respondingQuote.description}</p>

                  <div className={styles.quoteInfoGrid}>
                    <p><span>Cliente</span><strong>{respondingQuote.customer?.name ?? 'Cliente registrado'}</strong></p>
                    <p><span>Producto base</span><strong>{respondingQuote.product?.title ?? 'Producto base'}</strong></p>
                    <p><span>Cantidad</span><strong>{respondingQuote.quantity}</strong></p>
                    <p><span>Creada</span><strong>{respondingQuote.createdAt}</strong></p>
                    <p><span>Medidas</span><strong>{respondingQuote.requestedDimensions ?? 'No especificado'}</strong></p>
                    <p><span>Material</span><strong>{respondingQuote.requestedMaterial ?? 'No especificado'}</strong></p>
                    <p><span>Color</span><strong>{respondingQuote.requestedColor ?? 'No especificado'}</strong></p>
                    <p><span>Acabado</span><strong>{respondingQuote.requestedFinish ?? 'No especificado'}</strong></p>
                  </div>

                  {respondingQuote.referenceImages?.length ? (
                    <div className={styles.quoteReferenceImages}>
                      {respondingQuote.referenceImages.map((image, index) => (
                        <img src={image} alt={`Referencia ${index + 1}`} key={`${image}-${index}`} />
                      ))}
                    </div>
                  ) : (
                    <p className={styles.helperText}>Esta solicitud no incluye imagenes de referencia.</p>
                  )}
                </article>

                <form className={styles.quoteResponseForm} onSubmit={handleRespondQuote}>
                  <div>
                    <span className={styles.kicker}>Propuesta para el cliente</span>
                    <h3>Condiciones de la cotizacion</h3>
                  </div>

                  <div className={styles.quoteFormGrid}>
                    <label>
                      <span>Precio cotizado</span>
                      <input name="quotedPrice" type="number" min="0.01" max="999999.99" step="0.01" required defaultValue={respondingQuote.quotedPrice ?? ''} />
                    </label>
                    <label>
                      <span>Plazo de entrega en dias</span>
                      <input name="quotedDeliveryDays" type="number" min="1" required defaultValue={respondingQuote.quotedDeliveryDays ?? ''} />
                    </label>
                    <label>
                      <span>Validez de la propuesta</span>
                      <input name="validUntil" type="date" />
                    </label>
                    <label className={styles.full}>
                      <span>Comentario / condiciones</span>
                      <textarea name="sellerComment" placeholder="Indica condiciones comerciales, coordinaciones o restricciones importantes." defaultValue={respondingQuote.sellerComment ?? ''} />
                    </label>
                    <label className={styles.full}>
                      <span>Que incluye la propuesta</span>
                      <textarea name="proposalScope" placeholder="Ejemplo: fabricacion, acabado, embalaje, accesorios o instalacion si aplica." />
                    </label>
                    <label className={styles.full}>
                      <span>Observaciones sobre materiales o acabados</span>
                      <textarea name="materialNotes" placeholder="Detalla madera, tela, color, acabado, variaciones o alternativas disponibles." />
                    </label>
                  </div>

                  {quoteResponseError && <p className={styles.error}>{quoteResponseError}</p>}

                  <div className={styles.quoteActions}>
                    <button className={styles.secondaryButton} type="button" disabled={quoteResponseLoading} onClick={closeQuoteResponse}>
                      Cancelar
                    </button>
                    <button className="primaryButton" type="submit" disabled={quoteResponseLoading}>
                      {quoteResponseLoading ? 'Enviando respuesta...' : 'Enviar respuesta'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {tab === 'earnings' && (
          <div className={styles.list}>
            {!earnings ? (
              <div className={styles.empty}>Cargando ingresos...</div>
            ) : (
              <>
                <div className={styles.summaryGrid}>
                  <article><span>Vendido bruto</span><strong>{formatMoney(earnings.summary.grossTotal)}</strong></article>
                  <article><span>Comision</span><strong>{formatMoney(earnings.summary.commissionTotal)}</strong></article>
                  <article><span>Neto</span><strong>{formatMoney(earnings.summary.netTotal)}</strong></article>
                  <article><span>Retenido</span><strong>{formatMoney(earnings.summary.heldTotal)}</strong></article>
                  <article><span>Disponible</span><strong>{formatMoney(earnings.summary.releasedTotal)}</strong></article>
                  <article><span>Pagado</span><strong>{formatMoney(earnings.summary.paidTotal)}</strong></article>
                </div>
                <article className={styles.card}>
                  <h2>Cuenta configurada</h2>
                  <div className={styles.groupFacts}>
                    <p><span>Banco</span><strong>{earnings.bankAccount?.bankName ?? 'No configurado'}</strong></p>
                    <p><span>Cuenta</span><strong>{earnings.bankAccount?.bankAccountNumber ?? 'No configurado'}</strong></p>
                    <p><span>CCI</span><strong>{earnings.bankAccount?.cci ?? 'No configurado'}</strong></p>
                    <p><span>Titular</span><strong>{earnings.bankAccount?.accountHolderName ?? 'No configurado'}</strong></p>
                  </div>
                </article>
                {earnings.items.map((item) => (
                  <article className={styles.card} key={item.saleId}>
                    <div className={styles.cardHeader}>
                      <div>
                        <h2>{formatOrderNumber(item.orderNumber, item.orderId)}</h2>
                        <p>Venta: {item.createdAt}</p>
                      </div>
                      <span className={styles.status}>{getFundsStatusLabel(item.fundsStatus)}</span>
                    </div>
                    <div className={styles.moneyGrid}>
                      <p><span>Bruto</span><strong>{formatMoney(item.grossAmount)}</strong></p>
                      <p><span>Comision</span><strong>{formatMoney(item.commissionAmount)}</strong></p>
                      <p><span>Neto</span><strong>{formatMoney(item.netAmount)}</strong></p>
                      <p><span>Liberado</span><strong>{item.releasedAt ?? 'Pendiente'}</strong></p>
                    </div>
                  </article>
                ))}
              </>
            )}
          </div>
        )}

        {tab === 'profile' && producer && (
          <form className={styles.productForm} onSubmit={handleProfileSubmit}>
            <div className={styles.formHeader}>
              <div>
                <h2>Perfil de productora</h2>
                <p>Estos datos se muestran en el perfil publico y se usan para pagos.</p>
              </div>
            </div>
            <div className={styles.formGridWide}>
              <label><span>Nombre comercial</span><input name="businessName" required defaultValue={producer.name} /></label>
              <label><span>Tipo</span><input name="type" required defaultValue={producer.type} /></label>
              <label><span>Ubicacion</span><input name="location" required defaultValue={producer.location} /></label>
              <label><span>Telefono</span><input name="phone" defaultValue={producer.phone ?? ''} /></label>
              <label className={styles.full}><span>Descripcion</span><textarea name="description" required defaultValue={producer.description} /></label>
              <label className={styles.full}><span>Imagen o logo URL</span><input name="imageUrl" defaultValue={producer.image ?? ''} /></label>
              <label><span>Banco</span><input name="bankName" defaultValue={producer.bankName ?? ''} /></label>
              <label><span>Tipo de cuenta</span><input name="bankAccountType" defaultValue={producer.bankAccountType ?? ''} /></label>
              <label><span>Numero de cuenta</span><input name="bankAccountNumber" defaultValue={producer.bankAccountNumber ?? ''} /></label>
              <label><span>CCI</span><input name="cci" defaultValue={producer.cci ?? ''} /></label>
              <label className={styles.full}><span>Titular</span><input name="accountHolderName" defaultValue={producer.accountHolderName ?? ''} /></label>
            </div>
            <div className={styles.actions}>
              <button className="primaryButton" type="submit" disabled={savingProfile}>
                {savingProfile ? 'Guardando...' : 'Guardar perfil'}
              </button>
            </div>
          </form>
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
