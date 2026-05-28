export type ProductType = 'featured' | 'eco';

export type AvailabilityType = 'IN_STOCK' | 'MADE_TO_ORDER' | 'CUSTOM_QUOTE';

export type Role = 'customer' | 'seller' | 'admin';

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
  title: string;
  price: string;
  numericPrice: number;
  image: string;
  storeName: string;
  description: string;
  category?: string;
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
};

export type Producer = {
  id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  image?: string;
  avatar?: string;
};

export type Category = {
  name: string;
  image?: string;
  icon?: string;
  description?: string;
  rating?: number;
  reviews?: number;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type User = {
  name: string;
  email: string;
};

export type MarketplaceItem = CartItem & {
  title: string;
  price: string;
  numericPrice: number;
  producerId?: string;
  producerName: string;
};

export type PurchaseRequestGroup = {
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
