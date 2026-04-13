import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: '/',        label: 'Home' },
    { to: '/about',   label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-bg/85 backdrop-blur-xl border-b border-white/[0.07]">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between gap-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-heading font-extrabold text-xl text-gradient">
          <span className="text-2xl">⚕</span>
          eMediCare
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
          </div>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-white rounded transition-all duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white rounded transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white rounded transition-all duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-1 px-6 py-4 bg-bg-2 border-t border-white/[0.07] animate-fade-up">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              {label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-white/[0.07] flex flex-col gap-2 mt-1">
            <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-ghost text-sm justify-center">Sign In</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm justify-center">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}
