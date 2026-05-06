import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Calendar, Clock, Users, Coins,
  Video, MapPin, Bot, Megaphone, DollarSign, Scale,
  Landmark, Check, ExternalLink, Zap, Share2, Download,
  CalendarPlus, AlertTriangle, Tag, UserCheck
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { events } from '../data/mockData';

const NOW_REF = new Date('2026-04-14');
const MS_PER_DAY = 1000 * 60 * 60 * 24;

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
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function getCountdown(dateStr) {
  const target = new Date(dateStr);
  const diff = target - NOW_REF;
  const days = Math.floor(diff / MS_PER_DAY);
  if (days < 0)  return null;
  if (days === 0) return { text: 'Starts today', tone: 'imminent' };
  if (days === 1) return { text: 'Starts tomorrow', tone: 'imminent' };
  if (days <= 7)  return { text: `Starts in ${days} days`, tone: 'soon' };
  return { text: `Starts in ${days} days`, tone: 'normal' };
}

function CapacityMeter({ attendees, max }) {
  const pct = Math.min(100, Math.round((attendees / max) * 100));
  const remaining = max - attendees;
  const tone = pct >= 100 ? 'full' : pct >= 80 ? 'urgent' : '';
  const label = pct >= 100
    ? 'Sold out'
    : remaining <= 5
      ? `Only ${remaining} spot${remaining === 1 ? '' : 's'} left`
      : `${remaining} of ${max} spots open`;
  return (
    <div className="capacity-meter" aria-label={`Capacity: ${attendees} of ${max} registered`}>
      <div className="capacity-meter-row">
        <span>{label}</span>
        <span className={`capacity-meter-count ${tone}`}>{attendees}/{max}</span>
      </div>
      <div className="capacity-meter-bar">
        <div className={`capacity-meter-fill ${tone}`} style={{ '--fill': `${pct}%` }} />
      </div>
    </div>
  );
}

/* ---- Calendar helpers ---- */
function parseEventTime(dateStr, timeStr) {
  // timeStr like "2:00 PM EST" — strip TZ, treat as local
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hours = 9, mins = 0;
  if (m) {
    hours = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) hours += 12;
    mins = parseInt(m[2], 10);
  }
  const d = new Date(dateStr);
  d.setHours(hours, mins, 0, 0);
  return d;
}

function toIcsDate(d) {
  // YYYYMMDDTHHMMSS in local time (no Z) — compatible with most calendars
  const pad = n => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) + 'T' +
    pad(d.getHours()) +
    pad(d.getMinutes()) + '00'
  );
}

function googleCalUrl(event) {
  const start = parseEventTime(event.date, event.time);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h default
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    location: event.format === 'virtual' ? 'Zoom (link sent via email)' : event.location,
    dates: `${toIcsDate(start)}/${toIcsDate(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadIcs(event) {
  const start = parseEventTime(event.date, event.time);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fud//Workshops//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@fud.app`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${event.title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n').replace(/,/g, '\\,')}`,
    `LOCATION:${(event.format === 'virtual' ? 'Zoom (link sent via email)' : event.location).replace(/,/g, '\\,')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, registerForEvent, registeredEvents, isProfileComplete, openOnboarding } = useUser();
  const [registering, setRegistering] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroCtaRef = useRef(null);

  const event = events.find(e => e.id === id);

  useEffect(() => {
    if (!heroCtaRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(heroCtaRef.current);
    return () => observer.disconnect();
  }, [event]);

  const relatedEvents = useMemo(() => {
    if (!event) return [];
    return events
      .filter(e => e.id !== event.id)
      .filter(e => e.category === event.category)
      .filter(e => new Date(e.date) >= NOW_REF)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  }, [event]);

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
  const isFull = event.attendees >= event.maxAttendees;
  const cat = categoryConfig[event.category] || categoryConfig['AI Tools'];
  const CatIcon = cat.icon;
  const countdown = getCountdown(event.date);

  // Derived bullets — fall back to splitting description if learnings missing
  const learnings = event.learnings || event.description
    .split(/\.\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map(s => s.replace(/[.!?]+$/, ''));

  async function handleRegister() {
    if (isRegistered || justRegistered || !canAfford || isFull) return;
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

  async function handleShare() {
    const shareData = {
      title: event.title,
      text: `Check out this Fud workshop: ${event.title}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch { /* fallthrough */ }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  }

  function renderRegisterCTA() {
    if (isRegistered || justRegistered) {
      return (
        <div className="cta-registered-block">
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
          <div className="cta-cal-row">
            <a
              href={googleCalUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-cal-btn"
            >
              <CalendarPlus size={15} /> Google Calendar
            </a>
            <button className="cta-cal-btn" onClick={() => downloadIcs(event)}>
              <Download size={15} /> Download .ics
            </button>
          </div>
        </div>
      );
    }
    if (isFull) {
      return (
        <button className="cta-register" disabled>
          Sold out — join waitlist
        </button>
      );
    }
    if (!canAfford) {
      return (
        <div className="cta-needs-coins">
          <div className="cta-needs-info">
            <span className="cta-needs-title">Need {event.coinCost - user.coinBalance} more coins</span>
            <span className="cta-needs-sub">Buy Fud Coins to register for this workshop</span>
          </div>
          <Link to="/wallet" className="cta-buy-btn">
            Buy Coins <ArrowRight size={16} />
          </Link>
        </div>
      );
    }
    return (
      <button
        className={`cta-register ${event.type}`}
        onClick={handleRegister}
        disabled={registering}
      >
        {registering ? (
          <><span className="spinner" /> Registering you...</>
        ) : (
          <>
            <Zap size={17} strokeWidth={2.5} />
            {event.type === 'free'
              ? 'Apply in 1 click'
              : `Pay ${event.coinCost} coins · Apply`}
          </>
        )}
      </button>
    );
  }

  const showStickyCta = stickyVisible && !isRegistered && !justRegistered;

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
            <Link to="/events" className="cat-chip-static cat-chip-link">{event.category}</Link>
          </div>
        </div>

        <h1 className="detail-title">{event.title}</h1>

        {countdown && !isRegistered && !justRegistered && (
          <span className={`detail-countdown ${countdown.tone}`}>
            <Zap size={13} strokeWidth={2.4} /> {countdown.text}
          </span>
        )}

        {/* Big date block */}
        <div className="detail-when">
          <div className="when-date">
            <span className="when-day">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
            <span className="when-num">{new Date(event.date).getDate()}</span>
            <span className="when-month">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
          </div>
          <div className="when-meta">
            <span className="when-time"><Clock size={14} /> {event.time}</span>
            <span className="when-full">{formatDate(event.date)}</span>
          </div>
        </div>

        {event.maxAttendees && (
          <CapacityMeter attendees={event.attendees} max={event.maxAttendees} />
        )}

        {/* Register CTA */}
        <div className="detail-cta-section" ref={heroCtaRef}>
          <div className="detail-cta-row">
            {renderRegisterCTA()}
            <button
              className={`cta-share ${shareCopied ? 'copied' : ''}`}
              onClick={handleShare}
              aria-label="Share workshop"
            >
              {shareCopied ? <><Check size={16} /> Copied</> : <><Share2 size={16} /> Share</>}
            </button>
          </div>
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

        {learnings.length > 0 && (
          <div className="learnings-block">
            <h3 className="learnings-title">What you'll learn</h3>
            <ul className="learnings-list">
              {learnings.map((item, i) => (
                <li key={i} className="learnings-item">
                  <span className="learnings-check"><Check size={13} strokeWidth={3} /></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {event.audience && (
          <div className="audience-row">
            <UserCheck size={15} className="audience-icon" />
            <span className="audience-label">Best for</span>
            <span className="audience-text">{event.audience}</span>
          </div>
        )}

        {event.tags && event.tags.length > 0 && (
          <div className="detail-tags">
            {event.tags.map(tag => (
              <span key={tag} className="detail-tag"><Tag size={11} /> {tag}</span>
            ))}
          </div>
        )}
      </section>

      {/* Host */}
      <section className="detail-section">
        <h2 className="detail-h2">Your host</h2>
        <div className="host-card">
          <div className="host-avatar-lg" style={{ background: cat.color }}>
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
              <h2 className="agent-title">Your Fud Agent recommends</h2>
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

      {/* Related events */}
      {relatedEvents.length > 0 && (
        <section className="detail-section">
          <div className="section-header">
            <h2 className="detail-h2" style={{ marginBottom: 0 }}>More {event.category} workshops</h2>
            <Link to="/events" className="see-all">Browse all <ArrowRight size={14} /></Link>
          </div>
          <div className="related-grid">
            {relatedEvents.map(rel => {
              const rcat = categoryConfig[rel.category] || cat;
              const RIcon = rcat.icon;
              return (
                <Link to={`/events/${rel.id}`} key={rel.id} className="related-card">
                  <div className="related-icon" style={{ background: rcat.bg, color: rcat.color }}>
                    <RIcon size={16} />
                  </div>
                  <div className="related-body">
                    <span className="related-title">{rel.title}</span>
                    <span className="related-meta">
                      <Calendar size={12} />
                      {new Date(rel.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <span className="related-dot">·</span>
                      {rel.host.name}
                    </span>
                  </div>
                  <ArrowRight size={14} className="related-arrow" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Sticky CTA on scroll */}
      <div className={`detail-sticky-cta ${showStickyCta ? 'visible' : ''}`} aria-hidden={!showStickyCta}>
        <div className="detail-sticky-cta-info">
          <span className="detail-sticky-cta-title">{event.title}</span>
          <span className="detail-sticky-cta-sub">
            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {event.time}
          </span>
        </div>
        {renderRegisterCTA()}
      </div>
    </div>
  );
}
