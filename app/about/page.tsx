'use client';

import { useState } from 'react';



const FAQS = [
  {
    q: 'Who can donate medications or medical supplies?',
    a: 'Any registered hospital, pharmacy, clinic, or healthcare organisation operating in Ghana can sign up and list surplus, unexpired medications or medical equipment for donation.',
  },
  {
    q: 'Is The MedCycle free to use?',
    a: 'Yes — creating an account, browsing listings, and posting donations are completely free. Our goal is to make medical redistribution as accessible as possible.',
  },
  {
    q: 'How are donated medications verified for safety?',
    a: 'Every listing goes through a review process. Donors are required to confirm expiry dates, storage conditions, and quantity. Our team and platform guidelines enforce strict safety standards before redistribution.',
  },
  {
    q: 'Who can receive donated items?',
    a: 'Verified clinics, NGOs, community health centres, and government health facilities across Ghana can request and receive donated items listed on the platform.',
  },
  {
    q: 'What types of items can be listed?',
    a: 'Surplus prescription and over-the-counter medications, medical devices, consumables (gloves, syringes, PPE), and diagnostic equipment — all must be unexpired and in good condition.',
  },
  {
    q: 'Where is The MedCycle currently available?',
    a: 'We are currently operating in Ghana, based in the Ashanti Region (Oduom). We plan to expand across West Africa in the coming years.',
  },
];

function FAQItem({ q, a, index, isOpen, onToggle }: {
  q: string; a: string; index: number; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden bg-white
        ${isOpen ? 'border-primary/40 shadow-md' : 'border-border hover:border-primary/20'}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={isOpen}
        id={`faq-btn-${index}`}
      >
        <span className="font-semibold text-text text-sm sm:text-base">{q}</span>
        <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
          ${isOpen ? 'bg-primary text-white rotate-45' : 'bg-surface text-text-secondary'}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <p className="px-6 pb-5 text-text-secondary text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-300/10 rounded-full blur-2xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10
            backdrop-blur-sm rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft" />
            Our Story
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
            About The <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">MedCycle</span>
          </h1>
          <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
            We're on a mission to eliminate medical waste and bridge the gap between surplus
            resources and the communities that need them most.
          </p>
        </div>
      </section>

      {/* ── Mission & Vision ─────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold
                rounded-full uppercase tracking-wider mb-4">Who We Are</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-text mb-6">
                Connecting Surplus to Need
              </h2>
              <p className="text-text-secondary leading-relaxed mb-5">
                The MedCycle is a Ghanaian health-tech platform that enables hospitals, pharmacies,
                and healthcare organisations to list and donate surplus medications, equipment, and
                supplies to clinics, NGOs, and communities that are underserved.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Founded in 2026, we identified a systemic problem: well-resourced hospitals routinely
                discard valuable, unexpired medications while nearby clinics run critical shortages.
                Our answer is a verified, transparent marketplace for medical redistribution.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {[
                { icon: '🎯', title: 'Our Mission', desc: 'Reduce medical waste and improve healthcare access through technology-enabled resource sharing.' },
                { icon: '🔭', title: 'Our Vision', desc: 'A Ghana—and eventually an Africa—where no medication expires unused while a patient goes without.' },
                { icon: '📍', title: 'Where We Work', desc: 'Currently operating in Ghana, with plans to expand across West Africa.' },
                { icon: '👥', title: 'Who We Serve', desc: 'Hospitals, clinics, NGOs, community pharmacies, and government health facilities of all sizes.' },
              ].map((card) => (
                <div key={card.title} className="bg-surface rounded-2xl p-6 border border-border
                  hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="text-3xl mb-3">{card.icon}</div>
                  <h3 className="font-bold text-text text-sm mb-2">{card.title}</h3>
                  <p className="text-text-secondary text-xs leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold
              rounded-full uppercase tracking-wider mb-3">Got Questions?</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">Frequently Asked Questions</h2>
            <p className="text-text-secondary text-base">
              Everything you need to know about The MedCycle platform.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FAQItem
                key={i}
                q={faq.q}
                a={faq.a}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Us ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold
              rounded-full uppercase tracking-wider mb-3">Get In Touch</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">Contact Us</h2>
            <p className="text-text-secondary text-base max-w-xl mx-auto">
              Have a question, a partnership idea, or need support? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">

            {/* Phone */}
            <a href="tel:+233501651008"
              className="flex flex-col items-center text-center gap-4 p-8 bg-background rounded-2xl border border-border
                hover:border-primary/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Phone</p>
                <p className="font-bold text-text text-base group-hover:text-primary transition-colors">+233 501 651 008</p>
              </div>
            </a>

            {/* Location */}
            <div className="flex flex-col items-center text-center gap-4 p-8 bg-background rounded-2xl border border-border
              hover:border-primary/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Location</p>
                <p className="font-bold text-text text-base">Oduom, Ashanti Region</p>
                <p className="text-text-secondary text-sm">Ghana 🇬🇭</p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center text-center gap-4 p-8 bg-background rounded-2xl border border-border
              hover:border-primary/40 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Available</p>
                <p className="font-bold text-text text-base">Mon – Fri, 8am – 5pm</p>
                <p className="text-text-secondary text-sm">Ghana Standard Time (GMT)</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 gradient-hero text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold mb-4">Join the Movement</h2>
          <p className="text-blue-200 text-lg mb-8">
            Be part of a growing community of healthcare providers committed to reducing waste
            and saving lives.
          </p>
          <a href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-dark
              font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-xl text-base">
            Register Your Organisation
          </a>
        </div>
      </section>
    </div>
  );
}
