import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-[#0A192F]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-heading font-extrabold text-xl text-[#F8FAFC] tracking-tight">
          eMediCare
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive
                ? 'text-white bg-[#112240]'
                : 'text-white/60 hover:text-white'
              }`
            }
          >
            Home
          </NavLink>
          <button
            type="button"
            onClick={() => scrollToSection('about-section')}
            className="px-4 py-1.5 rounded-full text-sm font-medium text-white/60 hover:text-white transition-all duration-300"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('contact-section')}
            className="px-4 py-1.5 rounded-full text-sm font-medium text-white/60 hover:text-white transition-all duration-300"
          >
            Contact
          </button>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link 
            to="/login" 
            className="px-5 py-2 border border-white/20 rounded-xl text-sm font-bold text-[#F8FAFC] hover:bg-white hover:text-[#0A192F] transition-all duration-300"
          >
            Sign In
          </Link>
          <Link 
            to="/register" 
            className="px-5 py-2 bg-[#F8FAFC] rounded-xl text-sm font-bold text-[#0A192F] shadow-lg shadow-black/20 hover:scale-105 transition-all duration-300"
          >
            Get Started
          </Link>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-[#F8FAFC] rounded transition-all duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#F8FAFC] rounded transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#F8FAFC] rounded transition-all duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-1 px-6 py-4 bg-[#0A192F] border-t border-white/10 animate-fade-up">
          <NavLink
            to="/"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all"
          >
            Home
          </NavLink>
          <button
            type="button"
            onClick={() => scrollToSection('about-section')}
            className="text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('contact-section')}
            className="text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all"
          >
            Contact
          </button>
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2 mt-1">
            <Link to="/login" onClick={() => setMenuOpen(false)} className="w-full py-3 text-center border border-white/20 rounded-xl text-sm font-bold text-[#F8FAFC]">Sign In</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="w-full py-3 text-center bg-[#22C55E] rounded-xl text-sm font-bold text-[#0A192F]">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}
