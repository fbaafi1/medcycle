'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        toggleRef.current && !toggleRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 gradient-primary rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-primary-dark tracking-tight">
              Med<span className="text-secondary">Cycle</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {user && (
              <>
                <Link href="/listings/create" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
                  Post Listing
                </Link>
                <Link href="/my-listings" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
                  My Listings
                </Link>
                <Link href="/profile" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary rounded-lg hover:bg-primary/5 transition-colors">
                  Profile
                </Link>
                {profile?.is_admin && (
                  <Link href="/admin" className="px-4 py-2 text-sm font-medium text-warning hover:text-amber-600 rounded-lg hover:bg-warning/5 transition-colors">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-9 bg-border/50 rounded-lg animate-pulse-soft" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary truncate max-w-[150px]">
                  {profile?.contact_person || user.email}
                </span>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm font-medium text-danger hover:bg-danger/5 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="px-5 py-2 text-sm font-semibold text-white gradient-primary rounded-lg hover:opacity-90 transition-opacity shadow-md">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={toggleRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-primary/5 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu - overlays content */}
        {mobileMenuOpen && (
          <div ref={menuRef} className="md:hidden absolute right-4 top-14 w-64 bg-white border border-border rounded-xl shadow-lg animate-fade-in z-50">
            <div className="py-2 px-2">
            {user ? (
              <>
                <Link href="/listings/create" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg">
                  Post a Listing
                </Link>
                <Link href="/my-listings" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg">
                  My Listings
                </Link>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg">
                  Profile
                </Link>
                {profile?.is_admin && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-warning hover:bg-warning/5 rounded-lg">
                    Admin Panel
                  </Link>
                )}
                <div className="border-t border-border mt-2 pt-2 px-4">
                  <p className="text-xs text-text-secondary mb-2 truncate">{user.email}</p>
                  <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-sm font-medium text-danger hover:bg-danger/5 rounded-lg px-2">
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2 px-4 pt-3 border-t border-border mt-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-white gradient-primary rounded-lg hover:opacity-90 transition-opacity">
                  Sign Up
                </Link>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
