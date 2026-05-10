import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Upload, BarChart3, FileVideo } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Home', icon: <Sparkles className="w-4 h-4" /> },
    { path: '/library', label: 'Library', icon: <FileVideo className="w-4 h-4" /> },
    { path: '/teacher', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { path: '/analytics', label: 'Insights', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="max-w-[1400px] mx-auto w-full h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-[28px] h-[28px] rounded-md bg-[var(--accent-muted)] flex items-center justify-center transition-transform group-hover:scale-105">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-primary)' }}>
            SherySense
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link key={link.path} to={link.path}>
                <button className={`nav-link ${isActive ? 'active' : ''} flex items-center gap-2`}>
                  {link.icon}
                  <span className="hidden sm:inline">{link.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
