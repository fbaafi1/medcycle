'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Listing, Profile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'listings' | 'users'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || !profile?.is_admin) {
        router.push('/');
        return;
      }
      fetchData();
    }
  }, [authLoading, user, profile, router]);

  const fetchData = async () => {
    const [listingsRes, usersRes] = await Promise.all([
      supabase.from('listings').select('*, profiles!listings_user_id_profiles_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ]);
    setListings(listingsRes.data || []);
    setUsers(usersRes.data || []);
    setLoading(false);
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await supabase.from('listings').delete().eq('id', id);
    setListings(listings.filter(l => l.id !== id));
  };

  if (authLoading || !profile?.is_admin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Admin Panel</h1>
        <p className="text-sm text-text-secondary mt-1">Manage all listings and users on MedCycle.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-border p-1 w-fit">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'listings' ? 'gradient-primary text-white shadow-sm' : 'text-text-secondary hover:text-primary'
          }`}
        >
          📋 Listings ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'users' ? 'gradient-primary text-white shadow-sm' : 'text-text-secondary hover:text-primary'
          }`}
        >
          👥 Users ({users.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder={activeTab === 'listings' ? 'Search listings by title, category, or organization...' : 'Search users by name, organization, or location...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm text-text placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-border animate-pulse-soft" />
          ))}
        </div>
      ) : activeTab === 'listings' ? (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Posted By</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.filter(l => {
                  const s = search.toLowerCase();
                  if (!s) return true;
                  return l.title.toLowerCase().includes(s) ||
                    l.category.toLowerCase().includes(s) ||
                    l.status.toLowerCase().includes(s) ||
                    (l.profiles?.organization_name || '').toLowerCase().includes(s);
                }).map((listing) => (
                  <tr key={listing.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/listings/${listing.id}`} className="font-medium text-text hover:text-primary transition-colors">
                        {listing.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-text-secondary">{listing.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        listing.status === 'available' ? 'badge-available' : 'badge-taken'
                      }`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{listing.profiles?.organization_name || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(listing.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteListing(listing.id)} className="text-danger hover:text-red-700 text-xs font-medium transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {listings.length === 0 && (
            <div className="text-center py-12 text-sm text-text-secondary">No listings found.</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Organization</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Contact Person</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Location</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">License</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => {
                  const s = search.toLowerCase();
                  if (!s) return true;
                  return (u.organization_name || '').toLowerCase().includes(s) ||
                    (u.contact_person || '').toLowerCase().includes(s) ||
                    (u.phone_number || '').toLowerCase().includes(s) ||
                    (u.location || '').toLowerCase().includes(s);
                }).map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 font-medium text-text">{u.organization_name || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{u.contact_person || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{u.phone_number || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{u.location || '—'}</td>
                    <td className="px-4 py-3">
                      {u.license_url ? (
                        <a href={u.license_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs font-medium">
                          View
                        </a>
                      ) : (
                        <span className="text-text-secondary text-xs">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="text-center py-12 text-sm text-text-secondary">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
