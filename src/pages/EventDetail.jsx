import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Calendar, Clock, Users, Coins,
  Video, MapPin, Bot, Megaphone, DollarSign, Scale,
  Landmark, Check, ExternalLink, Zap
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { events } from '../data/mockData';

const categoryConfig = {
  'AI Tools':   { icon: Bot,        color: '#6366F1', bg: '#EEF2FF' },
  'Marketing':  { icon: Megaphone,  color: '#DB2777', bg: '#FCE7F3' },
  'Finance':    { icon: DollarSign, color: '#059669', bg: '#ECFDF5' },
  'Legal':      { icon: Scale,      color: '#D97706', bg: '#FFFBEB' },
  'Operations': { icon: Landmark,   color: '#0284C7', bg: '#E0F2FE' },
};

const affiliateColors = [
  { bg: '#EEF2FF', color: '#6366F1' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#FFFBEB', color: '#D97706' },
  { bg: '#FCE7F3', color: '#DB2777' },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, registerForEvent, registeredEvents, isProfileComplete, openOnboarding } = useUser();
  const [registering, setRegistering] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <div className="placeholder-page">
        <h2>Event not found</h2>
        <p>This event may have been removed.</p>
        <Link to="/events" className="clear-filters-btn">Back to events</Link>
      </div>
    );
  }

  const isRegistered = registeredEvents.includes(event.id);
  const canAfford = event.type === 'free' || user.coinBalance >= event.coinCost;
  const cat = categoryConfig[event.category] || categoryConfig['AI Tools'];
  const CatIcon = cat.icon;

  async function handleRegister() {
    if (isRegistered || justRegistered || !canAfford) return;

    // If profile isn't complete, run onboarding first; the modal will auto-apply after.
    if (!isProfileComplete) {
      openOnboarding({ type: 'apply', event });
      return;
    }

    setRegistering(true);
    await new Promise(r => setTimeout(r, 700));
    const ok = registerForEvent(event);
    if (ok) setJustRegistered(true);
    setRegistering(false);
  }

  return (
    <div className="event-detail animate-in">
      <button onClick={() => navigate(-1)} className="back-btn">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-hero-top">
          <div className="detail-icon" style={{ background: cat.bg, color: cat.color }}>
            <CatIcon size={28} />
          </div>
          <div className="detail-badges">
            {event.type === 'free' ? (
              <span className="type-badge free">FREE</span>
            ) : (
              <span className="type-badge paid"><Coins size={13} /> {event.coinCost} coins</span>
            )}
            <span className={`format-tag ${event.format}`}>
              {event.format === 'virtual' ? <Video size={12} /> : <MapPin size={12} />}
              {event.format === 'virtual' ? 'Virtual' : event.location}
            </span>
            <span className="cat-chip-static">{event.category}</span>
          </div>
        </div>

        <h1 className="detail-title">{event.title}</h1>

        <div className="detail-meta">
          <span><Calendar size={15} /> {formatDate(event.date)}</span>
          <span><Clock size={15} /> {event.time}</span>
          <span><Users size={15} /> {event.attendees}/{event.maxAttendees} registered</span>
        </div>

        {/* Register CTA */}
        <div className="detail-cta-section">
          {isRegistered || justRegistered ? (
            <div className="cta-registered">
              <div className="cta-check"><Check size={20} strokeWidth={3} /></div>
              <div>
                <span className="cta-reg-title">You're registered!</span>
                <span className="cta-reg-sub">
                  {event.format === 'virtual'
                    ? 'Zoom link will be emailed closer to the date'
                    : `Location details: ${event.location}`}
                </span>
              </div>
            </div>
          ) : !canAfford ? (
            <div className="cta-needs-coins">
              <div className="cta-needs-info">
                <span className="cta-needs-title">Need {event.coinCost - user.coinBalance} more coins</span>
                <span className="cta-needs-sub">Buy Fud Coins to register for this workshop</span>
              </div>
              <Link to="/wallet" className="cta-buy-btn">
                Buy Coins <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <button
              className={`cta-register ${event.type}`}
              onClick={handleRegister}
              disabled={registering}
            >
              {registering ? (
                <>
                  <span className="spinner" /> Registering you...
                </>
              ) : (
                <>
                  <Zap size={17} strokeWidth={2.5} />
                  {event.type === 'free'
                    ? 'Apply in 1 click'
                    : `Pay ${event.coinCost} coins · Apply in 1 click`}
                </>
              )}
            </button>
          )}
          {event.coinsEarned > 0 && !isRegistered && !justRegistered && (
            <p className="cta-earn-note">
              <Coins size={13} /> Earn +{event.coinsEarned} Fud Coins for attending
            </p>
          )}
        </div>
      </div>

      {/* About */}
      <section className="detail-section">
        <h2 className="detail-h2">About this workshop</h2>
        <p className="detail-body">{event.description}</p>
      </section>

      {/* Host */}
      <section className="detail-section">
        <h2 className="detail-h2">Your host</h2>
        <div className="host-card">
          <div className="host-avatar-lg">
            {event.host.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="host-card-name">{event.host.name}</div>
            <div className="host-card-title">{event.host.title}</div>
          </div>
        </div>
      </section>

      {/* AI Agent Affiliate Recommendations */}
      {event.affiliates && event.affiliates.length > 0 && (
        <section className="detail-section affiliate-section">
          <div className="agent-header">
            <div className="agent-avatar">
              <Bot size={20} strokeWidth={2.2} />
              <span className="agent-pulse" />
            </div>
            <div className="agent-meta">
              <h2 className="agent-title">
                Your Fud Agent recommends
              </h2>
              <p className="agent-sub">Tools curated for this workshop</p>
            </div>
          </div>

          <div className="affiliate-grid">
            {event.affiliates.map((aff, i) => {
              const style = affiliateColors[i % affiliateColors.length];
              return (
                <a
                  href={aff.link}
                  className="affiliate-card"
                  key={i}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="affiliate-top">
                    <div
                      className="affiliate-logo"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {aff.name.charAt(0)}
                    </div>
                    {aff.discount && (
                      <span className="affiliate-discount">{aff.discount}</span>
                    )}
                  </div>
                  <h3 className="affiliate-name">{aff.name}</h3>
                  <p className="affiliate-desc">{aff.description}</p>
                  <span className="affiliate-cta">
                    Learn more <ExternalLink size={13} />
                  </span>
                </a>
              );
            })}
          </div>

          <p className="affiliate-disclosure">
            Fud may earn a commission on purchases made through these links — at no extra cost to you.
          </p>
        </section>
      )}
    </div>
  );
}
