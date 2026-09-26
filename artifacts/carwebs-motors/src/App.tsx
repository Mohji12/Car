import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  type ChangeEvent as ReactChangeEvent,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Car,
  Check,
  ChevronRight,
  CircleHelp,
  Eye,
  Heart,
  Home,
  LayoutGrid,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import {
  getGetAnalyticsSummaryQueryKey,
  getListVehiclesQueryKey,
  setAuthTokenGetter,
  useCreateVehicle,
  useDeleteVehicle,
  useGetAnalyticsSummary,
  useGetVehicle,
  useListVehicles,
  useParseVehicleDetails,
  useUpdateVehicle,
  type NamedCategory,
  type RunningCosts,
  type Vehicle,
  type VehicleInput,
  type VehiclePatch,
} from '@workspace/api-client-react';
import { sampleVehicles } from '@/data/sample-vehicles';
import { apiUrl } from '@/lib/api';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';

const WHATSAPP = '447533335233';
const WHATSAPP_DISPLAY = '+44 7533 335233';
const PHONE_DISPLAY = '+44 7533 335233';
const PHONE_TEL = '+447533335233';
const EMAIL = 'info@carwebs.co.uk';
const ADMIN_TOKEN_KEY = 'carwebs-admin-token';

const HERO_SLIDE_FILES = [
  'ChatGPT Image Sep 26, 2026, 04_34_35 AM.png',
  'ChatGPT Image Sep 26, 2026, 04_46_01 AM.png',
  'ChatGPT Image Sep 26, 2026, 04_27_57 AM.png',
  'ChatGPT Image Sep 26, 2026, 04_28_46 AM.png',
  'ChatGPT Image Sep 26, 2026, 04_25_52 AM.png',
] as const;

const HERO_SLIDES = HERO_SLIDE_FILES.map((file) => encodeURI(`/${file}`));

const formatPrice = (price: number) => `£${price.toLocaleString('en-GB')}`;
const formatMileage = (mileage: number) => `${mileage.toLocaleString('en-GB')} miles`;
const whatsAppUrl = (vehicles: Vehicle[]) => {
  const refs = vehicles.map((v) => `${v.make} ${v.model} (${v.id.toUpperCase()})`).join(', ');
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hello CarWebs Motors, I'm interested in ${refs}. Could you share availability and next steps?`)}`;
};

const tagLabel = (tag: string) => {
  if (tag === 'new_arrival') return 'New arrival';
  if (tag === 'featured') return 'Featured';
  return tag.replace(/_/g, ' ');
};

function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

setAuthTokenGetter(() => getAdminToken());

function Logo({ full = false }: { full?: boolean }) {
  if (full) return <img className="footer-logo" src="/carwebs-motors-logo-lockup.png" alt="CarWebs Motors Ltd official logo" data-testid="img-official-logo" />;
  return <img className="header-logo" src="/carwebs-motors-logo-lockup.png" alt="CarWebs Motors Ltd" data-testid="img-header-logo" />;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function ScrollToTopOnRouteChange() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location]);
  return null;
}

function Shell({ children, savedCount }: { children: ReactNode; savedCount: number }) {
  const [location, setLocation] = useLocation();
  const isHome = location === '/';
  const tabs = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/inventory', label: 'Inventory', icon: LayoutGrid },
    { href: `/saved`, label: `Saved${savedCount ? ` (${savedCount})` : ''}`, icon: Heart },
  ];
  const goHomeTop = (event: ReactMouseEvent) => {
    event.preventDefault();
    if (location !== '/') setLocation('/');
    scrollToTop();
    requestAnimationFrame(scrollToTop);
  };
  return (
    <div className="app-shell">
      <header className={`topbar ${isHome ? 'home-topbar' : ''}`}>
        <Link href="/" className="brand-link" data-testid="link-brand" onClick={goHomeTop}><Logo /></Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/" className={location === '/' ? 'active' : ''} data-testid="link-nav-home">Showroom</Link>
          <Link href="/inventory" className={location.startsWith('/inventory') ? 'active' : ''} data-testid="link-nav-inventory">Available stock</Link>
          <Link href="/saved" className={location === '/saved' ? 'active' : ''} data-testid="link-nav-saved">Shortlist {savedCount > 0 && `(${savedCount})`}</Link>
          <a className="whatsapp-mini" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" data-testid="link-nav-whatsapp"><MessageCircle size={15} /> WhatsApp</a>
          <Link href="/admin" className="admin-link" data-testid="link-nav-admin">Stock desk</Link>
        </nav>
      </header>
      <main>{children}</main>
      <nav className="bottom-tabs" aria-label="Mobile navigation">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link href={href} className={`bottom-tab ${location === href || (href === '/inventory' && location.startsWith('/inventory')) ? 'active' : ''}`} key={href} data-testid={`link-mobile-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`}>
            <Icon strokeWidth={1.8} /><span>{label}</span>
          </Link>
        ))}
        <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="bottom-tab whatsapp" data-testid="link-mobile-whatsapp"><MessageCircle strokeWidth={1.8} /><span>WhatsApp</span></a>
      </nav>
    </div>
  );
}

function getYoutubeId(url: string): string | null {
  const match =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/) ||
    url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  return match?.[1] ?? null;
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || /s3[.-].*amazonaws\.com/i.test(url);
}

type CardMedia =
  | { kind: 'image'; src: string }
  | { kind: 'video'; src: string; poster?: string; direct: boolean };

function buildCardMedia(vehicle: Vehicle): CardMedia[] {
  const images = (vehicle.images?.length ? vehicle.images : ['/carwebs-motors-logo.jpeg']).map(
    (src): CardMedia => ({ kind: 'image', src }),
  );
  const videoUrl = vehicle.videoUrl?.trim();
  if (!videoUrl) return images;

  const youtubeId = getYoutubeId(videoUrl);
  if (youtubeId) {
    return [
      ...images,
      {
        kind: 'video',
        src: videoUrl,
        poster: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        direct: false,
      },
    ];
  }

  return [
    ...images,
    {
      kind: 'video',
      src: videoUrl,
      poster: images[0]?.kind === 'image' ? images[0].src : undefined,
      direct: isDirectVideoUrl(videoUrl),
    },
  ];
}

function VehicleCard({ vehicle, saved, onToggleSaved, compact = false }: { vehicle: Vehicle; saved: boolean; onToggleSaved: (id: string) => void; compact?: boolean }) {
  const [offset, setOffset] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [swiped, setSwiped] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const media = useMemo(() => buildCardMedia(vehicle), [vehicle]);

  useEffect(() => {
    setMediaIndex(0);
  }, [vehicle.id]);

  useEffect(() => {
    if (media.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setMediaIndex((current) => (current + 1) % media.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [media.length, paused, vehicle.id]);

  const handleTouchStart = (event: ReactTouchEvent<HTMLElement>) => setTouchStart(event.touches[0].clientX);
  const handleTouchMove = (event: ReactTouchEvent<HTMLElement>) => {
    if (touchStart !== null) setOffset(Math.max(0, Math.min(72, event.touches[0].clientX - touchStart)));
  };
  const handleTouchEnd = () => {
    if (offset > 50) { onToggleSaved(vehicle.id); setSwiped(true); }
    setOffset(0); setTouchStart(null);
    window.setTimeout(() => setSwiped(false), 250);
  };
  const badge =
    vehicle.status === 'sold'
      ? 'Sold'
      : vehicle.tags.includes('new_arrival')
        ? 'New arrival'
        : vehicle.featured || vehicle.tags.includes('featured')
          ? 'Selected stock'
          : null;
  const active = media[Math.min(mediaIndex, media.length - 1)];

  return (
    <article
      className={`vehicle-card ${compact ? 'compact-card' : ''}`}
      style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      data-testid={`card-vehicle-${vehicle.id}`}
    >
      <Link href={`/inventory/${vehicle.id}`} onClick={(event) => { if (swiped) event.preventDefault(); }} data-testid={`link-vehicle-${vehicle.id}`}>
        <div className="vehicle-image">
          {media.map((item, index) => {
            const isActive = index === mediaIndex;
            if (item.kind === 'image') {
              return (
                <img
                  key={`img-${vehicle.id}-${item.src}-${index}`}
                  src={item.src}
                  alt={`${vehicle.make} ${vehicle.model} ${vehicle.variant}`}
                  loading="lazy"
                  className={isActive ? 'active' : ''}
                  data-testid={index === 0 ? `img-vehicle-${vehicle.id}` : undefined}
                />
              );
            }
            if (item.direct) {
              return (
                <video
                  key={`vid-${vehicle.id}-${item.src}-${index}`}
                  className={isActive ? 'active' : ''}
                  src={item.src}
                  poster={item.poster}
                  muted
                  playsInline
                  loop
                  autoPlay={isActive}
                  preload="metadata"
                />
              );
            }
            return (
              <div
                key={`vidthumb-${vehicle.id}-${item.src}-${index}`}
                className={`card-video-slide ${isActive ? 'active' : ''}`}
              >
                <img src={item.poster || '/carwebs-motors-logo.jpeg'} alt="" loading="lazy" />
                <span className="card-video-play" aria-hidden="true">▶</span>
              </div>
            );
          })}
          {badge && <div className={`vehicle-badge ${vehicle.status === 'sold' ? 'sold' : ''}`}>{badge}</div>}
          {active?.kind === 'video' && <div className="card-video-badge">Video</div>}
          {media.length > 1 && (
            <div className="card-image-dots" aria-hidden="true">
              {media.map((item, index) => (
                <i key={index} className={`${index === mediaIndex ? 'active' : ''} ${item.kind === 'video' ? 'video-dot' : ''}`} />
              ))}
            </div>
          )}
          <button className={`save-button ${saved ? 'saved' : ''}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onToggleSaved(vehicle.id); }} aria-label={saved ? `Remove ${vehicle.make} ${vehicle.model} from saved` : `Save ${vehicle.make} ${vehicle.model}`} data-testid={`button-save-${vehicle.id}`}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button>
        </div>
        <div className="vehicle-body">
          <h3>{vehicle.make} <span>{vehicle.model}</span></h3>
          <div className="vehicle-meta"><span>{vehicle.year}</span><span>{formatMileage(vehicle.mileage)}</span><span>{vehicle.transmission}</span></div>
          <div className="vehicle-price"><strong>{formatPrice(vehicle.price)}</strong><small>{vehicle.location}</small></div>
        </div>
      </Link>
      <div className="vehicle-card-actions">
        <a
          className="card-action card-action-call"
          href={`tel:${PHONE_TEL}`}
          onClick={(event) => event.stopPropagation()}
          data-testid={`link-call-${vehicle.id}`}
        >
          <Phone size={14} /> Call
        </a>
        <a
          className="card-action card-action-whatsapp"
          href={whatsAppUrl([vehicle])}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          data-testid={`link-whatsapp-${vehicle.id}`}
        >
          <MessageCircle size={14} /> WhatsApp
        </a>
      </div>
    </article>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <Logo full />
          <p>Discover CarWebs: offering top-quality used cars. Visit us today in St Albans.</p>
        </div>
        <div className="footer-links">
          <div>
            <b>Visit</b>
            <span>Miriam Lane off Noke Lane</span>
            <span>St Albans, Hertfordshire AL2 3NY</span>
            <span>Mon–Sun · 10:30–18:00</span>
          </div>
          <div>
            <b>Talk to us</b>
            <a href={`tel:${PHONE_TEL}`}>Call: {PHONE_DISPLAY}</a>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">WhatsApp: {WHATSAPP_DISPLAY}</a>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>CARWEBS MOTORS LTD · EST. 2017</span>
        <span>AUTO TRADER HIGHLY RATED 2018 TILL NOW</span>
      </div>
    </footer>
  );
}

function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (HERO_SLIDES.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="hero-visual hero-slideshow" aria-live="polite">
      {HERO_SLIDES.map((src, slideIndex) => (
        <img
          key={src}
          src={src}
          alt={`CarWebs Motors featured vehicle ${slideIndex + 1}`}
          className={slideIndex === index ? 'active' : ''}
        />
      ))}
      <div className="hero-slide-indicators" role="tablist" aria-label="Slideshow controls">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`hero-slide-indicator ${i === index ? 'active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1} of ${HERO_SLIDES.length}`}
          />
        ))}
      </div>
    </div>
  );
}

function HomePage({ vehicles, savedIds, onToggleSaved }: { vehicles: Vehicle[]; savedIds: string[]; onToggleSaved: (id: string) => void }) {
  const featured = vehicles.filter((vehicle) => vehicle.status === 'available' && (vehicle.featured || vehicle.tags.includes('featured') || vehicle.tags.includes('new_arrival'))).slice(0, 3);
  const [testimonial, setTestimonial] = useState(0);
  const testimonials = [
    { name: 'S Alladi', quote: 'Amazing and genuine people. I purchased a car as a gift for my daughter. Great service, very professional and efficient. Highly recommended. Daughter loves the car — good price, clean compared to other dealers. Staff also friendly and helpful. Thank you.' },
    { name: 'Carly A', quote: 'Very recommended place. Good service — the gentleman that provides service was very friendly and helpful, did show us a few cars and was patient.' },
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">Independent stock / St Albans, UK</div>
          <h1>Find the car<br />you <em>keep</em><br />thinking about.</h1>
          <p>CarWebs offers a curated selection of quality used cars. Enjoy unbeatable deals and exceptional customer service — trusted, transparent, and local in St Albans.</p>
          <div className="hero-actions">
            <Link href="/inventory" className="button button-primary" data-testid="link-hero-inventory">Browse available stock <ArrowRight size={16} /></Link>
            <a href={`tel:${PHONE_TEL}`} className="button button-dark" data-testid="link-hero-call"><Phone size={16} /> Call {PHONE_DISPLAY}</a>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="button button-whatsapp" data-testid="link-hero-whatsapp"><MessageCircle size={16} /> WhatsApp</a>
          </div>
          <div className="hero-note"><strong>01</strong><span>New arrivals checked<br />every weekday</span></div>
        </div>
        <HeroSlideshow />
      </section>
      <section className="build-strip">
        <div><b>The CarWebs standard</b><span>Details that add up</span></div>
        <div><b>12 mo</b><span>Warranty available</span></div>
        <div><b>HPI</b><span>Clear & verified</span></div>
        <div><b>P/X</b><span>Part exchange welcome</span></div>
      </section>
      <section className="home-section">
        <div className="section-head">
          <div><div className="eyebrow">The short list</div><h2>Worth a closer look.</h2></div>
          <Link href="/inventory" className="section-link" data-testid="link-featured-view-all">View all available stock <ArrowRight size={14} /></Link>
        </div>
        <div className="featured-grid">{featured.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} saved={savedIds.includes(vehicle.id)} onToggleSaved={onToggleSaved} />)}</div>
      </section>
      <section className="home-section" style={{ paddingTop: 28 }}>
        <div className="why-grid">
          <div className="why-intro">
            <div className="eyebrow">Why CarWebs</div>
            <h2>Less forecourt.<br />More confidence.</h2>
            <p>Welcome to CarWebs, your trusted destination for quality used vehicles. We take pride in transparency, thorough inspections, and building long-term relationships.</p>
          </div>
          <div className="reasons">
            <div className="reason"><div className="reason-number">01</div><div><h3>Extensive, carefully chosen stock</h3><p>A wide range of vehicles for every need and budget — each one inspected to our standards.</p></div><ChevronRight size={18} /></div>
            <div className="reason"><div className="reason-number">02</div><div><h3>Competitive pricing</h3><p>No hidden fees. Clear numbers, exclusive offers, and part-exchange welcome.</p></div><ChevronRight size={18} /></div>
            <div className="reason"><div className="reason-number">03</div><div><h3>Customer-centric service</h3><p>Friendly staff ready to assist every step of the way — Auto Trader Highly Rated 2018 till now.</p></div><ChevronRight size={18} /></div>
          </div>
        </div>
      </section>
      <section className="home-section features-section">
        <div className="section-head">
          <div><div className="eyebrow">Enjoy</div><h2>Our extra features.</h2></div>
        </div>
        <div className="features-grid">
          <div className="feature-item"><b>Extended warranties</b><p>Peace of mind with warranty options covering you long after purchase — 3, 6, 12 and 24 months.</p></div>
          <div className="feature-item"><b>Specials</b><p>Limited-time offers and promotions on select vehicles for exceptional value.</p></div>
          <div className="feature-item"><b>Flexible pricing</b><p>Personalised pricing tailored to your budget for a seamless buying experience.</p></div>
          <div className="feature-item"><b>Expert car advice</b><p>Guidance from our team to help you make informed decisions about purchase and maintenance.</p></div>
        </div>
      </section>
      <section className="home-section testimonials-section">
        <div className="section-head">
          <div><div className="eyebrow">Our testimonials</div><h2>What our clients say.</h2></div>
          <div className="testimonial-nav">
            <button type="button" onClick={() => setTestimonial((t) => (t - 1 + testimonials.length) % testimonials.length)} aria-label="Previous testimonial"><ArrowLeft size={16} /></button>
            <button type="button" onClick={() => setTestimonial((t) => (t + 1) % testimonials.length)} aria-label="Next testimonial"><ArrowRight size={16} /></button>
          </div>
        </div>
        <blockquote className="testimonial-card">
          <p>{testimonials[testimonial].quote}</p>
          <footer><strong>{testimonials[testimonial].name}</strong><span>Buyer</span></footer>
        </blockquote>
      </section>
      <div className="awards">
        <div className="award"><div className="award-mark">AT</div><div><b>Auto Trader Highly Rated</b><span>Customer service 2018 till now</span></div></div>
        <div className="award"><div className="award-mark">12</div><div><b>Years in the trade</b><span>Local, established, accountable</span></div></div>
        <div className="award"><div className="award-mark"><ShieldCheck size={15} /></div><div><b>Prepared properly</b><span>Every car gets our standard</span></div></div>
      </div>
      <Footer />
    </>
  );
}

function InventoryPage({ vehicles, savedIds, onToggleSaved, loading }: { vehicles: Vehicle[]; savedIds: string[]; onToggleSaved: (id: string) => void; loading: boolean }) {
  const [query, setQuery] = useState('');
  const [make, setMake] = useState('All makes');
  const [body, setBody] = useState('All body types');
  const [fuel, setFuel] = useState('All fuel types');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtered = useMemo(() => vehicles.filter((vehicle) => vehicle.status === 'available' && (!query || `${vehicle.make} ${vehicle.model} ${vehicle.variant}`.toLowerCase().includes(query.toLowerCase())) && (make === 'All makes' || vehicle.make === make) && (body === 'All body types' || vehicle.bodyType === body) && (fuel === 'All fuel types' || vehicle.fuel === fuel)), [vehicles, query, make, body, fuel]);
  const clearFilters = () => { setQuery(''); setMake('All makes'); setBody('All body types'); setFuel('All fuel types'); };
  const makes = ['All makes', ...Array.from(new Set(vehicles.map((v) => v.make)))];
  const bodies = ['All body types', ...Array.from(new Set(vehicles.map((v) => v.bodyType)))];
  const fuels = ['All fuel types', ...Array.from(new Set(vehicles.map((v) => v.fuel)))];

  return (
    <>
      <section className="inventory-header">
        <div className="inventory-header-inner">
          <div><div className="eyebrow" style={{ color: '#e8a33d' }}>The showroom floor</div><h1>Available stock.</h1></div>
          <p>A considered selection of premium, performance and beautifully useful cars. New arrivals appear here first.</p>
        </div>
      </section>
      <div className="inventory-tools">
        <label className="search-box"><Search size={17} color="#69717b" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search make, model or variant" aria-label="Search stock" data-testid="input-inventory-search" /></label>
        <button className={`filter-chip ${filtersOpen || make !== 'All makes' || body !== 'All body types' || fuel !== 'All fuel types' ? 'active' : ''}`} onClick={() => setFiltersOpen((open) => !open)} data-testid="button-open-filters"><SlidersHorizontal size={15} /> Filters</button>
        <span className="stock-count" data-testid="text-stock-count">{filtered.length} vehicles shown</span>
      </div>
      {filtersOpen && (
        <div className="filter-panel">
          <div className="select-field"><label htmlFor="make-filter">Make</label><select id="make-filter" value={make} onChange={(event) => setMake(event.target.value)} data-testid="select-filter-make">{makes.map((option) => <option key={option}>{option}</option>)}</select></div>
          <div className="select-field"><label htmlFor="body-filter">Body type</label><select id="body-filter" value={body} onChange={(event) => setBody(event.target.value)} data-testid="select-filter-body">{bodies.map((option) => <option key={option}>{option}</option>)}</select></div>
          <div className="select-field"><label htmlFor="fuel-filter">Fuel</label><select id="fuel-filter" value={fuel} onChange={(event) => setFuel(event.target.value)} data-testid="select-filter-fuel">{fuels.map((option) => <option key={option}>{option}</option>)}</select></div>
          <button className="button button-outline" onClick={clearFilters} data-testid="button-clear-filters"><X size={14} /> Clear all</button>
        </div>
      )}
      <div className="inventory-content">
        {loading ? (
          <div className="inventory-grid" aria-label="Loading inventory">{[1, 2, 3, 4, 5, 6].map((item) => <div className="vehicle-card" key={item}><div className="vehicle-image skeleton" /><div className="vehicle-body"><div className="skeleton" style={{ height: 21, width: '62%' }} /></div></div>)}</div>
        ) : (
          <div className="inventory-grid">
            {filtered.length ? filtered.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} saved={savedIds.includes(vehicle.id)} onToggleSaved={onToggleSaved} />) : (
              <div className="empty-state" data-testid="empty-inventory"><CircleHelp size={29} /><h3>Nothing matching that brief.</h3><p>Try clearing a filter or searching for another make.</p><button className="button button-outline" onClick={clearFilters}>Reset the search</button></div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function getVideoEmbed(url: string | null | undefined): { kind: 'youtube' | 'vimeo' | 'file'; src: string } | null {
  if (!url?.trim()) return null;
  const value = url.trim();
  const yt =
    value.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/) ||
    value.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (yt?.[1]) {
    return { kind: 'youtube', src: `https://www.youtube.com/embed/${yt[1]}` };
  }
  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo?.[1]) {
    return { kind: 'vimeo', src: `https://player.vimeo.com/video/${vimeo[1]}` };
  }
  return { kind: 'file', src: value };
}

function VehicleDetail({ vehicles, savedIds, onToggleSaved }: { vehicles: Vehicle[]; savedIds: string[]; onToggleSaved: (id: string) => void }) {
  const { id } = useParams<{ id: string }>();
  const { data: fetched, isLoading } = useGetVehicle(id || '');
  const vehicle = fetched ?? vehicles.find((item) => item.id === id);
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    setPhoto(0);
  }, [id]);

  if (isLoading && !vehicle) return <div className="page"><div className="empty-state"><RefreshCw className="spin" size={29} /><h3>Loading vehicle…</h3></div></div>;
  if (!vehicle) return <div className="page"><div className="empty-state"><CircleHelp size={29} /><h3>That vehicle has moved on.</h3><p>The stock record may have just been updated.</p><Link className="button button-primary" href="/inventory">Back to available stock</Link></div></div>;

  const images = vehicle.images?.length ? vehicle.images : ['/carwebs-motors-logo.jpeg'];
  const safePhoto = Math.min(photo, images.length - 1);
  const nextPhoto = (direction: number) => setPhoto((current) => (current + direction + images.length) % images.length);
  const video = getVideoEmbed(vehicle.videoUrl);
  const similar = vehicles.filter((item) => item.status === 'available' && item.id !== vehicle.id && (item.bodyType === vehicle.bodyType || item.make === vehicle.make)).slice(0, 3);
  const overview = [
    { label: 'Make / model', value: `${vehicle.make} ${vehicle.model}` },
    { label: 'Variant', value: vehicle.variant },
    { label: 'Condition', value: vehicle.condition },
    { label: 'Colour', value: vehicle.colour },
    { label: 'Fuel / gearbox', value: `${vehicle.fuel} · ${vehicle.transmission}` },
    { label: 'Doors', value: vehicle.doors != null ? String(vehicle.doors) : '—' },
    { label: 'Engine size', value: vehicle.engineSize || '—' },
    { label: 'Registered', value: vehicle.registrationDate || '—' },
    { label: 'Plate', value: vehicle.registrationPlate || '—' },
    { label: 'Location', value: vehicle.location },
    ...vehicle.specs,
  ];

  return (
    <div className="detail-page">
      <Link href="/inventory" className="back-link" data-testid="link-detail-back"><ArrowLeft size={15} /> Back to available stock</Link>
      <section className="detail-hero">
        <div className="gallery">
          <img key={images[safePhoto]} src={images[safePhoto]} alt={`${vehicle.make} ${vehicle.model}, view ${safePhoto + 1}`} data-testid="img-detail-gallery" />
          {images.length > 1 && (
            <>
              <div className="gallery-controls">
                <button type="button" onClick={() => nextPhoto(-1)} aria-label="Previous image"><ArrowLeft size={16} /></button>
                <button type="button" onClick={() => nextPhoto(1)} aria-label="Next image"><ArrowRight size={16} /></button>
              </div>
              <div className="gallery-dots">{images.map((_, index) => <i className={index === safePhoto ? 'active' : ''} key={index} />)}</div>
            </>
          )}
          <div className="detail-tags">
            {vehicle.status === 'sold' && <span className="tag sold">Sold</span>}
            {vehicle.tags.map((tag) => <span className="tag" key={tag}>{tagLabel(tag)}</span>)}
            {video && <span className="tag">Video</span>}
          </div>
        </div>
        <div className="detail-summary">
          <div className="eyebrow">{vehicle.id.toUpperCase()} / {vehicle.status}</div>
          <h1>{vehicle.make}<span>{vehicle.model}</span></h1>
          <div className="detail-price">{formatPrice(vehicle.price)}</div>
          <p>{vehicle.variant} · {vehicle.year} · {formatMileage(vehicle.mileage)}</p>
          <div className="detail-actions">
            <a className="button button-dark" href={`tel:${PHONE_TEL}`}><Phone size={16} /> Call dealership</a>
            <a className="button button-whatsapp" href={whatsAppUrl([vehicle])} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Enquire about this car</a>
            <button className={`button ${savedIds.includes(vehicle.id) ? 'button-primary' : 'button-outline'}`} onClick={() => onToggleSaved(vehicle.id)}><Heart size={16} fill={savedIds.includes(vehicle.id) ? 'currentColor' : 'none'} /> {savedIds.includes(vehicle.id) ? 'Saved to shortlist' : 'Save to shortlist'}</button>
          </div>
        </div>
      </section>

      {images.length > 1 && (
        <div className="gallery-thumbs" aria-label="Vehicle photo gallery">
          {images.map((url, index) => (
            <button
              type="button"
              key={`${url}-${index}`}
              className={index === safePhoto ? 'active' : ''}
              onClick={() => setPhoto(index)}
            >
              <img src={url} alt={`${vehicle.make} ${vehicle.model} thumbnail ${index + 1}`} />
            </button>
          ))}
        </div>
      )}

      {video && (
        <section className="detail-video-section">
          <div className="section-head">
            <div><div className="eyebrow">Walkaround</div><h2>Watch this car.</h2></div>
          </div>
          <div className="detail-video-frame">
            {video.kind === 'file' ? (
              <video controls playsInline preload="metadata" src={video.src}>
                <track kind="captions" />
              </video>
            ) : (
              <iframe
                title={`${vehicle.make} ${vehicle.model} video`}
                src={video.src}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </section>
      )}

      <section className="spec-layout">
        <div className="vehicle-description-block">
          <h2 className="vehicle-description-title">Description</h2>
          <p className="description vehicle-description-body">{vehicle.description}</p>
          <div className="highlights">{vehicle.highlights.map((highlight) => <span className="highlight" key={highlight}><Check size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />{highlight}</span>)}</div>
        </div>
        <div>
          <div className="eyebrow">Car overview</div>
          <h2>At a glance.</h2>
          <div className="spec-table">{overview.map((spec) => <div className="spec-row" key={spec.label}><span>{spec.label}</span><b>{spec.value}</b></div>)}</div>
        </div>
      </section>

      {nonemptyCategories(vehicle.featureCategories).length > 0 && (
        <section className="detail-accordions">
          <div className="section-head">
            <div><div className="eyebrow">Equipment</div><h2>Features.</h2></div>
          </div>
          {nonemptyCategories(vehicle.featureCategories).map((category) => (
            <details className="detail-accordion" key={`feature-${category.name}`}>
              <summary>
                <span>{category.name}</span>
                <span className="count-badge">{category.items.length}</span>
              </summary>
              <ul>
                {category.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      )}

      {nonemptyCategories(vehicle.specCategories).length > 0 && (
        <section className="detail-accordions">
          <div className="section-head">
            <div><div className="eyebrow">Technical</div><h2>Spec.</h2></div>
          </div>
          {nonemptyCategories(vehicle.specCategories).map((category) => (
            <details className="detail-accordion" key={`spec-${category.name}`}>
              <summary>
                <span>{category.name}</span>
                <span className="count-badge">{category.items.length}</span>
              </summary>
              <ul>
                {category.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      )}

      {vehicle.runningCosts &&
        (vehicle.runningCosts.mpgUrban != null ||
          vehicle.runningCosts.mpgExtraUrban != null ||
          vehicle.runningCosts.mpgAverage != null ||
          vehicle.runningCosts.roadTaxPerYear != null) && (
        <section className="running-costs">
          <div className="section-head">
            <div><div className="eyebrow">Ownership</div><h2>Running costs.</h2></div>
          </div>
          <p className="running-costs-intro">
            Get an idea of how much this vehicle might cost to run including miles per gallon and road tax.
          </p>
          {(vehicle.runningCosts.mpgAverage != null ||
            vehicle.runningCosts.mpgUrban != null ||
            vehicle.runningCosts.mpgExtraUrban != null) && (
            <div className="running-costs-block">
              <h3>Miles per gallon (MPG)</h3>
              {vehicle.runningCosts.mpgAverage != null && (
                <div className="running-costs-hero">{vehicle.runningCosts.mpgAverage}mpg</div>
              )}
              <p className="running-costs-note">
                A vehicle’s MPG can vary depending on where you usually drive it. Here’s what you can expect from this vehicle on different roads.
              </p>
              <div className="running-costs-rows">
                {vehicle.runningCosts.mpgUrban != null && (
                  <div>
                    <span>Urban</span>
                    <b>{vehicle.runningCosts.mpgUrban}mpg</b>
                    <small>Driving around towns and cities</small>
                  </div>
                )}
                {vehicle.runningCosts.mpgExtraUrban != null && (
                  <div>
                    <span>Extra Urban</span>
                    <b>{vehicle.runningCosts.mpgExtraUrban}mpg</b>
                    <small>Driving in towns and on faster A-roads</small>
                  </div>
                )}
                {vehicle.runningCosts.mpgAverage != null && (
                  <div>
                    <span>Average</span>
                    <b>{vehicle.runningCosts.mpgAverage}mpg</b>
                    <small>Urban and extra urban combined</small>
                  </div>
                )}
              </div>
            </div>
          )}
          {vehicle.runningCosts.roadTaxPerYear != null && (
            <div className="running-costs-block">
              <h3>Road tax per year</h3>
              <div className="running-costs-hero">£{vehicle.runningCosts.roadTaxPerYear}</div>
            </div>
          )}
        </section>
      )}

      {similar.length > 0 && (
        <section className="similar-section">
          <div className="section-head">
            <div><div className="eyebrow">Keep looking</div><h2>Similar in the showroom.</h2></div>
            <Link className="section-link" href="/inventory">See all stock <ArrowRight size={14} /></Link>
          </div>
          <div className="inventory-grid similar-grid">{similar.map((item) => <VehicleCard key={item.id} vehicle={item} saved={savedIds.includes(item.id)} onToggleSaved={onToggleSaved} />)}</div>
        </section>
      )}
    </div>
  );
}

function SavedPage({ vehicles, savedIds, onToggleSaved }: { vehicles: Vehicle[]; savedIds: string[]; onToggleSaved: (id: string) => void }) {
  const saved = vehicles.filter((vehicle) => savedIds.includes(vehicle.id));
  return (
    <>
      <section className="saved-header">
        <div className="saved-header-inner">
          <div><div className="eyebrow">Your considered options</div><h1>Shortlist.</h1></div>
          <p>Keep a few cars close while you decide what deserves a visit.</p>
        </div>
      </section>
      <div className="saved-content">
        {saved.length > 0 ? (
          <>
            <div className="saved-cta">
              <p><b>{saved.length} {saved.length === 1 ? 'car' : 'cars'} saved.</b><span>Send the whole shortlist to our team in one message.</span></p>
              <div className="saved-cta-actions">
                <a className="button button-dark button-small" href={`tel:${PHONE_TEL}`}><Phone size={15} /> Call</a>
                <a className="button button-whatsapp button-small" href={whatsAppUrl(saved)} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Enquire on WhatsApp</a>
              </div>
            </div>
            <div className="saved-list">{saved.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} saved onToggleSaved={onToggleSaved} />)}</div>
          </>
        ) : (
          <div className="empty-state"><Heart size={29} /><h3>Your shortlist is waiting.</h3><p>Tap the heart on any car that catches your eye.</p><Link href="/inventory" className="button button-primary">Browse the showroom</Link></div>
        )}
      </div>
    </>
  );
}

const DEFAULT_FEATURE_CATEGORIES: NamedCategory[] = [
  { name: 'Audio and Communications', items: [] },
  { name: 'Drivers Assistance', items: [] },
  { name: 'Exterior', items: [] },
  { name: 'Illumination', items: [] },
  { name: 'Interior', items: [] },
  { name: 'Performance', items: [] },
  { name: 'Safety and Security', items: [] },
];

const DEFAULT_SPEC_CATEGORIES: NamedCategory[] = [
  { name: 'Performance', items: [] },
  { name: 'Size and dimensions', items: [] },
];

const emptyRunningCosts = (): RunningCosts => ({
  mpgUrban: null,
  mpgExtraUrban: null,
  mpgAverage: null,
  roadTaxPerYear: null,
});

function nonemptyCategories(categories: NamedCategory[] | undefined | null): NamedCategory[] {
  return (categories || []).filter((category) => category.name.trim() && category.items.some((item) => item.trim()));
}

function CategoryEditor({
  title,
  categories,
  onChange,
}: {
  title: string;
  categories: NamedCategory[];
  onChange: (next: NamedCategory[]) => void;
}) {
  return (
    <div className="admin-category-block">
      <h3>{title}</h3>
      {categories.map((category, index) => (
        <details className="admin-category" key={`${category.name}-${index}`} open={index === 0}>
          <summary>
            <input
              className="admin-input admin-category-name"
              value={category.name}
              onChange={(event) => {
                const next = [...categories];
                next[index] = { ...category, name: event.target.value };
                onChange(next);
              }}
              onClick={(event) => event.stopPropagation()}
            />
            <span className="count-badge">{category.items.filter(Boolean).length}</span>
          </summary>
          <textarea
            className="admin-input"
            rows={Math.max(4, category.items.length + 1)}
            placeholder="One item per line"
            value={category.items.join('\n')}
            onChange={(event) => {
              const next = [...categories];
              next[index] = {
                ...category,
                items: event.target.value.split('\n').map((line) => line.trimEnd()),
              };
              onChange(next);
            }}
          />
          <button
            type="button"
            className="button button-outline button-small"
            onClick={() => onChange(categories.filter((_, i) => i !== index))}
          >
            Remove category
          </button>
        </details>
      ))}
      <button
        type="button"
        className="button button-outline button-small"
        onClick={() => onChange([...categories, { name: 'New category', items: [] }])}
      >
        Add category
      </button>
    </div>
  );
}

const emptyForm = (): VehicleInput => ({
  make: '',
  model: '',
  variant: '',
  year: new Date().getFullYear(),
  price: 0,
  mileage: 0,
  fuel: 'Petrol',
  transmission: 'Manual',
  bodyType: 'Hatchback',
  colour: '',
  location: 'St Albans',
  status: 'available',
  tags: [],
  featured: false,
  description: '',
  highlights: [],
  specs: [],
  images: [],
  condition: 'Used',
  doors: 5,
  engineSize: '',
  registrationDate: '',
  registrationPlate: '',
  videoUrl: '',
  featureCategories: DEFAULT_FEATURE_CATEGORIES.map((item) => ({ ...item, items: [] })),
  specCategories: DEFAULT_SPEC_CATEGORIES.map((item) => ({ ...item, items: [] })),
  runningCosts: emptyRunningCosts(),
});

function AdminPage() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => getAdminToken() || '');
  const [authed, setAuthed] = useState(() => Boolean(getAdminToken()));
  const [loginError, setLoginError] = useState('');
  const [adminView, setAdminView] = useState<'analytics' | 'add' | 'manage'>('analytics');
  const [statusFilter, setStatusFilter] = useState<'available' | 'sold'>('available');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleInput>(emptyForm());
  const [highlightText, setHighlightText] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [extractText, setExtractText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractReady, setExtractReady] = useState(false);

  const { data: apiVehicles, refetch } = useListVehicles(undefined, {
    query: {
      queryKey: getListVehiclesQueryKey(),
      placeholderData: sampleVehicles as Vehicle[],
    },
  });
  const vehicles = apiVehicles?.length ? apiVehicles : (sampleVehicles as Vehicle[]);
  const { data: analytics } = useGetAnalyticsSummary({
    query: { enabled: authed, queryKey: getGetAnalyticsSummaryQueryKey() },
  });
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();
  const parseMutation = useParseVehicleDetails();

  const listed = vehicles.filter((vehicle) => vehicle.status === statusFilter);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: getListVehiclesQueryKey() });
    await queryClient.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() });
    await refetch();
  };

  const login = () => {
    if (!token.trim()) {
      setLoginError('Enter the admin token');
      return;
    }
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token.trim());
    setAuthTokenGetter(() => getAdminToken());
    setAuthed(true);
    setLoginError('');
  };

  const logout = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setAuthTokenGetter(() => null);
    setAuthed(false);
  };

  const startNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setHighlightText('');
    setPasteText('');
    setFormMessage('');
    setExtractText('');
    setExtractReady(false);
    setAdminView('add');
  };

  const startEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setForm({
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.variant,
      year: vehicle.year,
      price: vehicle.price,
      mileage: vehicle.mileage,
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      bodyType: vehicle.bodyType,
      colour: vehicle.colour,
      location: vehicle.location,
      status: vehicle.status,
      tags: vehicle.tags,
      featured: vehicle.featured,
      description: vehicle.description,
      highlights: vehicle.highlights,
      specs: vehicle.specs,
      images: vehicle.images,
      condition: vehicle.condition,
      doors: vehicle.doors,
      engineSize: vehicle.engineSize,
      registrationDate: vehicle.registrationDate,
      registrationPlate: vehicle.registrationPlate,
      videoUrl: vehicle.videoUrl,
      featureCategories: vehicle.featureCategories?.length
        ? vehicle.featureCategories
        : DEFAULT_FEATURE_CATEGORIES.map((item) => ({ ...item, items: [] })),
      specCategories: vehicle.specCategories?.length
        ? vehicle.specCategories
        : DEFAULT_SPEC_CATEGORIES.map((item) => ({ ...item, items: [] })),
      runningCosts: vehicle.runningCosts || emptyRunningCosts(),
    });
    setHighlightText(vehicle.highlights.join(', '));
    setPasteText('');
    setFormMessage('');
    setExtractText('');
    setExtractReady(false);
    setAdminView('add');
  };

  const toggleTag = (tag: string) => {
    const tags = form.tags ?? [];
    setForm({
      ...form,
      tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
      featured: tag === 'featured' ? !tags.includes(tag) : form.featured,
    });
  };

  const save = async () => {
    const featureCategories = (form.featureCategories || [])
      .map((category) => ({
        name: category.name.trim(),
        items: category.items.map((item) => item.trim()).filter(Boolean),
      }))
      .filter((category) => category.name);
    const specCategories = (form.specCategories || [])
      .map((category) => ({
        name: category.name.trim(),
        items: category.items.map((item) => item.trim()).filter(Boolean),
      }))
      .filter((category) => category.name);
    const costs = form.runningCosts || emptyRunningCosts();
    const runningCosts: RunningCosts | null =
      costs.mpgUrban == null &&
      costs.mpgExtraUrban == null &&
      costs.mpgAverage == null &&
      costs.roadTaxPerYear == null
        ? null
        : costs;

    const payload: VehicleInput = {
      ...form,
      highlights: highlightText.split(',').map((h) => h.trim()).filter(Boolean),
      featured: Boolean(form.featured || form.tags?.includes('featured')),
      videoUrl: form.videoUrl?.trim() || null,
      featureCategories,
      specCategories,
      runningCosts,
    };
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: payload as VehiclePatch });
      setFormMessage('Listing updated. You can upload images or video below.');
    } else {
      const created = await createMutation.mutateAsync({ data: payload });
      setEditingId(created.id);
      setForm((current) => ({
        ...current,
        images: created.images,
        videoUrl: created.videoUrl,
        featureCategories: created.featureCategories,
        specCategories: created.specCategories,
        runningCosts: created.runningCosts || emptyRunningCosts(),
      }));
      setFormMessage('Listing published. Now upload images or a video for this car.');
    }
    setExtractReady(false);
    await invalidate();
  };

  const extractFromText = async () => {
    if (extractText.trim().length < 10) {
      setFormMessage('Paste more listing details before extracting.');
      return;
    }
    setExtracting(true);
    setFormMessage('');
    try {
      const response = await fetch(apiUrl('/api/vehicles/extract'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAdminToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractText }),
      });
      const payload = await response.json().catch(() => ({})) as { message?: string } & Partial<VehicleInput>;
      if (!response.ok) {
        throw new Error(payload.message || 'Extract failed');
      }
      setForm((current) => ({
        ...current,
        make: payload.make || current.make,
        model: payload.model || current.model,
        variant: payload.variant ?? current.variant,
        year: typeof payload.year === 'number' ? payload.year : current.year,
        price: typeof payload.price === 'number' ? payload.price : current.price,
        mileage: typeof payload.mileage === 'number' ? payload.mileage : current.mileage,
        fuel: payload.fuel || current.fuel,
        transmission: payload.transmission || current.transmission,
        bodyType: payload.bodyType || current.bodyType,
        colour: payload.colour || current.colour,
        location: payload.location || current.location || 'St Albans',
        status: payload.status === 'sold' ? 'sold' : 'available',
        tags: payload.tags ?? current.tags,
        featured: Boolean(payload.featured),
        description: payload.description || current.description,
        highlights: payload.highlights ?? current.highlights,
        specs: payload.specs ?? current.specs,
        condition: payload.condition || current.condition || 'Used',
        doors: payload.doors ?? current.doors,
        engineSize: payload.engineSize ?? current.engineSize,
        registrationDate: payload.registrationDate ?? current.registrationDate,
        registrationPlate: payload.registrationPlate ?? current.registrationPlate,
      }));
      setHighlightText((payload.highlights || []).join(', '));
      setExtractReady(true);
      setFormMessage('Details extracted. Review the fields below, then Publish to add to the site.');
    } catch (error) {
      setExtractReady(false);
      setFormMessage(error instanceof Error ? error.message : 'Extract failed.');
    } finally {
      setExtracting(false);
    }
  };

  const parsePastedDetails = async () => {
    if (!pasteText.trim()) {
      setFormMessage('Paste the full listing text first.');
      return;
    }
    setFormMessage('Parsing with Gemini…');
    try {
      const parsed = await parseMutation.mutateAsync({ data: { text: pasteText } });
      setForm((current) => ({
        ...current,
        featureCategories: parsed.featureCategories.length
          ? parsed.featureCategories
          : current.featureCategories,
        specCategories: parsed.specCategories.length
          ? parsed.specCategories
          : current.specCategories,
        runningCosts: parsed.runningCosts || current.runningCosts || emptyRunningCosts(),
      }));
      setFormMessage('Gemini filled Features, Spec, and Running costs. Review, then save.');
    } catch {
      setFormMessage('Gemini parse failed. Check GEMINI_API_KEY on the API server.');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this listing?')) return;
    await deleteMutation.mutateAsync({ id });
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm());
      setHighlightText('');
      setFormMessage('');
    }
    await invalidate();
  };

  const MAX_IMAGES = 12;

  const uploadImages = async (files: FileList | File[] | null) => {
    if (!editingId) {
      setFormMessage('Save the listing first, then upload images.');
      return;
    }
    const remaining = Math.max(0, MAX_IMAGES - (form.images?.length || 0));
    if (remaining === 0) {
      setFormMessage(`This car already has ${MAX_IMAGES} images. Remove some to add more.`);
      return;
    }
    const selected = Array.from(files || []).filter((file) => file.type.startsWith('image/'));
    if (!selected.length) {
      setFormMessage('No image files selected. Choose JPG, PNG, or WebP photos.');
      return;
    }
    const batch = selected.slice(0, remaining);
    const skipped = selected.length - batch.length;
    setUploading(true);
    setFormMessage(`Uploading ${batch.length} image${batch.length === 1 ? '' : 's'}…`);
    try {
      const body = new FormData();
      batch.forEach((file) => body.append('files', file));
      const response = await fetch(apiUrl(`/api/vehicles/${editingId}/images`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAdminToken()}` },
        body,
      });
      const payload = await response.json().catch(() => ({})) as Vehicle & { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Upload failed');
      setForm((current) => ({ ...current, images: payload.images }));
      setFormMessage(
        skipped > 0
          ? `Uploaded ${batch.length} image${batch.length === 1 ? '' : 's'}. ${skipped} skipped (max ${MAX_IMAGES}).`
          : `Images uploaded (${payload.images?.length ?? 0} total).`,
      );      await invalidate();
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const onImagePickerChange = (event: ReactChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    void uploadImages(files);
    event.target.value = '';
  };

  const onImageDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (uploading || !editingId) return;
    void uploadImages(event.dataTransfer.files);
  };

  const uploadVideo = async (files: FileList | null) => {
    if (!files?.length || !editingId) {
      setFormMessage('Save the listing first, then upload a video.');
      return;
    }
    setUploading(true);
    setFormMessage('');
    try {
      const body = new FormData();
      body.append('file', files[0]);
      const response = await fetch(apiUrl(`/api/vehicles/${editingId}/video`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAdminToken()}` },
        body,
      });
      const payload = await response.json().catch(() => ({})) as Vehicle & { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Upload failed');
      setForm((current) => ({ ...current, videoUrl: payload.videoUrl }));
      setFormMessage('Video uploaded to S3.');
      await invalidate();
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Video upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (!authed) {
    return (
      <div className="admin-page">
        <div className="admin-top">
          <div><div className="eyebrow">Internal / stock desk</div><h1>Admin login.</h1></div>
          <p>Enter the shared admin token to manage listings and analytics.</p>
        </div>
        <div className="admin-login">
          <input className="admin-input" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ADMIN_TOKEN" data-testid="input-admin-token" />
          <button className="button button-primary" onClick={login} data-testid="button-admin-login">Sign in</button>
          {loginError && <p className="admin-error">{loginError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-top">
        <div>
          <div className="eyebrow">Internal / stock desk</div>
          <h1>
            {adminView === 'analytics' && 'Analytics.'}
            {adminView === 'add' && (editingId ? 'Edit car.' : 'Add car.')}
            {adminView === 'manage' && 'Manage cars.'}
          </h1>
        </div>
        <p>
          {adminView === 'analytics' && 'Track stock performance, views, and recent activity.'}
          {adminView === 'add' && 'Enter car details, then upload images or add a video.'}
          {adminView === 'manage' && 'Browse, edit, or delete existing stock listings.'}
        </p>
        <button className="button button-outline button-small" onClick={logout}>Sign out</button>
      </div>

      <div className="admin-main-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={adminView === 'analytics'}
          className={adminView === 'analytics' ? 'active' : ''}
          onClick={() => setAdminView('analytics')}
        >
          <BarChart3 size={16} /> Analytics
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={adminView === 'add'}
          className={adminView === 'add' ? 'active' : ''}
          onClick={startNew}
        >
          <Plus size={16} /> Add car
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={adminView === 'manage'}
          className={adminView === 'manage' ? 'active' : ''}
          onClick={() => setAdminView('manage')}
        >
          <Car size={16} /> Manage cars
        </button>
      </div>

      {adminView === 'analytics' && (
        <div className="admin-analytics-view">
          <div className="analytics-strip">
            <div><b>{analytics?.total ?? vehicles.length}</b><span>Total listings</span></div>
            <div><b>{analytics?.available ?? vehicles.filter((v) => v.status === 'available').length}</b><span>Available</span></div>
            <div><b>{analytics?.sold ?? vehicles.filter((v) => v.status === 'sold').length}</b><span>Sold</span></div>
            <div><b>{analytics?.newArrival ?? 0}</b><span>New arrivals</span></div>
            <div><b>{analytics?.featured ?? 0}</b><span>Featured</span></div>
            <div><b>{analytics?.totalViews ?? 0}</b><span>Total views</span></div>
          </div>

          <div className="admin-analytics-grid">
            <section className="admin-panel">
              <div className="eyebrow">Performance</div>
              <h2>Top viewed</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Vehicle</th><th>Status</th><th>Views</th></tr></thead>
                  <tbody>
                    {(analytics?.topViewed?.length ? analytics.topViewed : [...vehicles].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5)).map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td><b>{vehicle.make} {vehicle.model}</b><div className="eyebrow">{vehicle.id}</div></td>
                        <td>{vehicle.status}</td>
                        <td>{vehicle.viewCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="admin-panel">
              <div className="eyebrow">Latest stock</div>
              <h2>Recent listings</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Vehicle</th><th>Price</th><th>Added</th></tr></thead>
                  <tbody>
                    {(analytics?.recent?.length ? analytics.recent : vehicles.slice(0, 5)).map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td><b>{vehicle.make} {vehicle.model}</b></td>
                        <td>{formatPrice(vehicle.price)}</td>
                        <td>{new Date(vehicle.addedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="button button-primary button-small admin-panel-cta" onClick={startNew}>
                <Plus size={14} /> Add a car
              </button>
            </section>
          </div>
        </div>
      )}

      {adminView === 'manage' && (
        <div className="admin-manage-view">
          <div className="admin-tabs">
            <button type="button" className={statusFilter === 'available' ? 'active' : ''} onClick={() => setStatusFilter('available')}>Available ({vehicles.filter((v) => v.status === 'available').length})</button>
            <button type="button" className={statusFilter === 'sold' ? 'active' : ''} onClick={() => setStatusFilter('sold')}>Sold ({vehicles.filter((v) => v.status === 'sold').length})</button>
            <button type="button" className="button button-primary button-small" onClick={startNew}><Plus size={14} /> Add car</button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Preview</th><th>Vehicle</th><th>Price</th><th>Tags</th><th>Views</th><th>Actions</th></tr></thead>
              <tbody>
                {listed.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td><img className="admin-thumb" src={vehicle.images[0] || '/carwebs-motors-logo.jpeg'} alt="" /></td>
                    <td><b>{vehicle.make} {vehicle.model}</b><div className="eyebrow">{vehicle.id}</div></td>
                    <td>{formatPrice(vehicle.price)}</td>
                    <td>{vehicle.tags.map(tagLabel).join(', ') || '—'}</td>
                    <td>{vehicle.viewCount}</td>
                    <td className="admin-actions">
                      <button type="button" onClick={() => startEdit(vehicle)} aria-label={`Edit ${vehicle.id}`}><Pencil size={14} /></button>
                      <Link href={`/inventory/${vehicle.id}`} aria-label={`Open ${vehicle.id}`}><Eye size={14} /></Link>
                      <button type="button" onClick={() => remove(vehicle.id)} aria-label={`Delete ${vehicle.id}`}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminView === 'add' && (
        <form className="admin-form admin-form-solo" onSubmit={(e) => { e.preventDefault(); void save(); }}>
          <div className="eyebrow">{editingId ? `Editing ${editingId}` : 'Create listing'}</div>
          <h2>{editingId ? 'Update vehicle' : 'List a car'}</h2>

          {!editingId && (
            <div className="admin-extract-block">
              <div className="eyebrow">Gemini / extract</div>
              <h3>Paste listing details</h3>
              <p className="admin-media-hint">
                Drop in a dealer blurb or notes. Gemini fills the form — review everything, then Publish to add it to the site.
              </p>
              <label className="admin-full">
                Free-text details
                <textarea
                  className="admin-input"
                  rows={6}
                  value={extractText}
                  onChange={(e) => setExtractText(e.target.value)}
                  placeholder="e.g. 2020 Audi A3 S line, Mythos Black, 32,400 miles, £18,995, full service history, 1 owner, virtual cockpit…"
                  data-testid="input-ai-extract"
                />
              </label>
              <div className="admin-form-actions">
                <button
                  type="button"
                  className="button button-dark"
                  disabled={extracting}
                  onClick={() => void extractFromText()}
                  data-testid="button-ai-extract"
                >
                  {extracting ? 'Extracting…' : 'Extract details'}
                </button>
              </div>
              {extractReady && (
                <p className="admin-extract-banner" data-testid="banner-ai-review">
                  Review the fields below, then Publish to add to the site.
                </p>
              )}
            </div>
          )}

          <div className="admin-form-grid">
            <label>Make<input className="admin-input" required value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} /></label>
            <label>Model<input className="admin-input" required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></label>
            <label>Variant<input className="admin-input" value={form.variant || ''} onChange={(e) => setForm({ ...form, variant: e.target.value })} /></label>
            <label>Year<input className="admin-input" type="number" required value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></label>
            <label>Price (£)<input className="admin-input" type="number" required value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })} /></label>
            <label>Mileage<input className="admin-input" type="number" required value={form.mileage || ''} onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) || 0 })} /></label>
            <label>Fuel<input className="admin-input" value={form.fuel} onChange={(e) => setForm({ ...form, fuel: e.target.value })} /></label>
            <label>Transmission<input className="admin-input" value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })} /></label>
            <label>Body type<input className="admin-input" value={form.bodyType} onChange={(e) => setForm({ ...form, bodyType: e.target.value })} /></label>
            <label>Colour<input className="admin-input" value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} /></label>
            <label>Condition<input className="admin-input" value={form.condition || 'Used'} onChange={(e) => setForm({ ...form, condition: e.target.value })} /></label>
            <label>Doors<input className="admin-input" type="number" value={form.doors ?? ''} onChange={(e) => setForm({ ...form, doors: e.target.value === '' ? null : Number(e.target.value) })} /></label>
            <label>Engine size<input className="admin-input" value={form.engineSize || ''} onChange={(e) => setForm({ ...form, engineSize: e.target.value })} /></label>
            <label>Reg date<input className="admin-input" value={form.registrationDate || ''} onChange={(e) => setForm({ ...form, registrationDate: e.target.value })} /></label>
            <label>Plate<input className="admin-input" value={form.registrationPlate || ''} onChange={(e) => setForm({ ...form, registrationPlate: e.target.value })} /></label>
            <label>Location<input className="admin-input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
            <label>Status
              <select className="admin-input" value={form.status || 'available'} onChange={(e) => setForm({ ...form, status: e.target.value as 'available' | 'sold' })}>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </label>
          </div>
          <div className="tag-toggles">
            <button type="button" className={(form.tags || []).includes('new_arrival') ? 'active' : ''} onClick={() => toggleTag('new_arrival')}>New arrival</button>
            <button type="button" className={(form.tags || []).includes('featured') ? 'active' : ''} onClick={() => toggleTag('featured')}>Featured</button>
          </div>
          <label className="admin-full">Description<textarea className="admin-input" rows={4} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="admin-full">Highlights (comma separated)<input className="admin-input" value={highlightText} onChange={(e) => setHighlightText(e.target.value)} /></label>

          <div className="admin-details-block">
            <div className="eyebrow">Structured details</div>
            <h3>Features, Spec & running costs</h3>
            <p className="admin-media-hint">
              Paste the full listing text once and let Gemini split it, or edit the categories manually below.
            </p>
            <label className="admin-full">
              Paste full listing text
              <textarea
                className="admin-input"
                rows={8}
                placeholder="Paste Features, Spec, Running costs text here…"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="button button-primary button-small"
              disabled={parseMutation.isPending || !pasteText.trim()}
              onClick={() => void parsePastedDetails()}
            >
              {parseMutation.isPending ? 'Parsing…' : 'Parse with Gemini'}
            </button>

            <CategoryEditor
              title="Features"
              categories={form.featureCategories || []}
              onChange={(featureCategories) => setForm({ ...form, featureCategories })}
            />
            <CategoryEditor
              title="Spec"
              categories={form.specCategories || []}
              onChange={(specCategories) => setForm({ ...form, specCategories })}
            />

            <div className="admin-running-costs">
              <h3>Running costs</h3>
              <div className="admin-grid">
                <label>
                  Urban MPG
                  <input
                    className="admin-input"
                    type="number"
                    step="0.1"
                    value={form.runningCosts?.mpgUrban ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        runningCosts: {
                          ...(form.runningCosts || emptyRunningCosts()),
                          mpgUrban: e.target.value === '' ? null : Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Extra Urban MPG
                  <input
                    className="admin-input"
                    type="number"
                    step="0.1"
                    value={form.runningCosts?.mpgExtraUrban ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        runningCosts: {
                          ...(form.runningCosts || emptyRunningCosts()),
                          mpgExtraUrban: e.target.value === '' ? null : Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Average MPG
                  <input
                    className="admin-input"
                    type="number"
                    step="0.1"
                    value={form.runningCosts?.mpgAverage ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        runningCosts: {
                          ...(form.runningCosts || emptyRunningCosts()),
                          mpgAverage: e.target.value === '' ? null : Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Road tax £ / year
                  <input
                    className="admin-input"
                    type="number"
                    step="1"
                    value={form.runningCosts?.roadTaxPerYear ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        runningCosts: {
                          ...(form.runningCosts || emptyRunningCosts()),
                          roadTaxPerYear: e.target.value === '' ? null : Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
              </div>
            </div>
          </div>

            <div className="admin-media-block">
            <div className="eyebrow"><Video size={12} /> Media</div>
            <h3>Images & video</h3>
            <p className="admin-media-hint">
              Dump all photos for this car in one go (up to {MAX_IMAGES} total) — multi-select in the file picker or drag a whole batch onto the drop zone.
              Publish the listing first, then upload. One video file or a YouTube/Vimeo link anytime.
            </p>
            <label className="admin-full">Video link (YouTube / Vimeo / direct MP4)
              <input className="admin-input" placeholder="https://..." value={form.videoUrl || ''} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
            </label>
            {form.videoUrl ? (
              <a className="admin-video-link" href={form.videoUrl} target="_blank" rel="noreferrer">Open current video</a>
            ) : null}
            <div
              className={`admin-dropzone ${uploading ? 'is-busy' : ''} ${!editingId ? 'is-disabled' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onDrop={onImageDrop}
            >
              <strong>Drop all car photos here</strong>
              <span>Or click below and multi-select every image at once (Ctrl/Cmd + click, or Shift + click).</span>
              <div className="admin-media-actions">
                <label className="admin-file-btn">
                  Select all photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading || !editingId}
                    onChange={onImagePickerChange}
                  />
                </label>
                <label className="admin-file-btn">
                  Upload video file
                  <input
                    type="file"
                    accept="video/*"
                    disabled={uploading || !editingId}
                    onChange={(e) => {
                      void uploadVideo(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
            {!editingId && <p className="admin-note">Save the car details first to enable image/video file uploads.</p>}
            {(form.images || []).length > 0 && (
              <div className="admin-image-list">
                {(form.images || []).map((url) => (
                  <div key={url} className="admin-image-item">
                    <img src={url} alt="" />
                    <button type="button" onClick={() => setForm({ ...form, images: (form.images || []).filter((item) => item !== url) })}>Remove</button>
                  </div>
                ))}
              </div>
            )}
            {(form.images || []).length > 0 && (
              <p className="admin-note">
                {(form.images || []).length} / {MAX_IMAGES} images attached.
                {' '}
                You can dump more in another batch anytime.
              </p>
            )}
          </div>

          {formMessage && <p className="admin-form-message">{formMessage}</p>}
          <div className="admin-form-actions">
            <button className="button button-primary" type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading || parseMutation.isPending}>
              {editingId ? 'Save changes' : 'Publish listing'}
            </button>
            {editingId && (
              <button type="button" className="button button-outline" onClick={() => setAdminView('manage')}>
                Back to manage
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function RouterContent({ savedIds, onToggleSaved }: { savedIds: string[]; onToggleSaved: (id: string) => void }) {
  const { data: apiVehicles, isLoading, isError } = useListVehicles(undefined, {
    query: {
      queryKey: getListVehiclesQueryKey(),
      placeholderData: sampleVehicles as Vehicle[],
    },
  });
  const vehicles = (apiVehicles?.length ? apiVehicles : (sampleVehicles as Vehicle[]));
  return (
    <Shell savedCount={savedIds.length}>
      <ScrollToTopOnRouteChange />
      <Switch>
        <Route path="/inventory/:id"><VehicleDetail vehicles={vehicles} savedIds={savedIds} onToggleSaved={onToggleSaved} /></Route>
        <Route path="/inventory"><InventoryPage vehicles={vehicles} savedIds={savedIds} onToggleSaved={onToggleSaved} loading={isLoading && !isError && !apiVehicles} /></Route>
        <Route path="/saved"><SavedPage vehicles={vehicles} savedIds={savedIds} onToggleSaved={onToggleSaved} /></Route>
        <Route path="/admin"><AdminPage /></Route>
        <Route path="/"><HomePage vehicles={vehicles} savedIds={savedIds} onToggleSaved={onToggleSaved} /></Route>
        <Route><div className="page"><div className="empty-state"><CircleHelp size={29} /><h3>Page not found.</h3><Link className="button button-primary" href="/">Return home</Link></div></div></Route>
      </Switch>
    </Shell>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 1 },
  },
});

function App() {
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('carwebs-saved');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('carwebs-saved', JSON.stringify(savedIds));
  }, [savedIds]);
  const toggleSaved = (id: string) =>
    setSavedIds((current) => (current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]));

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <RouterContent savedIds={savedIds} onToggleSaved={toggleSaved} />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
