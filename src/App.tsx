import type { FormEvent } from 'react';
import { useState } from 'react';
import Footer from './components/Footer/Footer';
import Navbar from './components/Navbar/Navbar';
import { products } from './data/catalog';
import type { CartItem, Order, User, ViewName } from './types';
import CartView from './views/CartView';
import HomeView from './views/HomeView';
import LoginView from './views/LoginView';
import OrdersView from './views/OrdersView';
import OrderSuccessView from './views/OrderSuccessView';
import OrderTrackingView from './views/OrderTrackingView';
import ProductDetailView from './views/ProductDetailView';
import VerdecitoView from './views/VerdecitoView';

type TestUser = User & { password: string };

const TEST_USER: TestUser = {
  email: 'usuario@verdecito.com',
  name: 'Usuario Verdecito',
  password: '123456',
};

export default function App() {
  const [view, setView] = useState<ViewName>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [previousView, setPreviousView] = useState<ViewName>('home');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasPendingCheckout, setHasPendingCheckout] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const navigate = (nextView: ViewName) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const buyNow = (productId: string) => {
    addToCart(productId);
    setHasPendingCheckout(true);
    navigate(currentUser ? 'cart' : 'login');
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

  const confirmPurchase = (total: number) => {
    const order: Order = {
      id: `PED-${Date.now()}`,
      date: new Date().toLocaleDateString('es-PE'),
      items: cartItems,
      total,
      status: 'En preparación',
    };

    setOrders((currentOrders) => [order, ...currentOrders]);
    setLastOrderId(order.id);
    setSelectedOrderId(order.id);
    setHasPendingCheckout(false);
    clearCart();
    navigate('orderSuccess');
  };

  const trackOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    navigate('orderTracking');
  };

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const lastOrder = orders.find((order) => order.id === lastOrderId);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const renderView = () => {
    if (view === 'verdecito') {
      return <VerdecitoView onProductSelect={(productId) => openProduct(productId, 'verdecito')} />;
    }

    if (view === 'productDetail') {
      return (
        <ProductDetailView
          cartMessage={cartMessage}
          onAddToCart={addToCart}
          onBack={() => navigate(previousView)}
          product={selectedProduct}
        />
      );
    }

    if (view === 'cart') {
      return (
        <CartView
          cartItems={cartItems}
          currentUser={currentUser}
          onCheckout={startCheckout}
          onConfirmPurchase={confirmPurchase}
          onDecrease={decreaseQuantity}
          onIncrease={increaseQuantity}
          onNavigate={navigate}
          onRemove={removeFromCart}
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
      return <OrderTrackingView order={selectedOrder} onNavigate={navigate} />;
    }

    return (
      <HomeView
        onNavigate={navigate}
        onProductSelect={(productId) => openProduct(productId, 'home')}
      />
    );
  };

  return (
    <div className="appLayout">
      <Navbar
        activeView={view}
        cartCount={cartCount}
        currentUser={currentUser}
        onNavigate={navigate}
      />
      <div className="appMain">
        {renderView()}
      </div>
      <Footer />
    </div>
  );
}
