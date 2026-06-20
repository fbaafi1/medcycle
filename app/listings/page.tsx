'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Listing, ListingCategory } from '@/lib/types';
import { readCache, writeCache, isCacheFresh, FETCH_TIMEOUT_MS } from '@/lib/cache';
import { withRetry } from '@/lib/retry';
import ListingCard from '@/components/ListingCard';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';

const ITEMS_PER_PAGE = 9;
const CACHE_KEY = 'medcycle_listings_v1';

const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  all:        { label: 'All',         emoji: '🏥', color: 'from-primary to-primary-light' },
  medication: { label: 'Medications', emoji: '💊', color: 'from-blue-500 to-cyan-400' },
  equipment:  { label: 'Equipment',   emoji: '🩺', color: 'from-emerald-500 to-teal-400' },
  supply:     { label: 'Supplies',    emoji: '📦', color: 'from-violet-500 to-purple-400' },
};

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<ListingCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { fetchListings(); }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, category]);

  const fetchListings = async () => {
    setError(false);

    const cached = readCache<Listing[]>(CACHE_KEY);
    const hasCachedData = Boolean(cached?.data?.length);

    if (hasCachedData) {
      setListings(cached!.data);
      setLoading(false);
      if (isCacheFresh(cached!.timestamp)) return;
    } else {
      setLoading(true);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const data = await withRetry(async () => {
        const { data, error } = await supabase
          .from('listings')
          .select('*, profiles!listings_user_id_profiles_fkey(*)')
          .eq('is_approved', true)
          .abortSignal(controller.signal);
        if (error) throw error;
        return data ?? [];
      });

      clearTimeout(timeoutId);
      const shuffled = data.sort(() => Math.random() - 0.5);
      setListings(shuffled);
      writeCache(CACHE_KEY, shuffled);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Failed to fetch listings:', err);
      if (!hasCachedData) setError(true);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedListings = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    document.getElementById('listings-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (safePage > 3) pages.push('ellipsis');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  // Category counts
  const counts: Record<string, number> = { all: listings.length };
  listings.forEach((l) => {
    counts[l.category] = (counts[l.category] || 0) + 1;
  });

  return (
    <AuthGuard>
    <div>
      {/* ── Hero banner ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-14">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-300/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10
                backdrop-blur-sm rounded-full text-xs font-medium mb-4">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft" />
                Available Now
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-2">
                Browse Listings
              </h1>
              <p className="text-blue-200 text-base max-w-xl">
                Verified medications, equipment, and supplies available for donation across Nigeria.
              </p>
            </div>

            <Link
              href="/listings/create"
              className="glow-border shrink-0 inline-flex items-center gap-2 px-6 py-3
                bg-white text-primary-dark font-bold rounded-xl hover:bg-blue-50
                transition-colors shadow-lg text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Post a Listing
            </Link>
          </div>

        </div>
      </section>

      {/* ── Search + Results ────────────────────────────────────────────── */}
      <section id="listings-top" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search bar */}
        <div className="relative mb-8">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="listings-search"
            type="text"
            placeholder="Search by name, location, organisation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-border rounded-2xl
              text-sm text-text placeholder-text-secondary/60 shadow-sm
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5
                text-text-secondary/50 hover:text-text-secondary transition-colors"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category filter pills — below search */}
        {!loading && (
          <div className="flex flex-wrap gap-2 mb-6">
            {(['all', 'medication', 'equipment', 'supply'] as const).map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold
                    transition-all duration-200 border ${
                      category === cat
                        ? 'gradient-primary text-white border-transparent shadow-md'
                        : 'bg-white text-text-secondary border-border hover:border-primary/30 hover:text-primary'
                    }`}
                >
                  <span>{meta.emoji}</span>
                  {meta.label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    category === cat ? 'bg-white/20 text-white' : 'bg-border/50 text-text-secondary'
                  }`}>
                    {counts[cat] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {!loading && !error && (
          <p className="text-sm text-text-secondary mb-5">
            Showing <span className="font-semibold text-text">{filtered.length}</span> listing{filtered.length !== 1 ? 's' : ''}
            {category !== 'all' && (
              <> in <span className="font-semibold text-primary capitalize">{category}s</span></>
            )}
            {debouncedSearch && (
              <> matching <span className="font-semibold text-primary">"{debouncedSearch}"</span></>
            )}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(9)].map((_, i) => (
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
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-danger/5 flex items-center justify-center">
              <svg className="w-10 h-10 text-danger/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Unable to load listings</h3>
            <p className="text-sm text-text-secondary mb-6">Check your internet connection and try again.</p>
            <button
              onClick={() => { setLoading(true); fetchListings(); }}
              className="inline-flex items-center gap-2 px-6 py-3 gradient-primary text-white
                text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/5 flex items-center justify-center">
              <svg className="w-10 h-10 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">No listings found</h3>
            <p className="text-sm text-text-secondary mb-6">
              {search || category !== 'all'
                ? 'Try adjusting your search or clearing filters.'
                : 'Be the first to post a listing!'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {(search || category !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setCategory('all'); }}
                  className="inline-flex items-center px-5 py-2.5 bg-white border border-border
                    text-text-secondary text-sm font-semibold rounded-xl hover:border-primary/30 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <Link
                href="/listings/create"
                className="inline-flex items-center px-5 py-2.5 gradient-primary text-white
                  text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md"
              >
                Post a Listing
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedListings.map((listing, i) => (
                <div key={listing.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-text-secondary order-2 sm:order-1">
                  Showing{' '}
                  <span className="font-semibold text-text">{startIndex + 1}</span>–
                  <span className="font-semibold text-text">
                    {Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}
                  </span>{' '}
                  of <span className="font-semibold text-text">{filtered.length}</span> listings
                </p>

                <nav className="flex items-center gap-1 order-1 sm:order-2" aria-label="Pagination">
                  <button
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium
                      rounded-lg border border-border bg-white text-text-secondary
                      hover:text-primary hover:border-primary/30 transition-colors
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  {getPageNumbers().map((page, idx) =>
                    page === 'ellipsis' ? (
                      <span key={`e-${idx}`} className="px-2 py-2 text-sm text-text-secondary select-none">…</span>
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

                  <button
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium
                      rounded-lg border border-border bg-white text-text-secondary
                      hover:text-primary hover:border-primary/30 transition-colors
                      disabled:opacity-40 disabled:cursor-not-allowed"
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
    </AuthGuard>
  );
}
