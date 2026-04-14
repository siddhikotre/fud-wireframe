import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins, Plus, ArrowRight, X, Lock, Check, Sparkles,
  CheckCircle2, Gift, UserPlus, Trophy, Star, ShoppingBag
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { coinPackages } from '../data/mockData';

function getActivityIcon(tx) {
  if (tx.type === 'purchased') return { icon: ShoppingBag,  color: '#7C3AED', bg: '#F5F3FF' };
  const d = tx.description;
  if (d.includes('Attended')) return { icon: CheckCircle2, color: '#059669', bg: '#ECFDF5' };
  if (d.includes('Welcome'))  return { icon: Gift,         color: '#6366F1', bg: '#EEF2FF' };
  if (d.includes('profile'))  return { icon: UserPlus,     color: '#0284C7', bg: '#E0F2FE' };
  if (d.includes('Tipped'))   return { icon: Trophy,       color: '#7C3AED', bg: '#F5F3FF' };
  return { icon: Star, color: '#D97706', bg: '#FFFBEB' };
}

/* ---- Stripe-simulated checkout ---- */
function CheckoutModal({ pkg, onClose, onSuccess }) {
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12 / 34');
  const [cvc, setCvc] = useState('123');

  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function handlePay(e) {
    e.preventDefault();
    setStep('processing');
    await new Promise(r => setTimeout(r, 1600));
    setStep('success');
    onSuccess(pkg);
  }

  return (
    <div className="checkout-backdrop" onClick={onClose}>
      <div className="checkout-modal" onClick={e => e.stopPropagation()}>
        {step !== 'success' && (
          <button className="checkout-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        )}

        {step === 'form' && (
          <>
            <div className="checkout-header">
              <div className="stripe-brand">
                <span className="stripe-logo">stripe</span>
                <span className="stripe-lock"><Lock size={11} /> Secure payment</span>
              </div>
              <h2 className="checkout-title">Complete your purchase</h2>
            </div>

            <div className="checkout-summary">
              <div className="summary-row">
                <div className="summary-pkg">
                  <div className="summary-icon"><Coins size={18} /></div>
                  <div>
                    <div className="summary-name">{pkg.coins.toLocaleString()} FUD Coins</div>
                    <div className="summary-rate">${pkg.perCoin.toFixed(3)} per coin</div>
                  </div>
                </div>
                <div className="summary-price">${pkg.price}.00</div>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span className="total-amount">${pkg.price}.00 <span className="total-usd">USD</span></span>
              </div>
            </div>

            <form className="checkout-form" onSubmit={handlePay}>
              <label className="field">
                <span className="field-label">Card number</span>
                <input
                  className="field-input"
                  value={card}
                  onChange={e => setCard(e.target.value)}
                  placeholder="1234 1234 1234 1234"
                />
              </label>
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Expiry</span>
                  <input
                    className="field-input"
                    value={expiry}
                    onChange={e => setExpiry(e.target.value)}
                    placeholder="MM / YY"
                  />
                </label>
                <label className="field">
                  <span className="field-label">CVC</span>
                  <input
                    className="field-input"
                    value={cvc}
                    onChange={e => setCvc(e.target.value)}
                    placeholder="123"
                  />
                </label>
              </div>

              <button type="submit" className="pay-btn">
                <Lock size={14} /> Pay ${pkg.price}.00
              </button>

              <p className="demo-note">Demo mode — no real charge will be made</p>
            </form>
          </>
        )}

        {step === 'processing' && (
          <div className="checkout-processing">
            <div className="processing-spinner" />
            <h3>Processing payment...</h3>
            <p>Hang tight, we're securing your coins</p>
          </div>
        )}

        {step === 'success' && (
          <div className="checkout-success">
            <div className="success-burst">
              <div className="success-check"><Check size={36} strokeWidth={3} /></div>
            </div>
            <h3>Payment successful!</h3>
            <p className="success-line"><Sparkles size={14} /> {pkg.coins.toLocaleString()} FUD Coins added to your wallet</p>
            <button className="done-btn" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Page ---- */
export default function Wallet() {
  const { user, transactions, buyCoins } = useUser();
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [justPurchased, setJustPurchased] = useState(null);

  function handleSuccess(pkg) {
    buyCoins(pkg);
    setJustPurchased(pkg.id);
    setTimeout(() => setJustPurchased(null), 3000);
  }

  return (
    <div className="wallet-page">
      <div className="wallet-header animate-in">
        <h1>Wallet</h1>
        <p>Buy and manage your FUD Coins</p>
      </div>

      {/* Balance hero */}
      <div className="wallet-balance animate-in" style={{ animationDelay: '60ms' }}>
        <div className="balance-left">
          <span className="balance-label">Current Balance</span>
          <div className="balance-amount">
            <Coins size={28} />
            <span className="balance-value">{user.coinBalance.toLocaleString()}</span>
          </div>
          <span className="balance-sub">≈ ${(user.coinBalance * 0.04).toFixed(2)} value</span>
        </div>
        <div className="balance-decoration" />
      </div>

      {/* Packages */}
      <section className="wallet-section animate-in" style={{ animationDelay: '120ms' }}>
        <h2 className="section-title">Buy FUD Coins</h2>
        <div className="pkg-grid">
          {coinPackages.map((pkg, i) => (
            <div
              key={pkg.id}
              className={`pkg-card ${pkg.label === 'Best value' ? 'featured' : ''}`}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {pkg.label && (
                <span className={`pkg-ribbon ${pkg.label === 'Best value' ? 'best' : 'popular'}`}>
                  {pkg.label === 'Best value' && <Sparkles size={11} />}
                  {pkg.label}
                </span>
              )}
              <div className="pkg-coins">
                <Coins size={22} />
                <span className="pkg-coin-count">{pkg.coins.toLocaleString()}</span>
                <span className="pkg-coin-label">coins</span>
              </div>
              <div className="pkg-price-row">
                <span className="pkg-price">${pkg.price}</span>
                <span className="pkg-per">${pkg.perCoin.toFixed(3)}/coin</span>
              </div>
              <button
                className="pkg-buy-btn"
                onClick={() => setSelectedPkg(pkg)}
              >
                {justPurchased === pkg.id ? (
                  <><Check size={16} strokeWidth={3} /> Purchased</>
                ) : (
                  <><Plus size={16} strokeWidth={2.5} /> Buy now</>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Transaction history */}
      <section className="wallet-section animate-in" style={{ animationDelay: '200ms' }}>
        <h2 className="section-title">Transaction History</h2>
        <div className="activity-list">
          {transactions.map(tx => {
            const act = getActivityIcon(tx);
            const ActIcon = act.icon;
            const sign = tx.type === 'spent' ? '-' : '+';
            return (
              <div key={tx.id} className={`activity-item ${tx.type}`}>
                <div className="activity-icon-box" style={{ background: act.bg, color: act.color }}>
                  <ActIcon size={18} />
                </div>
                <div className="activity-info">
                  <span className="activity-desc">{tx.description}</span>
                  <span className="activity-date">
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {tx.price && ` · $${tx.price}.00 paid`}
                  </span>
                </div>
                <span className={`activity-amount ${tx.type === 'spent' ? 'spent' : 'earned'}`}>
                  {sign}{tx.amount}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {selectedPkg && (
        <CheckoutModal
          pkg={selectedPkg}
          onClose={() => setSelectedPkg(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
