import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Coins, Clock, Users, Bot, Megaphone,
  DollarSign, Scale, Landmark, Sparkles,
  SlidersHorizontal, X, Video, MapPin,
  ChevronLeft, ChevronRight, BookmarkCheck, AlertTriangle,
  CalendarDays, ArrowDownUp, ChevronDown, Check, TrendingUp,
  GraduationCap
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

const typeFilters = [
  { key: 'free', label: 'Free', icon: Sparkles, color: '#059669', bg: '#ECFDF5' },
  { key: 'paid', label: 'Paid', icon: Coins,    color: '#7A6FFA', bg: '#F2F0FF' },
];

const formatFilters = [
  { key: 'virtual',   label: 'Virtual',   icon: Video,  color: '#2563EB', bg: '#EFF6FF' },
  { key: 'in-person', label: 'In-person', icon: MapPin, color: '#DB2777', bg: '#FCE7F3' },
];

const dateFilters = [
  { key: 'this-week',      label: 'This week',     icon: CalendarDays, color: '#7A6FFA', bg: '#F2F0FF' },
  { key: 'next-two-weeks', label: 'Next 2 weeks',  icon: CalendarDays, color: '#7A6FFA', bg: '#F2F0FF' },
  { key: 'later',          label: 'Later',         icon: CalendarDays, color: '#7A6FFA', bg: '#F2F0FF' },
];

const levelFilters = [
  { key: 'beginner',     label: 'Beginner',     icon: GraduationCap, color: '#059669', bg: '#ECFDF5' },
  { key: 'intermediate', label: 'Intermediate', icon: GraduationCap, color: '#D97706', bg: '#FFFBEB' },
  { key: 'advanced',     label: 'Advanced',     icon: GraduationCap, color: '#991B1B', bg: '#FEE2E2' },
];

const sortOptions = [
  { key: 'soonest', label: 'Soonest', icon: CalendarDays },
  { key: 'popular', label: 'Most popular', icon: TrendingUp },
  { key: 'coins',   label: 'Most coins to earn', icon: Coins },
];

function bucketFor(dateStr) {
  const days = Math.floor((new Date(dateStr) - NOW_REF) / MS_PER_DAY);
  if (days < 7)  return { key: 'this-week',     label: 'This week' };
  if (days < 21) return { key: 'next-two-weeks', label: 'Next 2 weeks' };
  return { key: 'later', label: 'Later' };
}

function eventLevel(event) {
  const tags = event.tags || [];
  if (tags.includes('advanced'))     return 'advanced';
  if (tags.includes('intermediate')) return 'intermediate';
  if (tags.includes('beginner'))     return 'beginner';
  return null;
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

/* Generic single-select dropdown for filters with label + options + match counts.
   Set value to 'all' for "no filter" (returns to default). */
function FilterDropdown({ label, options, counts = {}, value, onChange, allLabel = 'Any' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    function onEsc(e)   { if (e.key === 'Escape') setOpen(false); }
    if (open) {
      document.addEventListener('mousedown', onClick);
      document.addEventListener('keydown', onEsc);
    }
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const isActive = value !== 'all';
  const current = options.find(o => o.key === value);
  const triggerColor = current?.color;
  const triggerBg    = current?.bg;
  const TrigIcon     = current?.icon;

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        type="button"
        className={`filter-dropdown-trigger ${isActive ? 'active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={isActive ? { '--chip-color': triggerColor, '--chip-bg': triggerBg } : {}}
      >
        {isActive && TrigIcon ? <TrigIcon size={14} /> : null}
        <span className="filter-dropdown-label">{label}:</span>
        <span className="filter-dropdown-value">{current ? current.label : allLabel}</span>
        <ChevronDown size={14} className={`filter-dropdown-chev ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="filter-dropdown-list" role="listbox">
          <button
            type="button"
            role="option"
            aria-selected={value === 'all'}
            className={`filter-dropdown-item ${value === 'all' ? 'selected' : ''}`}
            onClick={() => { onChange('all'); setOpen(false); }}
          >
            <span>{allLabel}</span>
            {value === 'all' && <Check size={14} className="filter-dropdown-check" />}
          </button>
          {options.map(opt => {
            const Icon = opt.icon;
            const isCurrent = opt.key === value;
            const n = counts[opt.key] ?? 0;
            return (
              <button
                key={opt.key}
                type="button"
                role="option"
                aria-selected={isCurrent}
                className={`filter-dropdown-item ${isCurrent ? 'selected' : ''}`}
                onClick={() => { onChange(isCurrent ? 'all' : opt.key); setOpen(false); }}
                disabled={n === 0 && !isCurrent}
              >
                {Icon && <Icon size={14} style={{ color: opt.color }} />}
                <span>{opt.label}</span>
                {n > 0 && <span className="filter-dropdown-count">{n}</span>}
                {isCurrent && <Check size={14} className="filter-dropdown-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onClick);
      document.addEventListener('keydown', onEsc);
    }
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const current = sortOptions.find(o => o.key === value) || sortOptions[0];

  return (
    <div className="sort-menu" ref={ref}>
      <button
        type="button"
        className="sort-menu-trigger"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <ArrowDownUp size={14} />
        <span className="sort-menu-label">Sort:</span>
        <span className="sort-menu-current">{current.label}</span>
        <ChevronDown size={14} className={`sort-menu-chev ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="sort-menu-list" role="listbox">
          {sortOptions.map(opt => {
            const Icon = opt.icon;
            const isCurrent = opt.key === value;
            return (
              <button
                key={opt.key}
                type="button"
                role="option"
                aria-selected={isCurrent}
                className={`sort-menu-item ${isCurrent ? 'selected' : ''}`}
                onClick={() => { onChange(opt.key); setOpen(false); }}
              >
                <Icon size={14} />
                <span>{opt.label}</span>
                {isCurrent && <Check size={14} className="sort-menu-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, isRegistered }) {
  const cat = categoryConfig[event.category] || categoryConfig['AI Tools'];
  const CatIcon = cat.icon;
  const capacity = getCapacity(event);
  const dateLabel = new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <Link to={`/events/${event.id}`} key={event.id} className={`event-card ${event.type} ${isRegistered ? 'is-registered' : ''}`}>
      <div className="event-card-image">
        {event.image && <img src={event.image} alt="" loading="lazy" />}
        <div className="event-card-image-tint" />
        <div className="event-card-image-cat" style={{ background: cat.bg, color: cat.color }}>
          <CatIcon size={14} />
          <span>{event.category}</span>
        </div>
        <div className="event-card-image-badges">
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
      </div>

      <div className="event-card-body">
        <div className="event-card-datestrip">
          <span className="event-card-when">
            <Clock size={13} strokeWidth={2.2} />
            {dateLabel} &middot; {event.time}
          </span>
          <span className={`format-tag ${event.format}`}>
            {event.format === 'virtual' ? <Video size={12} /> : <MapPin size={12} />}
            {event.format === 'virtual' ? 'Virtual' : event.location}
          </span>
        </div>

        <h3 className="event-card-title">{event.title}</h3>

        {event.description && (
          <p className="event-card-desc">{event.description}</p>
        )}

        <div className="event-card-footer">
          <div className="host-row">
            <div className="host-avatar-sm">{event.host.name.split(' ').map(n => n[0]).join('')}</div>
            <div className="host-info-stack">
              <span className="host-name-sm">{event.host.name}</span>
              <span className="host-role-sm">{event.host.title}</span>
            </div>
          </div>
          <div className="event-card-stats">
            <span className="attendee-pill" title={`${event.attendees} of ${event.maxAttendees} registered`}>
              <Users size={12} /> {event.attendees}
            </span>
            {event.coinsEarned > 0 && (
              <span className="earn-pill" title={`Earn ${event.coinsEarned} Fud Coins`}>
                <Coins size={11} /> +{event.coinsEarned}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function FilterGroup({ label, children }) {
  return (
    <>
      <span className="filter-section-label">{label}</span>
      {children}
      <span className="filter-divider" aria-hidden />
    </>
  );
}

export default function Events() {
  const { registeredEvents } = useUser();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [activeFormat, setActiveFormat] = useState('all');
  const [activeDateRange, setActiveDateRange] = useState('all');
  const [activeLevel, setActiveLevel] = useState('all');
  const [showRegisteredOnly, setShowRegisteredOnly] = useState(false);
  const [sortBy, setSortBy] = useState('soonest');
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

  const upcomingEvents = useMemo(
    () => events.filter(e => new Date(e.date) >= NOW_REF),
    []
  );

  const featuredEvents = useMemo(
    () => upcomingEvents.filter(e => e.featured),
    [upcomingEvents]
  );

  // Per-dimension counts (independent of other filters)
  const counts = useMemo(() => {
    const byType = { free: 0, paid: 0 };
    const byFormat = { virtual: 0, 'in-person': 0 };
    const byDate = { 'this-week': 0, 'next-two-weeks': 0, 'later': 0 };
    const byLevel = { beginner: 0, intermediate: 0, advanced: 0 };
    for (const e of upcomingEvents) {
      if (e.type in byType) byType[e.type]++;
      if (e.format in byFormat) byFormat[e.format]++;
      byDate[bucketFor(e.date).key]++;
      const lvl = eventLevel(e);
      if (lvl && lvl in byLevel) byLevel[lvl]++;
    }
    return { type: byType, format: byFormat, date: byDate, level: byLevel };
  }, [upcomingEvents]);

  const filteredEvents = useMemo(() => {
    return upcomingEvents
      .filter(e => activeType === 'all' || e.type === activeType)
      .filter(e => activeFormat === 'all' || e.format === activeFormat)
      .filter(e => activeDateRange === 'all' || bucketFor(e.date).key === activeDateRange)
      .filter(e => activeLevel === 'all' || eventLevel(e) === activeLevel)
      .filter(e => !showRegisteredOnly || registeredEvents.includes(e.id))
      .filter(e => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.host.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
        );
      });
  }, [upcomingEvents, search, activeType, activeFormat, activeDateRange, activeLevel, showRegisteredOnly, registeredEvents]);

  const sortedEvents = useMemo(() => {
    const arr = [...filteredEvents];
    switch (sortBy) {
      case 'popular':
        arr.sort((a, b) => (b.attendees ?? 0) - (a.attendees ?? 0));
        break;
      case 'coins':
        arr.sort((a, b) => (b.coinsEarned ?? 0) - (a.coinsEarned ?? 0));
        break;
      case 'soonest':
      default:
        arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    return arr;
  }, [filteredEvents, sortBy]);

  // Group by date only when sorting by date AND no explicit date filter
  const showDateGroups = sortBy === 'soonest' && activeDateRange === 'all';

  const groupedEvents = useMemo(() => {
    if (!showDateGroups) return [{ key: 'all', label: '', items: sortedEvents }];
    const groups = { 'this-week': [], 'next-two-weeks': [], 'later': [] };
    for (const e of sortedEvents) groups[bucketFor(e.date).key].push(e);
    return [
      { key: 'this-week',      label: 'This week',     items: groups['this-week'] },
      { key: 'next-two-weeks', label: 'Next 2 weeks',  items: groups['next-two-weeks'] },
      { key: 'later',          label: 'Later',         items: groups['later'] },
    ].filter(g => g.items.length > 0);
  }, [sortedEvents, showDateGroups]);

  // Active filter chips
  const activeFilterChips = [];
  if (search) {
    activeFilterChips.push({ key: 'search', label: `“${search}”`, onRemove: () => setSearch('') });
  }
  if (showRegisteredOnly) {
    activeFilterChips.push({ key: 'reg', label: 'My events', onRemove: () => setShowRegisteredOnly(false) });
  }
  if (activeType !== 'all') {
    activeFilterChips.push({
      key: 'type',
      label: activeType === 'free' ? 'Free' : 'Paid',
      onRemove: () => setActiveType('all'),
    });
  }
  if (activeFormat !== 'all') {
    activeFilterChips.push({
      key: 'format',
      label: activeFormat === 'virtual' ? 'Virtual' : 'In-person',
      onRemove: () => setActiveFormat('all'),
    });
  }
  if (activeDateRange !== 'all') {
    const f = dateFilters.find(d => d.key === activeDateRange);
    activeFilterChips.push({
      key: 'date',
      label: f?.label || 'Date',
      onRemove: () => setActiveDateRange('all'),
    });
  }
  if (activeLevel !== 'all') {
    const f = levelFilters.find(l => l.key === activeLevel);
    activeFilterChips.push({
      key: 'level',
      label: f?.label || 'Level',
      onRemove: () => setActiveLevel('all'),
    });
  }

  const hasFilters = activeFilterChips.length > 0;
  const filterCount = activeFilterChips.length;

  function clearFilters() {
    setSearch('');
    setActiveType('all');
    setActiveFormat('all');
    setActiveDateRange('all');
    setActiveLevel('all');
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
          placeholder="Search events, topics, or hosts"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        {search ? (
          <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">
            <X size={16} />
          </button>
        ) : (
          <kbd className="search-kbd" aria-hidden>/</kbd>
        )}
      </div>

      {/* Sticky filter rail */}
      <div className="events-filters events-filters--sticky animate-in" style={{ animationDelay: '120ms' }}>
        <div className="filter-row filter-row--unified" role="toolbar" aria-label="Event filters">
          {/* My events toggle */}
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

          <FilterDropdown
            label="When"
            options={dateFilters}
            counts={counts.date}
            value={activeDateRange}
            onChange={setActiveDateRange}
          />

          <span className="filter-divider" aria-hidden />

          <FilterDropdown
            label="Type"
            options={typeFilters}
            counts={counts.type}
            value={activeType}
            onChange={setActiveType}
          />

          <span className="filter-divider" aria-hidden />

          <FilterDropdown
            label="Format"
            options={formatFilters}
            counts={counts.format}
            value={activeFormat}
            onChange={setActiveFormat}
          />

          <span className="filter-divider" aria-hidden />

          <FilterDropdown
            label="Level"
            options={levelFilters}
            counts={counts.level}
            value={activeLevel}
            onChange={setActiveLevel}
          />

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

      {/* Active filter summary — always visible when any filter is on */}
      {hasFilters && (
        <div className="active-filter-bar animate-in" style={{ animationDelay: '160ms' }} aria-label="Active filters">
          <span className="active-filter-bar-label">Filtering by</span>
          <div className="active-filter-bar-chips">
            {activeFilterChips.map(c => (
              <button
                key={c.key}
                className="active-filter-chip"
                onClick={c.onRemove}
                aria-label={`Remove filter: ${c.label}`}
              >
                {c.label} <X size={12} />
              </button>
            ))}
          </div>
          <button className="active-filter-bar-clear" onClick={clearFilters}>Clear all</button>
        </div>
      )}

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
                    {event.image && <img src={event.image} alt="" loading="lazy" />}
                    <div className="featured-image-tint" />
                    <div className="featured-image-cat" style={{ background: cat.bg, color: cat.color }}>
                      <CatIcon size={14} />
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
                  </div>
                  <div className="featured-content">
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
        <div className="section-header">
          <div className="section-title-group">
            <h2 className="section-title">{hasFilters ? 'Results' : 'All Upcoming'}</h2>
          </div>
          <div className="section-actions">
            <span className="event-count">{sortedEvents.length} {sortedEvents.length === 1 ? 'event' : 'events'}</span>
            <SortMenu value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="events-empty">
            <div className="events-empty-icon" aria-hidden>
              <SlidersHorizontal size={26} strokeWidth={2} />
            </div>
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
                {showDateGroups && groupedEvents.length > 1 && group.label && (
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
