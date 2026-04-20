import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import OnboardingModal from './components/OnboardingModal';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Wallet from './pages/Wallet';
import Login from './pages/Login';
import './App.css';

function App() {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login';

  return (
    <div className="app">
      <ScrollToTop />
      {!isAuthRoute && <Navbar />}
      <main className={isAuthRoute ? 'app-content app-content--auth' : 'app-content'}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/wallet" element={<Wallet />} />
        </Routes>
      </main>
      {!isAuthRoute && <OnboardingModal />}
    </div>
  );
}

export default App;
