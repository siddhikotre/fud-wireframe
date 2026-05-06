import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Coins, Clock, Users, Bot, Megaphone,
  DollarSign, Scale, Landmark, Sparkles,
  SlidersHorizontal, X, Video, MapPin,
  ChevronLeft, ChevronRight, BookmarkCheck, AlertTriangle
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { events, categories } from '../data/mockData';

const NOW_REF = new Date('2026-04-14');
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const categoryConfig = {
  'AI Tools':   { icon: Bot,        color: '#6366F1', bg: '#EEF2FF' },
  'Marketing':  { icon: Megaphone,  color: '#DB2777', bg: '#FCE7F3' },
  'Finance':    { icon: DollarSign, color: '#059669', bg: '#ECFDF5' },
  'Legal':      { icon: Scale,      color: '#D97706', bg: '#FFFBEB' },
  'Operations': { icon: Landmark,   color: '#0284C7', bg: '#E0F2FE' },
};

const typeFilters = [
  { key: 'free', label: 'Free', icon: Sparkles, color: '#059669', bg: '#ECFDF5' },
  { key: 'paid', label: 'Paid', icon: Coins, color: '#7A6FFA', bg: '#F2F0FF' },
];

const formatFilters = [
  { key: 'virtual',   label: 'Virtual',   icon: Video,  color: '#2563EB', bg: '#EFF6FF' },
  { key: 'in-person', label: 'In-person', icon: MapPin, color: '#DB2777', bg: '#FCE7F3' },
];

function bucketFor(dateStr) {
  const days = Math.floor((new Date(dateStr) - NOW_REF) / MS_PER_DAY);
  if (days < 7)  return { key: 'this-week',     label: 'This week' };
  if (days < 21) return { key: 'next-two-weeks', label: 'Next 2 weeks' };
  return { key: 'later', label: 'Later' };
}

function getCapacity(event) {
  const remaining = (event.maxAttendees ?? 0) - (event.attendees ?? 0);
  const pct = event.maxAttendees ? event.attendees / event.maxAttendees : 0;
  if (remaining <= 0) return { tone: 'full',   label: 'Sold out' };
  if (pct >= 0.9)     return { tone: 'urgent', label: `${remaining} left` };
  if (pct >= 0.8)     return { tone: 'urgent', label: `${remaining} spots left` };
  return null;
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
      <button onClick={() => scroll(1)}  aria-label="Next"><ChevronRight size={16} strokeWidth={2.2} /></button>
    </div>
  );
}

function EventCard({ event, isRegistered }) {
  const cat = categoryConfig[event.category] || categoryConfig['AI Tools'];
  const CatIcon = cat.icon;
  const capacity = getCapacity(event);
  return (
    <Link
      to={`/events/${event.id}`}
      key={event.id}
      className={`event-card ${event.type}`}
    >
      <div className="event-card-image">
        {event.image && (
          <img src={event.image} alt="" loading="lazy" />
        )}
        <div
          className="event-card-image-tint"
          style={{ background: `linear-gradient(180deg, transparent 25%, rgba(10,10,10,0.65) 70%, rgba(10,10,10,0.85))` }}
        />
        <div className="event-card-image-cat" style={{ background: cat.bg, color: cat.color }}>
          <CatIcon size={16} />
          <span>{event.category}</span>
        </div>
        <div className="event-card-image-badges">
          {isRegistered && <span className="reg-badge">Registered</span>}
          {capacity && (
            <span className={`capacity-badge ${capacity.tone}`}>
              {capacity.tone === 'full'
                ? <AlertTriangle size={11} />
                : <Users size={11} />}
              {capacity.label}
            </span>
          )}
          {event.type === 'free' ? (
            <span className="type-badge free">FREE</span>
          ) : (
            <span className="type-badge paid"><Coins size={12} /> {event.coinCost}</span>
          )}
        </div>
        <h3 className="event-card-image-title">{event.title}</h3>
      </div>

      <div className="event-card-body">
        <div className="event-card-meta">
          <span className="meta-item">
            <Clock size={14} />
            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {' '}&middot; {event.time}
          </span>
          <span className={`format-tag ${event.format}`}>
            {event.format === 'virtual' ? <Video size={12} /> : <MapPin size={12} />}
            {event.format === 'virtual' ? 'Virtual' : event.location}
          </span>
        </div>

        <div className="event-card-bottom">
          <div className="host-row">
            <div className="host-avatar-sm">{event.host.name.split(' ').map(n => n[0]).join('')}</div>
            <span className="host-name-sm">{event.host.name}</span>
          </div>
          <div className="bottom-right">
            <span className="attendee-pill">
              <Users size={13} /> {event.attendees}
            </span>
            {event.coinsEarned > 0 && (
              <span className="earn-pill">+{event.coinsEarned}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Events() {
  const { registeredEvents } = useUser();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeType, setActiveType] = useState('all');
  const [activeFormat, setActiveFormat] = useState('all');
  const [showRegisteredOnly, setShowRegisteredOnly] = useState(false);
  const featuredRef = useRef(null);
  const searchRef = useRef(null);

  // Keyboard shortcuts: "/" focuses search, Esc clears
  useEffect(() => {
    function onKey(e) {
      const tag = (e.target.tagName || '').toLowerCase();
      const inField = tag === 'input' || tag === 'textarea';
      if (e.key === '/' && !inField) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (document.activeElement === searchRef.current) {
          if (search) setSearch('');
          else searchRef.current?.blur();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [search]);

  const featuredEvents = useMemo(
    () => events.filter(e => e.featured && new Date(e.date) >= NOW_REF),
    []
  );

  const filteredEvents = useMemo(() => {
    return events
      .filter(e => new Date(e.date) >= NOW_REF)
      .filter(e => activeCategory === 'All' || e.category === activeCategory)
      .filter(e => activeType === 'all' || e.type === activeType)
      .filter(e => activeFormat === 'all' || e.format === activeFormat)
      .filter(e => !showRegisteredOnly || registeredEvents.includes(e.id))
      .filter(e => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.host.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [search, activeCategory, activeType, activeFormat, showRegisteredOnly, registeredEvents]);

  const groupedEvents = useMemo(() => {
    const groups = { 'this-week': [], 'next-two-weeks': [], 'later': [] };
    for (const e of filteredEvents) groups[bucketFor(e.date).key].push(e);
    return [
      { key: 'this-week',      label: 'This week',      items: groups['this-week'] },
      { key: 'next-two-weeks', label: 'Next 2 weeks',   items: groups['next-two-weeks'] },
      { key: 'later',          label: 'Later',          items: groups['later'] },
    ].filter(g => g.items.length > 0);
  }, [filteredEvents]);

  // Build a list of active filters so we can show removable chips in the empty state
  const activeFilterChips = [];
  if (search)            activeFilterChips.push({ key: 'search',  label: `"${search}"`,                       onRemove: () => setSearch('') });
  if (activeCategory !== 'All') activeFilterChips.push({ key: 'cat',     label: activeCategory,                onRemove: () => setActiveCategory('All') });
  if (activeType   !== 'all')   activeFilterChips.push({ key: 'type',    label: activeType === 'free' ? 'Free' : 'Paid', onRemove: () => setActiveType('all') });
  if (activeFormat !== 'all')   activeFilterChips.push({ key: 'format',  label: activeFormat === 'virtual' ? 'Virtual' : 'In-person', onRemove: () => setActiveFormat('all') });
  if (showRegisteredOnly)       activeFilterChips.push({ key: 'reg',     label: 'My events',                   onRemove: () => setShowRegisteredOnly(false) });

  const hasFilters = activeFilterChips.length > 0;
  const filterCount = activeFilterChips.length;

  function clearFilters() {
    setSearch('');
    setActiveCategory('All');
    setActiveType('all');
    setActiveFormat('all');
    setShowRegisteredOnly(false);
  }

  return (
    <div className="events-page">
      {/* Header */}
      <div className="events-header animate-in">
        <h1>Events &amp; Workshops</h1>
        <p>Discover workshops to grow your business and earn Fud Coins</p>
      </div>

      {/* Search */}
      <div className="events-search-bar animate-in" style={{ animationDelay: '60ms' }}>
        <Search size={18} className="search-icon" />
        <input
          ref={searchRef}
          type="text"
          placeholder='Search events, topics, or hosts...   ( press " / " )'
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Sticky filter rail */}
      <div className="events-filters events-filters--sticky animate-in" style={{ animationDelay: '120ms' }}>
        <div className="filter-row filter-row--unified" role="toolbar" aria-label="Event filters">
          {/* My events toggle — first chip so it's always visible */}
          <button
            className={`filter-chip my-events-chip ${showRegisteredOnly ? 'active' : ''}`}
            onClick={() => setShowRegisteredOnly(v => !v)}
            aria-pressed={showRegisteredOnly}
            style={{ '--chip-color': '#7A6FFA', '--chip-bg': '#F2F0FF' }}
          >
            <BookmarkCheck size={14} />
            My events
            {registeredEvents.length > 0 && (
              <span className="my-events-count">{registeredEvents.length}</span>
            )}
          </button>

          <span className="filter-divider" aria-hidden />

          {typeFilters.map(f => {
            const TIcon = f.icon;
            const isActive = activeType === f.key;
            return (
              <button
                key={f.key}
                className={`filter-chip type-chip ${isActive ? 'active' : ''}`}
                onClick={() => setActiveType(isActive ? 'all' : f.key)}
                aria-pressed={isActive}
                style={{ '--chip-color': f.color, '--chip-bg': f.bg }}
              >
                {TIcon && <TIcon size={14} />}
                {f.label}
              </button>
            );
          })}

          <span className="filter-divider" aria-hidden />

          {formatFilters.map(f => {
            const FIcon = f.icon;
            const isActive = activeFormat === f.key;
            return (
              <button
                key={f.key}
                className={`filter-chip format-chip ${isActive ? 'active' : ''}`}
                onClick={() => setActiveFormat(isActive ? 'all' : f.key)}
                aria-pressed={isActive}
                style={{ '--chip-color': f.color, '--chip-bg': f.bg }}
              >
                {FIcon && <FIcon size={14} />}
                {f.label}
              </button>
            );
          })}

          <span className="filter-divider" aria-hidden />

          {categories.filter(c => c.name !== 'All').map(cat => {
            const config = categoryConfig[cat.name];
            const Icon = config?.icon;
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                className={`filter-chip cat-chip ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(isActive ? 'All' : cat.name)}
                aria-pressed={isActive}
                style={config ? {
                  '--chip-color': config.color,
                  '--chip-bg': config.bg,
                } : {}}
              >
                {Icon && <Icon size={14} />}
                {cat.name}
              </button>
            );
          })}

          {hasFilters && (
            <>
              <span className="filter-divider" aria-hidden />
              <button className="clear-filters" onClick={clearFilters}>
                <X size={14} /> Clear ({filterCount})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Featured strip — only when no filters applied */}
      {!hasFilters && featuredEvents.length > 0 && (
        <section className="featured-section animate-in" style={{ animationDelay: '180ms' }}>
          <div className="section-header">
            <div className="section-title-group">
              <h2 className="section-title">
                <Sparkles size={18} /> Featured
              </h2>
            </div>
            <ScrollNav scrollRef={featuredRef} />
          </div>
          <div className="featured-scroll" ref={featuredRef}>
            {featuredEvents.map(event => {
              const cat = categoryConfig[event.category] || categoryConfig['AI Tools'];
              const CatIcon = cat.icon;
              const isRegistered = registeredEvents.includes(event.id);
              const capacity = getCapacity(event);
              return (
                <Link to={`/events/${event.id}`} key={event.id} className="featured-card">
                  <div className="featured-image">
                    {event.image && (
                      <img src={event.image} alt="" loading="lazy" />
                    )}
                    <div
                      className="featured-image-tint"
                      style={{ background: `linear-gradient(180deg, transparent 25%, rgba(10,10,10,0.65) 70%, rgba(10,10,10,0.88))` }}
                    />
                    <div className="featured-image-cat" style={{ background: cat.bg, color: cat.color }}>
                      <CatIcon size={16} />
                      <span>{event.category}</span>
                    </div>
                    <div className="featured-image-badges">
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
                        <span className="type-badge paid"><Coins size={12} /> {event.coinCost}</span>
                      )}
                    </div>
                    <h3 className="featured-image-title">{event.title}</h3>
                  </div>
                  <div className="featured-content">
                    <div className="featured-meta">
                      <span><Clock size={14} /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className={`format-tag ${event.format}`}>
                        {event.format === 'virtual' ? <Video size={12} /> : <MapPin size={12} />}
                        {event.format === 'virtual' ? 'Virtual' : event.location}
                      </span>
                    </div>
                    <div className="featured-footer">
                      <div className="host-info">
                        <div className="host-avatar">{event.host.name.split(' ').map(n => n[0]).join('')}</div>
                        <div className="host-details">
                          <span className="host-name">{event.host.name}</span>
                          <span className="host-title">{event.host.title}</span>
                        </div>
                      </div>
                      {event.coinsEarned > 0 && (
                        <span className="earn-tag"><Coins size={12} /> +{event.coinsEarned}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Events grid — date-grouped */}
      <section className="events-grid-section animate-in" style={{ animationDelay: hasFilters ? '180ms' : '240ms' }}>
        {!hasFilters && (
          <div className="section-header">
            <h2 className="section-title">All Upcoming</h2>
            <span className="event-count">{filteredEvents.length} events</span>
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="events-empty">
            <SlidersHorizontal size={32} />
            <h3>No events match your filters</h3>
            <p>Try removing one to see more results.</p>
            {activeFilterChips.length > 0 && (
              <div className="empty-filter-chips" role="list">
                {activeFilterChips.map(c => (
                  <button
                    key={c.key}
                    role="listitem"
                    className="empty-filter-chip"
                    onClick={c.onRemove}
                    aria-label={`Remove filter: ${c.label}`}
                  >
                    {c.label} <X size={12} />
                  </button>
                ))}
              </div>
            )}
            <button className="clear-filters-btn" onClick={clearFilters}>Clear all filters</button>
          </div>
        ) : (
          <div className="events-groups">
            {groupedEvents.map(group => (
              <div className="events-group" key={group.key}>
                {/* Don't show group header when only a single bucket exists (cleaner) */}
                {groupedEvents.length > 1 && (
                  <div className="events-group-header">
                    <span className="events-group-label">{group.label}</span>
                    <span className="events-group-count">{group.items.length}</span>
                  </div>
                )}
                <div className="events-grid">
                  {group.items.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isRegistered={registeredEvents.includes(event.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
