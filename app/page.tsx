'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Listing, ListingCategory } from '@/lib/types';
import ListingCard from '@/components/ListingCard';
import Link from 'next/link';

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ListingCategory | 'all'>('all');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles!listings_user_id_profiles_fkey(*)')
      .eq('is_approved', true);
    // Shuffle randomly
    const shuffled = (data || []).sort(() => Math.random() - 0.5);
    setListings(shuffled);
    setLoading(false);
  };

  const filtered = listings.filter((l) => {
    const matchesSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      (l.generic_name && l.generic_name.toLowerCase().includes(search.toLowerCase())) ||
      (l.trade_name && l.trade_name.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === 'all' || l.category === category;
    const notExpired = !l.expiry_date || new Date(l.expiry_date) >= new Date(new Date().toDateString());
    return matchesSearch && matchesCategory && notExpired;
  });

  return (
    <div>
      {/* Hero with medical background images */}
      <section className="relative overflow-hidden">
        {/* Background images */}
        <div className="absolute inset-0 grid grid-cols-2">
          <img src="/images/pills.jpg" alt="" className="w-full h-full object-cover" />
          <img src="/images/stethoscope.jpg" alt="" className="w-full h-full object-cover" />
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
          {/* Search */}
          <div className="relative flex-1">
            <img src="/images/logo.svg" alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 object-contain" />
            <input
              type="text"
              placeholder="Search by title, generic name, or trade name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm text-text placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
            {filtered.map((listing, i) => (
              <div key={listing.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
