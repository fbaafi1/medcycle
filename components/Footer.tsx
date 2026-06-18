export default function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="/images/The_MedCycle_Logo.svg"
                alt="The MedCycle Logo"
                className="w-12 h-12 object-contain drop-shadow-sm"
              />
              <span className="text-lg font-bold text-primary-dark">The Med<span className="text-secondary">Cycle</span></span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Connecting healthcare providers to share and redistribute medical resources efficiently.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-sm text-text-secondary hover:text-primary transition-colors">Browse Listings</a></li>
              <li><a href="/listings/create" className="text-sm text-text-secondary hover:text-primary transition-colors">Post a Listing</a></li>
              <li><a href="/auth/signup" className="text-sm text-text-secondary hover:text-primary transition-colors">Create Account</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-3">Reach Us</h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+233501651008" className="hover:text-primary transition-colors">+233 501 651 008</a>
              </li>
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>A/R – Oduom, Ghana</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="text-xs text-text-secondary">&copy; {new Date().getFullYear()} The MedCycle. Healthcare resource exchange platform.</p>
        </div>
      </div>
    </footer>
  );
}
