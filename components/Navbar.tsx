'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const PUBLIC_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/listings', label: 'Listings' },
];

export default function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className={`bg-white sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-md border-b border-border' : 'border-b border-border shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 sm:h-24">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/images/The_MedCycle_Logo.svg"
              alt="The MedCycle Logo"
              className="w-14 h-14 sm:w-20 sm:h-20 object-contain group-hover:scale-105 transition-transform drop-shadow-md"
            />
            <span className="text-xl sm:text-2xl font-bold text-primary-dark tracking-tight">
              The Med<span className="text-secondary">Cycle</span>
            </span>
          </Link>

          {/* Desktop Nav – Public links (always visible) */}
          <div className="hidden md:flex items-center gap-1">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.href)
                    ? 'text-primary bg-primary/8 font-semibold'
                    : 'text-text-secondary hover:text-primary hover:bg-primary/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Auth-only links */}
            {user && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <Link href="/listings/create" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/listings/create') ? 'text-primary bg-primary/8 font-semibold' : 'text-text-secondary hover:text-primary hover:bg-primary/5'
                }`}>
                  Post Listing
                </Link>
                <Link href="/my-listings" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/my-listings') ? 'text-primary bg-primary/8 font-semibold' : 'text-text-secondary hover:text-primary hover:bg-primary/5'
                }`}>
                  My Listings
                </Link>
                <Link href="/profile" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/profile') ? 'text-primary bg-primary/8 font-semibold' : 'text-text-secondary hover:text-primary hover:bg-primary/5'
                }`}>
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
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div ref={menuRef} className="md:hidden absolute right-4 top-[5.5rem] w-72 bg-white border border-border rounded-2xl shadow-xl animate-fade-in z-50 overflow-hidden">
            <div className="py-3 px-2">

              {/* Public links */}
              <p className="px-4 py-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Navigation</p>
              {PUBLIC_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl mx-1 transition-colors ${
                    isActive(link.href)
                      ? 'text-primary bg-primary/8 font-semibold'
                      : 'text-text-secondary hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Auth links */}
              {user ? (
                <>
                  <div className="border-t border-border my-2 mx-2" />
                  <p className="px-4 py-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Account</p>
                  <Link href="/listings/create" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 rounded-xl mx-1">
                    Post a Listing
                  </Link>
                  <Link href="/my-listings" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 rounded-xl mx-1">
                    My Listings
                  </Link>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 rounded-xl mx-1">
                    Profile
                  </Link>
                  {profile?.is_admin && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-warning hover:bg-warning/5 rounded-xl mx-1">
                      Admin Panel
                    </Link>
                  )}
                  <div className="border-t border-border mt-2 pt-2 px-4 pb-2">
                    <p className="text-xs text-text-secondary mb-2 truncate">{user.email}</p>
                    <button
                      onClick={() => { signOut(); setMobileMenuOpen(false); }}
                      className="w-full text-left py-2 text-sm font-medium text-danger hover:bg-danger/5 rounded-lg px-2"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2 px-3 pt-2 mt-2 border-t border-border pb-2">
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
