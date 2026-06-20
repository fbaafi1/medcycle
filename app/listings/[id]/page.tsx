'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Listing } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Lightbox from '@/components/Lightbox';
import AuthGuard from '@/components/AuthGuard';
import FetchError from '@/components/FetchError';
import { readCache, writeCache, isCacheFresh, FETCH_TIMEOUT_MS } from '@/lib/cache';
import { withRetry } from '@/lib/retry';

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Inappropriate content',
  fraudulent: 'Fraudulent / scam',
  expired: 'Already expired or unavailable',
  duplicate: 'Duplicate listing',
  other: 'Other',
};

/** Returns expiry urgency info for a medication listing. */
function getExpiryInfo(expiryDate: string | null): {
  label: string;
  bannerStyle: string;
  textStyle: string;
  pulse: boolean;
} | null {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return null;
  if (daysLeft === 0) return {
    label: '⚠️ This medication expires TODAY — act immediately.',
    bannerStyle: 'bg-red-50 border-red-300 text-red-800',
    textStyle: 'text-red-600 font-bold',
    pulse: true,
  };
  if (daysLeft <= 7) return {
    label: `⚠️ This medication expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — urgent pickup needed.`,
    bannerStyle: 'bg-red-50 border-red-200 text-red-700',
    textStyle: 'text-red-600 font-semibold',
    pulse: true,
  };
  if (daysLeft <= 30) return {
    label: `🕐 This medication expires in ${daysLeft} days — pickup recommended soon.`,
    bannerStyle: 'bg-orange-50 border-orange-200 text-orange-800',
    textStyle: 'text-orange-500 font-semibold',
    pulse: false,
  };
  return null;
}


const LISTING_CACHE_PREFIX = 'medcycle_listing_';
const HOME_CACHE_KEY = 'medcycle_listings_v1';

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  // Report / flag state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      setFetchError(false);
      const cacheKey = `${LISTING_CACHE_PREFIX}${id}`;
      let hasCachedData = false;

      const cached = readCache<Listing>(cacheKey);
      if (cached?.data) {
        hasCachedData = true;
        setListing(cached.data);
        setLoading(false);
        if (isCacheFresh(cached.timestamp)) return;
      }

      const homeCache = readCache<Listing[]>(HOME_CACHE_KEY);
      if (!hasCachedData && homeCache?.data) {
        const found = homeCache.data.find((l) => l.id === id);
        if (found) {
          hasCachedData = true;
          setListing(found);
          setLoading(false);
          if (isCacheFresh(homeCache.timestamp)) return;
        }
      }

      if (!hasCachedData) setLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        const data = await withRetry(async () => {
          const { data, error } = await supabase
            .from('listings')
            .select('*, profiles!listings_user_id_profiles_fkey(*)')
            .eq('id', id)
            .abortSignal(controller.signal)
            .single();
          if (error) throw error;
          return data;
        });

        clearTimeout(timeoutId);
        setListing(data);
        if (data) writeCache(cacheKey, data);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Failed to fetch listing:', err);
        if (!hasCachedData) setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchListing();
  }, [id]);

  // Check if the current user has already reported this listing
  useEffect(() => {
    if (!id || !user) return;
    const checkExistingReport = async () => {
      const { data } = await supabase
        .from('reports')
        .select('id')
        .eq('listing_id', id as string)
        .eq('reporter_id', user.id)
        .maybeSingle();
      if (data) setAlreadyReported(true);
    };
    checkExistingReport();
  }, [id, user]);

  const handleDelete = async () => {
    if (!listing || !confirm('Are you sure you want to delete this listing?')) return;
    await supabase.from('listings').delete().eq('id', listing.id);
    router.push('/my-listings');
  };

  const toggleStatus = async () => {
    if (!listing) return;
    const newStatus = (listing.status === 'available' ? 'taken' : 'available') as import('@/lib/types').ListingStatus;
    await supabase.from('listings').update({ status: newStatus }).eq('id', listing.id);
    const updated = { ...listing, status: newStatus };
    setListing(updated);
    // Invalidate caches so stale status isn't shown
    try {
      sessionStorage.removeItem(`${LISTING_CACHE_PREFIX}${listing.id}`);
      sessionStorage.removeItem(HOME_CACHE_KEY);
    } catch {}
  };

  const submitReport = async () => {
    if (!listing || !user || reportSubmitting) return;
    setReportSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      listing_id: listing.id,
      reporter_id: user.id,
      reason: reportReason,
      message: reportMessage.trim() || null,
    });
    setReportSubmitting(false);
    if (!error) {
      setAlreadyReported(true);
      setReportSuccess(true);
      setReportModalOpen(false);
      setReportMessage('');
      setTimeout(() => setReportSuccess(false), 4000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse-soft space-y-4">
          <div className="h-8 bg-border/30 rounded w-1/4" />
          <div className="h-72 bg-border/30 rounded-2xl" />
          <div className="h-32 bg-border/30 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <svg className="w-12 h-12 text-danger/40 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <h2 className="text-xl font-bold text-text mb-2">Connection error</h2>
        <p className="text-sm text-text-secondary mb-6">Unable to load this listing. Check your internet connection.</p>
        <button
          onClick={() => { setLoading(true); setFetchError(false); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md mr-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
        <Link href="/listings" className="text-primary font-medium hover:underline text-sm">← Back to listings</Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <svg className="w-12 h-12 text-primary/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-bold text-text mb-2">Listing not found</h2>
        <p className="text-sm text-text-secondary mb-6">This listing may have been removed.</p>
        <Link href="/listings" className="text-primary font-medium hover:underline">← Back to listings</Link>
      </div>
    );
  }

  const isOwner = user?.id === listing.user_id;
  const isAvailable = listing.status === 'available';
  const expiryInfo = listing.category === 'medication' ? getExpiryInfo(listing.expiry_date) : null;
  const phone = listing.profiles?.phone_number?.replace(/\s/g, '') || '';
  const whatsappNumber = phone.replace('+', '');

  return (
    <AuthGuard>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      {/* Back */}
      <Link href="/listings" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to listings
      </Link>

      {/* Pending approval banner */}
      {!listing.is_approved && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm animate-fade-in">
          <svg className="w-5 h-5 mt-0.5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-amber-800 font-semibold">Pending Admin Approval</p>
            <p className="text-amber-700/80 text-xs mt-0.5">
              This listing is not yet visible on the platform. An admin will review and approve it shortly.
            </p>
          </div>
        </div>
      )}

      {/* Expiry warning banner */}
      {expiryInfo && (
        <div className={`mb-6 flex items-start gap-3 px-4 py-3.5 border rounded-xl text-sm animate-fade-in ${expiryInfo.bannerStyle}`}>
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className={`font-medium ${expiryInfo.pulse ? 'animate-pulse' : ''}`}>{expiryInfo.label}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden border border-border bg-white mb-6">
            {listing.image_url ? (
              <Lightbox src={listing.image_url} alt={listing.title}>
                <img src={listing.image_url} alt={listing.title} loading="lazy" decoding="async" className="w-full h-64 sm:h-80 object-cover hover:opacity-90 transition-opacity" />
              </Lightbox>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            {/* Status & Category */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isAvailable ? 'badge-available' : 'badge-taken'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {isAvailable ? 'Available' : 'Taken'}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/5 text-primary rounded-full text-xs font-semibold">
                {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-text mb-3">{listing.title}</h1>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">{listing.description}</p>

            {/* Category-specific details */}
            <div className="space-y-3">
              {listing.category === 'medication' && (
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">Medication Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {listing.generic_name && (
                      <div>
                        <span className="text-text-secondary">Generic Name:</span>
                        <span className="ml-2 font-medium text-text">{listing.generic_name}</span>
                      </div>
                    )}
                    {listing.trade_name && (
                      <div>
                        <span className="text-text-secondary">Trade Name:</span>
                        <span className="ml-2 font-medium text-text">{listing.trade_name}</span>
                      </div>
                    )}
                    {listing.expiry_date && (
                      <div>
                        <span className="text-text-secondary">Expiry Date:</span>
                        <span className={`ml-2 ${expiryInfo ? expiryInfo.textStyle : 'font-medium text-text'}`}>
                          {new Date(listing.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          {expiryInfo?.pulse && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">URGENT</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {listing.category === 'equipment' && listing.condition && (
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <h3 className="text-sm font-semibold text-emerald-900 mb-2">Equipment Details</h3>
                  <p className="text-sm">
                    <span className="text-text-secondary">Condition:</span>
                    <span className="ml-2 font-medium text-text capitalize">{listing.condition.replace('_', ' ')}</span>
                  </p>
                </div>
              )}

              {listing.category === 'supply' && listing.quantity && (
                <div className="p-4 bg-violet-50/50 rounded-xl border border-violet-100">
                  <h3 className="text-sm font-semibold text-violet-900 mb-2">Supply Details</h3>
                  <p className="text-sm">
                    <span className="text-text-secondary">Quantity:</span>
                    <span className="ml-2 font-medium text-text">{listing.quantity}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="mt-6 pt-4 border-t border-border text-xs text-text-secondary">
              Posted on {new Date(listing.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact Card */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-text mb-4">Contact Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
                <div>
                  <p className="font-medium text-text">{listing.profiles?.organization_name || 'Unknown Organization'}</p>
                  <p className="text-text-secondary">{listing.profiles?.location || 'No location'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <p className="font-medium text-text">{listing.profiles?.contact_person || 'Unknown Contact'}</p>
              </div>
              {phone && (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <p className="font-medium text-text">{listing.profiles?.phone_number}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {phone && (
              <div className="mt-5 space-y-2">
                <a
                  href={`tel:${phone}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Now
                </a>
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#25d366] text-white text-sm font-semibold rounded-lg hover:bg-[#20bd5a] transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-text mb-4">Manage Listing</h3>
              <div className="space-y-2">
                <button
                  onClick={toggleStatus}
                  className={`w-full py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                    isAvailable
                      ? 'bg-taken/10 text-taken hover:bg-taken/20 border border-taken/20'
                      : 'bg-success/10 text-success hover:bg-success/20 border border-success/20'
                  }`}
                >
                  Mark as {isAvailable ? 'Taken' : 'Available'}
                </button>
                <Link
                  href={`/listings/${listing.id}/edit`}
                  className="block w-full py-2.5 text-center text-sm font-semibold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors border border-primary/20"
                >
                  Edit Listing
                </Link>
                <button
                  onClick={handleDelete}
                  className="w-full py-2.5 text-sm font-semibold text-danger bg-danger/5 rounded-lg hover:bg-danger/10 transition-colors border border-danger/20"
                >
                  Delete Listing
                </button>
              </div>
            </div>
          )}

          {/* Report button — only for logged-in non-owners */}
          {user && !isOwner && (
            <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
              {alreadyReported ? (
                <div className="flex items-center justify-center gap-2 text-xs text-text-secondary py-0.5">
                  <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Report submitted — thank you
                </div>
              ) : (
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-danger hover:bg-danger/5 rounded-lg transition-colors border border-danger/20"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  Report this listing
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Success toast ── */}
      {reportSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-success text-white text-sm font-semibold rounded-xl shadow-xl animate-slide-up">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Report submitted. Thank you!
        </div>
      )}

      {/* ── Report Modal ── */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setReportModalOpen(false)}
          />
          {/* Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-text">Report this listing</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Help us keep the platform safe and trustworthy.</p>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Reason <span className="text-danger">*</span>
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger/50 transition-colors"
                  >
                    {Object.entries(REASON_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Additional details{' '}
                    <span className="text-text-secondary font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={reportMessage}
                    onChange={(e) => setReportMessage(e.target.value)}
                    placeholder="Provide more context about the issue…"
                    rows={3}
                    className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-danger/20 focus:border-danger/50 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-text-secondary bg-white border border-border rounded-lg hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  disabled={reportSubmitting}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-danger hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {reportSubmitting ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
