export default function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-lg font-bold text-primary-dark">Med<span className="text-secondary">Cycle</span></span>
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

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-3">Important</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              MedCycle is a resource-sharing platform. All users must ensure listed items are safe, properly stored, and suitable for use. MedCycle does not handle logistics or payments.
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="text-xs text-text-secondary">&copy; {new Date().getFullYear()} MedCycle. Healthcare resource exchange platform.</p>
        </div>
      </div>
    </footer>
  );
}
