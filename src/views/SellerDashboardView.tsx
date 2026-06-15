import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { ProductFormInput } from '../services/productsService';
import type { Category, Notification, Producer, Product, PurchaseRequest, PurchaseRequestGroup, Sale } from '../types';
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

type SellerDashboardTab = 'summary' | 'products' | 'create' | 'requests' | 'sales' | 'notifications';

type SellerDashboardViewProps = {
  activeProducerId: string;
  categories: Category[];
  initialEditProductId?: string | null;
  initialTab?: SellerDashboardTab;
  notifications: Notification[];
  products: Product[];
  producers: Producer[];
  requests: PurchaseRequest[];
  sales: Sale[];
  onConfirmRequest: (requestId: string, producerId: string, readyDate: string, observation: string) => void;
  onCreateProduct: (data: ProductFormInput) => Promise<Product>;
  onClearEditProduct?: () => void;
  onMarkSaleDelivered: (saleId: string) => void;
  onMarkSaleDispatched: (saleId: string) => void;
  onMarkSaleInPreparation: (saleId: string) => void;
  onMarkSaleReady: (saleId: string) => void;
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

const getInputValue = (event: FormEvent<HTMLFormElement>, name: string) => (
  String(new FormData(event.currentTarget).get(name) ?? '').trim()
);

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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const nextRequiresConfirmation = initialProduct?.requiresConfirmation === true
      || initialProduct?.availabilityType === 'MADE_TO_ORDER';
    setSaleMode(nextRequiresConfirmation ? 'confirmation' : 'direct');
    setError('');
  }, [initialProduct?.id, initialProduct?.availabilityType]);

  const handleSaleModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSaleMode(event.target.value as 'direct' | 'confirmation');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    const price = Number(getInputValue(event, 'numericPrice'));
    const stockValue = getInputValue(event, 'stock');
    const dispatchValue = getInputValue(event, 'estimatedDispatchDays');

    if (!Number.isFinite(price) || price <= 0) {
      setError('Ingresa un precio mayor a 0.');
      setIsSaving(false);
      return;
    }

    if (saleMode === 'direct' && (!stockValue || Number(stockValue) < 0)) {
      setError('El stock es obligatorio para productos en stock.');
      setIsSaving(false);
      return;
    }

    if (saleMode === 'confirmation' && (!dispatchValue || Number(dispatchValue) <= 0)) {
      setError('Indica los dias estimados de preparacion.');
      setIsSaving(false);
      return;
    }

    const data: ProductFormInput = {
      availabilityType: saleMode === 'direct' ? 'IN_STOCK' : 'MADE_TO_ORDER',
      badge: getInputValue(event, 'badge') || undefined,
      categoryId: getInputValue(event, 'categoryId') || undefined,
      colors: getInputValue(event, 'colors')
        .split(',')
        .map((color) => color.trim())
        .filter(Boolean),
      customizable: new FormData(event.currentTarget).get('customizable') === 'on',
      description: getInputValue(event, 'description'),
      dimensions: getInputValue(event, 'dimensions') || undefined,
      estimatedDispatchDays: dispatchValue ? Number(dispatchValue) : null,
      finish: getInputValue(event, 'finish') || undefined,
      imageUrl: getInputValue(event, 'imageUrl'),
      isActive: new FormData(event.currentTarget).get('isActive') === 'on',
      materials: getInputValue(event, 'materials') || undefined,
      numericPrice: price,
      producerId,
      requiresConfirmation: saleMode === 'confirmation',
      stock: saleMode === 'direct' ? Number(stockValue) : null,
      title: getInputValue(event, 'title'),
      type: getInputValue(event, 'type') as ProductFormInput['type'],
    };

    try {
      if (initialProduct) {
        await onUpdateProduct(initialProduct.id, data);
        onSaved('Producto actualizado correctamente.');
      } else {
        await onCreateProduct(data);
        onSaved('Producto publicado correctamente.');
        event.currentTarget.reset();
        setSaleMode('direct');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el producto.');
    } finally {
      setIsSaving(false);
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
        <label>
          <span>Precio</span>
          <input name="numericPrice" type="number" min="0.01" step="0.01" required defaultValue={initialProduct?.numericPrice ?? ''} />
        </label>
        <label>
          <span>Imagen URL</span>
          <input name="imageUrl" required defaultValue={initialProduct?.image ?? ''} />
        </label>
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

      <div className={styles.actions}>
        <button className="primaryButton" type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : initialProduct ? 'Guardar cambios' : 'Publicar producto'}
        </button>
      </div>
    </form>
  );
}

export default function SellerDashboardView({
  activeProducerId,
  categories,
  initialEditProductId,
  initialTab = 'summary',
  notifications,
  products,
  producers,
  requests,
  sales,
  onConfirmRequest,
  onCreateProduct,
  onClearEditProduct,
  onMarkSaleDelivered,
  onMarkSaleDispatched,
  onMarkSaleInPreparation,
  onMarkSaleReady,
  onViewProduct,
  onRejectRequest,
  onUpdateProduct,
}: SellerDashboardViewProps) {
  const [tab, setTab] = useState<SellerDashboardTab>(initialTab);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [readyDates, setReadyDates] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!initialEditProductId) return;
    setEditingProductId(initialEditProductId);
    setMessage('');
    setTab('create');
  }, [initialEditProductId]);

  const producer = producers.find((item) => item.id === activeProducerId);
  const sellerProducts = products.filter((product) => product.producerId === activeProducerId);
  const sellerRequests = requests
    .map((request) => ({
      request,
      group: request.groupsByProducer.find((group) => group.producerId === activeProducerId),
    }))
    .filter((entry): entry is { request: PurchaseRequest; group: PurchaseRequestGroup } => Boolean(entry.group));
  const sellerSales = sales.filter((sale) => sale.producerId === activeProducerId);
  const sellerNotifications = notifications.filter((notification) => notification.role === 'seller').slice(0, 5);
  const editingProduct = sellerProducts.find((product) => product.id === editingProductId);

  useEffect(() => {
    if (!editingProductId) return;
    const productExists = products.some((product) => product.id === editingProductId);
    if (!productExists || editingProduct) return;
    setMessage('No tienes permiso para editar este producto.');
    setEditingProductId(null);
    onClearEditProduct?.();
    setTab('products');
  }, [editingProduct, editingProductId, onClearEditProduct, products]);

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
    setTab('create');
  };

  const handleSaved = (nextMessage: string) => {
    setMessage(nextMessage);
    setEditingProductId(null);
    onClearEditProduct?.();
    setTab('products');
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>Panel productor</h1>
          <p>{producer ? `Gestion de ${producer.name}` : 'Gestiona productos, solicitudes y ventas de tu productora.'}</p>
        </div>

        <div className={styles.tabs}>
          <button className={tab === 'summary' ? styles.active : undefined} type="button" onClick={() => setTab('summary')}>Resumen</button>
          <button className={tab === 'products' ? styles.active : undefined} type="button" onClick={() => setTab('products')}>Mis productos</button>
          <button className={tab === 'create' ? styles.active : undefined} type="button" onClick={() => { setEditingProductId(null); setTab('create'); }}>Subir producto</button>
          <button className={tab === 'requests' ? styles.active : undefined} type="button" onClick={() => setTab('requests')}>Solicitudes de compra</button>
          <button className={tab === 'sales' ? styles.active : undefined} type="button" onClick={() => setTab('sales')}>Ventas</button>
          <button className={tab === 'notifications' ? styles.active : undefined} type="button" onClick={() => setTab('notifications')}>Notificaciones</button>
        </div>

        {message && <p className={styles.success}>{message}</p>}

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
          <div className={styles.productGrid}>
            {sellerProducts.length === 0 ? (
              <div className={styles.empty}>Aun no tienes productos publicados.</div>
            ) : sellerProducts.map((product) => (
              <article className={styles.productCard} key={product.id}>
                <span
                  className={styles.productImage}
                  style={product.image ? { backgroundImage: `url(${product.image})` } : undefined}
                >
                  {!product.image && 'Sin imagen'}
                </span>
                <div>
                  {product.badge && <span className={styles.productBadge}>{product.badge}</span>}
                  <h2>{product.title}</h2>
                  <p>{getCategoryDisplayName(undefined, product.category)}</p>
                </div>
                <div className={styles.productFacts}>
                  <p><span>Precio</span><strong>{product.price}</strong></p>
                  <p><span>Tipo de venta</span><strong>{getConfirmationLabel(product.requiresConfirmation)}</strong></p>
                  <p><span>Stock</span><strong>{product.stock === undefined ? 'No aplica' : `${product.stock} unidades`}</strong></p>
                  {product.estimatedDispatchDays && (
                    <p><span>Dias estimados</span><strong>{product.estimatedDispatchDays}</strong></p>
                  )}
                  <p><span>Estado</span><strong>{getActiveLabel(product.isActive)}</strong></p>
                </div>
                <div className={styles.productActions}>
                  <button className="primaryButton" type="button" onClick={() => openEditProduct(product)}>
                    Editar producto
                  </button>
                  <button className={styles.ghostButton} type="button" onClick={() => onViewProduct(product.id)}>
                    Ver detalle
                  </button>
                </div>
              </article>
            ))}
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
              setTab('products');
            }}
            onCreateProduct={onCreateProduct}
            onSaved={handleSaved}
            onUpdateProduct={onUpdateProduct}
          />
        )}

        {tab === 'requests' && (
          <div className={styles.list}>
            {sellerRequests.length === 0 ? (
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
            {sellerSales.length === 0 ? (
              <div className={styles.empty}>Aun no tienes ventas confirmadas.</div>
            ) : sellerSales.map((sale) => (
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
                  <button className="primaryButton" type="button" onClick={() => onMarkSaleInPreparation(sale.id)}>
                    En preparacion
                  </button>
                  <button className="accentButton" type="button" onClick={() => onMarkSaleReady(sale.id)}>
                    Lista para despacho
                  </button>
                  <button className={styles.ghostButton} type="button" onClick={() => onMarkSaleDispatched(sale.id)}>
                    Despachada
                  </button>
                  <button className={styles.ghostButton} type="button" onClick={() => onMarkSaleDelivered(sale.id)}>
                    Entregada
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === 'notifications' && (
          <div className={styles.list}>
            {sellerNotifications.length === 0 ? (
              <div className={styles.empty}>No tienes notificaciones recientes.</div>
            ) : sellerNotifications.map((notification) => (
              <article className={styles.card} key={notification.id}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2>{notification.title}</h2>
                    <p>{notification.message}</p>
                  </div>
                  <span className={styles.status}>{notification.read ? 'Leida' : 'Nueva'}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
