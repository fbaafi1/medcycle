'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import FetchError from '@/components/FetchError';
import { FETCH_TIMEOUT_MS } from '@/lib/cache';
import { withRetry } from '@/lib/retry';
import { supabase } from '@/lib/supabase';

interface NewsArticle {
  id: string;
  date: string;
  tag: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  published: boolean;
}

interface GalleryItem {
  id: string;
  label: string;
  description: string;
  image_url: string | null;
}

interface HomePageClientProps {
  initialNews: NewsArticle[];
  initialGallery: GalleryItem[];
  serverFetchFailed: boolean;
}

export default function HomePageClient({
  initialNews,
  initialGallery,
  serverFetchFailed,
}: HomePageClientProps) {
  const [news, setNews] = useState<NewsArticle[]>(initialNews);
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery);
  const [newsLoading, setNewsLoading] = useState(serverFetchFailed);
  const [galleryLoading, setGalleryLoading] = useState(serverFetchFailed);
  const [fetchError, setFetchError] = useState(serverFetchFailed);
  const [retrying, setRetrying] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const fetchContent = useCallback(async () => {
    setFetchError(false);
    setNewsLoading(true);
    setGalleryLoading(true);
    setRetrying(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const [newsData, galleryData] = await withRetry(async () => {
        const [newsResult, galleryResult] = await Promise.all([
          supabase
            .from('news_articles')
            .select('*')
            .eq('published', true)
            .order('created_at', { ascending: false })
            .limit(4)
            .abortSignal(controller.signal),
          supabase
            .from('donation_gallery')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(6)
            .abortSignal(controller.signal),
        ]);
        if (newsResult.error) throw newsResult.error;
        if (galleryResult.error) throw galleryResult.error;
        return [newsResult.data ?? [], galleryResult.data ?? []] as const;
      });

      clearTimeout(timeoutId);
      setNews(newsData);
      setGallery(galleryData);
    } catch {
      clearTimeout(timeoutId);
      setFetchError(true);
    } finally {
      setNewsLoading(false);
      setGalleryLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    if (serverFetchFailed) fetchContent();
  }, [serverFetchFailed, fetchContent]);

  // When gallery loads with more than 2 items, scroll carousel to index 1
  // so the 2nd card is centered with peeks visible on both sides.
  useEffect(() => {
    if (gallery.length <= 2) return;
    // Wait for the DOM to paint the carousel before scrolling
    requestAnimationFrame(() => {
      const el = carouselRef.current;
      if (!el) return;
      const cardWidth = el.scrollWidth / gallery.length;
      el.scrollTo({ left: cardWidth, behavior: 'instant' });
      setActiveSlide(1);
    });
  }, [gallery]);

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-2">
          <img src="/images/pills.jpg" alt="" fetchPriority="high" decoding="async"
            className="w-full h-full object-cover" />
          <img src="/images/stethoscope.jpg" alt="" fetchPriority="high" decoding="async"
            className="w-full h-full object-cover" />
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-40
            bg-gradient-to-r from-transparent via-[#0c4a6e]/70 to-transparent pointer-events-none" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e]/90 via-[#0369a1]/80 to-[#06b6d4]/70" />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-white/5 blur-3xl animate-pulse-soft pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full bg-cyan-300/10 blur-2xl animate-pulse-soft pointer-events-none"
          style={{ animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-white">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 animate-slide-up">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft" />
              Healthcare Resource Sharing Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Share Medical Resources,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
                Save Lives Together
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 leading-relaxed mb-10 max-w-2xl animate-slide-up" style={{ animationDelay: '200ms' }}>
              Connect hospitals and healthcare providers to redistribute surplus medications,
              equipment, and supplies to communities that need them most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <Link href="/listings/create"
                className="glow-border inline-flex items-center justify-center gap-2 px-7 py-3.5
                  bg-white text-primary-dark font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-xl text-base w-fit">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Donate Now
              </Link>
              <Link href="/listings"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5
                  bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold
                  rounded-xl hover:bg-white/20 transition-colors shadow-lg text-base w-fit">
                Browse Listings
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50 animate-bounce">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>



      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full uppercase tracking-wider mb-3">Simple Process</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text">How MedCycle Works</h2>
            <p className="text-text-secondary mt-3 max-w-xl mx-auto">Getting surplus medications to those in need takes just three steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📋', title: 'Post a Listing', desc: 'Register your organisation and list surplus medications or equipment with expiry dates and quantities.' },
              { step: '02', icon: '🔍', title: 'Connect & Verify', desc: 'Our team verifies each listing for safety and compliance before it appears to recipient organisations.' },
              { step: '03', icon: '🤝', title: 'Connect & Collect', desc: 'Approved listings go live for recipient organisations to view. They contact the donor directly to arrange collection, and the donor marks the item as taken once handed over.' },
            ].map((item) => (
              <div key={item.step} className="relative bg-surface rounded-2xl p-8 border border-border
                shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="absolute -top-4 left-8 px-3 py-1 gradient-primary text-white text-xs font-bold rounded-full shadow-md">{item.step}</div>
                <div className="text-4xl mb-4 mt-2">{item.icon}</div>
                <h3 className="text-lg font-bold text-text mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── News ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-3">Latest News</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-text">{"What's Happening"}</h2>
            </div>
          </div>

          {fetchError && !newsLoading && !galleryLoading ? (
            <FetchError
              title="Unable to load content"
              onRetry={fetchContent}
              retrying={retrying}
            />
          ) : newsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-background rounded-2xl border border-border overflow-hidden animate-pulse-soft">
                  <div className="h-28 bg-border/30" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-border/30 rounded w-1/3" />
                    <div className="h-4 bg-border/30 rounded w-full" />
                    <div className="h-3 bg-border/30 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-16 text-text-secondary">
              <p className="text-4xl mb-3">📰</p>
              <p className="font-medium">No news articles published yet.</p>
              <p className="text-sm mt-1">Check back soon — articles are managed in the admin panel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {news.map((article, i) => (
                <Link key={article.id} href={`/news/${article.id}`}
                  className="bg-background rounded-2xl border border-border overflow-hidden
                    hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="h-28 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                    {article.image_url
                      ? <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" loading="lazy"/>
                      : <div className="w-full h-full gradient-hero flex items-center justify-center"><svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/></svg></div>
                    }
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">{article.tag}</span>
                      <span className="text-xs text-text-secondary">{article.date}</span>
                    </div>
                    <h3 className="font-bold text-text text-sm leading-snug mb-2 flex-1">{article.title}</h3>
                    <p className="text-text-secondary text-xs leading-relaxed line-clamp-3">{article.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Previous Donations Gallery ─────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-background to-blue-50/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full uppercase tracking-wider mb-3">Community Impact</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text">Previous Donations in Action</h2>
            <p className="text-text-secondary mt-3 max-w-xl mx-auto">
              Every listing on MedCycle tells a story. Here are some recent donations that made a difference.
            </p>
          </div>

          {fetchError && !galleryLoading ? null : galleryLoading ? (
            /* ── Loading skeleton ── */
            <>
              {/* Mobile skeleton */}
              <div className="sm:hidden flex gap-4 overflow-hidden px-[12%]">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex-none w-[76%] rounded-2xl overflow-hidden animate-pulse-soft">
                    <div className="h-56 bg-border/30" />
                  </div>
                ))}
              </div>
              {/* Desktop skeleton */}
              <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden animate-pulse-soft">
                    <div className="h-56 bg-border/30" />
                  </div>
                ))}
              </div>
            </>
          ) : gallery.length === 0 ? (
            <div className="text-center py-16 text-text-secondary">
              <p className="text-4xl mb-3">🖼️</p>
              <p className="font-medium">No gallery items yet.</p>
              <p className="text-sm mt-1">Admins can add donation stories in the admin panel.</p>
            </div>
          ) : (
            <>
              {/* ── Mobile carousel (hidden on sm+) ── */}
              <div className="sm:hidden">
                {/* Track */}
                <div
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth
                    px-[12%] pb-2"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    // Each card is 76% of the viewport width + 1rem gap
                    const cardWidth = el.scrollWidth / gallery.length;
                    const idx = Math.round(el.scrollLeft / cardWidth);
                    setActiveSlide(idx);
                  }}
                >
                  {gallery.map((item, i) => (
                    <Link
                      key={item.id}
                      href={`/donations/${item.id}`}
                      className="flex-none w-[76%] snap-center group relative rounded-2xl overflow-hidden shadow-md
                        transition-all duration-300 cursor-pointer"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <div className="h-56 bg-border/20 overflow-hidden">
                        {item.image_url
                          ? <img src={item.image_url} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          : <div className="w-full h-full gradient-hero flex items-center justify-center"><svg className="w-12 h-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/></svg></div>
                        }
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                        <p className="font-bold text-sm leading-tight mb-1">{item.label}</p>
                        <p className="text-xs text-white/80 leading-snug line-clamp-2">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Arrow controls */}
                <div className="flex items-center justify-center gap-4 mt-5">
                  <button
                    id="gallery-prev"
                    aria-label="Previous donation"
                    disabled={activeSlide === 0}
                    onClick={() => {
                      const el = carouselRef.current;
                      if (!el) return;
                      const cardWidth = el.scrollWidth / gallery.length;
                      el.scrollTo({ left: (activeSlide - 1) * cardWidth, behavior: 'smooth' });
                    }}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center
                      bg-surface text-text-secondary hover:bg-primary hover:text-white hover:border-primary
                      disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Dot indicators */}
                  <div className="flex items-center gap-1.5">
                    {gallery.map((_, i) => (
                      <button
                        key={i}
                        id={`gallery-dot-${i}`}
                        aria-label={`Go to slide ${i + 1}`}
                        onClick={() => {
                          const el = carouselRef.current;
                          if (!el) return;
                          const cardWidth = el.scrollWidth / gallery.length;
                          el.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
                        }}
                        className={`rounded-full transition-all duration-300 ${
                          i === activeSlide
                            ? 'w-6 h-2 bg-primary'
                            : 'w-2 h-2 bg-border hover:bg-primary/50'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    id="gallery-next"
                    aria-label="Next donation"
                    disabled={activeSlide === gallery.length - 1}
                    onClick={() => {
                      const el = carouselRef.current;
                      if (!el) return;
                      const cardWidth = el.scrollWidth / gallery.length;
                      el.scrollTo({ left: (activeSlide + 1) * cardWidth, behavior: 'smooth' });
                    }}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center
                      bg-surface text-text-secondary hover:bg-primary hover:text-white hover:border-primary
                      disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ── Desktop grid (hidden on mobile) ── */}
              <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-6">
                {gallery.map((item, i) => (
                  <Link key={item.id} href={`/donations/${item.id}`}
                    className="group relative rounded-2xl overflow-hidden shadow-md
                      hover:shadow-2xl hover:-translate-y-2 transition-all duration-400 cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="h-56 bg-border/20 overflow-hidden">
                      {item.image_url
                        ? <img src={item.image_url} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"/>
                        : <div className="w-full h-full gradient-hero flex items-center justify-center"><svg className="w-12 h-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/></svg></div>
                      }
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                      <p className="font-bold text-sm leading-tight mb-1">{item.label}</p>
                      <p className="text-xs text-white/80 leading-snug">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="text-center mt-12">
            <Link href="/listings"
              className="inline-flex items-center gap-2 px-8 py-3.5 gradient-primary
                text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg text-base">
              Browse All Listings
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-20 gradient-hero text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to Make a Difference?</h2>
          <p className="text-blue-200 text-lg mb-10 max-w-2xl mx-auto">
            Join hundreds of hospitals and clinics already sharing surplus resources through MedCycle. Registration is free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4
                bg-white text-primary-dark font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-xl text-base">
              Get Started Free
            </Link>
            <Link href="/about"
              className="inline-flex items-center justify-center gap-2 px-8 py-4
                bg-white/10 border border-white/30 backdrop-blur-sm text-white
                font-semibold rounded-xl hover:bg-white/20 transition-colors text-base">
              Learn More
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
