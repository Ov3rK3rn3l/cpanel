import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Users, Gamepad2, Target, Award, UserPlus, Sparkles } from 'lucide-react';

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

const InteractiveCard = ({ icon, title, description, delay }) => (
  <motion.div 
    variants={fadeInDelayed(delay)} 
    className="h-full group"
    whileHover={{ scale: 1.03, y: -5, transition: { type: "spring", stiffness: 300, damping: 15 } }}
  >
    <Card className="bg-card/60 border-border/40 group-hover:border-primary/70 shadow-xl hover:shadow-primary/20 h-full transition-all duration-300 glassmorphic overflow-hidden relative">
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/10 rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-400 animate-ping group-hover:animate-none" style={{ animationDelay: `${delay * 100}ms` }}></div>
      <div className="absolute -top-5 -right-5 w-20 h-20 bg-primary/20 rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
      <CardHeader className="items-center text-center relative z-10 pt-8">
        <motion.div 
          className="p-4 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full inline-block mb-4 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300"
          whileHover={{ scale: 1.15, rotate: 5 }}
        >
          {React.cloneElement(icon, { className: "h-10 w-10 text-highlight-vibrant group-hover:text-primary-light transition-colors duration-300 stroke-[1.5]"})}
        </motion.div>
        <CardTitle className="text-xl md:text-2xl font-semibold text-foreground mt-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 pb-8">
        <p className="text-foreground/70 text-center text-sm md:text-base font-sans leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const OfferingsSection = () => {
  const offerings = [
    { icon: <ShieldCheck />, title: "Operações Táticas", description: "Briefings detalhados, objetivos claros e comando estruturado em cada missão." },
    { icon: <Users />, title: "Comunidade Engajada", description: "Membros ativos e um Discord organizado para interação, estratégia e amizade." },
    { icon: <Gamepad2 />, title: "Foco Milsim", description: "Experiência imersiva em Squad, Arma Reforger, Hell Let Loose e outros títulos táticos." },
    { icon: <Target />, title: "Treinamento Contínuo", description: "Aprimore suas habilidades táticas, de comunicação e liderança com nossos treinos." },
    { icon: <Award />, title: "Hierarquia e Respeito", description: "Sistema de patentes e reconhecimento baseado em mérito, dedicação e participação." },
    { icon: <UserPlus />, title: "Recrutamento Ativo", description: "Novos operadores são sempre bem-vindos para fortalecer nossas fileiras e expandir o clã." },
  ];

  return (
    <motion.section 
      className="container mx-auto px-4 relative py-16 md:py-24"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={staggerContainer}
    >
      <div className="absolute -bottom-1/4 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 opacity-70 animate-pulse-slow"></div>
      <div className="absolute -top-1/4 -right-24 w-80 h-80 bg-secondary/5 rounded-full blur-3xl -z-10 opacity-60 animate-pulse-slower"></div>
      
      <motion.h2 
        className="text-4xl md:text-5xl font-arma text-center mb-16 md:mb-20 text-primary" 
        variants={fadeIn}
        style={{ textShadow: '0 0 8px hsl(var(--primary-hsl)/0.2)'}}
      >
        Nossos Pilares <Sparkles className="inline-block h-8 w-8 md:h-10 md:w-10 text-yellow-400 ml-2 drop-shadow-lg" />
      </motion.h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {offerings.map((item, index) => (
           <InteractiveCard key={index} icon={item.icon} title={item.title} description={item.description} delay={index * 0.1} />
        ))}
      </div>
    </motion.section>
  );
};

export default OfferingsSection;