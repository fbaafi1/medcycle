'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Listing } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Lightbox from '@/components/Lightbox';

const categoryIcons: Record<string, string> = {
  medication: '💊',
  equipment: '🏥',
  supply: '📦',
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      const { data } = await supabase
        .from('listings')
        .select('*, profiles!listings_user_id_profiles_fkey(*)')
        .eq('id', id)
        .single();
      setListing(data);
      setLoading(false);
    };
    if (id) fetchListing();
  }, [id]);

  const handleDelete = async () => {
    if (!listing || !confirm('Are you sure you want to delete this listing?')) return;
    await supabase.from('listings').delete().eq('id', listing.id);
    router.push('/my-listings');
  };

  const toggleStatus = async () => {
    if (!listing) return;
    const newStatus = listing.status === 'available' ? 'taken' : 'available';
    await supabase.from('listings').update({ status: newStatus }).eq('id', listing.id);
    setListing({ ...listing, status: newStatus });
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

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <span className="text-5xl block mb-4">😕</span>
        <h2 className="text-xl font-bold text-text mb-2">Listing not found</h2>
        <p className="text-sm text-text-secondary mb-6">This listing may have been removed.</p>
        <Link href="/" className="text-primary font-medium hover:underline">← Back to listings</Link>
      </div>
    );
  }

  const isOwner = user?.id === listing.user_id;
  const isAvailable = listing.status === 'available';
  const phone = listing.profiles?.phone_number?.replace(/\s/g, '') || '';
  const whatsappNumber = phone.replace('+', '');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden border border-border bg-white mb-6">
            {listing.image_url ? (
              <Lightbox src={listing.image_url} alt={listing.title}>
                <img src={listing.image_url} alt={listing.title} className="w-full h-64 sm:h-80 object-cover hover:opacity-90 transition-opacity" />
              </Lightbox>
            ) : (
              <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                <span className="text-7xl">{categoryIcons[listing.category] || '📋'}</span>
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
                {categoryIcons[listing.category]} {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-text mb-3">{listing.title}</h1>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">{listing.description}</p>

            {/* Category-specific details */}
            <div className="space-y-3">
              {listing.category === 'medication' && (
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">💊 Medication Details</h3>
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
                        <span className="ml-2 font-medium text-text">{new Date(listing.expiry_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {listing.category === 'equipment' && listing.condition && (
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <h3 className="text-sm font-semibold text-emerald-900 mb-2">🏥 Equipment Details</h3>
                  <p className="text-sm">
                    <span className="text-text-secondary">Condition:</span>
                    <span className="ml-2 font-medium text-text capitalize">{listing.condition.replace('_', ' ')}</span>
                  </p>
                </div>
              )}

              {listing.category === 'supply' && listing.quantity && (
                <div className="p-4 bg-violet-50/50 rounded-xl border border-violet-100">
                  <h3 className="text-sm font-semibold text-violet-900 mb-2">📦 Supply Details</h3>
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
                <span className="text-lg">🏛️</span>
                <div>
                  <p className="font-medium text-text">{listing.profiles?.organization_name || 'Unknown Organization'}</p>
                  <p className="text-text-secondary">{listing.profiles?.location || 'No location'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">👤</span>
                <p className="font-medium text-text">{listing.profiles?.contact_person || 'Unknown Contact'}</p>
              </div>
              {phone && (
                <div className="flex items-center gap-3">
                  <span className="text-lg">📞</span>
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
        </div>
      </div>
    </div>
  );
}
