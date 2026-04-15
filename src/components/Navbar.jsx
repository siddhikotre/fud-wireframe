import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wallet, Coins } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function Navbar() {
  const { user } = useUser();

  return (
    <>
      <header className="top-bar">
        <div className="logo">
          <div className="logo-mark">F</div>
          <span className="logo-text">Fud</span>
        </div>

        <nav className="desktop-nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/events">Events</NavLink>
          <NavLink to="/wallet">Wallet</NavLink>
        </nav>

        <div className="coin-display">
          <div className="coin-icon-wrapper">
            <Coins size={14} />
          </div>
          <span className="coin-amount">{user.coinBalance}</span>
        </div>
      </header>

      <nav className="mobile-nav">
        <NavLink to="/" end className="mobile-tab">
          <LayoutDashboard size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/events" className="mobile-tab">
          <Calendar size={20} />
          <span>Events</span>
        </NavLink>
        <NavLink to="/wallet" className="mobile-tab">
          <Wallet size={20} />
          <span>Wallet</span>
        </NavLink>
      </nav>
    </>
  );
}
