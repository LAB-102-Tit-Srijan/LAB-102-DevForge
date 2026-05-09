import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Upload, BarChart3 } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home', icon: <Sparkles className="w-4 h-4" /> },
    { path: '/teacher', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { path: '/analytics', label: 'Insights', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
      style={{ height: '80px' }}
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-coral to-coral-light flex items-center justify-center shadow-lg group-hover:shadow-[0_0_25px_rgba(245,158,139,0.3)] transition-shadow duration-300">
                <Sparkles className="w-5 h-5 text-bg-app" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-coral rounded-full pulse-ring" />
            </div>
            <span className="text-lg font-bold gradient-text tracking-tight">
              SheriSense
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link key={link.path} to={link.path}>
                  <button
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-[10px]
                      transition-all duration-300 cursor-pointer
                      ${isActive
                        ? 'bg-gradient-to-r from-coral to-coral-light text-bg-app shadow-lg'
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-card'
                      }
                    `}
                  >
                    {link.icon}
                    <span className="hidden sm:inline">{link.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
