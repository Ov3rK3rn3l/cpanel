import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, User, Settings, LogOut, Store, Package, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const sidebarVariants = {
  open: { x: 0 },
  closed: { x: "100%" }
};

const backdropVariants = {
  open: { opacity: 1 },
  closed: { opacity: 0 }
};

const MemberSidebar = ({ isOpen, setIsOpen, memberData }) => {
  const { logout, userRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Meu Perfil', icon: <User className="h-5 w-5" />, path: '/profile' },
    { label: 'Loja', icon: <Store className="h-5 w-5" />, path: '/store' },
    { label: 'Meu Inventário', icon: <Package className="h-5 w-5" />, path: '/inventory' },
    ...(userRole === 'admin' || userRole === 'moderador' || userRole === 'recrutador'
      ? [{ label: 'Painel Admin', icon: <Settings className="h-5 w-5" />, path: '/admin/dashboard' }]
      : []),
    ...(userRole === 'admin' || userRole === 'moderador' || userRole === 'recrutador'
      ? [{ label: 'Logs de Ações', icon: <BarChart3 className="h-5 w-5" />, path: '/admin/logs' }]
      : [])
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-40"
            transition={{ duration: 0.3 }}
          />
          <motion.div
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-72 bg-card/95 backdrop-blur-lg z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-primary/20 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">Menu</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 flex items-center gap-4 border-b border-primary/20">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={memberData?.avatar_url} alt={memberData?.codinome} />
                <AvatarFallback className="text-2xl bg-secondary">{memberData?.codinome?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-lg text-foreground">{memberData?.codinome}</p>
                <p className="text-sm text-muted-foreground">{memberData?.patente_atual}</p>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navItems.map(item => (
                <Button
                  key={item.path}
                  asChild
                  variant="ghost"
                  className="w-full justify-start text-lg py-6"
                  onClick={() => setIsOpen(false)}
                >
                  <Link to={item.path}>
                    {item.icon}
                    <span className="ml-4">{item.label}</span>
                  </Link>
                </Button>
              ))}
            </nav>

            <div className="p-4 mt-auto border-t border-primary/20">
              <Button variant="destructive" className="w-full text-lg py-6" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-4" />
                Sair
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MemberSidebar;