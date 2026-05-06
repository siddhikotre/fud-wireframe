import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins, ArrowRight, Clock, Users,
  Building2, Star, Calendar,
  CheckCircle2, Gift, UserPlus, Trophy, ChevronRight, ChevronLeft,
  Video, MapPin, Sparkles, AlertTriangle, Zap, Award, TrendingUp,
  Flame, BookOpen
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { events } from '../data/mockData';

const NOW_REF = new Date('2026-04-14');
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getActivityIcon(description) {
  if (description.includes('Attended'))   return { icon: CheckCircle2 };
  if (description.includes('Welcome'))    return { icon: Gift };
  if (description.includes('profile'))    return { icon: UserPlus };
  if (description.includes('Tipped'))     return { icon: Trophy };
  if (description.includes('Purchased'))  return { icon: Coins };
  if (description.includes('Registered')) return { icon: Calendar };
  return { icon: Star };
}

function getCapacity(event) {
  const remaining = (event.maxAttendees ?? 0) - (event.attendees ?? 0);
  const pct = event.maxAttendees ? event.attendees / event.maxAttendees : 0;
  if (remaining <= 0) return { tone: 'full',   label: 'Sold out' };
  if (pct >= 0.9)     return { tone: 'urgent', label: `${remaining} left` };
  if (pct >= 0.8)     return { tone: 'urgent', label: `${remaining} spots left` };
  return null;
}

function daysFromNow(dateStr) {
  return Math.ceil((new Date(dateStr) - NOW_REF) / MS_PER_DAY);
}

function activityBucket(dateStr) {
  const days = Math.floor((NOW_REF - new Date(dateStr)) / MS_PER_DAY);
  if (days <= 0)  return 'today';
  if (days === 1) return 'yesterday';
  if (days <= 7)  return 'this-week';
  return 'older';
}

const ACTIVITY_BUCKETS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this-week', label: 'Earlier this week' },
  { key: 'older',     label: 'Earlier' },
];

function ScrollNav({ scrollRef }) {
  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = Math.max(scrollRef.current.clientWidth * 0.82, 260);
    scrollRef.current.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };
  return (
    <div className="scroll-nav">
      <button onClick={() => scroll(-1)} aria-label="Previous"><ChevronLeft size={16} strokeWidth={2.2} /></button>
      <button onClick={() => scroll(1)}  aria-label="Next"><ChevronRight size={16} strokeWidth={2.2} /></button>
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
            <stop offset="0%"   stopColor="#F5A623" />
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
  const { user, transactions, registeredEvents, isProfileComplete, openOnboarding } = useUser();
  const eventsScrollRef = useRef(null);

  // ---- Derived data ----
  const upcomingEvents = useMemo(
    () => events
      .filter(e => new Date(e.date) >= NOW_REF)
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    []
  );

  const upcomingRegistered = useMemo(
    () => upcomingEvents.filter(e => registeredEvents.includes(e.id)),
    [upcomingEvents, registeredEvents]
  );

  // Pin registered events first in the strip
  const displayEvents = useMemo(() => {
    const reg = upcomingRegistered.slice(0, 4);
    const rest = upcomingEvents.filter(e => !registeredEvents.includes(e.id)).slice(0, Math.max(0, 4 - reg.length));
    return [...reg, ...rest];
  }, [upcomingEvents, upcomingRegistered, registeredEvents]);

  const nextRegistered = upcomingRegistered[0];
  const nextEvent = upcomingEvents[0];

  // Stats: workshops attended (registered + happened in past), coins earned this week, weeks on Fud
  const eventsAttendedCount = (user.eventsAttended || []).length;

  const coinsThisWeek = useMemo(() => {
    return transactions
      .filter(tx => tx.type === 'earned')
      .filter(tx => activityBucket(tx.date) === 'today' || activityBucket(tx.date) === 'yesterday' || activityBucket(tx.date) === 'this-week')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const weeksOnFud = useMemo(() => {
    const joined = new Date(user.joinedDate);
    const days = Math.max(0, Math.floor((NOW_REF - joined) / MS_PER_DAY));
    return Math.max(1, Math.ceil(days / 7));
  }, [user.joinedDate]);

  // How many upcoming events the user can afford right now (free or coin-affordable)
  const affordableCount = useMemo(() => {
    return upcomingEvents
      .filter(e => !registeredEvents.includes(e.id))
      .filter(e => e.type === 'free' || user.coinBalance >= e.coinCost)
      .length;
  }, [upcomingEvents, registeredEvents, user.coinBalance]);

  // ---- Smart hero CTA ----
  // Priority: incomplete profile → imminent workshop → next registered → discover next → browse all
  function renderHeroCTA() {
    if (!isProfileComplete) {
      return (
        <button className="next-event-cta onboarding-cta" onClick={() => openOnboarding()}>
          <div className="next-event-info">
            <span className="next-event-label cta-agent">
              <Sparkles size={11} /> Fud Agent
            </span>
            <span className="next-event-title">Complete setup to unlock 1-click apply</span>
          </div>
          <ChevronRight size={18} />
        </button>
      );
    }

    if (nextRegistered) {
      const days = daysFromNow(nextRegistered.date);
      const isImminent = days <= 1;
      return (
        <Link to={`/events/${nextRegistered.id}`} className={`next-event-cta ${isImminent ? 'imminent' : ''}`}>
          <div className="next-event-info">
            <span className="next-event-label">
              {isImminent ? (
                <><Zap size={11} strokeWidth={2.5} /> Starting {days <= 0 ? 'today' : 'tomorrow'}</>
              ) : (
                <>Next workshop in {days} day{days !== 1 ? 's' : ''}</>
              )}
            </span>
            <span className="next-event-title">{nextRegistered.title}</span>
          </div>
          <ChevronRight size={18} />
        </Link>
      );
    }

    if (nextEvent) {
      return (
        <Link to={`/events/${nextEvent.id}`} className="next-event-cta">
          <div className="next-event-info">
            <span className="next-event-label">Recommended for you</span>
            <span className="next-event-title">{nextEvent.title}</span>
          </div>
          <ChevronRight size={18} />
        </Link>
      );
    }

    return (
      <Link to="/events" className="next-event-cta">
        <div className="next-event-info">
          <span className="next-event-label">Browse</span>
          <span className="next-event-title">Discover this week's workshops</span>
        </div>
        <ChevronRight size={18} />
      </Link>
    );
  }

  // ---- Activity grouping + rollup ----
  const recentTx = transactions.slice(0, 8);

  const groupedTx = useMemo(() => {
    const map = new Map(ACTIVITY_BUCKETS.map(b => [b.key, []]));
    for (const tx of recentTx) map.get(activityBucket(tx.date)).push(tx);
    return ACTIVITY_BUCKETS
      .map(b => ({ ...b, items: map.get(b.key) }))
      .filter(g => g.items.length > 0);
  }, [recentTx]);

  const weeklyEarned = useMemo(
    () => transactions
      .filter(tx => tx.type === 'earned')
      .filter(tx => ['today', 'yesterday', 'this-week'].includes(activityBucket(tx.date)))
      .reduce((s, tx) => s + tx.amount, 0),
    [transactions]
  );

  const weeklySpent = useMemo(
    () => transactions
      .filter(tx => tx.type === 'spent')
      .filter(tx => ['today', 'yesterday', 'this-week'].includes(activityBucket(tx.date)))
      .reduce((s, tx) => s + tx.amount, 0),
    [transactions]
  );

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
              <h1 className="greet-heading">Let's take<br />action today.</h1>
            </div>
            {renderHeroCTA()}
          </div>
        </div>

        {/* Coin balance — now with weekly delta + affordability hint */}
        <div className="bento-coin">
          <span className="bento-coin-label">Fud Coin Balance</span>
          <CoinRing value={user.coinBalance} />
          <div className="bento-coin-context">
            {coinsThisWeek > 0 && (
              <span className="coin-delta">
                <TrendingUp size={12} strokeWidth={2.4} /> +{coinsThisWeek} this week
              </span>
            )}
            {affordableCount > 0 && (
              <span className="coin-affordable">
                Enough for {affordableCount} workshop{affordableCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Link to="/wallet" className="bento-coin-link">
            View wallet <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* ---- Quick stats ---- */}
      <section className="dash-stats animate-in" style={{ animationDelay: '200ms' }}>
        <div className="stat-tile">
          <div className="stat-icon"><BookOpen size={18} /></div>
          <div className="stat-body">
            <span className="stat-value">{eventsAttendedCount}</span>
            <span className="stat-label">Workshop{eventsAttendedCount !== 1 ? 's' : ''} attended</span>
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon stat-icon--gold"><Coins size={18} /></div>
          <div className="stat-body">
            <span className="stat-value">+{coinsThisWeek}</span>
            <span className="stat-label">Earned this week</span>
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon stat-icon--success"><Flame size={18} /></div>
          <div className="stat-body">
            <span className="stat-value">{weeksOnFud}</span>
            <span className="stat-label">Week{weeksOnFud !== 1 ? 's' : ''} on Fud</span>
          </div>
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
            {displayEvents.length > 0 && <ScrollNav scrollRef={eventsScrollRef} />}
            <Link to="/events" className="see-all">See all <ArrowRight size={14} /></Link>
          </div>
        </div>

        {displayEvents.length === 0 ? (
          <div className="dash-empty">
            <Calendar size={28} strokeWidth={1.6} />
            <p>No upcoming workshops scheduled.</p>
            <Link to="/events" className="dash-empty-cta">Browse events <ArrowRight size={14} /></Link>
          </div>
        ) : (
          <div className="events-scroll" ref={eventsScrollRef}>
            {displayEvents.map(event => {
              const d = new Date(event.date);
              const day = d.toLocaleDateString('en-US', { day: 'numeric' });
              const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
              const isRegistered = registeredEvents.includes(event.id);
              const capacity = getCapacity(event);
              return (
                <Link
                  to={`/events/${event.id}`}
                  key={event.id}
                  className={`dash-event-card ${event.type} ${isRegistered ? 'is-registered' : ''}`}
                >
                  <div className="dash-event-top">
                    <div className="dash-event-date">
                      <span className="date-day">{day}</span>
                      <div className="date-meta">
                        <Calendar size={14} className="date-icon" />
                        <span className="date-month">{month}</span>
                      </div>
                    </div>
                    <div className="event-card-badges">
                      {isRegistered && <span className="reg-badge">Registered</span>}
                      {capacity && (
                        <span className={`capacity-badge ${capacity.tone}`}>
                          {capacity.tone === 'full' ? <AlertTriangle size={11} /> : <Users size={11} />}
                          {capacity.label}
                        </span>
                      )}
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
        )}
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

        {recentTx.length === 0 ? (
          <div className="dash-empty">
            <Award size={28} strokeWidth={1.6} />
            <p>Your activity will appear here as you earn and spend coins.</p>
          </div>
        ) : (
          <>
            {(weeklyEarned > 0 || weeklySpent > 0) && (
              <div className="activity-rollup">
                <span className="rollup-label">This week</span>
                <span className="rollup-stats">
                  {weeklyEarned > 0 && <span className="rollup-earned">+{weeklyEarned} earned</span>}
                  {weeklyEarned > 0 && weeklySpent > 0 && <span className="rollup-sep">·</span>}
                  {weeklySpent > 0 && <span className="rollup-spent">-{weeklySpent} spent</span>}
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
                            {tx.type === 'earned' || tx.type === 'purchased' ? '+' : '-'}{tx.amount}
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
    </div>
  );
}
