'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Listing, ListingCategory } from '@/lib/types';
import ListingCard from '@/components/ListingCard';
import Link from 'next/link';

const ITEMS_PER_PAGE = 9;
const CACHE_KEY = 'medcycle_listings_v1';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const FETCH_TIMEOUT_MS = 10_000; // 10 s — abort if mobile network stalls

/** True when the user triggered a hard reload (F5 / pull-to-refresh). */
function isHardReload(): boolean {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return nav?.type === 'reload';
  } catch {
    return false;
  }
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<ListingCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchListings();
  }, []);

  // Debounce search input — only update filtered results after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, category]);

  const fetchListings = async () => {
    setError(false);

    // 1. On a hard reload (F5 / pull-to-refresh) clear the cache so we
    //    always fetch fresh data — mobile browsers keep sessionStorage alive
    //    across reloads, which can silently serve stale or empty data.
    if (isHardReload()) {
      try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
    }

    // 2. Show cached data immediately (instant on repeat visits)
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (cachedData?.length) {
          setListings(cachedData);
          setLoading(false);
          // Cache still fresh — skip network entirely
          if (Date.now() - timestamp < CACHE_TTL) return;
        }
      }
    } catch { /* sessionStorage unavailable — continue to network */ }

    // 3. Fetch fresh data from Supabase with a timeout so we don't hang
    //    indefinitely on a slow/dropped mobile connection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles!listings_user_id_profiles_fkey(*)')
        .eq('is_approved', true)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);
      if (error) throw error;
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      setListings(shuffled);

      // 4. Persist to cache for next visit
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          data: shuffled,
          timestamp: Date.now(),
        }));
      } catch { /* storage full or unavailable */ }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Failed to fetch listings:', err);
      // Only show error state if we have nothing to display
      if (listings.length === 0) setError(true);
    } finally {
      setLoading(false);
    }
  };

  const filtered = listings.filter((l) => {
    const q = debouncedSearch.toLowerCase();
    const matchesSearch =
      !debouncedSearch ||
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      (l.generic_name && l.generic_name.toLowerCase().includes(q)) ||
      (l.trade_name && l.trade_name.toLowerCase().includes(q)) ||
      (l.profiles?.organization_name && l.profiles.organization_name.toLowerCase().includes(q)) ||
      (l.profiles?.location && l.profiles.location.toLowerCase().includes(q));
    const matchesCategory = category === 'all' || l.category === category;
    const notExpired = !l.expiry_date || new Date(l.expiry_date) >= new Date(new Date().toDateString());
    return matchesSearch && matchesCategory && notExpired;
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedListings = filtered.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to the listings section
    document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    if (safePage > 3) pages.push('ellipsis');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div>
      {/* Hero with medical background images */}
      <section className="relative overflow-hidden">
        {/* Background images */}
        <div className="absolute inset-0 grid grid-cols-2">
          <img src="/images/pills.jpg" alt="" fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
          <img src="/images/stethoscope.jpg" alt="" fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
          {/* Blend seam between images */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-32 bg-gradient-to-r from-transparent via-[#0c4a6e]/60 to-transparent pointer-events-none" />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c4a6e]/85 via-[#0369a1]/80 to-[#0ea5e9]/75" />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-white">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-secondary-light rounded-full animate-pulse-soft" />
              Healthcare Resource Sharing
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              Share Medical Resources,<br />
              <span className="text-secondary-light">Save Lives Together</span>
            </h1>
            <p className="text-base sm:text-lg text-blue-100 leading-relaxed mb-8 max-w-2xl">
              Connect with hospitals and healthcare providers to redistribute surplus medications, equipment, and supplies to those in need.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/listings/create"
                className="glow-border inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-dark font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg w-fit"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Donate Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section id="listings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search — matches title, names, org, location */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, location, organization…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm text-text placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'medication', 'equipment', 'supply'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  category === cat
                    ? 'gradient-primary text-white shadow-md'
                    : 'bg-white border border-border text-text-secondary hover:text-primary hover:border-primary/30'
                }`}
              >
                {cat === 'all' ? 'All' : cat === 'medication' ? 'Medications' : cat === 'equipment' ? 'Equipment' : 'Supplies'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-border overflow-hidden animate-pulse-soft">
                <div className="h-48 bg-border/30" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-border/30 rounded w-1/4" />
                  <div className="h-5 bg-border/30 rounded w-3/4" />
                  <div className="h-4 bg-border/30 rounded w-full" />
                  <div className="h-4 bg-border/30 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <svg className="w-12 h-12 text-danger/40 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-text mb-2">Unable to load listings</h3>
            <p className="text-sm text-text-secondary mb-6">Check your internet connection and try again.</p>
            <button
              onClick={() => { setLoading(true); fetchListings(); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-12 h-12 text-primary/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-text mb-2">No listings found</h3>
            <p className="text-sm text-text-secondary mb-6">
              {search || category !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Be the first to post a listing!'}
            </p>
            <Link
              href="/listings/create"
              className="inline-flex items-center px-5 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md"
            >
              Post a Listing
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              {paginatedListings.map((listing, i) => (
                <div key={listing.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results summary */}
                <p className="text-sm text-text-secondary order-2 sm:order-1">
                  Showing <span className="font-semibold text-text">{startIndex + 1}</span>–<span className="font-semibold text-text">{Math.min(endIndex, filtered.length)}</span> of{' '}
                  <span className="font-semibold text-text">{filtered.length}</span> listings
                </p>

                {/* Page controls */}
                <nav className="flex items-center gap-1 order-1 sm:order-2" aria-label="Pagination">
                  {/* Previous */}
                  <button
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-border bg-white text-text-secondary hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-text-secondary disabled:hover:border-border"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  {/* Page numbers */}
                  {getPageNumbers().map((page, idx) =>
                    page === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-text-secondary select-none">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`min-w-[36px] h-9 px-2 text-sm font-medium rounded-lg transition-all ${
                          page === safePage
                            ? 'gradient-primary text-white shadow-md scale-105'
                            : 'bg-white border border-border text-text-secondary hover:text-primary hover:border-primary/30'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  {/* Next */}
                  <button
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-border bg-white text-text-secondary hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-text-secondary disabled:hover:border-border"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
