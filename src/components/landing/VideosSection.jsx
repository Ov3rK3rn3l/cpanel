import React from 'react';
import { motion } from 'framer-motion';
import YouTubeEmbed from '@/components/shared/YouTubeEmbed';
import { Button } from '@/components/ui/button';
import { PlaySquare } from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] } }
};

const fadeInDelayed = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: "easeOut" } }
});

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    }
  }
};

const VideosSection = () => {
  const videos = [
    { id: "PaWVxF7hvk4", title: "GERR - Operação Alvorada VermelhaIniciante? Só Que Não – Começando com Maestria no ARMA REFORGER // GERR - (#01)" }, // Peryapt
    { id: "578RTkR-Sw4", title: "Torneio Raid Squad" }, // Peryapt
    { id: "2LgF3l9Vs8k", title: "Batalha em Fallujah" }, // DK
  ];

  // Canal do YouTube Comando
  const youtubeChannelUrl = "https://www.youtube.com/@ocomandobr"; 

  return (
    <motion.section 
      className="container mx-auto px-4 py-16 md:py-24"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={staggerContainer}
    >
      <motion.h2 
        className="text-4xl md:text-5xl font-arma text-center mb-16 md:mb-20 text-transparent bg-clip-text bg-gradient-to-r from-highlight-vibrant to-secondary" 
        variants={fadeIn}
        style={{ textShadow: '0 0 8px hsl(var(--highlight-vibrant-hsl)/0.2)'}}
      >
        GERR em Ação
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        {videos.map((video, index) => (
          <motion.div 
            key={video.id + index} 
            variants={fadeInDelayed(index * 0.1)}
            whileHover={{ y: -5, transition: { type: "spring", stiffness: 300 } }}
          >
            <YouTubeEmbed videoId={video.id} title={video.title} className="h-full" />
          </motion.div>
        ))}
      </div>
      {youtubeChannelUrl && (
        <motion.div 
          className="text-center mt-12 md:mt-16" 
          variants={fadeInDelayed(videos.length * 0.1 + 0.2)}
        >
          <Button 
            variant="default" 
            size="lg" 
            className="py-3 px-6 md:py-4 md:px-8 text-base md:text-lg shadow-lg shadow-primary/30 transform hover:scale-105"
            onClick={() => window.open(youtubeChannelUrl, '_blank')}
          >
            <PlaySquare className="mr-2 h-5 w-5 md:h-6 md:w-6" />
            Nosso Canal no YouTube
          </Button>
        </motion.div>
      )}
    </motion.section>
  );
};

export default VideosSection;