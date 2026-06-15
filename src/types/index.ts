export type ProductType = 'featured' | 'eco' | 'normal';

export type AvailabilityType = 'IN_STOCK' | 'MADE_TO_ORDER' | 'CUSTOM_QUOTE';

export type Role = 'customer' | 'seller' | 'admin';

export type ApiRole = 'CLIENT' | 'SELLER' | 'ADVISOR' | 'ADMIN';

export type OrderStatus = 'Pedido confirmado' | 'En preparación' | 'En camino' | 'Entregado';

export type PaymentOption = 'FULL_PAYMENT' | 'HALF_ADVANCE';

export type PaymentStatus = 'FULLY_PAID' | 'PARTIALLY_PAID';

export type FundsStatus = 'HELD' | 'RELEASED' | 'HELD_BY_CLAIM';

export type SaleStatus =
  | 'NEW_SALE'
  | 'IN_PREPARATION'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'IN_REVIEW'
  | 'LIQUIDATED'
  | 'HELD_BY_CLAIM';

export type PurchaseRequestStatus =
  | 'PENDING_PRODUCER_CONFIRMATION'
  | 'PARTIALLY_CONFIRMED'
  | 'CONFIRMED'
  | 'PARTIALLY_REJECTED'
  | 'READY_TO_PAY'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'CONVERTED_TO_ORDER';

export type PurchaseRequestGroupStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export type ClaimStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';

export type QuoteType = 'PRODUCT_BASED' | 'REFERENCE_IMAGE';

export type QuoteStatus =
  | 'PENDING_REVIEW'
  | 'IN_COORDINATION'
  | 'CONSULTING_PRODUCER'
  | 'PROPOSAL_RECEIVED'
  | 'RESOLUTION_SENT'
  | 'ADDED_TO_CART'
  | 'PAID'
  | 'CONVERTED_TO_ORDER'
  | 'REJECTED'
  | 'EXPIRED';

export type ViewName =
  | 'home'
  | 'catalog'
  | 'verdecito'
  | 'productDetail'
  | 'cart'
  | 'login'
  | 'orders'
  | 'orderTracking'
  | 'orderSuccess'
  | 'support'
  | 'producerProfile'
  | 'purchaseRequests'
  | 'purchaseRequestDetail'
  | 'sellerDashboard'
  | 'sales'
  | 'quoteRequest'
  | 'quoteOptions'
  | 'quotes'
  | 'quoteDetail'
  | 'adminQuotes'
  | 'adminQuoteDetail'
  | 'claims'
  | 'notifications';

export type TechnicalDetails = {
  dimensions?: string;
  materials?: string;
  colors?: string[];
  finish?: string;
  availability?: string;
  estimatedDelivery?: string;
  customizable?: boolean;
};

export type Product = {
  id: string;
  slug?: string;
  title: string;
  price: string;
  numericPrice: number;
  image: string;
  storeName: string;
  description: string;
  category?: string;
  categoryId?: string;
  rating?: number;
  oldPrice?: string;
  badge?: string;
  type: ProductType;
  producerId?: string;
  technicalDetails?: TechnicalDetails;
  availabilityType: AvailabilityType;
  stock?: number;
  estimatedDispatchDays?: number;
  requiresConfirmation?: boolean;
  customizable?: boolean;
  isActive?: boolean;
};

export type Producer = {
  id: string;
  userId?: string;
  name: string;
  type: string;
  location: string;
  description: string;
  phone?: string;
  address?: string;
  isApproved?: boolean;
  rating?: number;
  image?: string;
  avatar?: string;
};

export type Category = {
  id?: string;
  name: string;
  image?: string;
  icon?: string;
  description?: string;
  rating?: number;
  reviews?: number;
};

export type CartItem = {
  id?: string;
  productId: string;
  quantity: number;
};

export type User = {
  id?: string;
  name: string;
  email: string;
  role?: ApiRole;
  phone?: string;
  district?: string;
  isActive?: boolean;
  createdAt?: string;
};

export type MarketplaceItem = CartItem & {
  title: string;
  price: string;
  numericPrice: number;
  producerId?: string;
  producerName: string;
};

export type PurchaseRequestGroup = {
  id?: string;
  producerId: string;
  producerName: string;
  items: MarketplaceItem[];
  status: PurchaseRequestGroupStatus;
  readyDate?: string;
  observation?: string;
};

export type PurchaseRequest = {
  id: string;
  customerId: string;
  customerName: string;
  items: MarketplaceItem[];
  groupsByProducer: PurchaseRequestGroup[];
  status: PurchaseRequestStatus;
  createdAt: string;
  estimatedDeliveryDate?: string;
  deliveryDays: number;
  total: number;
  convertedOrderId?: string;
};

export type OrderProducerGroup = {
  producerId: string;
  producerName: string;
  items: MarketplaceItem[];
  status: SaleStatus;
  readyDate?: string;
  observation?: string;
};

export type Order = {
  id: string;
  date: string;
  items: CartItem[];
  marketplaceItems?: MarketplaceItem[];
  producerGroups?: OrderProducerGroup[];
  total: number;
  status: OrderStatus;
  estimatedDeliveryDate?: string;
  paymentOption?: PaymentOption;
  paidAmount?: number;
  remainingAmount?: number;
  paymentStatus?: PaymentStatus;
  fundsStatus?: FundsStatus;
};

export type Sale = {
  id: string;
  orderId: string;
  producerId: string;
  producerName: string;
  items: MarketplaceItem[];
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  fundsStatus: FundsStatus;
  readyDate?: string;
  observation?: string;
  createdAt: string;
};

export type Claim = {
  id: string;
  orderId: string;
  customerId: string;
  reason: string;
  description: string;
  status: ClaimStatus;
  createdAt: string;
};

export type Notification = {
  id: string;
  role: Role;
  userId?: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  targetView?: ViewName;
};

export type CatalogFilter = {
  category?: string;
  categoryId?: string;
  type?: ProductType;
  producer?: string;
  query?: string;
};

export type Review = {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

export type QuoteResolution = {
  id: string;
  quoteRequestId: string;
  producerId: string;
  finalTitle: string;
  finalDescription: string;
  finalPrice: number;
  deliveryTime: string;
  notes?: string;
  validUntil?: string;
  createdAt: string;
  producer?: ApiProducer | null;
};

export type Quote = {
  id: string;
  customerId: string;
  type: QuoteType;
  productId?: string;
  status: QuoteStatus;
  title: string;
  description: string;
  quantity: number;
  requestedDimensions?: string;
  requestedMaterial?: string;
  requestedColor?: string;
  requestedFinish?: string;
  deliveryDistrict?: string;
  referenceImages?: string[];
  createdAt: string;
  updatedAt?: string;
  customer?: ApiUser | null;
  product?: ApiProduct | null;
  resolutions: QuoteResolution[];
};

export type CreateQuoteInput = {
  type: QuoteType;
  productId?: string;
  title: string;
  description: string;
  quantity: number;
  requestedDimensions?: string;
  requestedMaterial?: string;
  requestedColor?: string;
  requestedFinish?: string;
  deliveryDistrict?: string;
  referenceImages?: string[];
};

export type CreateQuoteResolutionInput = {
  producerId: string;
  finalTitle: string;
  finalDescription: string;
  finalPrice: number;
  deliveryTime: string;
  notes?: string;
  validUntil?: string;
};

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
  phone?: string | null;
  district?: string | null;
  isActive?: boolean;
  createdAt?: string;
};

export type ApiProducer = {
  id: string;
  userId?: string;
  businessName: string;
  type: string;
  location: string;
  description: string;
  rating?: number | null;
  isApproved?: boolean;
  phone?: string | null;
  address?: string | null;
};

export type ApiCategory = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
};

export type ApiProduct = {
  id: string;
  slug?: string;
  producerId?: string;
  categoryId?: string;
  title: string;
  description: string;
  price?: number | string;
  numericPrice?: number | string;
  imageUrl: string;
  badge?: string | null;
  type?: 'FEATURED' | 'ECO' | 'NORMAL' | string;
  availabilityType: AvailabilityType;
  stock?: number | null;
  estimatedDispatchDays?: number | null;
  dimensions?: string | null;
  materials?: string | null;
  colors?: string[] | null;
  finish?: string | null;
  customizable?: boolean;
  requiresConfirmation?: boolean;
  isActive?: boolean;
  producer?: ApiProducer | null;
  category?: ApiCategory | null;
};

export type ApiCartItem = {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product?: ApiProduct;
};

export type ApiPurchaseRequestItem = {
  id: string;
  purchaseRequestId?: string;
  productId: string;
  producerId: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
  product?: ApiProduct | null;
  producer?: ApiProducer | null;
};

export type ApiPurchaseRequestGroup = {
  id: string;
  purchaseRequestId: string;
  producerId: string;
  status: PurchaseRequestGroupStatus;
  readyDate?: string | null;
  observation?: string | null;
  producer?: ApiProducer | null;
};

export type ApiPurchaseRequest = {
  id: string;
  customerId: string;
  status: PurchaseRequestStatus;
  deliveryDays: number;
  total: number;
  estimatedDeliveryDate?: string | null;
  createdAt: string;
  items?: ApiPurchaseRequestItem[];
  groups?: ApiPurchaseRequestGroup[];
};

export type ApiOrderItem = {
  id: string;
  orderId?: string;
  productId: string;
  producerId: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
  status?: string;
  product?: ApiProduct | null;
  producer?: ApiProducer | null;
};

export type ApiOrder = {
  id: string;
  customerId: string;
  status: string;
  total: number;
  paymentOption?: PaymentOption | null;
  paidAmount?: number | null;
  remainingAmount?: number | null;
  paymentStatus?: PaymentStatus | null;
  fundsStatus?: FundsStatus | null;
  estimatedDeliveryDate?: string | null;
  createdAt: string;
  items?: ApiOrderItem[];
  sales?: ApiSale[];
};

export type ApiSaleItem = {
  id: string;
  saleId?: string;
  productId: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
  status?: string;
  product?: ApiProduct | null;
};

export type ApiSale = {
  id: string;
  orderId: string;
  producerId: string;
  producerName?: string;
  status: SaleStatus;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  paymentStatus: PaymentStatus;
  fundsStatus: FundsStatus;
  readyDate?: string | null;
  observation?: string | null;
  createdAt: string;
  producer?: ApiProducer | null;
  items?: ApiSaleItem[];
};

export type ApiClaim = {
  id: string;
  orderId: string;
  customerId: string;
  reason: string;
  description: string;
  status: ClaimStatus;
  createdAt: string;
};

export type ApiNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string | null;
  read: boolean;
  targetType?: string | null;
  targetId?: string | null;
  createdAt: string;
};

export type ApiQuoteResolution = {
  id: string;
  quoteRequestId: string;
  producerId: string;
  finalTitle: string;
  finalDescription: string;
  finalPrice: number | string;
  deliveryTime: string;
  notes?: string | null;
  validUntil?: string | null;
  createdAt: string;
  producer?: ApiProducer | null;
};

export type ApiQuote = {
  id: string;
  customerId: string;
  type: QuoteType;
  productId?: string | null;
  status: QuoteStatus;
  title: string;
  description: string;
  quantity: number;
  requestedDimensions?: string | null;
  requestedMaterial?: string | null;
  requestedColor?: string | null;
  requestedFinish?: string | null;
  deliveryDistrict?: string | null;
  referenceImages?: unknown;
  createdAt: string;
  updatedAt?: string;
  customer?: ApiUser | null;
  product?: ApiProduct | null;
  resolutions?: ApiQuoteResolution[];
};
