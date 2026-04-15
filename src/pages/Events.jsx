import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Coins, Clock, Users, Bot, Megaphone,
  DollarSign, Scale, Landmark, Sparkles,
  SlidersHorizontal, X, Video, MapPin,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { events, categories } from '../data/mockData';

const categoryConfig = {
  'AI Tools':   { icon: Bot,        color: '#6366F1', bg: '#EEF2FF' },
  'Marketing':  { icon: Megaphone,  color: '#DB2777', bg: '#FCE7F3' },
  'Finance':    { icon: DollarSign, color: '#059669', bg: '#ECFDF5' },
  'Legal':      { icon: Scale,      color: '#D97706', bg: '#FFFBEB' },
  'Operations': { icon: Landmark,   color: '#0284C7', bg: '#E0F2FE' },
};

const typeFilters = [
  { key: 'all', label: 'All Events' },
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Paid' },
];

const formatFilters = [
  { key: 'all', label: 'All Formats' },
  { key: 'virtual', label: 'Virtual', icon: Video },
  { key: 'in-person', label: 'In-person', icon: MapPin },
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
      <button onClick={() => scroll(1)} aria-label="Next"><ChevronRight size={16} strokeWidth={2.2} /></button>
    </div>
  );
}

export default function Events() {
  const { registeredEvents } = useUser();
  const [search, setSearch] = useState('');
  const featuredRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeType, setActiveType] = useState('all');
  const [activeFormat, setActiveFormat] = useState('all');

  const featuredEvents = useMemo(
    () => events.filter(e => e.featured && new Date(e.date) >= new Date('2026-04-14')),
    []
  );

  const filteredEvents = useMemo(() => {
    return events
      .filter(e => new Date(e.date) >= new Date('2026-04-14'))
      .filter(e => activeCategory === 'All' || e.category === activeCategory)
      .filter(e => activeType === 'all' || e.type === activeType)
      .filter(e => activeFormat === 'all' || e.format === activeFormat)
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
  }, [search, activeCategory, activeType, activeFormat]);

  const hasFilters = search || activeCategory !== 'All' || activeType !== 'all' || activeFormat !== 'all';

  function clearFilters() {
    setSearch('');
    setActiveCategory('All');
    setActiveType('all');
    setActiveFormat('all');
  }

  return (
    <div className="events-page">
      {/* Header */}
      <div className="events-header animate-in">
        <h1>Events & Workshops</h1>
        <p>Discover workshops to grow your business and earn Fud Coins</p>
      </div>

      {/* Search */}
      <div className="events-search-bar animate-in" style={{ animationDelay: '60ms' }}>
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search events, topics, or hosts..."
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

      {/* Filters */}
      <div className="events-filters animate-in" style={{ animationDelay: '120ms' }}>
        {/* Type filters */}
        <div className="filter-row">
          {typeFilters.map(f => (
            <button
              key={f.key}
              className={`filter-chip type-chip ${activeType === f.key ? 'active' : ''}`}
              onClick={() => setActiveType(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Format filters */}
        <div className="filter-row">
          {formatFilters.map(f => {
            const FIcon = f.icon;
            return (
              <button
                key={f.key}
                className={`filter-chip format-chip ${activeFormat === f.key ? 'active' : ''}`}
                onClick={() => setActiveFormat(f.key)}
              >
                {FIcon && <FIcon size={14} />}
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Category filter row */}
        <div className="filter-row category-filters">
          {categories.map(cat => {
            const config = categoryConfig[cat.name];
            const Icon = config?.icon;
            return (
              <button
                key={cat.name}
                className={`filter-chip cat-chip ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.name)}
                style={activeCategory === cat.name && config ? {
                  '--chip-color': config.color,
                  '--chip-bg': config.bg,
                } : {}}
              >
                {Icon && <Icon size={14} />}
                {cat.name}
              </button>
            );
          })}
        </div>

        {hasFilters && (
          <button className="clear-filters" onClick={clearFilters}>
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {/* Featured strip */}
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
              return (
                <Link to={`/events/${event.id}`} key={event.id} className="featured-card">
                  <div className="featured-accent" style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}88)` }} />
                  <div className="featured-content">
                    <div className="featured-top">
                      <div className="featured-icon" style={{ background: cat.bg, color: cat.color }}>
                        <CatIcon size={22} />
                      </div>
                      <div className="featured-badges">
                        {isRegistered && <span className="reg-badge">Registered</span>}
                        {event.type === 'free' ? (
                          <span className="type-badge free">FREE</span>
                        ) : (
                          <span className="type-badge paid"><Coins size={12} /> {event.coinCost}</span>
                        )}
                      </div>
                    </div>
                    <h3 className="featured-title">{event.title}</h3>
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

      {/* Events grid */}
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
            <h3>No events found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button className="clear-filters-btn" onClick={clearFilters}>Clear all filters</button>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event, i) => {
              const cat = categoryConfig[event.category] || categoryConfig['AI Tools'];
              const CatIcon = cat.icon;
              const isRegistered = registeredEvents.includes(event.id);
              return (
                <Link
                  to={`/events/${event.id}`}
                  key={event.id}
                  className={`event-card ${event.type}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Category color accent bar */}
                  <div className="event-card-accent" style={{ background: cat.color }} />

                  <div className="event-card-body">
                    <div className="event-card-top">
                      <div className="event-card-icon" style={{ background: cat.bg, color: cat.color }}>
                        <CatIcon size={20} />
                      </div>
                      <div className="event-card-badges">
                        {isRegistered && <span className="reg-badge">Registered</span>}
                        {event.type === 'free' ? (
                          <span className="type-badge free">FREE</span>
                        ) : (
                          <span className="type-badge paid"><Coins size={12} /> {event.coinCost}</span>
                        )}
                      </div>
                    </div>

                    <h3 className="event-card-title">{event.title}</h3>

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
            })}
          </div>
        )}
      </section>
    </div>
  );
}
