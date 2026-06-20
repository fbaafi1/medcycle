'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FetchError from '@/components/FetchError';
import { readCache, writeCache, isCacheFresh, FETCH_TIMEOUT_MS } from '@/lib/cache';
import { withRetry } from '@/lib/retry';

interface GalleryItem {
  id: string;
  label: string;
  description: string;
  image_url: string | null;
  created_at: string;
  donor_name?: string | null;
  location?: string | null;
  quantity?: string | null;
  category?: string | null;
}

const DONATION_CACHE_PREFIX = 'medcycle_donation_';
const DONATIONS_LIST_CACHE_KEY = 'medcycle_donations_v1';

export default function DonationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<GalleryItem | null>(null);
  const [related, setRelated] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchDonation = async () => {
      setFetchError(false);
      const cacheKey = `${DONATION_CACHE_PREFIX}${id}`;
      let hasCachedData = false;

      // 1. Try item-level cache
      const cached = readCache<GalleryItem>(cacheKey);
      if (cached?.data) {
        hasCachedData = true;
        setItem(cached.data);
        setLoading(false);
        if (isCacheFresh(cached.timestamp)) return;
      }

      // 2. Try list-level cache as fallback
      const listCache = readCache<GalleryItem[]>(DONATIONS_LIST_CACHE_KEY);
      if (!hasCachedData && listCache?.data) {
        const found = listCache.data.find((g) => g.id === id);
        if (found) {
          hasCachedData = true;
          setItem(found);
          setLoading(false);
          if (isCacheFresh(listCache.timestamp)) return;
        }
      }

      if (!hasCachedData) setLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const data = await withRetry(async () => {
          const { data, error } = await supabase
            .from('donation_gallery')
            .select('*')
            .eq('id', id)
            .abortSignal(controller.signal)
            .single();
          if (error) throw error;
          return data;
        });

        clearTimeout(timeoutId);
        setItem(data);
        if (data) writeCache(cacheKey, data);

        // Load related (best-effort, no retry needed)
        supabase
          .from('donation_gallery')
          .select('*')
          .neq('id', id)
          .order('created_at', { ascending: false })
          .limit(3)
          .then(({ data: rel }) => setRelated(rel || []));
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        console.error('Failed to fetch donation:', err);
        if (!hasCachedData) {
          const isNotFound =
            err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'PGRST116';
          if (isNotFound) setNotFound(true);
          else setFetchError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDonation();
  }, [id]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="animate-pulse-soft space-y-6">
            <div className="h-4 bg-border/40 rounded w-24" />
            <div className="h-72 bg-border/30 rounded-2xl" />
            <div className="h-6 bg-border/40 rounded w-2/3" />
            <div className="h-4 bg-border/30 rounded w-full" />
            <div className="h-4 bg-border/30 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Network error ── */
  if (fetchError) {
    return (
      <FetchError
        title="Connection error"
        message="Unable to load this donation story. Check your internet connection."
        onRetry={() => {
          setFetchError(false);
          setLoading(true);
        }}
      />
    );
  }

  /* ── Not found ── */
  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-6xl">🖼️</p>
        <h1 className="text-2xl font-bold text-text">Donation Not Found</h1>
        <p className="text-text-secondary max-w-sm">
          This donation story may have been removed or the link is incorrect.
        </p>
        <Link href="/"
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero image ── */}
      <div className="relative w-full h-64 sm:h-80 lg:h-[420px] overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full gradient-hero flex items-center justify-center">
            <svg className="w-20 h-20 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />

        {/* Floating badge */}
        <div className="absolute top-5 left-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-lg">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            Donation Story
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-20">

        {/* Back link */}
        <Link href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors mb-8 group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Main card */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">

          {/* Header strip */}
          <div className="h-1.5 w-full gradient-primary" />

          <div className="p-8 sm:p-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text leading-tight mb-4">
              {item.label}
            </h1>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2 mb-7">
              {item.category && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                  📦 {item.category}
                </span>
              )}
              {item.location && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                  📍 {item.location}
                </span>
              )}
              {item.quantity && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                  🔢 {item.quantity}
                </span>
              )}
              {item.donor_name && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">
                  🏥 {item.donor_name}
                </span>
              )}
            </div>

            <div className="h-px bg-border mb-7" />

            {/* Description */}
            <p className="text-base text-text leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link href="/listings/create"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 gradient-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Donate Like This
              </Link>
              <Link href="/listings"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border bg-background text-text font-semibold rounded-xl hover:bg-surface transition-colors">
                Browse All Listings
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* ── More donation stories ── */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-text mb-6">More Donation Stories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((rel) => (
                <Link key={rel.id} href={`/donations/${rel.id}`}
                  className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="h-44 bg-border/20 overflow-hidden">
                    {rel.image_url
                      ? <img src={rel.image_url} alt={rel.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      : <div className="w-full h-full gradient-hero flex items-center justify-center">
                          <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                          </svg>
                        </div>
                    }
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white">
                    <p className="font-bold text-sm leading-tight">{rel.label}</p>
                    <p className="text-xs text-white/70 mt-0.5 line-clamp-1">{rel.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
