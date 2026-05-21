import { useState } from 'react';
import Footer from './components/Footer/Footer.jsx';
import Navbar from './components/Navbar/Navbar.jsx';
import { products } from './data/catalog.js';
import CartView from './views/CartView.jsx';
import HomeView from './views/HomeView.jsx';
import LoginView from './views/LoginView.jsx';
import OrdersView from './views/OrdersView.jsx';
import OrderSuccessView from './views/OrderSuccessView.jsx';
import OrderTrackingView from './views/OrderTrackingView.jsx';
import ProductDetailView from './views/ProductDetailView.jsx';
import VerdecitoView from './views/VerdecitoView.jsx';

const TEST_USER = {
  email: 'usuario@verdecito.com',
  name: 'Usuario Verdecito',
  password: '123456',
};

export default function App() {
  const [view, setView] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [previousView, setPreviousView] = useState('home');
  const [cartItems, setCartItems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasPendingCheckout, setHasPendingCheckout] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [orders, setOrders] = useState([]);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const navigate = (nextView) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProduct = (productId, sourceView = view) => {
    setSelectedProductId(productId);
    setCartMessage('');
    setPreviousView(sourceView === 'productDetail' ? 'home' : sourceView);
    navigate('productDetail');
  };

  const addToCart = (productId) => {
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

  const removeFromCart = (productId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
  };

  const increaseQuantity = (productId) => {
    setCartItems((currentItems) => currentItems.map((item) => (
      item.productId === productId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    )));
  };

  const decreaseQuantity = (productId) => {
    setCartItems((currentItems) => currentItems.flatMap((item) => {
      if (item.productId !== productId) return [item];
      const nextQuantity = item.quantity - 1;
      return nextQuantity > 0 ? [{ ...item, quantity: nextQuantity }] : [];
    }));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const buyNow = (productId) => {
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

  const handleLogin = (event) => {
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

  const confirmPurchase = (total) => {
    const order = {
      id: `PED-${Date.now()}`,
      date: new Date().toLocaleDateString('es-PE'),
      items: cartItems,
      total,
      status: 'En preparacion',
    };

    setOrders((currentOrders) => [order, ...currentOrders]);
    setLastOrderId(order.id);
    setSelectedOrderId(order.id);
    setHasPendingCheckout(false);
    clearCart();
    navigate('orderSuccess');
  };

  const trackOrder = (orderId) => {
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
          onBuyNow={buyNow}
          onNavigate={navigate}
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
    <>
      <Navbar
        activeView={view}
        cartCount={cartCount}
        currentUser={currentUser}
        onNavigate={navigate}
      />
      {renderView()}
      <Footer />
    </>
  );
}
