'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Listing, Profile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ListingFilter = 'pending' | 'approved' | 'all';

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'listings' | 'users'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [listingFilter, setListingFilter] = useState<ListingFilter>('pending');

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

  const approveListing = async (id: string) => {
    const { error } = await supabase.from('listings').update({ is_approved: true }).eq('id', id);
    if (error) {
      alert('Failed to approve: ' + error.message);
      return;
    }
    setListings(listings.map(l => l.id === id ? { ...l, is_approved: true } : l));
  };

  const rejectListing = async (id: string) => {
    if (!confirm('Reject this listing? It will be set back to unapproved.')) return;
    const { error } = await supabase.from('listings').update({ is_approved: false }).eq('id', id);
    if (error) {
      alert('Failed to reject: ' + error.message);
      return;
    }
    setListings(listings.map(l => l.id === id ? { ...l, is_approved: false } : l));
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Permanently delete this listing? This cannot be undone.')) return;
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (error) {
      alert('Failed to delete: ' + error.message);
      return;
    }
    setListings(listings.filter(l => l.id !== id));
  };

  if (authLoading || !profile?.is_admin) return null;

  const pendingCount = listings.filter(l => !l.is_approved).length;
  const approvedCount = listings.filter(l => l.is_approved).length;

  const filteredListings = listings.filter(l => {
    // Filter by approval status
    if (listingFilter === 'pending' && l.is_approved) return false;
    if (listingFilter === 'approved' && !l.is_approved) return false;
    // Filter by search
    const s = search.toLowerCase();
    if (!s) return true;
    return l.title.toLowerCase().includes(s) ||
      l.category.toLowerCase().includes(s) ||
      l.status.toLowerCase().includes(s) ||
      (l.profiles?.organization_name || '').toLowerCase().includes(s);
  });

  const filteredUsers = users.filter(u => {
    const s = search.toLowerCase();
    if (!s) return true;
    return (u.organization_name || '').toLowerCase().includes(s) ||
      (u.contact_person || '').toLowerCase().includes(s) ||
      (u.phone_number || '').toLowerCase().includes(s) ||
      (u.location || '').toLowerCase().includes(s);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Admin Panel</h1>
        <p className="text-sm text-text-secondary mt-1">Manage all listings and users on The MedCycle.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-xl font-bold text-text">{pendingCount}</p>
            <p className="text-xs text-text-secondary">Pending</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-xl font-bold text-text">{approvedCount}</p>
            <p className="text-xs text-text-secondary">Approved</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <div>
            <p className="text-xl font-bold text-text">{listings.length}</p>
            <p className="text-xs text-text-secondary">Total Listings</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <p className="text-xl font-bold text-text">{users.length}</p>
            <p className="text-xs text-text-secondary">Users</p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-border p-1 w-fit">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'listings' ? 'gradient-primary text-white shadow-sm' : 'text-text-secondary hover:text-primary'
          }`}
        >
          Listings ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'users' ? 'gradient-primary text-white shadow-sm' : 'text-text-secondary hover:text-primary'
          }`}
        >
          Users ({users.length})
        </button>
      </div>

      {/* Listing Sub-Filter Tabs (only when listings tab is active) */}
      {activeTab === 'listings' && (
        <div className="flex gap-2 mb-4">
          {([
            { key: 'pending' as ListingFilter, label: 'Pending Review', count: pendingCount },
            { key: 'approved' as ListingFilter, label: 'Approved', count: approvedCount },
            { key: 'all' as ListingFilter, label: 'All', count: listings.length },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setListingFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                listingFilter === tab.key
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-white border-border text-text-secondary hover:border-primary/20 hover:text-primary'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${
                listingFilter === tab.key ? 'bg-primary text-white' : 'bg-border/50 text-text-secondary'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <img src="/images/logo.svg" alt="" className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 object-contain" />
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
        <>
          {/* Pending alert banner */}
          {pendingCount > 0 && listingFilter !== 'approved' && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
              <p className="text-amber-800 font-medium">
                {pendingCount} listing{pendingCount !== 1 ? 's' : ''} waiting for your approval.
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Title</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Approval</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Posted By</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Date</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((listing) => (
                    <tr key={listing.id} className={`border-b border-border/50 hover:bg-surface-hover transition-colors ${!listing.is_approved ? 'bg-amber-50/30' : ''}`}>
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
                      <td className="px-4 py-3">
                        {listing.is_approved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{listing.profiles?.organization_name || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{new Date(listing.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {!listing.is_approved ? (
                            <button
                              onClick={() => approveListing(listing.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => rejectListing(listing.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              Unapprove
                            </button>
                          )}
                          <button
                            onClick={() => deleteListing(listing.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-danger hover:text-white hover:bg-danger border border-danger/30 hover:border-danger rounded-lg transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredListings.length === 0 && (
              <div className="text-center py-12 text-sm text-text-secondary">
                {listingFilter === 'pending' ? 'No listings pending approval.' :
                 listingFilter === 'approved' ? 'No approved listings yet.' :
                 'No listings found.'}
              </div>
            )}
          </div>
        </>
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
                {filteredUsers.map((u) => (
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
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-sm text-text-secondary">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
