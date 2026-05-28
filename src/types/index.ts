export type ProductType = 'featured' | 'eco';

export type OrderStatus = 'Pedido confirmado' | 'En preparación' | 'En camino' | 'Entregado';

export type ViewName =
  | 'home'
  | 'verdecito'
  | 'productDetail'
  | 'cart'
  | 'login'
  | 'orders'
  | 'orderTracking'
  | 'orderSuccess';

export type Product = {
  id: string;
  title: string;
  price: string;
  numericPrice: number;
  image: string;
  storeName: string;
  description: string;
  rating?: number;
  oldPrice?: string;
  badge?: string;
  type: ProductType;
  producerId?: string;
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

export type Order = {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
};
