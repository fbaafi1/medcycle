import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Our Services | The MedCycle',
  description: 'Discover the full range of services The MedCycle offers — from medication redistribution and equipment donation to compliance reporting and partner integrations.',
};

const SERVICES = [
  {
    id: 'medication-redistribution',
    icon: '💊',
    color: 'from-blue-500 to-cyan-400',
    title: 'Medication Redistribution',
    tagline: 'Safe. Verified. Compliant.',
    desc: 'List surplus unexpired medications for redistribution to partner clinics and NGOs. Every listing is reviewed by our Medical Safety team before going live.',
    features: [
      'Automated expiry-date tracking with alerts',
      'Category tagging — generics, trade names, OTC',
      'Cold-chain guidance for temperature-sensitive drugs',
      'Batch upload for large inventory transfers',
    ],
  },
  {
    id: 'equipment-donation',
    icon: '🩺',
    color: 'from-emerald-500 to-teal-400',
    title: 'Medical Equipment Donation',
    tagline: 'Give equipment a second life.',
    desc: 'Donate or request defibrillators, imaging accessories, surgical instruments, and other devices through our equipment marketplace.',
    features: [
      'Condition grading system (A, B, C)',
      'Calibration records and service history upload',
      'Matched to verified healthcare facilities',
      'Collection and logistics coordination support',
    ],
  },
  {
    id: 'supply-sharing',
    icon: '📦',
    color: 'from-violet-500 to-purple-400',
    title: 'Medical Supply Sharing',
    tagline: 'From gloves to IV lines — nothing wasted.',
    desc: 'Hospital consumables, PPE, surgical drapes, and other single-use supplies can be transferred before their expiry to facilities that need them urgently.',
    features: [
      'Real-time availability search',
      'Emergency urgent-request flag',
      'Geolocation-based matching for faster transfers',
      'Traceability from donor to recipient',
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute top-10 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-cyan-300/10 rounded-full blur-2xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10
            backdrop-blur-sm rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft" />
            What We Offer
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">Services</span>
          </h1>
          <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
            From medication redistribution to compliance reporting, MedCycle provides everything
            your organisation needs to donate or receive healthcare resources safely.
          </p>
        </div>
      </section>

      {/* ── Services Grid ────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((service, i) => (
              <div
                id={service.id}
                key={service.id}
                className="bg-surface rounded-2xl border border-border overflow-hidden
                  hover:shadow-xl hover:-translate-y-2 transition-all duration-300
                  flex flex-col animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Card header */}
                <div className={`h-32 bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                  <span className="text-6xl drop-shadow-lg">{service.icon}</span>
                </div>

                <div className="p-7 flex flex-col flex-1">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                    {service.tagline}
                  </p>
                  <h2 className="text-xl font-bold text-text mb-3">{service.title}</h2>
                  <p className="text-text-secondary text-sm leading-relaxed mb-5">{service.desc}</p>

                  <ul className="space-y-2 flex-1">
                    {service.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <svg className="w-4 h-4 text-secondary shrink-0 mt-0.5" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold
              rounded-full uppercase tracking-wider mb-3">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text">From Listing to Delivery</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: '1', icon: '📝', title: 'Register', desc: 'Create an account for your organisation and submit verification documents.' },
              { n: '2', icon: '📋', title: 'List', desc: 'Post surplus medications or equipment with quantities, expiry dates, and photos.' },
              { n: '3', icon: '✅', title: 'Review', desc: 'Our safety team approves the listing within 48 hours.' },
              { n: '4', icon: '🤝', title: 'Connect', desc: 'Recipients contact donors directly via the platform to arrange pickup of the resource.' },
            ].map((step) => (
              <div key={step.n} className="text-center relative">
                {/* Connector line */}
                <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-primary/40 to-transparent" />
                <div className="relative w-16 h-16 mx-auto rounded-full gradient-primary
                  flex items-center justify-center text-2xl shadow-lg mb-4 z-10">
                  {step.icon}
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 ml-5 w-5 h-5 bg-secondary
                  rounded-full text-white text-xs font-bold flex items-center justify-center z-20 shadow-sm">
                  {step.n}
                </div>
                <h3 className="font-bold text-text mb-2">{step.title}</h3>
                <p className="text-text-secondary text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 gradient-hero text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold mb-4">Ready to Get Started?</h2>
          <p className="text-blue-200 text-lg mb-8">
            Register your organisation today and start listing surplus resources in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-dark
                font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-xl text-base">
              Register Free
            </Link>
            <Link href="/listings"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/30
                text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base">
              Browse Listings
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
