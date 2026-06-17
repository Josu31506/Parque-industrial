import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import Footer from './components/Footer/Footer';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import Navbar from './components/Navbar/Navbar';
import {
  getProducerById as getFallbackProducerById,
  categories as fallbackCategories,
  producers as fallbackProducers,
} from './data/catalog';
import {
  getMe,
  getStoredUser,
  login as loginWithBackend,
  logout as logoutFromBackend,
  registerClient,
} from './services/authService';
import { ApiError, getAccessToken } from './services/api';
import {
  addCartItem as addRemoteCartItem,
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
import { checkoutCart, getMyOrders, getOrderTracking, markOrderDelivered } from './services/ordersService';
import { getMyProducer, getProducers as fetchProducers, updateMyProducer } from './services/producersService';
import {
  createProduct as createRemoteProduct,
  deactivateProduct as deactivateRemoteProduct,
  getMyProducts,
  getProducts as fetchProducts,
  updateProduct as updateRemoteProduct,
  type ProductFormInput,
} from './services/productsService';
import {
  cancelPurchaseRequest,
  confirmPurchaseRequestGroup,
  continueWithConfirmed,
  createPurchaseRequest,
  getMyPurchaseRequests,
  getSellerPurchaseRequests,
  payPurchaseRequest,
  rejectPurchaseRequestGroup,
} from './services/purchaseRequestsService';
import {
  getMySales,
  getMyEarnings,
  markSaleDispatched,
  markSaleInPreparation,
  markSaleReadyForDispatch,
} from './services/salesService';
import { getMyQuotes, getSellerQuotes, respondQuote } from './services/quotesService';
import type {
  CartItem,
  CatalogFilter,
  Category,
  Claim,
  MarketplaceItem,
  Order,
  OrderProducerGroup,
  PaymentOption,
  Producer,
  Product,
  PurchaseRequest,
  PurchaseRequestGroup,
  Quote,
  QuoteType,
  Role,
  Sale,
  SaleStatus,
  SellerEarnings,
  User,
  ViewName,
  ApiRole,
} from './types';
import CartView from './views/CartView';
import CatalogView from './views/CatalogView';
import ClaimsView from './views/ClaimsView';
import HomeView from './views/HomeView';
import LoginView from './views/LoginView';
import AcceptInvitationView from './views/AcceptInvitationView';
import AdminQuoteDetailView from './views/AdminQuoteDetailView';
import AdminQuotesView from './views/AdminQuotesView';
import OrdersView from './views/OrdersView';
import OrderSuccessView from './views/OrderSuccessView';
import OrderTrackingView from './views/OrderTrackingView';
import ProducerProfileView from './views/ProducerProfileView';
import ProductDetailView from './views/ProductDetailView';
import QuoteDetailView from './views/QuoteDetailView';
import QuoteOptionsView from './views/QuoteOptionsView';
import QuoteRequestView from './views/QuoteRequestView';
import PurchaseRequestDetailView from './views/PurchaseRequestDetailView';
import PurchaseRequestsView from './views/PurchaseRequestsView';
import QuotesView from './views/QuotesView';
import SellerDashboardView from './views/SellerDashboardView';
import SupportView from './views/SupportView';
import UserManagementView from './views/UserManagementView';
import VerdecitoView from './views/VerdecitoView';

const SHIPPING_COST = 10;
const DELIVERY_DAYS = 2;
const PLATFORM_COMMISSION = 0.1;
const PENDING_QUOTE_ACTION_KEY = 'pendingQuoteAction';
const CATALOG_CACHE_KEY = 'catalogCache';
const CART_CACHE_KEY = 'cartCache';
const ORDERS_CACHE_KEY = 'ordersCache';
const PURCHASE_REQUESTS_CACHE_KEY = 'purchaseRequestsCache';
const CLIENT_QUOTES_CACHE_KEY = 'clientQuotesCache';
const SELLER_DASHBOARD_CACHE_KEY = 'sellerDashboardCache';
const CLAIMS_CACHE_KEY = 'claimsCache';
const TRACKING_CACHE_KEY = 'trackingCache';
const CATALOG_TTL = 5 * 60 * 1000;
const CART_TTL = 30 * 1000;
const MODULE_TTL = 5 * 60 * 1000;
const TRACKING_TTL = 30 * 1000;
const AUTH_ME_TIMEOUT_MS = 2000;

type PendingQuoteAction = {
  type: QuoteType | 'OPTIONS';
  additionalProductTitles?: string[];
  productId?: string;
};

type CacheEnvelope<T> = {
  data: T;
  updatedAt: number;
};

type SellerDashboardCache = {
  products: Product[];
  quotes: Quote[];
  requests: PurchaseRequest[];
  sales: Sale[];
  earnings?: SellerEarnings | null;
  producer?: Producer | null;
};

type SellerDashboardTab = 'summary' | 'products' | 'create' | 'requests' | 'sales' | 'quotes' | 'earnings' | 'profile';

type SellerResourceKey = 'products' | 'quotes' | 'requests' | 'sales' | 'earnings' | 'profile';

type TrackingCache = Record<string, CacheEnvelope<Order>>;

type PageInfo = {
  page: number;
  totalPages: number;
  total: number;
};

type CatalogCache = {
  products: Product[];
  categories: Category[];
  producers: Producer[];
};

type CatalogProductsCacheEntry = {
  items: Product[];
  pageInfo: PageInfo;
  updatedAt: number;
};

const DEFAULT_PAGE_INFO: PageInfo = {
  page: 1,
  total: 0,
  totalPages: 1,
};

const SELLER_TAB_STORAGE_KEY = 'sellerDashboardActiveTab';
const validSellerTabs: SellerDashboardTab[] = ['summary', 'products', 'create', 'requests', 'sales', 'quotes', 'earnings', 'profile'];
const readSellerTab = (): SellerDashboardTab => {
  const storedTab = localStorage.getItem(SELLER_TAB_STORAGE_KEY);
  return validSellerTabs.includes(storedTab as SellerDashboardTab) ? storedTab as SellerDashboardTab : 'summary';
};

const getCatalogProductsCacheKey = (page: number, filter: CatalogFilter | null) => JSON.stringify({
  page,
  limit: 20,
  filter: filter ?? {},
});

const readCache = <T,>(key: string): CacheEnvelope<T> | null => {
  const value = localStorage.getItem(key);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as CacheEnvelope<T>;
    if (typeof parsed.updatedAt !== 'number' || !('data' in parsed)) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const writeCache = <T,>(key: string, data: T, updatedAt = Date.now()) => {
  localStorage.setItem(key, JSON.stringify({ data, updatedAt }));
};

const removeCache = (key: string) => {
  localStorage.removeItem(key);
};

const isCacheFresh = (updatedAt: number, ttl: number) => Date.now() - updatedAt < ttl;

const initialCatalogCache = readCache<CatalogCache>(CATALOG_CACHE_KEY);
const initialCartCache = readCache<CartItem[]>(CART_CACHE_KEY);
const initialOrdersCache = readCache<Order[]>(ORDERS_CACHE_KEY);
const initialPurchaseRequestsCache = readCache<PurchaseRequest[]>(PURCHASE_REQUESTS_CACHE_KEY);
const initialClientQuotesCache = readCache<Quote[]>(CLIENT_QUOTES_CACHE_KEY);
const initialSellerDashboardCache = readCache<SellerDashboardCache>(SELLER_DASHBOARD_CACHE_KEY);
const initialClaimsCache = readCache<Claim[]>(CLAIMS_CACHE_KEY);
const initialTrackingCache = readCache<TrackingCache>(TRACKING_CACHE_KEY);

const savePendingQuoteAction = (action: PendingQuoteAction) => {
  localStorage.setItem(PENDING_QUOTE_ACTION_KEY, JSON.stringify(action));
};

const takePendingQuoteAction = (): PendingQuoteAction | null => {
  const value = localStorage.getItem(PENDING_QUOTE_ACTION_KEY);
  localStorage.removeItem(PENDING_QUOTE_ACTION_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as PendingQuoteAction;
  } catch {
    return null;
  }
};

const clearCartCache = () => {
  removeCache(CART_CACHE_KEY);
};

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

const publicViews: ViewName[] = [
  'home',
  'catalog',
  'verdecito',
  'productDetail',
  'producerProfile',
  'support',
  'login',
  'acceptInvitation',
];

const authenticatedCommonViews: ViewName[] = [
  'home',
  'catalog',
  'productDetail',
  'producerProfile',
  'support',
];

const clientViews: ViewName[] = [
  ...authenticatedCommonViews,
  'verdecito',
  'cart',
  'orders',
  'orderTracking',
  'orderSuccess',
  'purchaseRequests',
  'purchaseRequestDetail',
  'quoteRequest',
  'quoteOptions',
  'quotes',
  'quoteDetail',
  'claims',
];

const sellerViews: ViewName[] = ['home', 'catalog', 'productDetail', 'producerProfile', 'sellerDashboard'];

const advisorViews: ViewName[] = ['home', 'claims', 'adminQuotes', 'adminQuoteDetail'];

const adminViews: ViewName[] = ['home', 'catalog', 'userManagement'];

const catalogViews: ViewName[] = [
  'home',
  'catalog',
  'productDetail',
  'producerProfile',
  'verdecito',
];

const canAccessView = (nextView: ViewName, user: User | null) => {
  if (!user) return publicViews.includes(nextView);
  if (user.role === 'CLIENT') return clientViews.includes(nextView);
  if (user.role === 'SELLER') return sellerViews.includes(nextView);
  if (user.role === 'ADMIN') return adminViews.includes(nextView);
  if (user.role === 'ADVISOR') return advisorViews.includes(nextView);
  return false;
};

const viewToPath: Record<ViewName, string> = {
  home: '/',
  catalog: '/catalog',
  verdecito: '/verdecito',
  productDetail: '/product-detail',
  cart: '/cart',
  login: '/login',
  orders: '/orders',
  orderTracking: '/order-tracking',
  orderSuccess: '/order-success',
  support: '/support',
  producerProfile: '/producer-profile',
  purchaseRequests: '/purchase-requests',
  purchaseRequestDetail: '/purchase-request-detail',
  sellerDashboard: '/seller-dashboard',
  sales: '/sales',
  quoteRequest: '/quote-request',
  quoteOptions: '/quote-options',
  quotes: '/quotes',
  quoteDetail: '/quote-detail',
  adminQuotes: '/admin/quotes',
  adminQuoteDetail: '/admin/quote-detail',
  userManagement: '/admin/users',
  claims: '/claims',
  acceptInvitation: '/accept-invitation',
};

const pathToView = Object.entries(viewToPath).reduce<Record<string, ViewName>>((acc, [viewName, path]) => {
  acc[path] = viewName as ViewName;
  return acc;
}, {});

const getInitialView = (): ViewName => {
  const stateView = window.history.state?.view as ViewName | undefined;
  if (stateView) return stateView;
  return pathToView[window.location.pathname] ?? 'home';
};

const getInitialUser = (): User | null => {
  if (!getAccessToken()) return null;
  return getStoredUser();
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number) => {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error('La validacion de sesion tardo demasiado.'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};

let sharedMeRequest: Promise<User> | null = null;

export default function App() {
  const [view, setView] = useState<ViewName>(() => getInitialView());
  const [activeProducerId, setActiveProducerId] = useState('muebles-ves');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [sellerEditingProductId, setSellerEditingProductId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<ViewName>('home');
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter | null>(null);
  const [selectedProducerId, setSelectedProducerId] = useState<string | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(() => initialCatalogCache?.data.products ?? []);
  const [catalogPageInfo, setCatalogPageInfo] = useState<PageInfo>(DEFAULT_PAGE_INFO);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(() => initialCatalogCache?.data.categories ?? []);
  const [catalogProducers, setCatalogProducers] = useState<Producer[]>(() => initialCatalogCache?.data.producers ?? []);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogSynced, setCatalogSynced] = useState(() => Boolean(initialCatalogCache?.data.products.length));
  const [catalogError, setCatalogError] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>(() => initialCartCache?.data ?? []);
  const [cartLoading, setCartLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => getInitialUser());
  const [authLoading, setAuthLoading] = useState(() => Boolean(getAccessToken() && !getStoredUser()));
  const [hasPendingCheckout, setHasPendingCheckout] = useState(false);
  const [pendingCartProductId, setPendingCartProductId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [cartNotice, setCartNotice] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>(() => initialOrdersCache?.data ?? []);
  const [ordersPageInfo, setOrdersPageInfo] = useState<PageInfo>(DEFAULT_PAGE_INFO);
  const [ordersPage, setOrdersPage] = useState(1);
  const [sales, setSales] = useState<Sale[]>(() => initialSellerDashboardCache?.data.sales ?? []);
  const [sellerEarnings, setSellerEarnings] = useState<SellerEarnings | null>(() => initialSellerDashboardCache?.data.earnings ?? null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>(() => initialSellerDashboardCache?.data.products ?? []);
  const [sellerQuotes, setSellerQuotes] = useState<Quote[]>(() => initialSellerDashboardCache?.data.quotes ?? []);
  const [sellerActiveTab, setSellerActiveTab] = useState<SellerDashboardTab>(() => readSellerTab());
  const [clientQuotes, setClientQuotes] = useState<Quote[]>(() => initialClientQuotesCache?.data ?? []);
  const [clientQuotesPageInfo, setClientQuotesPageInfo] = useState<PageInfo>(DEFAULT_PAGE_INFO);
  const [clientQuotesPage, setClientQuotesPage] = useState(1);
  const [clientQuotesLoading, setClientQuotesLoading] = useState(false);
  const [clientQuotesError, setClientQuotesError] = useState('');
  const [sellerDashboardLoading, setSellerDashboardLoading] = useState(false);
  const [sellerDashboardError, setSellerDashboardError] = useState('');
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => (
    initialPurchaseRequestsCache?.data ?? initialSellerDashboardCache?.data.requests ?? []
  ));
  const [purchaseRequestsPageInfo, setPurchaseRequestsPageInfo] = useState<PageInfo>(DEFAULT_PAGE_INFO);
  const [purchaseRequestsPage, setPurchaseRequestsPage] = useState(1);
  const [claims, setClaims] = useState<Claim[]>(() => initialClaimsCache?.data ?? []);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedPurchaseRequestId, setSelectedPurchaseRequestId] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedQuoteProductId, setSelectedQuoteProductId] = useState<string | null>(null);
  const [selectedQuoteAdditionalProducts, setSelectedQuoteAdditionalProducts] = useState<string[]>([]);
  const [selectedQuoteType, setSelectedQuoteType] = useState<QuoteType>('REFERENCE_IMAGE');
  const [catalogMode, setCatalogMode] = useState<'normal' | 'quote'>('normal');
  const isApplyingPopState = useRef(false);
  const catalogLoadedRef = useRef(Boolean(initialCatalogCache && isCacheFresh(initialCatalogCache.updatedAt, CATALOG_TTL)));
  const catalogRequestRef = useRef<Promise<void> | null>(null);
  const catalogMetadataRequestRef = useRef<Promise<void> | null>(null);
  const catalogProductsRequestRef = useRef<Record<string, Promise<void>>>({});
  const catalogProductsCacheRef = useRef<Record<string, CatalogProductsCacheEntry>>(
    initialCatalogCache
      ? {
        [getCatalogProductsCacheKey(1, null)]: {
          items: initialCatalogCache.data.products,
          pageInfo: { page: 1, total: initialCatalogCache.data.products.length, totalPages: 1 },
          updatedAt: initialCatalogCache.updatedAt,
        },
      }
      : {},
  );
  const cartRequestRef = useRef<Promise<CartItem[]> | null>(null);
  const lastCatalogFetchRef = useRef(initialCatalogCache?.updatedAt ?? 0);
  const lastCatalogMetadataFetchRef = useRef(initialCatalogCache?.updatedAt ?? 0);
  const lastCartFetchRef = useRef(initialCartCache?.updatedAt ?? 0);
  const ordersRequestRef = useRef<Promise<Order[]> | null>(null);
  const lastOrdersFetchRef = useRef(initialOrdersCache?.updatedAt ?? 0);
  const purchaseRequestsRequestRef = useRef<Promise<PurchaseRequest[]> | null>(null);
  const lastPurchaseRequestsFetchRef = useRef(initialPurchaseRequestsCache?.updatedAt ?? 0);
  const clientQuotesRequestRef = useRef<Promise<Quote[]> | null>(null);
  const lastClientQuotesFetchRef = useRef(initialClientQuotesCache?.updatedAt ?? 0);
  const claimsRequestRef = useRef<Promise<Claim[]> | null>(null);
  const lastClaimsFetchRef = useRef(initialClaimsCache?.updatedAt ?? 0);
  const sellerDashboardRequestRef = useRef<Partial<Record<SellerResourceKey, Promise<void>>>>({});
  const lastSellerDashboardFetchRef = useRef<Record<SellerResourceKey, number>>({
    products: initialSellerDashboardCache?.data.products.length ? initialSellerDashboardCache.updatedAt : 0,
    quotes: initialSellerDashboardCache?.data.quotes.length ? initialSellerDashboardCache.updatedAt : 0,
    requests: initialSellerDashboardCache?.data.requests.length ? initialSellerDashboardCache.updatedAt : 0,
    sales: initialSellerDashboardCache?.data.sales.length ? initialSellerDashboardCache.updatedAt : 0,
    earnings: initialSellerDashboardCache?.data.earnings ? initialSellerDashboardCache.updatedAt : 0,
    profile: initialSellerDashboardCache?.data.producer ? initialSellerDashboardCache.updatedAt : 0,
  });
  const trackingRequestRef = useRef<Record<string, Promise<Order>>>({});
  const trackingCacheRef = useRef<TrackingCache>(initialTrackingCache?.data ?? {});
  const sessionRole = mapApiRoleToUiRole(currentUser?.role);

  const fetchMeOnce = async () => {
    if (sharedMeRequest) return sharedMeRequest;

    sharedMeRequest = getMe().finally(() => {
      sharedMeRequest = null;
    });

    return sharedMeRequest;
  };

  const invalidateCatalogCache = () => {
    catalogLoadedRef.current = false;
    lastCatalogFetchRef.current = 0;
    lastCatalogMetadataFetchRef.current = 0;
    catalogProductsCacheRef.current = {};
    catalogProductsRequestRef.current = {};
    catalogMetadataRequestRef.current = null;
    catalogRequestRef.current = null;
    removeCache(CATALOG_CACHE_KEY);
  };

  const invalidateOrdersCache = () => {
    lastOrdersFetchRef.current = 0;
    removeCache(ORDERS_CACHE_KEY);
  };

  const invalidatePurchaseRequestsCache = () => {
    lastPurchaseRequestsFetchRef.current = 0;
    removeCache(PURCHASE_REQUESTS_CACHE_KEY);
  };

  const invalidateQuotesCache = () => {
    lastClientQuotesFetchRef.current = 0;
    removeCache(CLIENT_QUOTES_CACHE_KEY);
  };

  const invalidateSellerDashboardCache = () => {
    lastSellerDashboardFetchRef.current = {
      products: 0,
      quotes: 0,
      requests: 0,
      sales: 0,
      earnings: 0,
      profile: 0,
    };
    removeCache(SELLER_DASHBOARD_CACHE_KEY);
  };

  const clearUserModuleCaches = () => {
    clearCartCache();
    invalidateOrdersCache();
    invalidatePurchaseRequestsCache();
    invalidateQuotesCache();
    invalidateSellerDashboardCache();
    removeCache(CLAIMS_CACHE_KEY);
    removeCache(TRACKING_CACHE_KEY);
    lastCartFetchRef.current = 0;
    lastClaimsFetchRef.current = 0;
    trackingCacheRef.current = {};
  };

  const updateCartState = (updater: CartItem[] | ((current: CartItem[]) => CartItem[])) => {
    setCartItems((current) => {
      const nextItems = typeof updater === 'function' ? updater(current) : updater;
      writeCache(CART_CACHE_KEY, nextItems);
      lastCartFetchRef.current = Date.now();
      return nextItems;
    });
  };

  const updateOrdersState = (updater: Order[] | ((current: Order[]) => Order[])) => {
    setOrders((current) => {
      const nextOrders = typeof updater === 'function' ? updater(current) : updater;
      writeCache(ORDERS_CACHE_KEY, nextOrders);
      lastOrdersFetchRef.current = Date.now();
      return nextOrders;
    });
  };

  const updatePurchaseRequestsState = (
    updater: PurchaseRequest[] | ((current: PurchaseRequest[]) => PurchaseRequest[]),
  ) => {
    setPurchaseRequests((current) => {
      const nextRequests = typeof updater === 'function' ? updater(current) : updater;
      writeCache(PURCHASE_REQUESTS_CACHE_KEY, nextRequests);
      lastPurchaseRequestsFetchRef.current = Date.now();
      return nextRequests;
    });
  };

  const updateSellerDashboardCache = (
    products = sellerProducts,
    quotes = sellerQuotes,
    requests = purchaseRequests,
    nextSales = sales,
    earnings = sellerEarnings,
  ) => {
    writeCache(SELLER_DASHBOARD_CACHE_KEY, {
      products,
      quotes,
      requests,
      sales: nextSales,
      earnings,
    });
  };

  const updateClaimsState = (updater: Claim[] | ((current: Claim[]) => Claim[])) => {
    setClaims((current) => {
      const nextClaims = typeof updater === 'function' ? updater(current) : updater;
      writeCache(CLAIMS_CACHE_KEY, nextClaims);
      lastClaimsFetchRef.current = Date.now();
      return nextClaims;
    });
  };

  const writeCatalogCache = (
    products = catalogProducts,
    categories = catalogCategories.length ? catalogCategories : fallbackCategories,
    producers = catalogProducers.length ? catalogProducers : fallbackProducers,
    updatedAt = Date.now(),
  ) => {
    writeCache(CATALOG_CACHE_KEY, { products, categories, producers }, updatedAt);
  };

  const fetchCatalogMetadataOnce = async (options: { force?: boolean } = {}) => {
    const hasMetadata = catalogCategories.length > 0 && catalogProducers.length > 0;
    if (!options.force && hasMetadata && isCacheFresh(lastCatalogMetadataFetchRef.current, CATALOG_TTL)) return;
    if (!options.force && catalogMetadataRequestRef.current) return catalogMetadataRequestRef.current;

    catalogMetadataRequestRef.current = Promise.all([
      fetchCategories(),
      fetchProducers(),
    ])
      .then(([loadedCategories, loadedProducers]) => {
        const nextCategories = loadedCategories.length ? loadedCategories : fallbackCategories;
        const nextProducers = loadedProducers.length ? loadedProducers : fallbackProducers;
        setCatalogCategories(nextCategories);
        setCatalogProducers(nextProducers);
        lastCatalogMetadataFetchRef.current = Date.now();
        writeCatalogCache(catalogProducts, nextCategories, nextProducers, lastCatalogMetadataFetchRef.current);
      })
      .catch(() => {
        if (!catalogCategories.length) setCatalogCategories(fallbackCategories);
        if (!catalogProducers.length) setCatalogProducers(fallbackProducers);
      })
      .finally(() => {
        catalogMetadataRequestRef.current = null;
      });

    return catalogMetadataRequestRef.current;
  };

  const fetchCatalogProductsOnce = async (options: { force?: boolean; page?: number } = {}) => {
    const requestedPage = options.page ?? catalogPage;
    const cacheKey = getCatalogProductsCacheKey(requestedPage, catalogFilter);
    const cached = catalogProductsCacheRef.current[cacheKey];

    if (!options.force && cached && isCacheFresh(cached.updatedAt, CATALOG_TTL)) {
      setCatalogProducts(cached.items);
      setCatalogPage(requestedPage);
      setCatalogPageInfo(cached.pageInfo);
      catalogLoadedRef.current = true;
      return;
    }

    if (!options.force && catalogProductsRequestRef.current[cacheKey]) {
      return catalogProductsRequestRef.current[cacheKey];
    }

    setIsLoadingCatalog(true);
    setCatalogError('');

    catalogProductsRequestRef.current[cacheKey] = fetchProducts({ ...(catalogFilter ?? {}), limit: 20, page: requestedPage })
      .then((loadedProducts) => {
        const pageInfo = {
          page: loadedProducts.page,
          total: loadedProducts.total,
          totalPages: loadedProducts.totalPages,
        };
        setCatalogProducts(loadedProducts.items);
        setCatalogPage(requestedPage);
        setCatalogPageInfo(pageInfo);
        setCatalogSynced(true);
        catalogLoadedRef.current = true;
        lastCatalogFetchRef.current = Date.now();
        catalogProductsCacheRef.current[cacheKey] = {
          items: loadedProducts.items,
          pageInfo,
          updatedAt: lastCatalogFetchRef.current,
        };
        writeCatalogCache(loadedProducts.items, catalogCategories, catalogProducers, lastCatalogFetchRef.current);
      })
      .catch(() => {
        if (!catalogProducts.length) setCatalogProducts([]);
        setCatalogSynced(false);
        catalogLoadedRef.current = false;
        setCatalogError('No pudimos cargar el catalogo. Verifica que el backend este activo.');
      })
      .finally(() => {
        delete catalogProductsRequestRef.current[cacheKey];
        setIsLoadingCatalog(false);
      });

    return catalogProductsRequestRef.current[cacheKey];
  };

  const fetchCatalogOnce = async (options: { force?: boolean; page?: number } = {}) => {
    catalogRequestRef.current = Promise.all([
      fetchCatalogProductsOnce(options),
      fetchCatalogMetadataOnce({ force: options.force }),
    ])
      .then(() => undefined)
      .finally(() => {
        catalogRequestRef.current = null;
      });

    return catalogRequestRef.current;
  };

  const fetchCartOnce = async (options: { force?: boolean } = {}) => {
    if (cartRequestRef.current) {
      return cartRequestRef.current;
    }

    if (!options.force && isCacheFresh(lastCartFetchRef.current, CART_TTL)) {
      return cartItems;
    }

    setCartLoading(true);
    cartRequestRef.current = getRemoteCart()
      .then((remoteCart) => {
        updateCartState(remoteCart);
        setCartNotice('');
        return remoteCart;
      })
      .catch(() => {
        setCartNotice('No pudimos actualizar el carrito. Mostrando la ultima informacion guardada.');
        return cartItems;
      })
      .finally(() => {
        cartRequestRef.current = null;
        setCartLoading(false);
      });

    return cartRequestRef.current;
  };

  const fetchOrdersOnce = async (options: { force?: boolean; page?: number } = {}) => {
    const requestedPage = options.page ?? ordersPage;
    if (ordersRequestRef.current) return ordersRequestRef.current;
    if (!options.force && requestedPage === ordersPage && isCacheFresh(lastOrdersFetchRef.current, MODULE_TTL)) return orders;

    ordersRequestRef.current = getMyOrders({ limit: 5, page: requestedPage })
      .then((remoteOrders) => {
        updateOrdersState(remoteOrders.items);
        setOrdersPage(requestedPage);
        setOrdersPageInfo({ page: remoteOrders.page, total: remoteOrders.total, totalPages: remoteOrders.totalPages });
        return remoteOrders.items;
      })
      .catch(() => orders)
      .finally(() => {
        ordersRequestRef.current = null;
      });

    return ordersRequestRef.current;
  };

  const fetchPurchaseRequestsOnce = async (options: { force?: boolean; page?: number } = {}) => {
    const requestedPage = options.page ?? purchaseRequestsPage;
    if (purchaseRequestsRequestRef.current) return purchaseRequestsRequestRef.current;
    if (!options.force && requestedPage === purchaseRequestsPage && isCacheFresh(lastPurchaseRequestsFetchRef.current, MODULE_TTL)) return purchaseRequests;

    purchaseRequestsRequestRef.current = getMyPurchaseRequests({ limit: 5, page: requestedPage })
      .then((remoteRequests) => {
        updatePurchaseRequestsState(remoteRequests.items);
        setPurchaseRequestsPage(requestedPage);
        setPurchaseRequestsPageInfo({ page: remoteRequests.page, total: remoteRequests.total, totalPages: remoteRequests.totalPages });
        return remoteRequests.items;
      })
      .catch(() => purchaseRequests)
      .finally(() => {
        purchaseRequestsRequestRef.current = null;
      });

    return purchaseRequestsRequestRef.current;
  };

  const fetchClientQuotesOnce = async (options: { force?: boolean; page?: number } = {}) => {
    const requestedPage = options.page ?? clientQuotesPage;
    if (clientQuotesRequestRef.current) return clientQuotesRequestRef.current;
    if (!options.force && requestedPage === clientQuotesPage && isCacheFresh(lastClientQuotesFetchRef.current, MODULE_TTL)) return clientQuotes;

    setClientQuotesLoading(true);
    setClientQuotesError('');
    clientQuotesRequestRef.current = getMyQuotes({ limit: 5, page: requestedPage })
      .then((remoteQuotes) => {
        setClientQuotes(remoteQuotes.items);
        setClientQuotesPage(requestedPage);
        setClientQuotesPageInfo({ page: remoteQuotes.page, total: remoteQuotes.total, totalPages: remoteQuotes.totalPages });
        lastClientQuotesFetchRef.current = Date.now();
        writeCache(CLIENT_QUOTES_CACHE_KEY, remoteQuotes.items, lastClientQuotesFetchRef.current);
        return remoteQuotes.items;
      })
      .catch((error) => {
        setClientQuotesError(error instanceof Error ? error.message : 'No pudimos cargar tus cotizaciones.');
        return clientQuotes;
      })
      .finally(() => {
        clientQuotesRequestRef.current = null;
        setClientQuotesLoading(false);
      });

    return clientQuotesRequestRef.current;
  };

  const fetchClaimsOnce = async (options: { force?: boolean } = {}) => {
    if (claimsRequestRef.current) return claimsRequestRef.current;
    if (!options.force && isCacheFresh(lastClaimsFetchRef.current, MODULE_TTL)) return claims;

    claimsRequestRef.current = (sessionRole === 'admin' ? getAllClaims() : getMyClaims())
      .then((remoteClaims) => {
        updateClaimsState(remoteClaims);
        return remoteClaims;
      })
      .catch(() => claims)
      .finally(() => {
        claimsRequestRef.current = null;
      });

    return claimsRequestRef.current;
  };

  const fetchSellerResourceOnce = async (
    key: SellerResourceKey,
    loader: () => Promise<void>,
    options: { force?: boolean } = {},
  ) => {
    if (!options.force && sellerDashboardRequestRef.current[key]) {
      return sellerDashboardRequestRef.current[key];
    }

    if (!options.force && isCacheFresh(lastSellerDashboardFetchRef.current[key], MODULE_TTL)) {
      return;
    }

    sellerDashboardRequestRef.current[key] = (async () => {
      setSellerDashboardLoading(true);
      setSellerDashboardError('');

      try {
        if (import.meta.env.DEV) console.debug(`[seller-dashboard] fetch ${key}`);
        await loader();
        lastSellerDashboardFetchRef.current = {
          ...lastSellerDashboardFetchRef.current,
          [key]: Date.now(),
        };
      } catch (error) {
        setSellerDashboardError('No se pudo cargar el panel productor.');
        throw error;
      } finally {
        setSellerDashboardLoading(false);
        delete sellerDashboardRequestRef.current[key];
      }
    })();

    return sellerDashboardRequestRef.current[key];
  };

  const fetchSellerProductsOnce = (options: { force?: boolean } = {}) => fetchSellerResourceOnce('products', async () => {
    const remoteProducts = await getMyProducts({ limit: 20, page: 1 });
    setSellerProducts(remoteProducts.items);
    updateSellerDashboardCache(remoteProducts.items, sellerQuotes, purchaseRequests, sales);
    const nextProducerId = remoteProducts.items.find((product) => product.producerId)?.producerId;
    if (nextProducerId) setActiveProducerId(nextProducerId);
  }, options);

  const fetchSellerQuotesOnce = (options: { force?: boolean } = {}) => fetchSellerResourceOnce('quotes', async () => {
    const remoteQuotes = await getSellerQuotes({ limit: 5, page: 1 });
    setSellerQuotes(remoteQuotes.items);
    updateSellerDashboardCache(sellerProducts, remoteQuotes.items, purchaseRequests, sales);
  }, options);

  const fetchSellerRequestsOnce = (options: { force?: boolean } = {}) => fetchSellerResourceOnce('requests', async () => {
    const remoteRequests = await getSellerPurchaseRequests({ limit: 5, page: 1 });
    setPurchaseRequests(remoteRequests.items);
    updateSellerDashboardCache(sellerProducts, sellerQuotes, remoteRequests.items, sales);
  }, options);

  const fetchSellerSalesOnce = (options: { force?: boolean } = {}) => fetchSellerResourceOnce('sales', async () => {
    const remoteSales = await getMySales({ limit: 5, page: 1 });
    setSales(remoteSales.items);
    updateSellerDashboardCache(sellerProducts, sellerQuotes, purchaseRequests, remoteSales.items);
  }, options);

  const fetchSellerEarningsOnce = (options: { force?: boolean } = {}) => fetchSellerResourceOnce('earnings', async () => {
    const month = new Date().toISOString().slice(0, 7);
    const remoteEarnings = await getMyEarnings(month);
    setSellerEarnings(remoteEarnings);
    updateSellerDashboardCache(sellerProducts, sellerQuotes, purchaseRequests, sales, remoteEarnings);
  }, options);

  const fetchSellerProfileOnce = (options: { force?: boolean } = {}) => fetchSellerResourceOnce('profile', async () => {
    const producer = await getMyProducer();
    setActiveProducerId(producer.id);
    setCatalogProducers((current) => [producer, ...current.filter((entry) => entry.id !== producer.id)]);
  }, options);

  const fetchSellerDashboardOnce = async (options: { force?: boolean; tab?: SellerDashboardTab } = {}) => {
    const tab = options.tab ?? sellerActiveTab;
    if (tab === 'products' || tab === 'create') return fetchSellerProductsOnce(options);
    if (tab === 'quotes') return fetchSellerQuotesOnce(options);
    if (tab === 'requests') return fetchSellerRequestsOnce(options);
    if (tab === 'sales') return fetchSellerSalesOnce(options);
    if (tab === 'earnings') return fetchSellerEarningsOnce(options);
    if (tab === 'profile') return fetchSellerProfileOnce(options);
    return;
  };

  const setViewWithHistory = (
    nextView: ViewName,
    options: { replace?: boolean; scroll?: boolean } = {},
  ) => {
    const path = viewToPath[nextView] ?? '/';

    setView(nextView);

    if (options.replace) {
      window.history.replaceState({ view: nextView }, '', path);
    } else if (!isApplyingPopState.current && window.location.pathname !== path) {
      window.history.pushState({ view: nextView }, '', path);
    }

    if (options.scroll !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!catalogViews.includes(view)) return;
    void fetchCatalogOnce({ page: view === 'catalog' ? catalogPage : 1 });
  }, [view, catalogFilter]);

  useEffect(() => {
    window.history.replaceState({ view }, '', viewToPath[view] ?? '/');

    const handlePopState = (event: PopStateEvent) => {
      const nextView = (event.state?.view as ViewName | undefined)
        ?? pathToView[window.location.pathname]
        ?? 'home';

      isApplyingPopState.current = true;
      setView(nextView);
      window.requestAnimationFrame(() => {
        isApplyingPopState.current = false;
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleAuthLogout = () => {
      setCurrentUser(null);
      setCartItems([]);
      setCartLoading(false);
      cartRequestRef.current = null;
      sellerDashboardRequestRef.current = {};
      lastSellerDashboardFetchRef.current = { products: 0, quotes: 0, requests: 0, sales: 0, earnings: 0, profile: 0 };
      setSellerProducts([]);
      setSellerQuotes([]);
      setSellerEarnings(null);
      setClientQuotes([]);
      setClientQuotesError('');
      clientQuotesRequestRef.current = null;
      setSellerDashboardError('');
      clearUserModuleCaches();
      setViewWithHistory('login', { replace: true });
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'CLIENT') return;
    writeCache(CART_CACHE_KEY, cartItems);
  }, [cartItems, currentUser]);

  useEffect(() => {
    if (!catalogProducers.length) return;
    const producerForUser = currentUser?.role === 'SELLER'
      ? catalogProducers.find((producer) => producer.userId === currentUser.id)
      : undefined;

    if (producerForUser && producerForUser.id !== activeProducerId) {
      setActiveProducerId(producerForUser.id);
      return;
    }

    if (catalogProducers.some((producer) => producer.id === activeProducerId)) return;
    setActiveProducerId(catalogProducers[0].id);
  }, [activeProducerId, catalogProducers, currentUser?.id, currentUser?.role]);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = getAccessToken();
      const storedUser = getStoredUser();

      if (!token) {
        setAuthLoading(false);
        return;
      }

      if (storedUser) {
        setCurrentUser(storedUser);
        setAuthLoading(false);
      }

      try {
        const user = await withTimeout(fetchMeOnce(), AUTH_ME_TIMEOUT_MS);
        if (!isMounted) return;

        setCurrentUser(user);
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof ApiError && error.status === 401) {
          logoutFromBackend();
          setCurrentUser(null);
          setCartItems([]);
          setCartLoading(false);
          cartRequestRef.current = null;
          sellerDashboardRequestRef.current = {};
          lastSellerDashboardFetchRef.current = { products: 0, quotes: 0, requests: 0, sales: 0, earnings: 0, profile: 0 };
          setSellerProducts([]);
          setSellerQuotes([]);
          setSellerEarnings(null);
          setClientQuotes([]);
          setClientQuotesError('');
          clientQuotesRequestRef.current = null;
          setSellerDashboardError('');
          clearUserModuleCaches();
        } else if (storedUser) {
          setCurrentUser(storedUser);
        }
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const refreshActiveView = async () => {
      if (!currentUser) return;

      try {
        if (view === 'cart' && sessionRole === 'customer') {
          await fetchCartOnce();
        }

        if (view === 'orders' && sessionRole === 'customer') {
          await fetchOrdersOnce();
        }

        if ((view === 'purchaseRequests' || view === 'purchaseRequestDetail') && sessionRole === 'customer') {
          await fetchPurchaseRequestsOnce();
        }

        if (view === 'quotes' && sessionRole === 'customer') {
          await fetchClientQuotesOnce();
        }

        if (view === 'sellerDashboard' && currentUser.role === 'SELLER') {
          await fetchSellerDashboardOnce({ tab: sellerActiveTab });
        }

        if (view === 'claims') {
          await fetchClaimsOnce();
        }

      } catch {
        // Keep local data if the backend request fails.
      }
    };

    void refreshActiveView();

    return () => {
      isMounted = false;
    };
  }, [view, currentUser, sessionRole, sellerActiveTab]);

  useEffect(() => {
    if (authLoading) return;
    if (canAccessView(view, currentUser)) return;
    setViewWithHistory(currentUser ? 'home' : 'login', { replace: true });
  }, [authLoading, view, currentUser]);

  const findProducerById = (producerId: string | undefined) => (
    catalogProducers.find((producer) => producer.id === producerId)
      ?? getFallbackProducerById(producerId)
  );

  const navigate = (nextView: ViewName) => {
    if (!canAccessView(nextView, currentUser)) {
      setViewWithHistory(currentUser ? 'home' : 'login');
      return;
    }

    setViewWithHistory(nextView);
  };

  const getMarketplaceItems = (items: CartItem[]): MarketplaceItem[] => (
    items.flatMap((item) => {
      const product = item.product ?? catalogProducts.find((entry) => entry.id === item.productId);
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
      apiStatus: 'PAYMENT_COMPLETED',
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

    updateOrdersState((currentOrders) => [order, ...currentOrders]);
    setLastOrderId(order.id);
    setSelectedOrderId(order.id);
    createSalesFromOrder(order, groups);
    navigate('orderSuccess');
  };

  const handleNavbarNavigate = (nextView: ViewName) => {
    if (nextView === 'catalog') {
      handleNavigateToCatalog();
      return;
    }

    navigate(nextView);
  };

  const handleNavigateToCatalog = (filter: CatalogFilter | null = null) => {
    setCatalogMode('normal');
    setCatalogFilter(filter);
    setCatalogPage(1);
    navigate('catalog');
  };

  const handleCategorySelect = (categoryName: string) => {
    handleNavigateToCatalog({ category: categoryName });
  };

  const handleShowSustainableProducts = () => {
    handleNavigateToCatalog({ type: 'eco' });
  };

  const handleCatalogPageChange = (page: number) => {
    void fetchCatalogOnce({ force: true, page });
  };

  const handleOrdersPageChange = (page: number) => {
    void fetchOrdersOnce({ force: true, page });
  };

  const handlePurchaseRequestsPageChange = (page: number) => {
    void fetchPurchaseRequestsOnce({ force: true, page });
  };

  const handleClientQuotesPageChange = (page: number) => {
    void fetchClientQuotesOnce({ force: true, page });
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

  const openQuoteAction = (action: PendingQuoteAction) => {
    setCatalogMode('normal');

    if (action.type === 'OPTIONS') {
      setSelectedQuoteProductId(null);
      setSelectedQuoteAdditionalProducts([]);
      navigate('quoteOptions');
      return;
    }

    setSelectedQuoteType(action.type);
    setSelectedQuoteProductId(action.productId ?? null);
    setSelectedQuoteAdditionalProducts(action.additionalProductTitles ?? []);
    navigate('quoteRequest');
  };

  const requestQuoteAction = (action: PendingQuoteAction) => {
    if (!currentUser) {
      savePendingQuoteAction(action);
      setLoginError('Ingresa o regístrate para solicitar una cotización.');
      navigate('login');
      return;
    }

    if (currentUser.role === 'ADMIN' || currentUser.role === 'ADVISOR') {
      setCartMessage('Para realizar esta acción debes ingresar con una cuenta de cliente.');
      return;
    }

    if (currentUser.role === 'SELLER') {
      setCartMessage('Para realizar esta acción debes ingresar con una cuenta de cliente.');
      return;
    }

    openQuoteAction(action);
  };

  const handleOpenQuoteOptions = () => {
    requestQuoteAction({ type: 'OPTIONS' });
  };

  const handleOpenReferenceQuote = () => {
    requestQuoteAction({ type: 'REFERENCE_IMAGE' });
  };

  const handleOpenQuoteCatalog = () => {
    if (!currentUser) {
      requestQuoteAction({ type: 'OPTIONS' });
      return;
    }

    if (currentUser.role !== 'CLIENT') {
      requestQuoteAction({ type: 'OPTIONS' });
      return;
    }

    setCatalogMode('quote');
    setCatalogFilter(null);
    navigate('catalog');
  };

  const handleOpenQuoteRequest = (productId: string) => {
    requestQuoteAction({ type: 'PRODUCT_BASED', productId });
  };

  const handleOpenCartQuoteRequest = (productId: string, additionalProductTitles: string[]) => {
    requestQuoteAction({ type: 'PRODUCT_BASED', productId, additionalProductTitles });
  };

  const handleOpenQuoteDetail = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    navigate('quoteDetail');
  };

  const handleOpenAdminQuoteDetail = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    navigate('adminQuoteDetail');
  };

  const addToCart = async (productId: string) => {
    if (!currentUser) {
      setHasPendingCheckout(true);
      setPendingCartProductId(productId);
      setCartMessage('Debes iniciar sesion para agregar productos al carrito.');
      navigate('login');
      return;
    }

    if (currentUser.role !== 'CLIENT') {
      setCartMessage('Para realizar esta acción debes ingresar con una cuenta de cliente.');
      return;
    }

    const productExistsInCatalog = catalogProducts.some((product) => product.id === productId);
    if (import.meta.env.DEV) {
      console.log('addToCart productId', productId);
      console.log('product exists in catalogProducts', productExistsInCatalog);
    }

    if (!catalogSynced || !productExistsInCatalog) {
      setCartMessage('No se pudo sincronizar el catalogo con el servidor. Recarga la pagina.');
      return;
    }

    try {
      const addedItem = await addRemoteCartItem(productId, 1);
      const product = catalogProducts.find((entry) => entry.id === productId);
      updateCartState((currentItems) => {
        const existingItem = currentItems.find((entry) => entry.productId === productId);
        if (existingItem) {
          return currentItems.map((entry) => (
            entry.productId === productId
              ? {
                ...entry,
                id: addedItem.id ?? entry.id,
                quantity: addedItem.quantity,
                product: addedItem.product ?? entry.product ?? product,
              }
              : entry
          ));
        }

        return [{
          ...addedItem,
          product: addedItem.product ?? product,
        }, ...currentItems];
      });
    } catch (error) {
      setCartMessage(error instanceof Error ? error.message : 'No se pudo agregar el producto al carrito.');
      return;
    }

    setCartMessage('Producto agregado al carrito.');
    setCartNotice('');
  };

  const getCartEntryKey = (entry: CartItem) => entry.productId ?? entry.quoteId ?? '';

  const removeFromCart = async (cartEntryKey: string) => {
    const item = cartItems.find((entry) => getCartEntryKey(entry) === cartEntryKey);

    try {
      if (item?.id) {
        await removeRemoteCartItem(item.id);
        updateCartState((currentItems) => currentItems.filter((entry) => getCartEntryKey(entry) !== cartEntryKey));
        return;
      }
      setCartNotice('No pudimos identificar el item del carrito. Actualiza la pagina e intenta nuevamente.');
    } catch (error) {
      setCartNotice(error instanceof Error ? error.message : 'No se pudo eliminar el producto del carrito.');
    }
  };

  const increaseQuantity = async (cartEntryKey: string) => {
    const item = cartItems.find((entry) => getCartEntryKey(entry) === cartEntryKey);

    try {
      if (item?.id) {
        const updated = await updateRemoteCartItem(item.id, item.quantity + 1);
        updateCartState((currentItems) => currentItems.map((entry) => (
          getCartEntryKey(entry) === cartEntryKey
            ? { ...entry, ...updated, product: updated.product ?? entry.product }
            : entry
        )));
        return;
      }
      setCartNotice('No pudimos identificar el item del carrito. Actualiza la pagina e intenta nuevamente.');
    } catch (error) {
      setCartNotice(error instanceof Error ? error.message : 'No se pudo actualizar la cantidad.');
    }
  };

  const decreaseQuantity = async (cartEntryKey: string) => {
    const item = cartItems.find((entry) => getCartEntryKey(entry) === cartEntryKey);

    try {
      if (item?.id && item.quantity > 1) {
        const updated = await updateRemoteCartItem(item.id, item.quantity - 1);
        updateCartState((currentItems) => currentItems.map((entry) => (
          getCartEntryKey(entry) === cartEntryKey
            ? { ...entry, ...updated, product: updated.product ?? entry.product }
            : entry
        )));
        return;
      }

      if (item?.id) {
        await removeRemoteCartItem(item.id);
        updateCartState((currentItems) => currentItems.filter((entry) => getCartEntryKey(entry) !== cartEntryKey));
        return;
      }
      setCartNotice('No pudimos identificar el item del carrito. Actualiza la pagina e intenta nuevamente.');
    } catch (error) {
      setCartNotice(error instanceof Error ? error.message : 'No se pudo actualizar la cantidad.');
    }
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
    if (loginLoading) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    try {
      setLoginLoading(true);
      clearUserModuleCaches();
      const user = await loginWithBackend(email, password);

      setCurrentUser(user);
      if (pendingCartProductId && user.role === 'CLIENT') {
        try {
          const productExistsInCatalog = catalogProducts.some((product) => product.id === pendingCartProductId);
          if (!catalogSynced || !productExistsInCatalog) {
            setCartMessage('No se pudo sincronizar el catalogo con el servidor. Recarga la pagina.');
          } else {
            const addedItem = await addRemoteCartItem(pendingCartProductId, 1);
            const product = catalogProducts.find((entry) => entry.id === pendingCartProductId);
            updateCartState((currentItems) => {
              const existingItem = currentItems.find((entry) => entry.productId === pendingCartProductId);
              if (existingItem) {
                return currentItems.map((entry) => (
                  entry.productId === pendingCartProductId
                    ? {
                      ...entry,
                      id: addedItem.id ?? entry.id,
                      quantity: addedItem.quantity,
                      product: addedItem.product ?? entry.product ?? product,
                    }
                    : entry
                ));
              }

              return [{
                ...addedItem,
                product: addedItem.product ?? product,
              }, ...currentItems];
            });
          }
        } catch (error) {
          setCartMessage(error instanceof Error ? error.message : 'No se pudo agregar el producto pendiente al carrito.');
        }
      }
      setPendingCartProductId(null);
      setLoginError('');
      const pendingQuoteAction = takePendingQuoteAction();
      let nextView: ViewName = hasPendingCheckout && user.role === 'CLIENT'
          ? 'cart'
          : 'home';

      if (pendingQuoteAction && user.role === 'CLIENT') {
        if (pendingQuoteAction.type === 'OPTIONS') {
          setSelectedQuoteProductId(null);
          setSelectedQuoteAdditionalProducts([]);
          nextView = 'quoteOptions';
        } else {
          setSelectedQuoteType(pendingQuoteAction.type);
          setSelectedQuoteProductId(pendingQuoteAction.productId ?? null);
          setSelectedQuoteAdditionalProducts(pendingQuoteAction.additionalProductTitles ?? []);
          nextView = 'quoteRequest';
        }
      } else if (pendingQuoteAction && (user.role === 'ADMIN' || user.role === 'ADVISOR')) {
        nextView = 'adminQuotes';
      }

      setHasPendingCheckout(false);
      setViewWithHistory(nextView, { replace: true });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Correo o contrasena incorrectos.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (password !== confirmPassword) {
      setLoginError('Las contrasenas no coinciden.');
      return;
    }

    try {
      const baseData = {
        name: String(formData.get('name') ?? '').trim(),
        email: String(formData.get('email') ?? '').trim(),
        password,
        phone: String(formData.get('phone') ?? '').trim() || undefined,
        district: String(formData.get('district') ?? '').trim() || undefined,
      };
      const user = await registerClient(baseData);

      setCurrentUser(user);
      setLoginError('');
      setHasPendingCheckout(false);
      setViewWithHistory('home', { replace: true });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'No se pudo completar el registro.');
    }
  };

  const handleLogout = () => {
    logoutFromBackend();
    setCurrentUser(null);
    setHasPendingCheckout(false);
    localStorage.removeItem(PENDING_QUOTE_ACTION_KEY);
    setPendingCartProductId(null);
    setSelectedQuoteAdditionalProducts([]);
    setCartItems([]);
    setCartLoading(false);
    cartRequestRef.current = null;
    setClientQuotes([]);
    setClientQuotesError('');
    clientQuotesRequestRef.current = null;
    clearUserModuleCaches();
    setLoginError('');
    setViewWithHistory('login', { replace: true });
  };

  const handlePayNow = async () => {
    if (checkoutLoading) return;

    if (!currentUser) {
      setHasPendingCheckout(true);
      navigate('login');
      return;
    }

    if (currentUser.role !== 'CLIENT') {
      setCartNotice('Para comprar debes ingresar con una cuenta de cliente.');
      return;
    }

    try {
      setCheckoutLoading(true);
      const order = await checkoutCart('FULL_PAYMENT');
      updateOrdersState((current) => [order, ...current.filter((entry) => entry.id !== order.id)]);
      setLastOrderId(order.id);
      setSelectedOrderId(order.id);
      const purchasedProductIds = new Set(order.items.map((item) => item.productId));
      updateCartState((current) => {
        const remaining = current.filter((item) => !purchasedProductIds.has(item.productId));
        return remaining;
      });
      setCartNotice('');
      navigate('orderSuccess');
    } catch (error) {
      setCartNotice(error instanceof Error ? error.message : 'No se pudo completar la compra.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCreatePurchaseRequest = async () => {
    if (!currentUser) {
      setHasPendingCheckout(true);
      navigate('login');
      return;
    }

    try {
      const request = await createPurchaseRequest();
      updatePurchaseRequestsState((current) => [request, ...current.filter((entry) => entry.id !== request.id)]);
      setSelectedPurchaseRequestId(request.id);
      await fetchCartOnce({ force: true });
      navigate('purchaseRequestDetail');
      return;
    } catch (error) {
      setCartNotice(error instanceof Error ? error.message : 'No se pudo crear la solicitud de compra.');
      return;
    }
  };

  const updateRequestAfterProducerAction = (
    requestId: string,
    producerId: string,
    updater: (group: PurchaseRequestGroup) => PurchaseRequestGroup,
  ) => {
    updatePurchaseRequestsState((current) => current.map((request) => {
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
  };

  const handleContinueConfirmed = async (requestId: string) => {
    try {
      const request = await continueWithConfirmed(requestId);
      updatePurchaseRequestsState((current) => current.map((entry) => (
        entry.id === requestId ? request : entry
      )));
      return;
    } catch {
      // Keep local state update as fallback.
    }

    updatePurchaseRequestsState((current) => current.map((request) => {
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
      updatePurchaseRequestsState((current) => current.map((entry) => (
        entry.id === requestId ? request : entry
      )));
      return;
    } catch {
      // Keep local state update as fallback.
    }

    updatePurchaseRequestsState((current) => current.map((request) => (
      request.id === requestId ? { ...request, status: 'CANCELLED' } : request
    )));
  };

  const handlePayPurchaseRequest = async (requestId: string, paymentOption: PaymentOption) => {
    try {
      const order = await payPurchaseRequest(requestId, paymentOption);
      updateOrdersState((current) => [order, ...current.filter((entry) => entry.id !== order.id)]);
      setLastOrderId(order.id);
      setSelectedOrderId(order.id);
      updatePurchaseRequestsState((current) => current.map((entry) => (
        entry.id === requestId
          ? { ...entry, status: 'CONVERTED_TO_ORDER', convertedOrderId: order.id }
          : entry
      )));
      navigate('orderSuccess');
      return;
    } catch (error) {
      setCartNotice(error instanceof Error ? error.message : 'No se pudo pagar la solicitud.');
    }
  };

  const syncOrderGroupStatus = (sale: Sale, status: SaleStatus) => {
    updateOrdersState((current) => current.map((order) => {
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

    const updatedSale = await markSaleInPreparation(saleId);
    setSales((current) => {
      const nextSales = current.map((entry) => (
        entry.id === saleId ? { ...entry, ...updatedSale } : entry
      ));
      updateSellerDashboardCache(sellerProducts, sellerQuotes, purchaseRequests, nextSales);
      return nextSales;
    });
    syncOrderGroupStatus(updatedSale, 'IN_PREPARATION');
  };

  const handleMarkSaleReady = async (saleId: string) => {
    const sale = sales.find((entry) => entry.id === saleId);
    if (!sale) return;

    const updatedSale = await markSaleReadyForDispatch(saleId);
    setSales((current) => {
      const nextSales = current.map((entry) => (
        entry.id === saleId ? { ...entry, ...updatedSale } : entry
      ));
      updateSellerDashboardCache(sellerProducts, sellerQuotes, purchaseRequests, nextSales);
      return nextSales;
    });
    syncOrderGroupStatus(updatedSale, 'READY_FOR_DISPATCH');
  };

  const handleMarkSaleDispatched = async (saleId: string) => {
    const sale = sales.find((entry) => entry.id === saleId);
    if (!sale) return;

    const updatedSale = await markSaleDispatched(saleId);
    setSales((current) => {
      const nextSales = current.map((entry) => (
        entry.id === saleId ? { ...entry, ...updatedSale } : entry
      ));
      updateSellerDashboardCache(sellerProducts, sellerQuotes, purchaseRequests, nextSales);
      return nextSales;
    });
    syncOrderGroupStatus(updatedSale, 'DISPATCHED');
  };

  const handleCreateProduct = async (data: ProductFormInput) => {
    const product = await createRemoteProduct(data);
    setCatalogProducts((current) => [product, ...current.filter((entry) => entry.id !== product.id)]);
    setSellerProducts((current) => [product, ...current.filter((entry) => entry.id !== product.id)]);
    invalidateCatalogCache();
    invalidateSellerDashboardCache();
    return product;
  };

  const handleUpdateProduct = async (productId: string, data: ProductFormInput) => {
    const product = await updateRemoteProduct(productId, data);
    setCatalogProducts((current) => current.map((entry) => (
      entry.id === productId ? product : entry
    )));
    setSellerProducts((current) => current.map((entry) => (
      entry.id === productId ? product : entry
    )));
    invalidateCatalogCache();
    invalidateSellerDashboardCache();
    return product;
  };

  const handleDeleteProduct = async (productId: string) => {
    const product = await deactivateRemoteProduct(productId);
    setCatalogProducts((current) => current.filter((entry) => entry.id !== product.id));
    setSellerProducts((current) => current.filter((entry) => entry.id !== product.id));
    invalidateCatalogCache();
    invalidateSellerDashboardCache();
    return product;
  };

  const handleUpdateProducerProfile = async (data: Record<string, string>) => {
    const producer = await updateMyProducer(data);
    setCatalogProducers((current) => [producer, ...current.filter((entry) => entry.id !== producer.id)]);
    setActiveProducerId(producer.id);
    invalidateCatalogCache();
    lastSellerDashboardFetchRef.current = { ...lastSellerDashboardFetchRef.current, profile: Date.now() };
  };

  const handleRespondQuote = async (
    quoteId: string,
    data: { quotedPrice: number; quotedDeliveryDays: number; sellerComment?: string; validUntil?: string },
  ) => {
    const quote = await respondQuote(quoteId, data);
    setSellerQuotes((current) => {
      const nextQuotes = current.map((entry) => (entry.id === quoteId ? quote : entry));
      updateSellerDashboardCache(sellerProducts, nextQuotes, purchaseRequests, sales, sellerEarnings);
      return nextQuotes;
    });
  };

  const handleCreateClaim = async (orderId: string, reason: string, description: string) => {
    try {
      const claim = await createRemoteClaim(orderId, mapClaimReasonToApi(reason), description);
      updateClaimsState((current) => [claim, ...current.filter((entry) => entry.id !== claim.id)]);
      updateOrdersState((current) => current.map((order) => (
        order.id === orderId ? { ...order, fundsStatus: 'HELD_BY_CLAIM' } : order
      )));
      setSales((current) => current.map((sale) => (
        sale.orderId === orderId ? { ...sale, fundsStatus: 'HELD_BY_CLAIM', status: 'HELD_BY_CLAIM' } : sale
      )));
      navigate('claims');
      return;
    } catch {
      // Keep local claim creation as fallback.
    }

    const claim: Claim = {
      id: `RCL-${String(claims.length + 1).padStart(3, '0')}`,
      orderId,
      customerId: currentUser?.id ?? currentUser?.email ?? 'cliente-demo',
      reason,
      description,
      status: 'OPEN',
      createdAt: formatDate(new Date()),
    };

    updateClaimsState((current) => [claim, ...current]);
    updateOrdersState((current) => current.map((order) => (
      order.id === orderId ? { ...order, fundsStatus: 'HELD_BY_CLAIM' } : order
    )));
    setSales((current) => current.map((sale) => (
      sale.orderId === orderId ? { ...sale, fundsStatus: 'HELD_BY_CLAIM', status: 'HELD_BY_CLAIM' } : sale
    )));
    navigate('claims');
  };

  const handleResolveClaim = async (claimId: string, status: 'RESOLVED' | 'REJECTED') => {
    try {
      const claim = status === 'RESOLVED'
        ? await resolveClaim(claimId)
        : await rejectClaim(claimId);
      updateClaimsState((current) => current.map((entry) => (
        entry.id === claimId ? claim : entry
      )));
    } catch {
      updateClaimsState((current) => current.map((claim) => (
        claim.id === claimId ? { ...claim, status } : claim
      )));
    }

  };

  const handleOpenPurchaseRequest = (requestId: string) => {
    setSelectedPurchaseRequestId(requestId);
    navigate('purchaseRequestDetail');
  };

  const trackOrder = async (orderId: string) => {
    setSelectedOrderId(orderId);
    const currentOrder = orders.find((order) => order.id === orderId);
    if (currentOrder?.producerGroups?.length) {
      navigate('orderTracking');
      return;
    }

    const cachedTracking = trackingCacheRef.current[orderId];
    if (cachedTracking && isCacheFresh(cachedTracking.updatedAt, TRACKING_TTL)) {
      updateOrdersState((current) => {
        const exists = current.some((entry) => entry.id === orderId);
        if (!exists) return [cachedTracking.data, ...current];
        return current.map((entry) => (
          entry.id === orderId ? { ...entry, ...cachedTracking.data } : entry
        ));
      });
      navigate('orderTracking');
      return;
    }

    try {
      trackingRequestRef.current[orderId] ??= getOrderTracking(orderId).finally(() => {
        delete trackingRequestRef.current[orderId];
      });
      const order = await trackingRequestRef.current[orderId];
      trackingCacheRef.current = {
        ...trackingCacheRef.current,
        [orderId]: { data: order, updatedAt: Date.now() },
      };
      writeCache(TRACKING_CACHE_KEY, trackingCacheRef.current);
      updateOrdersState((current) => current.map((entry) => (
        entry.id === orderId ? { ...entry, ...order } : entry
      )));
    } catch {
      // Keep existing order state as fallback.
    }
    navigate('orderTracking');
  };

  const handleConfirmOrderReceived = async (orderId: string) => {
    const orderToConfirm = orders.find((entry) => entry.id === orderId)
      ?? trackingCacheRef.current[orderId]?.data;

    if (orderToConfirm?.apiStatus !== 'DISPATCHED') {
      setCartNotice('Solo puedes confirmar recepcion cuando el pedido esta en camino.');
      return;
    }

    try {
      const order = await markOrderDelivered(orderId);
      updateOrdersState((current) => current.map((entry) => (
        entry.id === orderId ? { ...entry, ...order } : entry
      )));
      setSales((current) => current.map((sale) => (
        sale.orderId === orderId ? { ...sale, status: 'DELIVERED' } : sale
      )));
      trackingCacheRef.current = {
        ...trackingCacheRef.current,
        [orderId]: { data: order, updatedAt: Date.now() },
      };
      writeCache(TRACKING_CACHE_KEY, trackingCacheRef.current);
    } catch (error) {
      setCartNotice(error instanceof Error ? error.message : 'No se pudo confirmar la recepcion.');
    }
  };

  const selectedProduct = catalogProducts.find((product) => product.id === selectedProductId)
    ?? sellerProducts.find((product) => product.id === selectedProductId);
  const selectedQuoteProduct = catalogProducts.find((product) => product.id === selectedQuoteProductId);
  const selectedProductProducer = findProducerById(selectedProduct?.producerId);
  const selectedProducer = findProducerById(selectedProducerId ?? undefined);
  const sellerProducer = currentUser?.role === 'SELLER'
    ? catalogProducers.find((producer) => producer.userId === currentUser.id)
      ?? catalogProducers.find((producer) => producer.id === activeProducerId)
      ?? sellerProducts
        .filter((product) => product.producerId)
        .map((product) => ({
          id: product.producerId ?? '',
          userId: currentUser.id,
          name: product.storeName,
          type: 'Productora local',
          location: 'Villa El Salvador',
          description: 'Productora local registrada.',
          avatar: product.storeName.slice(0, 2).toUpperCase(),
        } satisfies Producer))[0]
    : undefined;
  const lastOrder = orders.find((order) => order.id === lastOrderId);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const selectedPurchaseRequest = purchaseRequests.find((request) => request.id === selectedPurchaseRequestId);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleEditProductFromDetail = (productId: string) => {
    setSellerEditingProductId(productId);
    navigate('sellerDashboard');
  };

  const renderView = () => {
    if (view === 'acceptInvitation') {
      return (
        <AcceptInvitationView
          onAccepted={(user, nextView) => {
            setCurrentUser(user);
            setViewWithHistory(nextView, { replace: true });
          }}
          onNavigate={navigate}
        />
      );
    }

    if (view === 'catalog') {
      return (
        <CatalogView
          catalogError={catalogError}
          categories={catalogCategories}
          initialFilter={catalogFilter}
          isLoadingCatalog={isLoadingCatalog}
          onPageChange={handleCatalogPageChange}
          onProductSelect={(productId) => openProduct(productId, 'catalog')}
          pageInfo={catalogPageInfo}
          producers={catalogProducers}
          products={catalogProducts}
          quoteMode={catalogMode === 'quote'}
        />
      );
    }

    if (view === 'verdecito') {
      return (
        <VerdecitoView
          catalogError={catalogError}
          isLoadingCatalog={isLoadingCatalog}
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
          currentUser={currentUser}
          onAddToCart={addToCart}
          onBack={() => navigate(previousView)}
          onEditProduct={handleEditProductFromDetail}
          onProducerSelect={handleProducerSelect}
          onRequestQuote={handleOpenQuoteRequest}
          product={selectedProduct}
          producer={selectedProductProducer}
          sellerProducerId={sellerProducer?.id}
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
          checkoutLoading={checkoutLoading}
          currentUser={currentUser}
          isLoading={cartLoading}
          products={catalogProducts}
          onCheckout={startCheckout}
          onDecrease={decreaseQuantity}
          onIncrease={increaseQuantity}
          onNavigate={navigate}
          onPayNow={handlePayNow}
          onRemove={removeFromCart}
          onRequestCartQuote={handleOpenCartQuoteRequest}
          onRequestPurchase={handleCreatePurchaseRequest}
        />
      );
    }

    if (view === 'login') {
      return <LoginView error={loginError} isLoading={loginLoading} onLogin={handleLogin} onRegister={handleRegister} />;
    }

    if (view === 'orderSuccess') {
      return <OrderSuccessView order={lastOrder} onNavigate={navigate} />;
    }

    if (view === 'orders') {
      return (
        <OrdersView
          orders={orders}
          onNavigate={navigate}
          onPageChange={handleOrdersPageChange}
          onTrackOrder={trackOrder}
          pageInfo={ordersPageInfo}
        />
      );
    }

    if (view === 'orderTracking') {
      return (
        <OrderTrackingView
          order={selectedOrder}
          sales={sales}
          onConfirmReceived={handleConfirmOrderReceived}
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
          onPageChange={handlePurchaseRequestsPageChange}
          pageInfo={purchaseRequestsPageInfo}
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
          activeProducerId={sellerProducer?.id ?? sellerProducts.find((product) => product.producerId)?.producerId ?? activeProducerId}
          categories={catalogCategories.length ? catalogCategories : fallbackCategories}
          initialEditProductId={sellerEditingProductId}
          initialTab={sellerActiveTab}
          isLoading={sellerDashboardLoading}
          error={sellerDashboardError}
          products={sellerProducts}
          producers={sellerProducer ? [sellerProducer] : []}
          quotes={sellerQuotes}
          requests={purchaseRequests}
          sales={sales}
          earnings={sellerEarnings}
          onClearEditProduct={() => setSellerEditingProductId(null)}
          onConfirmRequest={handleSellerConfirmRequest}
          onCreateProduct={handleCreateProduct}
          onRefresh={() => void fetchSellerDashboardOnce({ force: true, tab: sellerActiveTab })}
          onMarkSaleDispatched={handleMarkSaleDispatched}
          onMarkSaleInPreparation={handleMarkSaleInPreparation}
          onMarkSaleReady={handleMarkSaleReady}
          onRespondQuote={handleRespondQuote}
          onTabChange={setSellerActiveTab}
          onUpdateProducerProfile={handleUpdateProducerProfile}
          onViewProduct={(productId) => openProduct(productId, 'sellerDashboard')}
          onRejectRequest={handleSellerRejectRequest}
          onDeleteProduct={handleDeleteProduct}
          onUpdateProduct={handleUpdateProduct}
        />
      );
    }

    if (view === 'claims') {
      return (
        <ClaimsView
          claims={claims}
          orders={orders}
          role={sessionRole}
          onResolveClaim={handleResolveClaim}
        />
      );
    }

    if (view === 'support') {
      return <SupportView />;
    }

    if (view === 'quoteRequest') {
      return (
        <QuoteRequestView
          onNavigate={navigate}
          onQuoteCreated={() => {
            invalidateQuotesCache();
            navigate('quotes');
          }}
          additionalProductTitles={selectedQuoteAdditionalProducts}
          product={selectedQuoteProduct}
          quoteType={selectedQuoteType}
        />
      );
    }

    if (view === 'quoteOptions') {
      return (
        <QuoteOptionsView
          onNavigate={navigate}
          onQuoteByProduct={handleOpenQuoteCatalog}
          onQuoteByReference={handleOpenReferenceQuote}
        />
      );
    }

    if (view === 'quotes') {
      return (
        <QuotesView
          error={clientQuotesError}
          isLoading={clientQuotesLoading}
          onNavigate={navigate}
          onOpenQuote={handleOpenQuoteDetail}
          onPageChange={handleClientQuotesPageChange}
          onQuoteByProduct={handleOpenQuoteCatalog}
          onRefresh={() => void fetchClientQuotesOnce({ force: true })}
          pageInfo={clientQuotesPageInfo}
          quotes={clientQuotes}
        />
      );
    }

    if (view === 'quoteDetail') {
      return <QuoteDetailView onNavigate={navigate} quoteId={selectedQuoteId} />;
    }

    if (view === 'adminQuotes') {
      return <AdminQuotesView onOpenQuote={handleOpenAdminQuoteDetail} />;
    }

    if (view === 'adminQuoteDetail') {
      return (
        <AdminQuoteDetailView
          onNavigate={navigate}
          producers={catalogProducers}
          quoteId={selectedQuoteId}
        />
      );
    }

    if (view === 'userManagement') {
      return <UserManagementView />;
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
        onRequestQuote={handleOpenQuoteOptions}
        onShowSustainableProducts={handleShowSustainableProducts}
        products={catalogProducts}
      />
    );
  };

  if (authLoading && !currentUser) {
    return <LoadingScreen message="Cargando tu sesión..." />;
  }

  return (
    <div className="appLayout">
      <Navbar
        activeView={view}
        cartCount={cartCount}
        currentUser={currentUser}
        onNavigate={handleNavbarNavigate}
        onLogout={handleLogout}
      />
      <div className="appMain">
        {renderView()}
      </div>
      <Footer onNavigate={navigate} />
    </div>
  );
}
