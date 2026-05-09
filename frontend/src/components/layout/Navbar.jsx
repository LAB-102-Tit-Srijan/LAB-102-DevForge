import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Upload, BarChart3, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

const Navbar = () => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home', icon: <Sparkles className="w-4 h-4" /> },
    { path: '/teacher', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
            </div>
            <span className="text-lg font-bold gradient-text">
              SheriSense
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant={location.pathname === link.path ? 'default' : 'ghost'}
                  size="sm"
                >
                  {link.icon}
                  <span className="hidden sm:inline">{link.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
