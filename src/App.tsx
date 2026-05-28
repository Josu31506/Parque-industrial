import type { FormEvent } from 'react';
import { useState } from 'react';
import Footer from './components/Footer/Footer';
import Navbar from './components/Navbar/Navbar';
import { getProducerById, producers, products } from './data/catalog';
import type {
  CartItem,
  CatalogFilter,
  Claim,
  Notification,
  MarketplaceItem,
  Order,
  OrderProducerGroup,
  PaymentOption,
  PurchaseRequest,
  PurchaseRequestGroup,
  Role,
  Sale,
  SaleStatus,
  User,
  ViewName,
} from './types';
import CartView from './views/CartView';
import CatalogView from './views/CatalogView';
import ClaimsView from './views/ClaimsView';
import HomeView from './views/HomeView';
import LoginView from './views/LoginView';
import NotificationsView from './views/NotificationsView';
import OrdersView from './views/OrdersView';
import OrderSuccessView from './views/OrderSuccessView';
import OrderTrackingView from './views/OrderTrackingView';
import ProducerProfileView from './views/ProducerProfileView';
import ProductDetailView from './views/ProductDetailView';
import PurchaseRequestDetailView from './views/PurchaseRequestDetailView';
import PurchaseRequestsView from './views/PurchaseRequestsView';
import SellerDashboardView from './views/SellerDashboardView';
import SupportView from './views/SupportView';
import VerdecitoView from './views/VerdecitoView';

type TestUser = User & { password: string };

const TEST_USER: TestUser = {
  email: 'usuario@verdecito.com',
  name: 'Usuario Verdecito',
  password: '123456',
};

const SHIPPING_COST = 10;
const DELIVERY_DAYS = 2;
const PLATFORM_COMMISSION = 0.1;

const formatDate = (date: Date) => date.toLocaleDateString('es-PE');

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

export default function App() {
  const [view, setView] = useState<ViewName>('home');
  const [currentRole, setCurrentRole] = useState<Role>('customer');
  const [activeProducerId, setActiveProducerId] = useState('muebles-ves');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<ViewName>('home');
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter | null>(null);
  const [selectedProducerId, setSelectedProducerId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasPendingCheckout, setHasPendingCheckout] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [cartNotice, setCartNotice] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedPurchaseRequestId, setSelectedPurchaseRequestId] = useState<string | null>(null);

  const navigate = (nextView: ViewName) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addNotification = (
    role: Role,
    title: string,
    message: string,
    targetView?: ViewName,
  ) => {
    const notification: Notification = {
      id: `NT-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role,
      title,
      message,
      createdAt: formatDate(new Date()),
      read: false,
      targetView,
    };

    setNotifications((current) => [notification, ...current]);
  };

  const getMarketplaceItems = (items: CartItem[]): MarketplaceItem[] => (
    items.flatMap((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return [];

      const producer = getProducerById(product.producerId);

      return [{
        productId: product.id,
        quantity: item.quantity,
        title: product.title,
        price: product.price,
        numericPrice: product.numericPrice,
        producerId: product.producerId,
        producerName: producer?.name ?? product.storeName,
      }];
    })
  );

  const groupItemsByProducer = (items: MarketplaceItem[]): PurchaseRequestGroup[] => {
    const groups = new Map<string, PurchaseRequestGroup>();

    items.forEach((item) => {
      const producerId = item.producerId ?? 'sin-productora';
      const current = groups.get(producerId);

      if (current) {
        current.items.push(item);
        return;
      }

      groups.set(producerId, {
        producerId,
        producerName: item.producerName,
        items: [item],
        status: 'PENDING',
      });
    });

    return Array.from(groups.values());
  };

  const getItemsTotal = (items: MarketplaceItem[]) => (
    items.reduce((sum, item) => sum + item.numericPrice * item.quantity, 0) + SHIPPING_COST
  );

  const calculateEstimatedDelivery = (groups: PurchaseRequestGroup[]) => {
    const readyDates = groups
      .filter((group) => group.status === 'CONFIRMED' && group.readyDate)
      .map((group) => parseDate(group.readyDate as string).getTime());

    if (!readyDates.length) return undefined;

    return formatDate(addDays(new Date(Math.max(...readyDates)), DELIVERY_DAYS));
  };

  const createSalesFromOrder = (order: Order, groups: PurchaseRequestGroup[] | OrderProducerGroup[]) => {
    const createdAt = formatDate(new Date());
    const createdSales: Sale[] = groups.map((group) => {
      const grossAmount = group.items.reduce(
        (sum, item) => sum + item.numericPrice * item.quantity,
        0,
      );
      const commissionAmount = Math.round(grossAmount * PLATFORM_COMMISSION);

      return {
        id: `V-${Date.now()}-${group.producerId}`,
        orderId: order.id,
        producerId: group.producerId,
        producerName: group.producerName,
        items: group.items,
        grossAmount,
        commissionAmount,
        netAmount: grossAmount - commissionAmount,
        status: 'NEW_SALE',
        paymentStatus: order.paymentStatus ?? 'FULLY_PAID',
        fundsStatus: order.fundsStatus ?? 'HELD',
        readyDate: group.readyDate,
        observation: group.observation,
        createdAt,
      };
    });

    setSales((current) => [...createdSales, ...current]);
    addNotification('seller', 'Nueva venta confirmada', 'Tienes una nueva venta con pago retenido.', 'sellerDashboard');
  };

  const createOrder = (
    marketplaceItems: MarketplaceItem[],
    groups: PurchaseRequestGroup[],
    paymentOption: PaymentOption,
    estimatedDeliveryDate?: string,
  ) => {
    const total = getItemsTotal(marketplaceItems);
    const paidAmount = paymentOption === 'FULL_PAYMENT' ? total : total * 0.5;
    const orderGroups: OrderProducerGroup[] = groups.map((group) => ({
      producerId: group.producerId,
      producerName: group.producerName,
      items: group.items,
      status: 'NEW_SALE',
      readyDate: group.readyDate,
      observation: group.observation,
    }));

    const order: Order = {
      id: `PED-${Date.now()}`,
      date: formatDate(new Date()),
      items: marketplaceItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      marketplaceItems,
      producerGroups: orderGroups,
      total,
      status: 'En preparación',
      estimatedDeliveryDate,
      paymentOption,
      paidAmount,
      remainingAmount: total - paidAmount,
      paymentStatus: paymentOption === 'FULL_PAYMENT' ? 'FULLY_PAID' : 'PARTIALLY_PAID',
      fundsStatus: 'HELD',
    };

    setOrders((currentOrders) => [order, ...currentOrders]);
    setLastOrderId(order.id);
    setSelectedOrderId(order.id);
    createSalesFromOrder(order, groups);
    addNotification('customer', 'Pago registrado', 'Tu pago fue registrado y quedo retenido por la plataforma.', 'orders');
    navigate('orderSuccess');
  };

  const handleNavbarNavigate = (nextView: ViewName) => {
    if (nextView === 'catalog') {
      handleNavigateToCatalog();
      return;
    }

    navigate(nextView);
  };

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);

    if (role === 'seller') {
      navigate('sellerDashboard');
      return;
    }

    if (role === 'admin') {
      navigate('claims');
      return;
    }

    navigate('home');
  };

  const handleNavigateToCatalog = (filter: CatalogFilter | null = null) => {
    setCatalogFilter(filter);
    navigate('catalog');
  };

  const handleCategorySelect = (categoryName: string) => {
    handleNavigateToCatalog({ category: categoryName });
  };

  const handleShowSustainableProducts = () => {
    handleNavigateToCatalog({ type: 'eco' });
  };

  const handleProducerSelect = (producerId: string) => {
    setSelectedProducerId(producerId);
    navigate('producerProfile');
  };

  const openProduct = (productId: string, sourceView: ViewName = view) => {
    setSelectedProductId(productId);
    setCartMessage('');
    setPreviousView(sourceView === 'productDetail' ? 'home' : sourceView);
    navigate('productDetail');
  };

  const addToCart = (productId: string) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === productId);

      if (existingItem) {
        return currentItems.map((item) => (
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }

      return [...currentItems, { productId, quantity: 1 }];
    });
    setCartMessage('Producto agregado al carrito.');
    setCartNotice('');
  };

  const removeFromCart = (productId: string) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
  };

  const increaseQuantity = (productId: string) => {
    setCartItems((currentItems) => currentItems.map((item) => (
      item.productId === productId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    )));
  };

  const decreaseQuantity = (productId: string) => {
    setCartItems((currentItems) => currentItems.flatMap((item) => {
      if (item.productId !== productId) return [item];
      const nextQuantity = item.quantity - 1;
      return nextQuantity > 0 ? [{ ...item, quantity: nextQuantity }] : [];
    }));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const startCheckout = () => {
    if (!currentUser) {
      setHasPendingCheckout(true);
      navigate('login');
      return;
    }

    navigate('cart');
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    if (email !== TEST_USER.email || password !== TEST_USER.password) {
      setLoginError('Correo o contrasena incorrectos.');
      return;
    }

    setCurrentUser({
      email: TEST_USER.email,
      name: TEST_USER.name,
    });
    setLoginError('');
    navigate(hasPendingCheckout ? 'cart' : 'home');
  };

  const handlePayNow = () => {
    const marketplaceItems = getMarketplaceItems(cartItems);
    const groups = groupItemsByProducer(marketplaceItems).map((group) => ({
      ...group,
      status: 'CONFIRMED' as const,
      readyDate: new Date().toISOString().slice(0, 10),
      observation: 'Producto con stock disponible.',
    }));
    const estimatedDeliveryDate = calculateEstimatedDelivery(groups);

    createOrder(marketplaceItems, groups, 'FULL_PAYMENT', estimatedDeliveryDate);
    clearCart();
  };

  const handleCreatePurchaseRequest = () => {
    if (!currentUser) {
      setHasPendingCheckout(true);
      navigate('login');
      return;
    }

    const requestItems = getMarketplaceItems(cartItems).filter((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return product?.availabilityType !== 'CUSTOM_QUOTE';
    });

    if (!requestItems.length) {
      setCartNotice('Este carrito solo contiene productos que requieren cotizacion personalizada.');
      return;
    }

    const request: PurchaseRequest = {
      id: `SC-${String(purchaseRequests.length + 1).padStart(3, '0')}`,
      customerId: currentUser.email,
      customerName: currentUser.name,
      items: requestItems,
      groupsByProducer: groupItemsByProducer(requestItems),
      status: 'PENDING_PRODUCER_CONFIRMATION',
      createdAt: formatDate(new Date()),
      deliveryDays: DELIVERY_DAYS,
      total: getItemsTotal(requestItems),
    };

    setPurchaseRequests((current) => [request, ...current]);
    setSelectedPurchaseRequestId(request.id);
    setCartItems((currentItems) => (
      currentItems.filter((cartItem) => !requestItems.some((item) => item.productId === cartItem.productId))
    ));
    addNotification('customer', 'Solicitud enviada', 'Tu solicitud fue enviada a los productores.', 'purchaseRequests');
    addNotification('seller', 'Nueva solicitud de venta', 'Tienes una solicitud pendiente por confirmar.', 'sellerDashboard');
    navigate('purchaseRequestDetail');
  };

  const handleRequestQuote = () => {
    setCartNotice('Este flujo sera gestionado por un asesor. La cotizacion completa se implementara en otra fase.');
    addNotification('admin', 'Solicitud de cotizacion visual', 'Un cliente intento solicitar una cotizacion personalizada.', 'notifications');
  };

  const updateRequestAfterProducerAction = (
    requestId: string,
    producerId: string,
    updater: (group: PurchaseRequestGroup) => PurchaseRequestGroup,
  ) => {
    setPurchaseRequests((current) => current.map((request) => {
      if (request.id !== requestId) return request;

      const groupsByProducer = request.groupsByProducer.map((group) => (
        group.producerId === producerId ? updater(group) : group
      ));
      const confirmedCount = groupsByProducer.filter((group) => group.status === 'CONFIRMED').length;
      const rejectedCount = groupsByProducer.filter((group) => group.status === 'REJECTED').length;
      const pendingCount = groupsByProducer.filter((group) => group.status === 'PENDING').length;
      const estimatedDeliveryDate = pendingCount === 0 && confirmedCount > 0
        ? calculateEstimatedDelivery(groupsByProducer)
        : request.estimatedDeliveryDate;
      const status: PurchaseRequest['status'] = pendingCount === 0 && rejectedCount === 0
        ? 'READY_TO_PAY'
        : confirmedCount > 0 && rejectedCount > 0
          ? 'PARTIALLY_CONFIRMED'
          : rejectedCount > 0
            ? 'PARTIALLY_REJECTED'
            : 'PENDING_PRODUCER_CONFIRMATION';

      return {
        ...request,
        groupsByProducer,
        status,
        estimatedDeliveryDate,
      };
    }));
  };

  const handleSellerConfirmRequest = (
    requestId: string,
    producerId: string,
    readyDate: string,
    observation: string,
  ) => {
    updateRequestAfterProducerAction(requestId, producerId, (group) => ({
      ...group,
      status: 'CONFIRMED',
      readyDate,
      observation: observation || 'Disponibilidad confirmada.',
    }));
    addNotification('customer', 'Productor confirmo disponibilidad', 'Revisa tu solicitud de compra.', 'purchaseRequests');
  };

  const handleSellerRejectRequest = (
    requestId: string,
    producerId: string,
    observation: string,
  ) => {
    updateRequestAfterProducerAction(requestId, producerId, (group) => ({
      ...group,
      status: 'REJECTED',
      observation,
    }));
    addNotification('customer', 'Productor rechazo disponibilidad', 'Revisa las opciones de tu solicitud.', 'purchaseRequests');
  };

  const handleContinueConfirmed = (requestId: string) => {
    setPurchaseRequests((current) => current.map((request) => {
      if (request.id !== requestId) return request;
      const confirmedGroups = request.groupsByProducer.filter((group) => group.status === 'CONFIRMED');
      const confirmedItems = confirmedGroups.flatMap((group) => group.items);

      return {
        ...request,
        items: confirmedItems,
        groupsByProducer: confirmedGroups,
        status: 'READY_TO_PAY',
        total: getItemsTotal(confirmedItems),
        estimatedDeliveryDate: calculateEstimatedDelivery(confirmedGroups),
      };
    }));
  };

  const handleCancelPurchaseRequest = (requestId: string) => {
    setPurchaseRequests((current) => current.map((request) => (
      request.id === requestId ? { ...request, status: 'CANCELLED' } : request
    )));
    addNotification('customer', 'Solicitud cancelada', 'La solicitud de compra fue cancelada.', 'purchaseRequests');
  };

  const handlePayPurchaseRequest = (requestId: string, paymentOption: PaymentOption) => {
    const request = purchaseRequests.find((entry) => entry.id === requestId);
    if (!request) return;

    const payableGroups = request.groupsByProducer.filter((group) => group.status === 'CONFIRMED');
    const payableItems = payableGroups.flatMap((group) => group.items);

    createOrder(payableItems, payableGroups, paymentOption, request.estimatedDeliveryDate);
    setPurchaseRequests((current) => current.map((entry) => (
      entry.id === requestId
        ? { ...entry, status: 'CONVERTED_TO_ORDER', convertedOrderId: `PED-${Date.now()}` }
        : entry
    )));
  };

  const syncOrderGroupStatus = (sale: Sale, status: SaleStatus) => {
    setOrders((current) => current.map((order) => {
      if (order.id !== sale.orderId) return order;

      return {
        ...order,
        producerGroups: order.producerGroups?.map((group) => (
          group.producerId === sale.producerId ? { ...group, status } : group
        )),
      };
    }));
  };

  const handleMarkSaleInPreparation = (saleId: string) => {
    const sale = sales.find((entry) => entry.id === saleId);
    if (!sale) return;

    setSales((current) => current.map((entry) => (
      entry.id === saleId ? { ...entry, status: 'IN_PREPARATION' } : entry
    )));
    syncOrderGroupStatus(sale, 'IN_PREPARATION');
  };

  const handleMarkSaleReady = (saleId: string) => {
    const sale = sales.find((entry) => entry.id === saleId);
    if (!sale) return;

    setSales((current) => current.map((entry) => (
      entry.id === saleId ? { ...entry, status: 'READY_FOR_DISPATCH' } : entry
    )));
    syncOrderGroupStatus(sale, 'READY_FOR_DISPATCH');
    addNotification('customer', 'Producto marcado como listo', `${sale.producerName} marco productos listos para despacho.`, 'orders');
  };

  const handleCreateClaim = (orderId: string, reason: string, description: string) => {
    const claim: Claim = {
      id: `RCL-${String(claims.length + 1).padStart(3, '0')}`,
      orderId,
      customerId: currentUser?.email ?? TEST_USER.email,
      reason,
      description,
      status: 'OPEN',
      createdAt: formatDate(new Date()),
    };

    setClaims((current) => [claim, ...current]);
    setOrders((current) => current.map((order) => (
      order.id === orderId ? { ...order, fundsStatus: 'HELD_BY_CLAIM' } : order
    )));
    setSales((current) => current.map((sale) => (
      sale.orderId === orderId ? { ...sale, fundsStatus: 'HELD_BY_CLAIM', status: 'HELD_BY_CLAIM' } : sale
    )));
    addNotification('customer', 'Reclamo registrado', 'El pago permanecera retenido hasta resolver el reclamo.', 'claims');
    addNotification('seller', 'Reclamo abierto', 'Existe un reclamo asociado a una venta.', 'sellerDashboard');
    addNotification('admin', 'Reclamo abierto', 'Hay un nuevo reclamo para revisar.', 'claims');
    navigate('claims');
  };

  const handleResolveClaim = (claimId: string, status: 'RESOLVED' | 'REJECTED') => {
    setClaims((current) => current.map((claim) => (
      claim.id === claimId ? { ...claim, status } : claim
    )));
    addNotification('customer', 'Reclamo actualizado', `Tu reclamo fue marcado como ${status}.`, 'claims');
  };

  const handleOpenPurchaseRequest = (requestId: string) => {
    setSelectedPurchaseRequestId(requestId);
    navigate('purchaseRequestDetail');
  };

  const handleOpenNotification = (notification: Notification) => {
    setNotifications((current) => current.map((entry) => (
      entry.id === notification.id ? { ...entry, read: true } : entry
    )));

    if (notification.targetView) {
      navigate(notification.targetView);
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((current) => current.map((notification) => (
      notification.role === currentRole ? { ...notification, read: true } : notification
    )));
  };

  const trackOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    navigate('orderTracking');
  };

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const selectedProducer = getProducerById(selectedProducerId ?? undefined);
  const lastOrder = orders.find((order) => order.id === lastOrderId);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const selectedPurchaseRequest = purchaseRequests.find((request) => request.id === selectedPurchaseRequestId);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const notificationCount = notifications.filter((notification) => (
    notification.role === currentRole && !notification.read
  )).length;

  const renderView = () => {
    if (view === 'catalog') {
      return (
        <CatalogView
          initialFilter={catalogFilter}
          onProductSelect={(productId) => openProduct(productId, 'catalog')}
        />
      );
    }

    if (view === 'verdecito') {
      return (
        <VerdecitoView
          onProductSelect={(productId) => openProduct(productId, 'verdecito')}
          onShowSustainableProducts={handleShowSustainableProducts}
        />
      );
    }

    if (view === 'productDetail') {
      return (
        <ProductDetailView
          cartMessage={cartMessage}
          onAddToCart={addToCart}
          onBack={() => navigate(previousView)}
          onProducerSelect={handleProducerSelect}
          product={selectedProduct}
        />
      );
    }

    if (view === 'producerProfile') {
      return (
        <ProducerProfileView
          producer={selectedProducer}
          onBack={() => navigate(previousView)}
          onOpenCatalog={() => handleNavigateToCatalog()}
          onProductSelect={(productId) => openProduct(productId, 'producerProfile')}
        />
      );
    }

    if (view === 'cart') {
      return (
        <CartView
          cartItems={cartItems}
          cartNotice={cartNotice}
          currentUser={currentUser}
          onCheckout={startCheckout}
          onDecrease={decreaseQuantity}
          onIncrease={increaseQuantity}
          onNavigate={navigate}
          onPayNow={handlePayNow}
          onRemove={removeFromCart}
          onRequestPurchase={handleCreatePurchaseRequest}
          onRequestQuote={handleRequestQuote}
        />
      );
    }

    if (view === 'login') {
      return <LoginView error={loginError} onLogin={handleLogin} />;
    }

    if (view === 'orderSuccess') {
      return <OrderSuccessView order={lastOrder} onNavigate={navigate} />;
    }

    if (view === 'orders') {
      return <OrdersView orders={orders} onNavigate={navigate} onTrackOrder={trackOrder} />;
    }

    if (view === 'orderTracking') {
      return (
        <OrderTrackingView
          order={selectedOrder}
          sales={sales}
          onCreateClaim={handleCreateClaim}
          onNavigate={navigate}
        />
      );
    }

    if (view === 'purchaseRequests') {
      return (
        <PurchaseRequestsView
          requests={purchaseRequests}
          onNavigate={navigate}
          onOpenRequest={handleOpenPurchaseRequest}
        />
      );
    }

    if (view === 'purchaseRequestDetail') {
      return (
        <PurchaseRequestDetailView
          request={selectedPurchaseRequest}
          onCancel={handleCancelPurchaseRequest}
          onContinueConfirmed={handleContinueConfirmed}
          onNavigate={navigate}
          onPay={handlePayPurchaseRequest}
        />
      );
    }

    if (view === 'sellerDashboard') {
      return (
        <SellerDashboardView
          activeProducerId={activeProducerId}
          producers={producers}
          requests={purchaseRequests}
          sales={sales}
          onChangeProducer={setActiveProducerId}
          onConfirmRequest={handleSellerConfirmRequest}
          onMarkSaleInPreparation={handleMarkSaleInPreparation}
          onMarkSaleReady={handleMarkSaleReady}
          onRejectRequest={handleSellerRejectRequest}
        />
      );
    }

    if (view === 'claims') {
      return (
        <ClaimsView
          claims={claims}
          orders={orders}
          role={currentRole}
          onResolveClaim={handleResolveClaim}
        />
      );
    }

    if (view === 'notifications') {
      return (
        <NotificationsView
          notifications={notifications}
          role={currentRole}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onOpenNotification={handleOpenNotification}
        />
      );
    }

    if (view === 'support') {
      return <SupportView />;
    }

    return (
      <HomeView
        onCategorySelect={handleCategorySelect}
        onNavigate={navigate}
        onOpenCatalog={() => handleNavigateToCatalog()}
        onProductSelect={(productId) => openProduct(productId, 'home')}
      />
    );
  };

  return (
    <div className="appLayout">
      <Navbar
        activeView={view}
        cartCount={cartCount}
        currentRole={currentRole}
        currentUser={currentUser}
        notificationCount={notificationCount}
        onNavigate={handleNavbarNavigate}
        onRoleChange={handleRoleChange}
      />
      <div className="appMain">
        {renderView()}
      </div>
      <Footer onNavigate={navigate} />
    </div>
  );
}
