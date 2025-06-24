import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/8b34e97e-b1fb-436b-96f9-daf091378bb8/519b1217a63f280edc7011c34bcde09f.png";

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { name: 'Início', path: '/', roles: ['public', 'member', 'recrutador', 'moderador', 'admin'] },
    { name: 'Painel Admin', path: '/admin/dashboard', roles: ['recrutador', 'moderador', 'admin'] },
    { name: 'Meu Painel', path: '/dashboard', roles: ['member'] },
  ];

  const getVisibleNavItems = () => {
    if (!user) return navItems.filter(item => item.roles.includes('public'));
    return navItems.filter(item => userRole && item.roles.includes(userRole));
  };
  
  const visibleNavItems = getVisibleNavItems();

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" } }
  };

  return (
    <nav className="bg-card/80 backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b border-primary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center group" onClick={() => setIsMobileMenuOpen(false)}>
            <img src={logoUrl} alt="Logo Clã GERR" className="h-16 w-auto transition-transform duration-300 group-hover:scale-110" />
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {visibleNavItems.map((item) => (
              <Button key={item.name} variant="ghost" asChild className="text-foreground hover:text-primary hover:bg-primary/10 transition-colors duration-200">
                <Link to={item.path}>{item.name}</Link>
              </Button>
            ))}
            {user ? (
              <Button onClick={handleLogout} variant="outline" className="btn-outline-dark">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            ) : (
              <Button asChild className="btn-primary-dark">
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground hover:text-primary"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden absolute top-20 left-0 right-0 bg-card/95 backdrop-blur-md shadow-xl border-t border-primary/20 pb-4 z-40"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {visibleNavItems.map((item) => (
                <Button key={item.name} variant="ghost" asChild className="w-full justify-start text-lg py-3 text-foreground hover:text-primary hover:bg-primary/10">
                  <Link to={item.path} onClick={() => setIsMobileMenuOpen(false)}>{item.name}</Link>
                </Button>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-primary/30 px-5">
              {user ? (
                <Button onClick={handleLogout} variant="outline" className="w-full btn-outline-dark text-lg py-3">
                  <LogOut className="mr-2 h-5 w-5" /> Sair
                </Button>
              ) : (
                <Button asChild className="w-full btn-primary-dark text-lg py-3">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <LogIn className="mr-2 h-5 w-5" /> Login
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;