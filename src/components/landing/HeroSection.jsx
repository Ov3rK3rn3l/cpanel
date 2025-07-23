import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';


const cinematicEntrance = (delay = 0, xOffset = -100, duration = 1.5) => ({
  hidden: { opacity: 0, x: xOffset, filter: 'blur(10px) saturate(0)' },
  visible: { 
    opacity: 1, 
    x: 0, 
    filter: 'blur(0px) saturate(1)', 
    transition: { duration, delay, ease: [0.16, 1, 0.3, 1], type: "spring", stiffness: 50, damping: 20 } 
  }
});

const ParallaxBackgroundContainer = ({ children, backgroundImageUrl, videoPath, fallbackImagePath }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]); 
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  const useVideoBackground = videoPath && false; 

  return (
    <div ref={ref} className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden bg-background">
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ 
          y: backgroundY, 
          scale: backgroundScale, 
          transformOrigin: 'center center' 
        }}
      >
        {useVideoBackground ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={fallbackImagePath || backgroundImageUrl}
            className="w-full h-full object-cover opacity-30"
          >
            <source src={videoPath} type="video/mp4" />
            
          </video>
        ) : (
           <div className="absolute inset-0 w-full h-full">
            <img  
              alt="Fundo cinematográfico do clã GERR" 
              className="w-full h-full object-cover opacity-20" 
             src="https://images.unsplash.com/photo-1501431531455-4b83a0027ea2" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        <div className="absolute inset-0" style={{boxShadow: 'inset 0 0 200px 100px hsl(var(--background)), inset 0 0 80px 40px hsl(var(--background))'}}></div>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background z-10"></div>
      
      <motion.div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-24" style={{y: contentY}}>
        {children}
      </motion.div>
    </div>
  );
};


const HeroSection = () => {
  const logoPlaceholderText = "G"; 
  
  const backgroundImageUrl = "placeholder_hero_bg.jpg"; 
  const videoPathForBackground = "/assets/videos/gerr_hero_background.mp4"; 
  const fallbackForVideo = "placeholder_fallback_video.jpg"; 

  return (
    <ParallaxBackgroundContainer 
      backgroundImageUrl={backgroundImageUrl} 
      videoPath={videoPathForBackground} 
      fallbackImagePath={fallbackForVideo}
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center"> 
        <motion.div 
          variants={cinematicEntrance(0.1, 0, 1)} 
          initial="hidden" 
          animate="visible" 
          className="mb-8"
        >
           <div className="w-40 h-40 md:w-48 md:h-48 flex items-center justify-center rounded-2xl">
             <img src="/gerr-clan-logo.png" alt="Logo do Clã GERR" className="w-full h-full object-contain" />
           </div>
        </motion.div>
        <motion.h1 
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-arma uppercase mb-6 text-primary text-center"
          variants={cinematicEntrance(0.3, 0)} 
          initial="hidden" 
          animate="visible"
          style={{
            textShadow: '0 0 15px hsl(var(--primary-hsl)/0.4), 0 0 25px hsl(var(--primary-hsl)/0.2), 0 0 5px #fff'
          }}
        >
          Grupo Especial de Retomada e Resgate
        </motion.h1>
        <motion.p 
          className="text-lg sm:text-xl md:text-2xl text-foreground/80 max-w-2xl mb-10 font-sans"
          variants={cinematicEntrance(0.5, 0)} 
          initial="hidden" 
          animate="visible"
        >
          Forjando lendas no campo de batalha virtual com disciplina, estratégia e camaradagem.
        </motion.p>
        
      </div>
    </ParallaxBackgroundContainer>
  );
};

export default HeroSection;