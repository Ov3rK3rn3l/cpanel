import React from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLocation } from 'react-router-dom';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main className={`flex-grow w-full ${!isLandingPage && !isAdminPage ? 'container mx-auto px-4 py-6 sm:px-6 lg:px-8' : ''}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;