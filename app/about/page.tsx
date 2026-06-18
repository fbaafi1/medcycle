import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | The MedCycle',
  description: 'Learn about The MedCycle\'s mission to reduce medical waste and improve healthcare access by connecting surplus medication donors with clinics in need.',
};

const TEAM = [
  { name: 'Dr. Amina Okafor', role: 'Co-Founder & CEO', emoji: '👩‍⚕️', bio: 'Former consultant physician with 15 years of experience in public health policy across West Africa.' },
  { name: 'Emeka Nwachukwu', role: 'Co-Founder & CTO', emoji: '👨‍💻', bio: 'Software engineer and health-tech advocate who built scalable systems for the Nigerian health ministry.' },
  { name: 'Fatima Bello', role: 'Head of Operations', emoji: '👩‍💼', bio: 'Supply-chain specialist with deep expertise in last-mile healthcare delivery in underserved regions.' },
  { name: 'Chidi Obi', role: 'Medical Safety Officer', emoji: '🔬', bio: 'Pharmacologist ensuring every donation meets strict safety and regulatory standards before distribution.' },
];

const VALUES = [
  { icon: '❤️', title: 'Compassion', desc: 'Every decision we make is guided by the impact it has on patients and communities in need.' },
  { icon: '🔒', title: 'Safety', desc: 'Rigorous verification ensures that every medication and device distributed is safe and within expiry.' },
  { icon: '🌍', title: 'Accessibility', desc: 'We believe quality healthcare resources should reach every corner of the country, regardless of wealth.' },
  { icon: '🤝', title: 'Collaboration', desc: 'Hospitals, clinics, NGOs, and regulators work together on our platform to maximise collective impact.' },
];

const MILESTONES = [
  { year: '2022', event: 'MedCycle founded with 5 pilot hospitals in Lagos.' },
  { year: '2023', event: 'Expanded to 6 states; 10,000 medicine units redistributed.' },
  { year: '2024', event: 'NGO partnership programme launched; first international collaboration.' },
  { year: '2025', event: 'Platform redesigned; mobile app beta released to 500 users.' },
  { year: '2026', event: '50,000 units redistributed; 18 states covered; 120 + partners.' },
];

export default function AboutPage() {
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
                The MedCycle is a Nigerian health-tech platform that enables hospitals, pharmacies,
                and healthcare organisations to list and donate surplus medications, equipment, and
                supplies to clinics, NGOs, and communities that are underserved.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Founded in 2022, we saw a systemic problem: well-resourced hospitals routinely
                discard valuable, unexpired medications while nearby clinics run critical shortages.
                Our answer is a verified, transparent marketplace for medical redistribution.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {[
                { icon: '🎯', title: 'Our Mission', desc: 'Reduce medical waste and improve healthcare access through technology-enabled resource sharing.' },
                { icon: '🔭', title: 'Our Vision', desc: 'A Nigeria—and eventually an Africa—where no medication expires unused while a patient goes without.' },
                { icon: '📍', title: 'Where We Work', desc: 'Currently active in 18 states, with plans to achieve nationwide coverage by the end of 2027.' },
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

      {/* ── Values ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold
              rounded-full uppercase tracking-wider mb-3">What We Stand For</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text">Our Core Values</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <div key={v.title}
                className="text-center p-8 rounded-2xl bg-background border border-border
                  hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                  animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}>
                <div className="text-5xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-text mb-3">{v.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold
              rounded-full uppercase tracking-wider mb-3">Our Journey</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text">Milestones</h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-accent" />

            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <div key={m.year} className="flex items-start gap-6 animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="relative shrink-0 w-16 h-16 rounded-full gradient-primary
                    flex items-center justify-center text-white font-extrabold text-xs
                    shadow-lg ring-4 ring-background z-10">
                    {m.year}
                  </div>
                  <div className="bg-surface rounded-xl border border-border p-5 flex-1
                    hover:shadow-md transition-shadow">
                    <p className="text-text text-sm leading-relaxed">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold
              rounded-full uppercase tracking-wider mb-3">The People</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text">Meet Our Team</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member, i) => (
              <div key={member.name}
                className="bg-background rounded-2xl border border-border overflow-hidden
                  hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}>
                <div className="h-36 gradient-hero flex items-center justify-center text-7xl">
                  {member.emoji}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-text">{member.name}</h3>
                  <p className="text-primary text-xs font-semibold mb-3">{member.role}</p>
                  <p className="text-text-secondary text-xs leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
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
