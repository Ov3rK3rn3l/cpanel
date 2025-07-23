import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, LogIn, UserPlus, PanelLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileDropdown from './ProfileDropdown';
import { cn } from '@/lib/utils';

const NavItem = ({ to, icon, children, exact = false }) => {
  const location = useLocation();
  const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <NavLink to={to} className="focus:outline-none">
      {({ isPending }) => (
        <Button
          variant="ghost"
          className={cn(
            'nav-item relative text-base font-semibold transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isActive ? 'text-primary' : 'text-foreground/80 hover:text-primary-foreground',
            'hover:bg-primary',
            isPending && 'opacity-50'
          )}
        >
          <div className="flex items-center">
            {React.cloneElement(icon, { className: 'h-5 w-5 mr-2' })}
            {children}
          </div>
          {isActive && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              layoutId="underline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </Button>
      )}
    </NavLink>
  );
};

const Navbar = () => {
  const { user, userRole, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const navLinks = (
    <>
      <NavItem to="/" icon={<Home />} exact={true}>Início</NavItem>
      {!user && (
        <>
          <NavItem to="/recrutamento" icon={<UserPlus />}>Ingressão</NavItem>
          <NavItem to="/login" icon={<LogIn />}>Login</NavItem>
        </>
      )}
    </>
  );
  
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "bg-card/80 backdrop-blur-lg border-b border-primary/20 shadow-lg" : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <NavLink to="/" className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
            <motion.img
                src="https://storage.googleapis.com/hostinger-horizons-assets-prod/8b34e97e-b1fb-436b-96f9-daf091378bb8/addbf301f58207e2da8fde334ce3a5ab.png"
                alt="Logo do Clã GERR"
                className="h-16 w-16 object-contain transition-transform duration-500 ease-out group-hover:rotate-[15deg] group-hover:scale-110"
                whileHover={{ rotate: 10, scale: 1.1 }}
            />
          </NavLink>
          
          <div className="hidden md:flex items-center space-x-2">
            {navLinks}
            {user && (
              <ProfileDropdown userRole={userRole} onLogout={handleLogout} />
            )}
          </div>
          
          <div className="md:hidden">
            <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="ghost" size="icon">
              <PanelLeft className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-card/95 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center space-y-2 px-4 pb-4">
              {navLinks}
              {user && (
                 <>
                  <NavItem to="/dashboard" icon={<Home />}>Meu Dashboard</NavItem>
                  {(userRole === 'admin' || userRole === 'moderador' || userRole === 'recrutador') && <NavItem to="/admin/dashboard" icon={<Home />}>Meu Painel</NavItem>}
                  <NavItem to="/steam-scanner" icon={<Home />}>Scanner Steam</NavItem>
                  <NavItem to="/profile" icon={<Home />}>Configurações</NavItem>
                  <Button onClick={handleLogout} variant="destructive" className="w-full mt-2">Sair</Button>
                 </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;