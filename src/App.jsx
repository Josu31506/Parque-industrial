import { useState } from 'react';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import HomeView from './views/HomeView.jsx';
import VerdecitoView from './views/VerdecitoView.jsx';

const views = {
  home: HomeView,
  verdecito: VerdecitoView,
};

export default function App() {
  const [view, setView] = useState('home');
  const CurrentView = views[view] ?? HomeView;

  const handleNavigate = (nextView) => {
    if (!views[nextView]) return;

    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Navbar activeView={view} onNavigate={handleNavigate} />
      <CurrentView />
      <Footer />
    </>
  );
}
