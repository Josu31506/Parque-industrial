import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import Footer from './components/Footer/Footer';
import Navbar from './components/Navbar/Navbar';
import {
  getProducerById as getFallbackProducerById,
  categories as fallbackCategories,
  producers as fallbackProducers,
  products as fallbackProducts,
} from './data/catalog';
import { getMe, login as loginWithBackend, logout as logoutFromBackend } from './services/authService';
import { getAccessToken } from './services/api';
import {
  addCartItem as addRemoteCartItem,
  clearCart as clearRemoteCart,
  getCart as getRemoteCart,
  removeCartItem as removeRemoteCartItem,
  updateCartItem as updateRemoteCartItem,
} from './services/cartService';
import { getCategories as fetchCategories } from './services/categoriesService';
import {
  createClaim as createRemoteClaim,
  getAllClaims,
  getMyClaims,
  rejectClaim,
  resolveClaim,
} from './services/claimsService';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from './services/notificationsService';
import { getMyOrders, getOrderTracking } from './services/ordersService';
import { getProducers as fetchProducers } from './services/producersService';
import { getProducts as fetchProducts } from './services/productsService';
import {
  cancelPurchaseRequest,
  confirmPurchaseRequestGroup,
  continueWithConfirmed,
  createPurchaseRequest,
  getMyPurchaseRequests,
  payPurchaseRequest,
  rejectPurchaseRequestGroup,
} from './services/purchaseRequestsService';
import {
  getMySales,
  markSaleInPreparation,
  markSaleReadyForDispatch,
} from './services/salesService';
import type {
  CartItem,
  CatalogFilter,
  Category,
  Claim,
  Notification,
  MarketplaceItem,
  Order,
  OrderProducerGroup,
  PaymentOption,
  Producer,
  Product,
  PurchaseRequest,
  PurchaseRequestGroup,
  Role,
  Sale,
  SaleStatus,
  User,
  ViewName,
  ApiRole,
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

const mapApiRoleToUiRole = (role: ApiRole | undefined): Role => {
  if (role === 'SELLER') return 'seller';
  if (role === 'ADMIN' || role === 'ADVISOR') return 'admin';
  return 'customer';
};

const mapClaimReasonToApi = (reason: string) => {
  const reasons: Record<string, string> = {
    'Producto danado': 'DAMAGED_PRODUCT',
    'Producto dañado': 'DAMAGED_PRODUCT',
    'Producto no corresponde': 'WRONG_PRODUCT',
    'Medidas incorrectas': 'WRONG_DIMENSIONS',
    'Color/acabado incorrecto': 'WRONG_COLOR',
    'No llego el producto': 'NOT_DELIVERED',
  };

  return reasons[reason] ?? 'OTHER';
};

export default function App() {
  const [view, setView] = useState<ViewName>('home');
  const [currentRole, setCurrentRole] = useState<Role>('customer');
  const [activeProducerId, setActiveProducerId] = useState('muebles-ves');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<ViewName>('home');
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter | null>(null);
  const [selectedProducerId, setSelectedProducerId] = useState<string | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(fallbackProducts);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(fallbackCategories);
  const [catalogProducers, setCatalogProducers] = useState<Producer[]>(fallbackProducers);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasPendingCheckout, setHasPendingCheckout] = useState(false);
  const [pendingCartProductId, setPendingCartProductId] = useState<string | null>(null);
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

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      setIsLoadingCatalog(true);
      setCatalogError('');

      try {
        const [loadedProducts, loadedCategories, loadedProducers] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchProducers(),
        ]);

        if (!isMounted) return;

        setCatalogProducts(loadedProducts.length ? loadedProducts : fallbackProducts);
        setCatalogCategories(loadedCategories.length ? loadedCategories : fallbackCategories);
        setCatalogProducers(loadedProducers.length ? loadedProducers : fallbackProducers);
      } catch {
        if (!isMounted) return;
        setCatalogProducts(fallbackProducts);
        setCatalogCategories(fallbackCategories);
        setCatalogProducers(fallbackProducers);
        setCatalogError('No pudimos cargar el catalogo. Verifica que el backend este activo.');
      } finally {
        if (isMounted) {
          setIsLoadingCatalog(false);
        }
      }
    };

    void loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!catalogProducers.length) return;
    if (catalogProducers.some((producer) => producer.id === activeProducerId)) return;
    setActiveProducerId(catalogProducers[0].id);
  }, [activeProducerId, catalogProducers]);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      if (!getAccessToken()) return;

      try {
        const user = await getMe();
        if (!isMounted) return;

        setCurrentUser(user);
        setCurrentRole(mapApiRoleToUiRole(user.role));
      } catch {
        if (!isMounted) return;
        logoutFromBackend();
        setCurrentUser(null);
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSessionData = async () => {
      if (!currentUser) return;

      try {
        if (currentRole === 'customer') {
          const [remoteCart, remoteRequests, remoteOrders, remoteClaims] = await Promise.all([
            getRemoteCart(),
            getMyPurchaseRequests(),
            getMyOrders(),
            getMyClaims(),
          ]);

          if (!isMounted) return;
          setCartItems(remoteCart);
          setPurchaseRequests(remoteRequests);
          setOrders(remoteOrders);
          setClaims(remoteClaims);
        }

        if (currentRole === 'seller' || currentRole === 'admin') {
          const remoteSales = await getMySales();
          if (!isMounted) return;
          setSales(remoteSales);
        }

        if (currentRole === 'admin') {
          const remoteClaims = await getAllClaims();
          if (!isMounted) return;
          setClaims(remoteClaims);
        }

        const remoteNotifications = await getNotifications(currentRole);
        if (!isMounted) return;
        setNotifications(remoteNotifications);
      } catch {
        // Keep local state as a fallback when the backend is not reachable.
      }
    };

    void loadSessionData();

    return () => {
      isMounted = false;
    };
  }, [currentUser, currentRole]);

  useEffect(() => {
    let isMounted = true;

    const refreshActiveView = async () => {
      if (!currentUser) return;

      try {
        if (view === 'cart' && currentRole === 'customer') {
          const remoteCart = await getRemoteCart();
          if (isMounted) setCartItems(remoteCart);
        }

        if (view === 'orders' && currentRole === 'customer') {
          const remoteOrders = await getMyOrders();
          if (isMounted) setOrders(remoteOrders);
        }

        if (view === 'purchaseRequests' && currentRole === 'customer') {
          const remoteRequests = await getMyPurchaseRequests();
          if (isMounted) setPurchaseRequests(remoteRequests);
        }

        if (view === 'sellerDashboard' && (currentRole === 'seller' || currentRole === 'admin')) {
          const remoteSales = await getMySales();
          if (isMounted) setSales(remoteSales);
        }

        if (view === 'claims') {
          const remoteClaims = currentRole === 'admin' ? await getAllClaims() : await getMyClaims();
          if (isMounted) setClaims(remoteClaims);
        }

        if (view === 'notifications') {
          const remoteNotifications = await getNotifications(currentRole);
          if (isMounted) setNotifications(remoteNotifications);
        }
      } catch {
        // Keep local data if the backend request fails.
      }
    };

    void refreshActiveView();

    return () => {
      isMounted = false;
    };
  }, [view, currentUser, currentRole]);

  const findProducerById = (producerId: string | undefined) => (
    catalogProducers.find((producer) => producer.id === producerId)
      ?? getFallbackProducerById(producerId)
  );

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
      const product = catalogProducts.find((entry) => entry.id === item.productId);
      if (!product) return [];

      const producer = findProducerById(product.producerId);

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

  const addToCart = async (productId: string) => {
    if (!currentUser) {
      setHasPendingCheckout(true);
      setPendingCartProductId(productId);
      setCartMessage('Debes iniciar sesion para agregar productos al carrito.');
      navigate('login');
      return;
    }

    try {
      await addRemoteCartItem(productId, 1);
      setCartItems(await getRemoteCart());
    } catch {
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
    }

    setCartMessage('Producto agregado al carrito.');
    setCartNotice('');
  };

  const removeFromCart = async (productId: string) => {
    const item = cartItems.find((entry) => entry.productId === productId);

    try {
      if (item?.id) {
        await removeRemoteCartItem(item.id);
      }
    } catch {
      // Fall back to local state below.
    }

    setCartItems((currentItems) => currentItems.filter((entry) => entry.productId !== productId));
  };

  const increaseQuantity = async (productId: string) => {
    const item = cartItems.find((entry) => entry.productId === productId);

    try {
      if (item?.id) {
        const updated = await updateRemoteCartItem(item.id, item.quantity + 1);
        setCartItems((currentItems) => currentItems.map((entry) => (
          entry.productId === productId ? updated : entry
        )));
        return;
      }
    } catch {
      // Fall back to local state below.
    }

    setCartItems((currentItems) => currentItems.map((entry) => (
      entry.productId === productId
        ? { ...entry, quantity: entry.quantity + 1 }
        : entry
    )));
  };

  const decreaseQuantity = async (productId: string) => {
    const item = cartItems.find((entry) => entry.productId === productId);

    try {
      if (item?.id && item.quantity > 1) {
        const updated = await updateRemoteCartItem(item.id, item.quantity - 1);
        setCartItems((currentItems) => currentItems.map((entry) => (
          entry.productId === productId ? updated : entry
        )));
        return;
      }

      if (item?.id) {
        await removeRemoteCartItem(item.id);
      }
    } catch {
      // Fall back to local state below.
    }

    setCartItems((currentItems) => currentItems.flatMap((item) => {
      if (item.productId !== productId) return [item];
      const nextQuantity = item.quantity - 1;
      return nextQuantity > 0 ? [{ ...item, quantity: nextQuantity }] : [];
    }));
  };

  const clearCart = async () => {
    try {
      if (currentUser) {
        await clearRemoteCart();
      }
    } catch {
      // Keep local clear as fallback.
    }

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

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    try {
      const user = await loginWithBackend(email, password);

      setCurrentUser(user);
      setCurrentRole(mapApiRoleToUiRole(user.role));
      if (pendingCartProductId) {
        try {
          await addRemoteCartItem(pendingCartProductId, 1);
          setCartItems(await getRemoteCart());
        } catch {
          setCartItems((currentItems) => [...currentItems, { productId: pendingCartProductId, quantity: 1 }]);
        }
        setPendingCartProductId(null);
      }
      setLoginError('');
      navigate(hasPendingCheckout ? 'cart' : 'home');
    } catch (error) {
      if (email === TEST_USER.email && password === TEST_USER.password) {
        setCurrentUser({
          email: TEST_USER.email,
          name: TEST_USER.name,
        });
        if (pendingCartProductId) {
          setCartItems((currentItems) => [...currentItems, { productId: pendingCartProductId, quantity: 1 }]);
          setPendingCartProductId(null);
        }
        setCurrentRole('customer');
        setLoginError('');
        navigate(hasPendingCheckout ? 'cart' : 'home');
        return;
      }

      setLoginError(error instanceof Error ? error.message : 'Correo o contrasena incorrectos.');
    }
  };

  const handleLogout = () => {
    logoutFromBackend();
    setCurrentUser(null);
    setHasPendingCheckout(false);
    setPendingCartProductId(null);
    setCartItems([]);
    setLoginError('');
    navigate('home');
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

  const handleCreatePurchaseRequest = async () => {
    if (!currentUser) {
      setHasPendingCheckout(true);
      navigate('login');
      return;
    }

    try {
      const request = await createPurchaseRequest();
      setPurchaseRequests((current) => [request, ...current.filter((entry) => entry.id !== request.id)]);
      setSelectedPurchaseRequestId(request.id);
      setCartItems(await getRemoteCart());
      navigate('purchaseRequestDetail');
      return;
    } catch {
      // Keep the simulated purchase request flow available as fallback.
    }

    const requestItems = getMarketplaceItems(cartItems).filter((item) => {
      const product = catalogProducts.find((entry) => entry.id === item.productId);
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

  const handleSellerConfirmRequest = async (
    requestId: string,
    producerId: string,
    readyDate: string,
    observation: string,
  ) => {
    const request = purchaseRequests.find((entry) => entry.id === requestId);
    const group = request?.groupsByProducer.find((entry) => entry.producerId === producerId);

    try {
      if (group?.id) {
        await confirmPurchaseRequestGroup(group.id, readyDate, observation);
      }
    } catch {
      // Keep local state update as fallback.
    }

    updateRequestAfterProducerAction(requestId, producerId, (group) => ({
      ...group,
      status: 'CONFIRMED',
      readyDate,
      observation: observation || 'Disponibilidad confirmada.',
    }));
    addNotification('customer', 'Productor confirmo disponibilidad', 'Revisa tu solicitud de compra.', 'purchaseRequests');
  };

  const handleSellerRejectRequest = async (
    requestId: string,
    producerId: string,
    observation: string,
  ) => {
    const request = purchaseRequests.find((entry) => entry.id === requestId);
    const group = request?.groupsByProducer.find((entry) => entry.producerId === producerId);

    try {
      if (group?.id) {
        await rejectPurchaseRequestGroup(group.id, observation);
      }
    } catch {
      // Keep local state update as fallback.
    }

    updateRequestAfterProducerAction(requestId, producerId, (group) => ({
      ...group,
      status: 'REJECTED',
      observation,
    }));
    addNotification('customer', 'Productor rechazo disponibilidad', 'Revisa las opciones de tu solicitud.', 'purchaseRequests');
  };

  const handleContinueConfirmed = async (requestId: string) => {
    try {
      const request = await continueWithConfirmed(requestId);
      setPurchaseRequests((current) => current.map((entry) => (
        entry.id === requestId ? request : entry
      )));
      return;
    } catch {
      // Keep local state update as fallback.
    }

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

  const handleCancelPurchaseRequest = async (requestId: string) => {
    try {
      const request = await cancelPurchaseRequest(requestId);
      setPurchaseRequests((current) => current.map((entry) => (
        entry.id === requestId ? request : entry
      )));
      addNotification('customer', 'Solicitud cancelada', 'La solicitud de compra fue cancelada.', 'purchaseRequests');
      return;
    } catch {
      // Keep local state update as fallback.
    }

    setPurchaseRequests((current) => current.map((request) => (
      request.id === requestId ? { ...request, status: 'CANCELLED' } : request
    )));
    addNotification('customer', 'Solicitud cancelada', 'La solicitud de compra fue cancelada.', 'purchaseRequests');
  };

  const handlePayPurchaseRequest = async (requestId: string, paymentOption: PaymentOption) => {
    try {
      const order = await payPurchaseRequest(requestId, paymentOption);
      setOrders((current) => [order, ...current.filter((entry) => entry.id !== order.id)]);
      setLastOrderId(order.id);
      setSelectedOrderId(order.id);
      setPurchaseRequests((current) => current.map((entry) => (
        entry.id === requestId
          ? { ...entry, status: 'CONVERTED_TO_ORDER', convertedOrderId: order.id }
          : entry
      )));
      try {
        setSales(await getMySales());
      } catch {
        // Sales may not be visible to client role.
      }
      navigate('orderSuccess');
      return;
    } catch {
      // Keep local payment flow as fallback.
    }

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

  const handleMarkSaleInPreparation = async (saleId: string) => {
    const sale = sales.find((entry) => entry.id === saleId);
    if (!sale) return;

    try {
      const updatedSale = await markSaleInPreparation(saleId);
      setSales((current) => current.map((entry) => (
        entry.id === saleId ? { ...entry, ...updatedSale } : entry
      )));
      syncOrderGroupStatus(updatedSale, 'IN_PREPARATION');
      return;
    } catch {
      setSales((current) => current.map((entry) => (
        entry.id === saleId ? { ...entry, status: 'IN_PREPARATION' } : entry
      )));
      syncOrderGroupStatus(sale, 'IN_PREPARATION');
    }
  };

  const handleMarkSaleReady = async (saleId: string) => {
    const sale = sales.find((entry) => entry.id === saleId);
    if (!sale) return;

    try {
      const updatedSale = await markSaleReadyForDispatch(saleId);
      setSales((current) => current.map((entry) => (
        entry.id === saleId ? { ...entry, ...updatedSale } : entry
      )));
      syncOrderGroupStatus(updatedSale, 'READY_FOR_DISPATCH');
      addNotification('customer', 'Producto marcado como listo', `${sale.producerName} marco productos listos para despacho.`, 'orders');
      return;
    } catch {
      setSales((current) => current.map((entry) => (
        entry.id === saleId ? { ...entry, status: 'READY_FOR_DISPATCH' } : entry
      )));
      syncOrderGroupStatus(sale, 'READY_FOR_DISPATCH');
    }

    addNotification('customer', 'Producto marcado como listo', `${sale.producerName} marco productos listos para despacho.`, 'orders');
  };

  const handleCreateClaim = async (orderId: string, reason: string, description: string) => {
    try {
      const claim = await createRemoteClaim(orderId, mapClaimReasonToApi(reason), description);
      setClaims((current) => [claim, ...current.filter((entry) => entry.id !== claim.id)]);
      setOrders((current) => current.map((order) => (
        order.id === orderId ? { ...order, fundsStatus: 'HELD_BY_CLAIM' } : order
      )));
      setSales((current) => current.map((sale) => (
        sale.orderId === orderId ? { ...sale, fundsStatus: 'HELD_BY_CLAIM', status: 'HELD_BY_CLAIM' } : sale
      )));
      addNotification('customer', 'Reclamo registrado', 'El pago permanecera retenido hasta resolver el reclamo.', 'claims');
      navigate('claims');
      return;
    } catch {
      // Keep local claim creation as fallback.
    }

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

  const handleResolveClaim = async (claimId: string, status: 'RESOLVED' | 'REJECTED') => {
    try {
      const claim = status === 'RESOLVED'
        ? await resolveClaim(claimId)
        : await rejectClaim(claimId);
      setClaims((current) => current.map((entry) => (
        entry.id === claimId ? claim : entry
      )));
    } catch {
      setClaims((current) => current.map((claim) => (
        claim.id === claimId ? { ...claim, status } : claim
      )));
    }

    addNotification('customer', 'Reclamo actualizado', `Tu reclamo fue marcado como ${status}.`, 'claims');
  };

  const handleOpenPurchaseRequest = (requestId: string) => {
    setSelectedPurchaseRequestId(requestId);
    navigate('purchaseRequestDetail');
  };

  const handleOpenNotification = async (notification: Notification) => {
    try {
      await markNotificationAsRead(notification.id);
    } catch {
      // Keep local read state as fallback.
    }

    setNotifications((current) => current.map((entry) => (
      entry.id === notification.id ? { ...entry, read: true } : entry
    )));

    if (notification.targetView) {
      navigate(notification.targetView);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsAsRead();
    } catch {
      // Keep local read state as fallback.
    }

    setNotifications((current) => current.map((notification) => (
      notification.role === currentRole ? { ...notification, read: true } : notification
    )));
  };

  const trackOrder = async (orderId: string) => {
    setSelectedOrderId(orderId);
    try {
      const order = await getOrderTracking(orderId);
      setOrders((current) => current.map((entry) => (
        entry.id === orderId ? { ...entry, ...order } : entry
      )));
    } catch {
      // Keep existing order state as fallback.
    }
    navigate('orderTracking');
  };

  const selectedProduct = catalogProducts.find((product) => product.id === selectedProductId);
  const selectedProductProducer = findProducerById(selectedProduct?.producerId);
  const selectedProducer = findProducerById(selectedProducerId ?? undefined);
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
          catalogError={catalogError}
          categories={catalogCategories}
          initialFilter={catalogFilter}
          isLoadingCatalog={isLoadingCatalog}
          onProductSelect={(productId) => openProduct(productId, 'catalog')}
          producers={catalogProducers}
          products={catalogProducts}
        />
      );
    }

    if (view === 'verdecito') {
      return (
        <VerdecitoView
          onProductSelect={(productId) => openProduct(productId, 'verdecito')}
          onShowSustainableProducts={handleShowSustainableProducts}
          products={catalogProducts}
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
          producer={selectedProductProducer}
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
          products={catalogProducts}
        />
      );
    }

    if (view === 'cart') {
      return (
        <CartView
          cartItems={cartItems}
          cartNotice={cartNotice}
          currentUser={currentUser}
          products={catalogProducts}
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
          products={catalogProducts}
          producers={catalogProducers}
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
        catalogError={catalogError}
        categories={catalogCategories}
        isLoadingCatalog={isLoadingCatalog}
        onCategorySelect={handleCategorySelect}
        onNavigate={navigate}
        onOpenCatalog={() => handleNavigateToCatalog()}
        onProductSelect={(productId) => openProduct(productId, 'home')}
        onShowSustainableProducts={handleShowSustainableProducts}
        products={catalogProducts}
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
        onLogout={handleLogout}
        onRoleChange={handleRoleChange}
      />
      <div className="appMain">
        {renderView()}
      </div>
      <Footer onNavigate={navigate} />
    </div>
  );
}
