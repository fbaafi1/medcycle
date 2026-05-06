'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Listing } from '@/lib/types';
import ListingCard from '@/components/ListingCard';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyListingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchMyListings();
    }
  }, [authLoading, user, router]);

  const fetchMyListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles!listings_user_id_profiles_fkey(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setListings(data || []);
    setLoading(false);
  };

  if (authLoading) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">My Listings</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your posted medical resources.</p>
        </div>
        <Link
          href="/listings/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Listing
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border overflow-hidden animate-pulse-soft">
              <div className="h-48 bg-border/30" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-border/30 rounded w-1/4" />
                <div className="h-5 bg-border/30 rounded w-3/4" />
                <div className="h-4 bg-border/30 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl block mb-4">📋</span>
          <h3 className="text-lg font-semibold text-text mb-2">No listings yet</h3>
          <p className="text-sm text-text-secondary mb-6">Start sharing medical resources with those in need.</p>
          <Link
            href="/listings/create"
            className="inline-flex items-center px-5 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md"
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing, i) => (
            <div key={listing.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
