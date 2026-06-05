'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Listing, Profile, Report } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ListingFilter = 'pending' | 'approved' | 'all';

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'listings' | 'users' | 'reports'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [confirmDeleteListingId, setConfirmDeleteListingId] = useState<string | null>(null);
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
    const [listingsRes, usersRes, reportsRes] = await Promise.all([
      supabase.from('listings').select('*, profiles!listings_user_id_profiles_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase
        .from('reports')
        .select('*, listings(id, title, category, status, is_approved, profiles!listings_user_id_profiles_fkey(organization_name)), profiles!reports_reporter_id_profiles_fkey(organization_name, contact_person)')
        .order('created_at', { ascending: false }),
    ]);
    setListings(listingsRes.data || []);
    setUsers(usersRes.data || []);
    setReports((reportsRes.data as Report[]) || []);
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

  const toggleAdmin = async (targetUser: Profile) => {
    // Prevent removing own admin role
    if (targetUser.user_id === user?.id) {
      alert('You cannot change your own admin role.');
      return;
    }
    const newStatus = !targetUser.is_admin;
    const action = newStatus ? 'promote' : 'demote';
    if (!confirm(`Are you sure you want to ${action} "${targetUser.organization_name || targetUser.contact_person || 'this user'}" ${newStatus ? 'to' : 'from'} admin?`)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: newStatus })
      .eq('id', targetUser.id);
    if (error) {
      alert('Failed to update role: ' + error.message);
      return;
    }
    setUsers(users.map(u => u.id === targetUser.id ? { ...u, is_admin: newStatus } : u));
  };

  const dismissReport = async (reportId: string) => {
    setDismissingId(reportId);
    const { error } = await supabase.from('reports').delete().eq('id', reportId);
    if (error) { alert('Failed to dismiss: ' + error.message); setDismissingId(null); return; }
    setReports(prev => prev.filter(r => r.id !== reportId));
    setDismissingId(null);
  };

  const deleteListingFromReport = async (listingId: string) => {
    setDeletingListingId(listingId);
    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (error) { alert('Failed to delete listing: ' + error.message); setDeletingListingId(null); return; }
    setReports(prev => prev.filter(r => r.listing_id !== listingId));
    setListings(prev => prev.filter(l => l.id !== listingId));
    setDeletingListingId(null);
    setConfirmDeleteListingId(null);
  };

  if (authLoading || !profile?.is_admin) return null;

  const pendingCount = listings.filter(l => !l.is_approved).length;
  const approvedCount = listings.filter(l => l.is_approved).length;
  const reportsCount = reports.length;

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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
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
        <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <div>
            <p className="text-xl font-bold text-text">{users.filter(u => u.is_admin).length}</p>
            <p className="text-xs text-text-secondary">Admins</p>
          </div>
        </div>
        <div className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${reportsCount > 0 ? 'border-danger/40 bg-danger/5' : 'border-border'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${reportsCount > 0 ? 'bg-danger/10' : 'bg-slate-50'}`}>
            <svg className={`w-5 h-5 ${reportsCount > 0 ? 'text-danger' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </div>
          <div>
            <p className={`text-xl font-bold ${reportsCount > 0 ? 'text-danger' : 'text-text'}`}>{reportsCount}</p>
            <p className="text-xs text-text-secondary">Reports</p>
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
        <button
          onClick={() => setActiveTab('reports')}
          className={`relative px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'reports' ? 'gradient-primary text-white shadow-sm' : 'text-text-secondary hover:text-primary'
          }`}
        >
          Reports
          {reportsCount > 0 && (
            <span className={`ml-1.5 px-1.5 py-0.5 text-xs font-bold rounded-full ${
              activeTab === 'reports' ? 'bg-white/30 text-white' : 'bg-danger text-white'
            }`}>{reportsCount}</span>
          )}
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
      ) : activeTab === 'reports' ? (
        <>
          {reportsCount > 0 && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-danger/5 border border-danger/20 rounded-xl text-sm">
              <svg className="w-5 h-5 text-danger flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              <p className="text-danger font-medium">{reportsCount} flagged listing{reportsCount !== 1 ? 's' : ''} need your review.</p>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Listing</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Reason</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Reporter</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Details</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">Date</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className={`border-b border-border/50 transition-all duration-300 ${
                        dismissingId === report.id || deletingListingId === report.listing_id
                          ? 'opacity-40 pointer-events-none'
                          : 'hover:bg-surface-hover bg-danger/5'
                      }`}
                    >
                      <td className="px-4 py-3">
                        {report.listings ? (
                          <Link href={`/listings/${report.listing_id}`} className="font-medium text-text hover:text-primary transition-colors">
                            {report.listings.title}
                          </Link>
                        ) : (
                          <span className="text-text-secondary italic">Listing deleted</span>
                        )}
                        {report.listings && (
                          <p className="text-xs text-text-secondary capitalize mt-0.5">{report.listings.category}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-danger/10 text-danger border border-danger/20 capitalize">
                          {report.reason.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {report.profiles?.organization_name || report.profiles?.contact_person || '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary max-w-[180px]">
                        <span className="line-clamp-2 text-xs">{report.message || <span className="italic">No details provided</span>}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{new Date(report.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* View */}
                          {report.listings && (
                            <Link
                              href={`/listings/${report.listing_id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg transition-colors"
                            >
                              View
                            </Link>
                          )}

                          {/* Dismiss */}
                          <button
                            onClick={() => dismissReport(report.id)}
                            disabled={dismissingId === report.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary bg-white hover:bg-surface-hover border border-border rounded-lg transition-colors disabled:opacity-50"
                          >
                            {dismissingId === report.id ? (
                              <>
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Dismissing…
                              </>
                            ) : 'Dismiss'}
                          </button>

                          {/* Delete Listing — inline confirm */}
                          {report.listings && (
                            confirmDeleteListingId === report.listing_id ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-danger font-medium">Sure?</span>
                                <button
                                  onClick={() => deleteListingFromReport(report.listing_id)}
                                  disabled={deletingListingId === report.listing_id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white bg-danger hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {deletingListingId === report.listing_id ? (
                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                  ) : 'Yes, delete'}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteListingId(null)}
                                  className="px-2.5 py-1.5 text-xs font-medium text-text-secondary bg-white border border-border rounded-lg hover:bg-surface-hover transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteListingId(report.listing_id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-danger hover:text-white hover:bg-danger border border-danger/30 hover:border-danger rounded-lg transition-colors"
                              >
                                Delete Listing
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reportsCount === 0 && (
              <div className="text-center py-12">
                <svg className="w-10 h-10 text-success/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-text">No reports</p>
                <p className="text-xs text-text-secondary mt-1">The platform looks clean!</p>
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
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">License</th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary">Joined</th>
                  <th className="text-right px-4 py-3 font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={`border-b border-border/50 hover:bg-surface-hover transition-colors ${u.is_admin ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-text">{u.organization_name || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{u.contact_person || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{u.phone_number || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{u.location || '—'}</td>
                    <td className="px-4 py-3">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          User
                        </span>
                      )}
                    </td>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        {u.user_id === user?.id ? (
                          <span className="text-xs text-text-secondary italic">You</span>
                        ) : u.is_admin ? (
                          <button
                            onClick={() => toggleAdmin(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Remove Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleAdmin(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Make Admin
                          </button>
                        )}
                      </div>
                    </td>
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
