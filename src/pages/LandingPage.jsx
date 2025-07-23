import React from 'react';
import HeroSection from '@/components/landing/HeroSection';
import AboutSection from '@/components/landing/AboutSection';
import OfferingsSection from '@/components/landing/OfferingsSection';
import VideosSection from '@/components/landing/VideosSection';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700&family=Staatliches&display=swap');
    
    .font-arma {
      font-family: 'Staatliches', 'Impact', 'Arial Black', sans-serif;
      letter-spacing: 0.05em;
      line-height: 1.1;
    }
    .font-sans {
      font-family: 'Roboto Condensed', 'Arial', sans-serif;
    }

    @keyframes pulse-slow {
      0%, 100% { opacity: 0.4; transform: scale(1) rotate(0deg); }
      50% { opacity: 0.6; transform: scale(1.05) rotate(5deg); }
    }
    .animate-pulse-slow {
      animation: pulse-slow 10s infinite ease-in-out;
    }
    @keyframes pulse-slower {
      0%, 100% { opacity: 0.3; transform: scale(1) rotate(0deg); }
      50% { opacity: 0.5; transform: scale(1.03) rotate(-5deg); }
    }
    .animate-pulse-slower {
      animation: pulse-slower 12s infinite ease-in-out;
    }
    
    .glassmorphic-general {
      background: hsl(var(--card) / 0.5);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid hsl(var(--border) / 0.2);
    }
  `}</style>
);

const LandingPage = () => {
  return (
    <div className="space-y-0 pb-16 overflow-x-hidden bg-background">
      <GlobalStyles />
      <HeroSection />
      <AboutSection />
      <OfferingsSection />
      <VideosSection />
    </div>
  );
};

export default LandingPage;