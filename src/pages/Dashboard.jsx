import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins, ArrowRight, Clock, Users,
  Building2, Star, Calendar,
  CheckCircle2, Gift, UserPlus, Trophy, ChevronRight, ChevronLeft,
  Video, MapPin, Sparkles
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { events } from '../data/mockData';

function getActivityIcon(description) {
  if (description.includes('Attended')) return { icon: CheckCircle2 };
  if (description.includes('Welcome'))  return { icon: Gift };
  if (description.includes('profile'))  return { icon: UserPlus };
  if (description.includes('Tipped'))   return { icon: Trophy };
  return { icon: Star };
}

function ScrollNav({ scrollRef }) {
  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = Math.max(scrollRef.current.clientWidth * 0.82, 260);
    scrollRef.current.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };
  return (
    <div className="scroll-nav">
      <button onClick={() => scroll(-1)} aria-label="Previous"><ChevronLeft size={16} strokeWidth={2.2} /></button>
      <button onClick={() => scroll(1)} aria-label="Next"><ChevronRight size={16} strokeWidth={2.2} /></button>
    </div>
  );
}

function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const startTime = performance.now();
    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span>{display}</span>;
}

function CoinRing({ value, max = 500, size = 110 }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="coin-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="coin-ring">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={stroke} className="coin-ring-bg"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#coinGrad)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="coin-ring-progress"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            '--ring-circumference': circumference,
            '--ring-offset': offset,
            animation: 'ringProgress 1.4s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        />
        <defs>
          <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C89526" />
            <stop offset="100%" stopColor="#DFB055" />
          </linearGradient>
        </defs>
      </svg>
      <div className="coin-ring-inner">
        <span className="coin-ring-number">
          <AnimatedNumber value={value} duration={1400} />
        </span>
        <span className="coin-ring-sub">of {max}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, transactions, isProfileComplete, openOnboarding } = useUser();
  const eventsScrollRef = useRef(null);

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date('2026-04-14'))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const nextEvent = upcomingEvents[0];
  const displayEvents = upcomingEvents.slice(0, 4);
  const recentTx = transactions.slice(0, 4);

  const daysUntilNext = nextEvent
    ? Math.ceil((new Date(nextEvent.date) - new Date('2026-04-14')) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="dashboard">
      {/* ---- Bento Hero ---- */}
      <section className="bento-hero">
        {/* Main greeting tile */}
        <div className="bento-greeting">
          <div className="bento-dots" />
          <div className="bento-greeting-content">
            <div className="bento-greeting-top">
              <span className="business-badge">
                <Building2 size={13} />
                {user.business}
              </span>
            </div>
            <div className="bento-greeting-text">
              <span className="greet-eyebrow">Welcome back, {user.name.split(' ')[0]}</span>
              <h1 className="greet-heading">
                Let's take<br />action today.
              </h1>
            </div>
            {!isProfileComplete ? (
              <button className="next-event-cta onboarding-cta" onClick={() => openOnboarding()}>
                <div className="next-event-info">
                  <span className="next-event-label cta-agent">
                    <Sparkles size={11} /> Fud Agent
                  </span>
                  <span className="next-event-title">Complete setup to unlock 1-click apply</span>
                </div>
                <ChevronRight size={18} />
              </button>
            ) : nextEvent && (
              <Link to={`/events/${nextEvent.id}`} className="next-event-cta">
                <div className="next-event-info">
                  <span className="next-event-label">
                    Next workshop{daysUntilNext > 0 ? ` in ${daysUntilNext} day${daysUntilNext > 1 ? 's' : ''}` : ' today'}
                  </span>
                  <span className="next-event-title">{nextEvent.title}</span>
                </div>
                <ChevronRight size={18} />
              </Link>
            )}
          </div>
        </div>

        {/* Coin balance */}
        <div className="bento-coin">
          <span className="bento-coin-label">Fud Coin Balance</span>
          <CoinRing value={user.coinBalance} />
          <Link to="/wallet" className="bento-coin-link">
            View wallet <ArrowRight size={13} />
          </Link>
        </div>

      </section>

      {/* ---- Upcoming Events ---- */}
      <section className="dash-section animate-in" style={{ animationDelay: '320ms' }}>
        <div className="section-header">
          <div className="section-title-group">
            <span className="section-num">No. 01</span>
            <h2 className="section-title">Upcoming events</h2>
          </div>
          <div className="section-actions">
            <ScrollNav scrollRef={eventsScrollRef} />
            <Link to="/events" className="see-all">See all <ArrowRight size={14} /></Link>
          </div>
        </div>
        <div className="events-scroll" ref={eventsScrollRef}>
          {displayEvents.map(event => {
            const d = new Date(event.date);
            const day = d.toLocaleDateString('en-US', { day: 'numeric' });
            const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            return (
              <Link to={`/events/${event.id}`} key={event.id} className={`dash-event-card ${event.type}`}>
                <div className="dash-event-top">
                  <div className="dash-event-date">
                    <span className="date-day">{day}</span>
                    <div className="date-meta">
                      <Calendar size={14} className="date-icon" />
                      <span className="date-month">{month}</span>
                    </div>
                  </div>
                  <div className="event-card-badges">
                    {event.type === 'free' ? (
                      <span className="type-badge free">FREE</span>
                    ) : (
                      <span className="type-badge paid"><Coins size={13} /> {event.coinCost}</span>
                    )}
                  </div>
                </div>
                <h3 className="dash-event-title">{event.title}</h3>
                <div className="dash-event-meta">
                  <span><Clock size={14} /> {event.time}</span>
                  <span className={`format-tag ${event.format}`}>
                    {event.format === 'virtual' ? <Video size={12} /> : <MapPin size={12} />}
                    {event.format === 'virtual' ? 'Virtual' : event.location}
                  </span>
                </div>
                <div className="dash-event-footer">
                  <span className="cat-tag">{event.category}</span>
                  <span className="attendee-count">
                    <Users size={14} /> {event.attendees}/{event.maxAttendees}
                  </span>
                </div>
                {event.coinsEarned > 0 && (
                  <div className="earn-tag"><Coins size={13} /> +{event.coinsEarned} coins</div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---- Recent Activity ---- */}
      <section className="dash-section animate-in" style={{ animationDelay: '400ms' }}>
        <div className="section-header">
          <div className="section-title-group">
            <span className="section-num">No. 02</span>
            <h2 className="section-title">Recent activity</h2>
          </div>
          <Link to="/wallet" className="see-all">View all <ArrowRight size={14} /></Link>
        </div>
        <div className="activity-list">
          {recentTx.map(tx => {
            const act = getActivityIcon(tx.description);
            const ActIcon = act.icon;
            return (
              <div key={tx.id} className={`activity-item ${tx.type}`}>
                <div className="activity-icon-box">
                  <ActIcon size={18} />
                </div>
                <div className="activity-info">
                  <span className="activity-desc">{tx.description}</span>
                  <span className="activity-date">
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <span className={`activity-amount ${tx.type}`}>
                  {tx.type === 'earned' ? '+' : '-'}{tx.amount}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
