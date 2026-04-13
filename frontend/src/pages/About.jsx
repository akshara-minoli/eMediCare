export default function About() {
  const team = [
    { name: 'Dr. Aisha Patel', role: 'Chief Medical Officer', emoji: '👩‍⚕️' },
    { name: 'Rahul Menon',     role: 'Lead Engineer',         emoji: '👨‍💻' },
    { name: 'Sara Nair',       role: 'UX / Product Design',   emoji: '🎨' },
    { name: 'James Okonkwo',   role: 'AI & Data Science',     emoji: '🤖' },
  ];

  return (
    <main className="min-h-screen bg-bg">

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" />
        <span className="text-5xl">⚕️</span>
        <h1 className="mt-4 font-heading font-extrabold text-4xl md:text-5xl text-gradient">
          About eMediCare
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-white/60 text-lg leading-relaxed">
          eMediCare is a next-generation telehealth platform connecting patients
          with certified doctors, AI-powered diagnostics, and seamless appointment
          management — all in one place.
        </p>
      </section>

      {/* Mission */}
      <section className="py-16 px-6 max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        {[
          { icon: '🎯', title: 'Our Mission', body: 'Make quality healthcare accessible to everyone, anywhere, at any time through technology.' },
          { icon: '🌍', title: 'Our Vision',  body: 'A world where no one is denied care because of geography, cost, or lack of information.' },
          { icon: '💡', title: 'Our Values',  body: 'Transparency, empathy, innovation, and patient-first thinking in everything we build.' },
        ].map(({ icon, title, body }) => (
          <div key={title} className="card p-8 text-center hover:shadow-glow transition-all duration-300">
            <div className="text-4xl mb-4">{icon}</div>
            <h2 className="font-heading font-bold text-xl text-white mb-2">{title}</h2>
            <p className="text-white/55 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      {/* Team */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="font-heading font-bold text-3xl text-white text-center mb-10">Meet the Team</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {team.map(({ name, role, emoji }) => (
            <div
              key={name}
              className="card p-6 flex flex-col items-center text-center gap-3 hover:scale-105 hover:shadow-glow transition-all duration-300"
            >
              <span className="text-5xl">{emoji}</span>
              <h3 className="font-heading font-semibold text-white">{name}</h3>
              <p className="text-white/50 text-xs">{role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-bg-2 mt-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { stat: '50K+',  label: 'Patients Served' },
            { stat: '1,200', label: 'Certified Doctors' },
            { stat: '98%',   label: 'Satisfaction Rate' },
            { stat: '24/7',  label: 'Support Available' },
          ].map(({ stat, label }) => (
            <div key={label}>
              <p className="text-3xl font-heading font-extrabold text-gradient">{stat}</p>
              <p className="text-white/50 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
