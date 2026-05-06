import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins, Plus, ArrowRight, X, Lock, Check, Sparkles,
  CheckCircle2, Gift, UserPlus, Trophy, Star, ShoppingBag,
  TrendingUp, TrendingDown, Search, Calendar, Zap
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { coinPackages, events } from '../data/mockData';

const NOW_REF = new Date('2026-04-14');
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const TX_FILTERS = [
  { key: 'all',       label: 'All',       icon: null },
  { key: 'earned',    label: 'Earned',    icon: TrendingUp },
  { key: 'spent',     label: 'Spent',     icon: TrendingDown },
  { key: 'purchased', label: 'Purchased', icon: ShoppingBag },
];

const TX_BUCKETS = [
  { key: 'today',      label: 'Today' },
  { key: 'this-week',  label: 'This week' },
  { key: 'this-month', label: 'This month' },
  { key: 'older',      label: 'Earlier' },
];

function txBucket(dateStr) {
  const days = Math.floor((NOW_REF - new Date(dateStr)) / MS_PER_DAY);
  if (days <= 0)  return 'today';
  if (days <= 7)  return 'this-week';
  if (days <= 30) return 'this-month';
  return 'older';
}

function getActivityIcon(tx) {
  if (tx.type === 'purchased') return { icon: ShoppingBag };
  const d = tx.description;
  if (d.includes('Attended'))   return { icon: CheckCircle2 };
  if (d.includes('Welcome'))    return { icon: Gift };
  if (d.includes('profile'))    return { icon: UserPlus };
  if (d.includes('Tipped'))     return { icon: Trophy };
  if (d.includes('Registered')) return { icon: Calendar };
  return { icon: Star };
}

/* ---- Stripe-simulated checkout ---- */
function CheckoutModal({ pkg, balanceBefore, affordableAfter, onClose, onSuccess }) {
  const [step, setStep] = useState('form');
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
                    <div className="summary-name">{pkg.coins.toLocaleString()} Fud Coins</div>
                    <div className="summary-rate">${pkg.perCoin.toFixed(3)} per coin</div>
                  </div>
                </div>
                <div className="summary-price">${pkg.price}.00</div>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span className="total-amount">${pkg.price}.00 <span className="total-usd">USD</span></span>
              </div>
              <div className="summary-after">
                <Zap size={13} strokeWidth={2.4} />
                <span>
                  After this purchase: <strong>{(balanceBefore + pkg.coins).toLocaleString()} coins</strong>
                  {affordableAfter > 0 && ` — enough for ${affordableAfter} workshop${affordableAfter !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            <form className="checkout-form" onSubmit={handlePay}>
              <label className="field">
                <span className="field-label">Card number</span>
                <input className="field-input" value={card} onChange={e => setCard(e.target.value)} placeholder="1234 1234 1234 1234" />
              </label>
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Expiry</span>
                  <input className="field-input" value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM / YY" />
                </label>
                <label className="field">
                  <span className="field-label">CVC</span>
                  <input className="field-input" value={cvc} onChange={e => setCvc(e.target.value)} placeholder="123" />
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
            <p className="success-line"><Sparkles size={14} /> {pkg.coins.toLocaleString()} Fud Coins added to your wallet</p>
            <button className="done-btn" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Page ---- */
export default function Wallet() {
  const { user, transactions, registeredEvents, buyCoins } = useUser();
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [justPurchased, setJustPurchased] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  function handleSuccess(pkg) {
    buyCoins(pkg);
    setJustPurchased(pkg.id);
    setTimeout(() => setJustPurchased(null), 3000);
  }

  // ---- Derived ----
  const upcomingEvents = useMemo(
    () => events
      .filter(e => new Date(e.date) >= NOW_REF)
      .filter(e => !registeredEvents.includes(e.id)),
    [registeredEvents]
  );

  const affordableNow = useMemo(() =>
    upcomingEvents.filter(e => e.type === 'free' || user.coinBalance >= e.coinCost).length
  , [upcomingEvents, user.coinBalance]);

  const earnableFreeCoins = useMemo(() =>
    upcomingEvents
      .filter(e => e.type === 'free' && (e.coinsEarned ?? 0) > 0)
      .reduce((sum, e) => sum + (e.coinsEarned ?? 0), 0)
  , [upcomingEvents]);

  // Lifetime totals
  const lifetimeEarned    = transactions.filter(t => t.type === 'earned').reduce((s, t) => s + t.amount, 0);
  const lifetimeSpent     = transactions.filter(t => t.type === 'spent').reduce((s, t) => s + t.amount, 0);
  const lifetimePurchased = transactions.filter(t => t.type === 'purchased').reduce((s, t) => s + t.amount, 0);

  // Best value calculation: package with highest savings vs base ($0.05/coin baseline)
  const baseRate = Math.max(...coinPackages.map(p => p.perCoin));
  const packagesWithSavings = coinPackages.map(p => {
    const savingsPct = Math.round(((baseRate - p.perCoin) / baseRate) * 100);
    return { ...p, savingsPct };
  });

  // Filtered + grouped transactions
  const filteredTx = useMemo(() => {
    return transactions
      .filter(tx => activeFilter === 'all' || tx.type === activeFilter)
      .filter(tx => {
        if (!search) return true;
        return tx.description.toLowerCase().includes(search.toLowerCase());
      });
  }, [transactions, activeFilter, search]);

  const groupedTx = useMemo(() => {
    const map = new Map(TX_BUCKETS.map(b => [b.key, []]));
    for (const tx of filteredTx) map.get(txBucket(tx.date)).push(tx);
    return TX_BUCKETS
      .map(b => ({ ...b, items: map.get(b.key) }))
      .filter(g => g.items.length > 0);
  }, [filteredTx]);

  // This-week rollup for the active filter view
  const weekRollup = useMemo(() => {
    const inWeek = filteredTx.filter(tx => ['today', 'this-week'].includes(txBucket(tx.date)));
    const earned = inWeek.filter(t => t.type === 'earned').reduce((s, t) => s + t.amount, 0);
    const spent  = inWeek.filter(t => t.type === 'spent').reduce((s, t) => s + t.amount, 0);
    const bought = inWeek.filter(t => t.type === 'purchased').reduce((s, t) => s + t.amount, 0);
    return { earned, spent, bought, hasAny: (earned + spent + bought) > 0 };
  }, [filteredTx]);

  const hasFilters = activeFilter !== 'all' || !!search;

  return (
    <div className="wallet-page">
      <div className="wallet-header animate-in">
        <h1>Wallet</h1>
        <p>Buy and manage your Fud Coins</p>
      </div>

      {/* Balance hero — now with workshop affordability + USD value */}
      <div className="wallet-balance animate-in" style={{ animationDelay: '60ms' }}>
        <div className="balance-left">
          <span className="balance-label">Current Balance</span>
          <div className="balance-amount">
            <Coins size={28} />
            <span className="balance-value">{user.coinBalance.toLocaleString()}</span>
          </div>
          <span className="balance-sub">≈ ${(user.coinBalance * 0.04).toFixed(2)} value</span>
          {affordableNow > 0 && (
            <span className="balance-affordable">
              <Zap size={13} strokeWidth={2.4} />
              Enough for {affordableNow} workshop{affordableNow !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="balance-decoration" />
      </div>

      {/* Free-coin earning nudge */}
      {earnableFreeCoins > 0 && (
        <Link to="/events" className="earn-nudge animate-in" style={{ animationDelay: '90ms' }}>
          <div className="earn-nudge-icon"><Sparkles size={18} strokeWidth={2.2} /></div>
          <div className="earn-nudge-text">
            <span className="earn-nudge-title">Earn +{earnableFreeCoins} coins for free</span>
            <span className="earn-nudge-sub">Attend any of the upcoming free workshops</span>
          </div>
          <ArrowRight size={18} className="earn-nudge-arrow" />
        </Link>
      )}

      {/* Lifetime stats */}
      <section className="wallet-stats animate-in" style={{ animationDelay: '120ms' }}>
        <div className="stat-tile">
          <div className="stat-icon stat-icon--success"><TrendingUp size={18} /></div>
          <div className="stat-body">
            <span className="stat-value">+{lifetimeEarned}</span>
            <span className="stat-label">Lifetime earned</span>
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon"><TrendingDown size={18} /></div>
          <div className="stat-body">
            <span className="stat-value">-{lifetimeSpent}</span>
            <span className="stat-label">Lifetime spent</span>
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon stat-icon--gold"><ShoppingBag size={18} /></div>
          <div className="stat-body">
            <span className="stat-value">+{lifetimePurchased}</span>
            <span className="stat-label">Lifetime purchased</span>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="wallet-section animate-in" style={{ animationDelay: '180ms' }}>
        <h2 className="section-title">Buy Fud Coins</h2>
        <div className="pkg-grid">
          {packagesWithSavings.map((pkg, i) => (
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
              {pkg.savingsPct > 0 && (
                <span className={`pkg-savings ${pkg.label === 'Best value' ? 'on-featured' : ''}`}>
                  Save {pkg.savingsPct}%
                </span>
              )}
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
      <section className="wallet-section animate-in" style={{ animationDelay: '260ms' }}>
        <div className="section-header">
          <h2 className="section-title">Transaction history</h2>
          <span className="event-count">{filteredTx.length} {filteredTx.length === 1 ? 'item' : 'items'}</span>
        </div>

        {/* Filters + search */}
        <div className="tx-controls">
          <div className="tx-filter-row" role="toolbar" aria-label="Transaction filters">
            {TX_FILTERS.map(f => {
              const Icon = f.icon;
              const isActive = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  className={`filter-chip ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f.key)}
                  aria-pressed={isActive}
                >
                  {Icon && <Icon size={14} />}
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="tx-search">
            <Search size={16} className="tx-search-icon" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="tx-search-input"
            />
            {search && (
              <button className="tx-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div className="dash-empty">
            <ShoppingBag size={28} strokeWidth={1.6} />
            <p>{hasFilters ? 'No transactions match this filter.' : "Your activity will appear here as you earn and spend coins."}</p>
            {hasFilters && (
              <button className="dash-empty-cta" onClick={() => { setActiveFilter('all'); setSearch(''); }}>
                Show all transactions
              </button>
            )}
          </div>
        ) : (
          <>
            {weekRollup.hasAny && (
              <div className="activity-rollup">
                <span className="rollup-label">This week</span>
                <span className="rollup-stats">
                  {weekRollup.earned > 0 && <span className="rollup-earned">+{weekRollup.earned} earned</span>}
                  {weekRollup.earned > 0 && (weekRollup.spent > 0 || weekRollup.bought > 0) && <span className="rollup-sep">·</span>}
                  {weekRollup.spent  > 0 && <span className="rollup-spent">-{weekRollup.spent} spent</span>}
                  {weekRollup.spent > 0 && weekRollup.bought > 0 && <span className="rollup-sep">·</span>}
                  {weekRollup.bought > 0 && <span className="rollup-purchased">+{weekRollup.bought} purchased</span>}
                </span>
              </div>
            )}

            <div className="activity-groups">
              {groupedTx.map(group => (
                <div className="activity-group" key={group.key}>
                  {groupedTx.length > 1 && (
                    <div className="activity-group-label">{group.label}</div>
                  )}
                  <div className="activity-list">
                    {group.items.map(tx => {
                      const act = getActivityIcon(tx);
                      const ActIcon = act.icon;
                      const sign = tx.type === 'spent' ? '-' : '+';
                      return (
                        <div key={tx.id} className={`activity-item ${tx.type}`}>
                          <div className="activity-icon-box">
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
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {selectedPkg && (
        <CheckoutModal
          pkg={selectedPkg}
          balanceBefore={user.coinBalance}
          affordableAfter={
            upcomingEvents.filter(e => e.type === 'free' || (user.coinBalance + selectedPkg.coins) >= e.coinCost).length
          }
          onClose={() => setSelectedPkg(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
