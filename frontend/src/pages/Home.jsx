import { Link } from 'react-router-dom';

const features = [
  { icon: '🩺', title: 'Doctor Booking',      desc: 'Browse verified doctors by specialty and book appointments in real time.' },
  { icon: '📹', title: 'Video Consultation',  desc: 'Consult doctors from home via secure, HD video calls.' },
  { icon: '🤖', title: 'AI Symptom Checker',  desc: 'Describe your symptoms and get instant AI-powered health insights.' },
  { icon: '💳', title: 'Easy Payments',       desc: 'Pay securely using card, UPI, or netbanking.' },
  { icon: '🔔', title: 'Smart Alerts',        desc: 'Get timely SMS and email reminders for your appointments.' },
  { icon: '📋', title: 'Digital Prescriptions', desc: 'Receive and store prescriptions digitally after every consult.' },
];

const stats = [
  { value: '500+', label: 'Verified Doctors' },
  { value: '50k+', label: 'Patients Served' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '24/7', label: 'Support Available' },
];

export default function Home() {
  return (
    <main className="pt-[72px]">

      {/* ── Hero ── */}
      <section className="min-h-screen flex items-center bg-gradient-hero relative overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 py-20 text-center relative z-10">
          <div className="section-tag mb-6 mx-auto w-fit">🚀 AI-Powered Healthcare Platform</div>

          <h1 className="text-5xl md:text-7xl font-heading font-extrabold leading-tight mb-6 animate-fade-up">
            Your Health,{' '}
            <span className="text-gradient">Smarter</span>{' '}
            &amp; Simpler
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Book doctors, consult via video, check symptoms with AI, and manage your health — all in one seamless platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/register" className="btn-primary px-8 py-3 text-base">Get Started — It's Free</Link>
            <Link to="/doctors"  className="btn-outline px-8 py-3 text-base">Browse Doctors</Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 border-y border-white/[0.07]">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <div className="text-4xl font-heading font-extrabold text-gradient mb-1">{value}</div>
              <div className="text-sm text-white/50">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="section-tag mx-auto w-fit mb-4">Everything You Need</div>
            <h2 className="text-4xl font-heading font-bold">Healthcare at your fingertips</h2>
            <p className="text-white/50 mt-3 max-w-xl mx-auto">All the tools you need to manage your health in one place.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="card group">
                <div className="text-4xl mb-4 group-hover:animate-float inline-block">{icon}</div>
                <h3 className="text-lg font-semibold font-heading mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 mx-6 mb-16 rounded-3xl bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-center px-6">
          <h2 className="text-4xl font-heading font-bold mb-4">Ready to take charge of your health?</h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">Join thousands of patients already using eMediCare for smarter healthcare.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary font-bold rounded-full text-base hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.07] py-8 text-center text-white/30 text-sm">
        © {new Date().getFullYear()} eMediCare. Built with ❤️ for better healthcare.
      </footer>
    </main>
  );
}
