import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  

    const fadeIn = {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] } }
    };

    const fadeInDelayed = (delay = 0) => ({
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: "easeOut" } }
    });
    
    const cinematicEntrance = (delay = 0, xOffset = -100) => ({
      hidden: { opacity: 0, x: xOffset, filter: 'blur(10px) saturate(0)' },
      visible: { 
        opacity: 1, 
        x: 0, 
        filter: 'blur(0px) saturate(1)', 
        transition: { duration: 1.5, delay, ease: [0.16, 1, 0.3, 1], type: "spring", stiffness: 50, damping: 20 } 
      }
    });

    const staggerContainer = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.2,
          delayChildren: 0.3,
        }
      }
    };
    
    const ParallaxBackground = ({ children }) => {
      const ref = useRef(null);
      const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
      const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]); 
      const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
      const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-5%"]); 

      return (
        <div ref={ref} className="relative min-h-screen flex flex-col justify-center items-start text-left overflow-hidden">
          <motion.div 
            className="absolute inset-0 z-0"
            style={{ y: backgroundY, scale: backgroundScale, transformOrigin: 'center center' }}
          >
             <img 
              src="https://images.steamusercontent.com/ugc/943935487821668967/1F761F48EDE22A7C0BF4F5CE5412D8F729E80CF6/?imw=5000&imh=5000&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false" 
              alt="Soldados em campo de batalha cinematográfico" 
              className="w-full h-full object-cover opacity-20" 
            />
            <div className="absolute inset-0" style={{boxShadow: 'inset 0 0 150px 70px rgba(var(--background-rgb), 1), inset 0 0 50px 20px rgba(var(--background-rgb), 0.8)'}}></div>
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent z-10"></div>
          
          <motion.div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{y: contentY}}>
            {children}
          </motion.div>
        </div>
      );
    };
    
    const InteractiveCard = ({ icon, title, description, delay }) => (
      <motion.div 
        variants={fadeInDelayed(delay)} 
        className="h-full group"
        whileHover={{ scale: 1.03, y: -5, transition: { duration: 0.2 } }}
      >
        <Card className="bg-card/70 border-border/50 group-hover:border-primary/80 shadow-xl h-full transition-all duration-300 transform group-hover:shadow-primary/30 glassmorphic overflow-hidden relative">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping group-hover:animate-none"></div>
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="items-center text-center relative z-10">
            <motion.div 
              className="p-3 bg-primary/10 rounded-full inline-block mb-4 group-hover:bg-primary/20 transition-colors duration-300"
              whileHover={{ scale: 1.1 }}
            >
              {React.cloneElement(icon, { className: "h-10 w-10 text-highlight-vibrant group-hover:text-primary-light transition-colors duration-300"})}
            </motion.div>
            <CardTitle className="text-xl md:text-2xl font-semibold text-foreground mt-2">{title}</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-foreground/70 text-center text-sm md:text-base font-sans">{description}</p>
          </CardContent>
        </Card>
      </motion.div>
    );

    const YouTubeEmbed = ({ videoId, title }) => {
      return (
        <div className="aspect-video rounded-lg overflow-hidden shadow-2xl border-2 border-border/30 hover:border-highlight-vibrant/70 transition-all duration-300 transform hover:scale-105 group relative">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          ></iframe>
        </div>
      );
    };


    const LandingPage = () => {
      const logoUrl = "/gerr-clan-logo.png"; 
    

      const videos = [
        { id: "CW9k7axIJ1k", title: "Squad - Batalha Intensa" },
        { id: "jqsI7BrEX4Q", title: "Squad - Operação Noturna" },
        { id: "hdkfRYUQBhU", title: "Squad - Desistir não é uma opção" },
      ];

      return (
        <div className="space-y-12 md:space-y-20 pb-16 overflow-x-hidden bg-background">
          <ParallaxBackground>
 <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 mt-[-60px]">
  <div className="max-w-3xl w-full">
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 mt-[-100px]">
  <div className="max-w-3xl w-full">
    <motion.div
      variants={cinematicEntrance(0.1, -50)}
      initial="hidden"
      animate="visible"
      className="mb-8"
    >
      {logoUrl && logoUrl !== "public/images/gerr-clan-logo.png" ? (
        <img
          src={logoUrl}
          alt="Logo Clã GERR"
          className="h-80 md:h-100 lg:h-100 mx-auto"
        />
      ) : (
        <div className="w-24 h-24 md:w-32 md:h-32 bg-primary/20 flex items-center justify-center rounded-lg mx-auto">
          <span className="text-4xl md:text-5xl font-bold text-primary font-arma">
            G
          </span>
        </div>
      )}
    </motion.div>

    <motion.h1
      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-arma uppercase mb-6 text-transparent bg-clip-text bg-gradient-to-br from-primary via-highlight-vibrant to-primary-light animate-text-shimmer"
      variants={cinematicEntrance(0.3, -80)}
      initial="hidden"
      animate="visible"
      style={{
        backgroundSize: "200% auto",
        animation: "textShimmer 5s linear infinite",
        textShadow:
          "0 0 10px hsl(var(--primary-hsl)/0.3), 0 0 20px hsl(var(--primary-hsl)/0.2)",
      }}
    >
      Grupo Especial de Retomada e Resgate
    </motion.h1>

    <motion.p
      className="text-lg sm:text-xl md:text-2xl text-foreground/80 mb-10 font-sans max-w-xl mx-auto"
      variants={cinematicEntrance(0.5, -100)}
      initial="hidden"
      animate="visible"
    >
      Forjando lendas no campo de batalha virtual com disciplina,
      estratégia e camaradagem.
    </motion.p>

    <motion.div
      variants={cinematicEntrance(0.7, -120)}
      initial="hidden"
      animate="visible"
    >
      {/*<Button
        size="lg"
        className="btn-vibrant py-3 px-8 md:py-4 md:px-10 rounded-md shadow-xl text-base md:text-lg transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
        onClick={() => window.open("https://discord.gg/kppfAn8w", "_blank")}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-primary/30 to-highlight-vibrant/30 opacity-0 group-hover:opacity-70 transition-opacity duration-500 group-hover:animate-pulse-slow"></span>
        <span className="relative flex items-center">
          <DiscordIcon className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Discord
        </span>
      </Button>*/}
    </motion.div>
  </div>
</div>

  </div>
</div>

</ParallaxBackground>

        </div>
      );
    };

    export default LandingPage;