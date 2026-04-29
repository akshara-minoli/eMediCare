import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import homeBg from '../images/home-background.jpg';

export default function Home() {
  const [counts, setCounts] = useState({ doctors: 0, patients: 0 });

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [docRes, patRes] = await Promise.all([
          fetch('/api/doctors'),
          fetch('/api/patients')
        ]);
        const docData = await docRes.json();
        const patData = await patRes.json();

        setCounts({
          doctors: docData.count || 0,
          patients: patData.count || 0
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    }
    fetchCounts();
  }, []);

  const stats = [
    { value: `${counts.doctors}+`, label: 'Verified Doctors' },
    { value: `${counts.patients}+`, label: 'Patients Served' },
    { value: '4.9/5', label: 'Average Rating' },
    { value: '24/7', label: 'Support Available' },
  ];
  return (
    <main className="pt-[72px] bg-bg min-h-screen">

      {/* ── Hero ── */}
      <section className="min-h-screen flex items-center relative overflow-hidden">
        {/* Background Image Layer */}
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${homeBg})` }}
        />

        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 py-20 text-center relative z-10">
          <div className="section-tag mb-6 mx-auto w-fit">🚀 AI-Powered Healthcare Platform</div>

          <h1 className="text-5xl md:text-7xl font-heading font-extrabold leading-tight mb-6 animate-fade-up">
            Your Health,{' '}
            <span className="inline-block px-4 py-1 glass text-[#F8FAFC] backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl shadow-black/20">Smarter</span>{' '}
            &amp; <span className="inline-block px-4 py-1 glass text-white backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl shadow-white/5">Simpler</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 animate-fade-up font-medium" style={{ animationDelay: '0.1s' }}>
            Book doctors, consult via video, check symptoms with AI, and manage your health — all in one seamless platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/register" className="px-8 py-3 bg-[#F8FAFC] text-[#0A192F] font-bold rounded-xl shadow-xl shadow-black/20 hover:scale-105 transition-all duration-300">
              Get Started — It's Free
            </Link>
            <Link to="/doctors" className="px-8 py-3 border border-white/20 text-[#F8FAFC] font-bold rounded-xl hover:bg-white/5 transition-all duration-300">
              Browse Doctors
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Row ── */}
      <section className="py-12 bg-[#F8FAFC] border-y border-[#D9E2EC]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center md:border-r last:border-r-0 border-[#D9E2EC]">
              <div className="text-3xl md:text-4xl font-heading font-extrabold text-[#0A192F] mb-1">{value}</div>
              <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── About Section ── */}
      <section id="about-section" className="py-24 bg-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-1.5 bg-[#F1F5F9] border border-[#D9E2EC] rounded-full text-[11px] font-bold text-[#0A192F] uppercase tracking-widest mb-6">
              About eMediCare
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-extrabold text-[#0A192F] leading-tight mb-6">
              Healthcare at your fingertips
            </h2>
            <p className="text-lg text-[#334155] leading-relaxed font-medium">
              We've built all the tools you need to manage your medical journey in one secure, world-class platform. 
              Designed for simplicity, trusted by specialists.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Doctor Booking', desc: 'Browse verified doctors by specialty and book in real time.', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
              { title: 'Video Consults', desc: 'Consult doctors from home via secure, HD video calls.', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> },
              { title: 'AI Health Insights', desc: 'Get instant, AI-powered insights for your symptoms.', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /> },
              { title: 'Secure Payments', desc: 'Pay securely using modern gateways and UPI.', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /> },
              { title: 'Digital Records', desc: 'Store and share your prescriptions and health history.', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
              { title: '24/7 Support', desc: 'Dedicated patient care team available at any hour.', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /> },
            ].map(({ title, desc, icon }) => (
              <div key={title} className="group p-10 bg-white border border-[#D9E2EC] rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-[#0A192F]/5 hover:-translate-y-2 transition-all duration-500">
                <div className="w-14 h-14 bg-[#F8FAFC] border border-[#D9E2EC] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#0A192F] group-hover:border-[#0A192F] transition-colors duration-300">
                  <svg className="w-7 h-7 text-[#0A192F] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {icon}
                  </svg>
                </div>
                <h3 className="text-xl font-bold font-heading text-[#0A192F] mb-4">{title}</h3>
                <p className="text-[#334155] leading-relaxed text-sm font-medium">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Video Section ── */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl font-heading font-extrabold text-[#0A192F] mb-4">eMediCare Videos</h2>
            <p className="text-[#334155] font-medium">Watch quick demos and tutorials from eMediCare. Experience how we're changing healthcare.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { id: 'MlNw4LovNjE', title: 'Platform Overview' },
              { id: '2MEy18SPIDM', title: 'Doctor Consultations' },
              { id: 'N_FLGcJgv8g', title: 'AI Health Guide' },
            ].map((video) => (
              <div key={video.id} className="group bg-white rounded-3xl overflow-hidden border border-[#D9E2EC] shadow-sm hover:shadow-xl transition-all duration-500">
                <div className="aspect-video relative">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-[#0A192F]">{video.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / Contact ── */}
      <section id="contact-section" className="py-16 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#0A192F] rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 text-left">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white mb-4">
                  Ready to take charge <br className="hidden md:block"/> of your health?
                </h2>
                <p className="text-base text-white/70 leading-relaxed font-medium">
                  Join 85,000+ patients using eMediCare for smarter healthcare. 
                  Experience the future of medical care today.
                </p>
              </div>
              
              <div className="flex flex-col items-center md:items-end gap-6 flex-shrink-0">
                <Link to="/register" className="px-10 py-5 bg-[#F8FAFC] text-[#0A192F] font-bold rounded-2xl shadow-xl shadow-black/20 hover:scale-105 transition-all duration-300">
                  Create Free Account — It's Fast
                </Link>
                <div className="text-sm text-white/50 text-center md:text-right">
                  support@emedicare.com <br/> +94 11 234 5678
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#F8FAFC] py-12 border-t border-[#D9E2EC]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#0A192F] flex items-center justify-center text-white font-bold">M</div>
            <span className="font-heading font-extrabold text-xl text-[#0A192F] tracking-tight">eMediCare</span>
          </div>
          <p className="text-[#64748B] text-sm font-medium">
            © {new Date().getFullYear()} eMediCare Healthcare platform. All rights reserved. Built for better healthcare.
          </p>
        </div>
      </footer>
    </main>
  );
}
