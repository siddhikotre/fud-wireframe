import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import OnboardingModal from './components/OnboardingModal';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Wallet from './pages/Wallet';
import './App.css';

function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <Navbar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/wallet" element={<Wallet />} />
        </Routes>
      </main>
      <OnboardingModal />
    </div>
  );
}

export default App;
