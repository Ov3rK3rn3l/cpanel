import React from 'react';
    import { Shield, Youtube, Twitch, Instagram } from 'lucide-react';
    import DiscordIcon from '@/components/shared/DiscordIcon';
    import { Link } from 'react-router-dom';
    import { motion } from 'framer-motion';

    const Footer = () => {
      const currentYear = new Date().getFullYear();
      const logoUrl = "/gerr-clan-logo.png"; // Você pode substituir por sua URL de logo real

      const socialLinks = [
        { href: "https://youtube.com/@ocomandobr", icon: <Youtube size={28} />, label: "YouTube", colorClass: "hover:text-red-500" },
        { href: "https://discord.gg/YT7XRyXBmv", icon: <DiscordIcon className="h-7 w-7" />, label: "Discord", colorClass: "hover:text-indigo-400" },
        { href: "https://www.twitch.tv/seprac_", icon: <Twitch size={28} />, label: "Twitch", colorClass: "hover:text-purple-500" },
        { href: "https://instagram.com/gerr_squad", icon: <Instagram size={28} />, label: "Instagram", colorClass: "hover:text-pink-500" },
      ];

      const footerIconVariants = {
        initial: { opacity: 0.7, y: 0, filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))' },
        hover: { 
          opacity: 1, 
          y: -5, 
          scale: 1.2,
          filter: 'drop-shadow(0px 5px 8px hsl(var(--primary-hsl)/0.5)) drop-shadow(0px 0px 15px hsl(var(--primary-hsl)/0.3))',
          transition: { type: "spring", stiffness: 300, damping: 10 } 
        }
      };
      
      const perspectiveWrapperVariants = {
        initial: { perspective: '1000px' },
        hover: { perspective: '800px' }
      };

      const icon3DEffect = {
        initial: { rotateX: 0, rotateY: 0 },
        hover: { rotateX: 10, rotateY: -10, transition: { duration: 0.3 } }
      };


      return (
        <footer className="bg-gradient-to-t from-background via-card/30 to-card/60 backdrop-blur-lg text-muted-foreground py-16 border-t border-border/40 mt-24 relative border">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -bottom-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50 animate-pulse-slow"></div>
            <div className="absolute -top-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl opacity-50 animate-pulse-slower"></div>
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-10">
              
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <Link to="/" className="flex items-center space-x-3 mb-4 group">
                  {logoUrl && logoUrl !== "/public/gerr-clan-logo.png" ? (
                    <motion.div whileHover={{ scale: 1.05, rotate: -3 }}>
                      <img src={logoUrl} alt="Logo Clã GERR" className="h-12 w-auto group-hover:opacity-80 transition-opacity" />
                    </motion.div>
                  ) : (
                    <motion.div whileHover={{ scale: 1.1, rotate: -5 }}>
                      <Shield className="h-12 w-12 text-primary group-hover:text-primary-light transition-colors" />
                    </motion.div>
                  )}
                  <span className="text-3xl font-display text-foreground group-hover:text-primary-light transition-colors">GERR</span>
                </Link>
                <p className="text-sm max-w-md">
                  Grupo Especial de Retomada e Resgate. Forjando lendas no campo de batalha virtual com disciplina, estratégia e camaradagem.
                </p>
              </div>
              
              <div className="flex flex-col items-center md:items-end">
                <h3 className="text-xl font-semibold text-foreground mb-6">Conecte-se Conosco</h3>
                
                <motion.div 
                  className="flex space-x-6"
                  variants={perspectiveWrapperVariants}
                  initial="initial"
                  whileHover="hover"
                >
                  {socialLinks.map(social => (
                    <motion.a 
                      key={social.label}
                      href={social.href} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`${social.colorClass} transition-colors duration-300`}
                      variants={footerIconVariants}
                      initial="initial"
                      whileHover="hover"
                      title={social.label}
                    >
                      <motion.div variants={icon3DEffect}>
                        {social.icon}
                      </motion.div>
                      <span className="sr-only">{social.label}</span>
                    </motion.a>
                  ))}
                </motion.div>
              </div>
            </div>

            <div className="mt-16 pt-10 border-t border-border/30 text-center">
              <p className="text-sm">
                &copy; {currentYear} GERR. Todos os direitos reservados.
              </p>
              <p className="text-xs mt-2">
                Desenvolvido com <span className="text-primary animate-pulse">❤️</span> pelo Alto Comando.
              </p>
            </div>
          </div>
        </footer>
      );
    };

    export default Footer;