import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <main className="min-h-screen bg-bg">

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/20 via-primary/10 to-transparent" />
        <span className="text-5xl">📬</span>
        <h1 className="mt-4 font-heading font-extrabold text-4xl md:text-5xl text-gradient">
          Contact Us
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-white/60 text-lg leading-relaxed">
          Have a question, feedback, or need support? We're here to help — reach out
          and our team will get back to you within 24 hours.
        </p>
      </section>

      <section className="py-12 px-6 max-w-5xl mx-auto grid md:grid-cols-2 gap-10">

        {/* Info */}
        <div className="flex flex-col gap-6">
          {[
            { icon: '📍', title: 'Our Office',   info: '42 Health Tower, Colombo 07, Sri Lanka' },
            { icon: '📞', title: 'Phone',         info: '+94 11 234 5678' },
            { icon: '✉️', title: 'Email',         info: 'support@emedicare.lk' },
            { icon: '🕐', title: 'Working Hours', info: 'Mon – Fri, 8 AM – 8 PM IST' },
          ].map(({ icon, title, info }) => (
            <div key={title} className="card p-6 flex items-start gap-4 hover:shadow-glow transition-all duration-300">
              <span className="text-3xl mt-0.5">{icon}</span>
              <div>
                <h3 className="font-heading font-semibold text-white">{title}</h3>
                <p className="text-white/55 text-sm mt-0.5">{info}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="card p-8">
          {sent ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
              <span className="text-6xl">✅</span>
              <h2 className="font-heading font-bold text-2xl text-white">Message Sent!</h2>
              <p className="text-white/55">Thanks for reaching out. We'll reply within 24 hours.</p>
              <button onClick={() => { setForm({ name: '', email: '', subject: '', message: '' }); setSent(false); }} className="btn-primary text-sm px-6 py-2 mt-2">
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h2 className="font-heading font-bold text-xl text-white mb-2">Send a Message</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/50 font-medium">Name</label>
                  <input
                    id="contact-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="input-field"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/50 font-medium">Email</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@email.com"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/50 font-medium">Subject</label>
                <input
                  id="contact-subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  placeholder="How can we help?"
                  className="input-field"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/50 font-medium">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Write your message here..."
                  className="input-field resize-none"
                />
              </div>

              <button type="submit" id="contact-submit" className="btn-primary text-sm py-3 mt-1">
                Send Message 🚀
              </button>
            </form>
          )}
        </div>
      </section>

    </main>
  );
}
