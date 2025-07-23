import React from 'react';
    import { motion } from 'framer-motion';
    import { Info } from 'lucide-react';
    

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
          staggerChildren: 0.2,
          delayChildren: 0.3,
        }
      }
    };

    const AboutSection = () => {
      
      return (
        <motion.section
          id="about-section"
          className="container mx-auto px-4 py-16 md:py-24 relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="absolute top-0 left-1/4 -translate-x-1/2 -translate-y-1/3 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 right-1/4 translate-x-1/2 translate-y-1/3 w-72 h-72 bg-secondary/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-16">
            <motion.div 
              className="lg:w-3/5 text-left"
              variants={fadeInDelayed(0.1)}
            >
              <div className="flex items-center mb-6 text-primary">
                <Info className="h-10 w-10 mr-3 animate-float" />
                <motion.h2 
                  className="text-4xl md:text-5xl font-arma text-primary"
                >
                  Sobre o Clã GERR
                </motion.h2>
              </div>
              <motion.div 
                className="prose prose-lg md:prose-xl text-foreground/80 space-y-6 font-sans text-justify"
                variants={fadeInDelayed(0.3)}
              >
                <p>
                  Fundado em 2023, o Grupo Especial de Retomada e Resgate (GERR) nasceu da paixão de um grupo de amigos por jogos táticos e simulação militar (Milsim). Nossa missão é criar um ambiente imersivo, desafiador e, acima de tudo, divertido, onde a estratégia, a comunicação e o trabalho em equipe são os pilares para o sucesso.
                </p>
                <p>
                  No GERR, valorizamos o respeito mútuo, a disciplina tática e o aprimoramento constante de nossos membros. Acreditamos que cada operador, independentemente de sua patente ou tempo de clã, tem um papel crucial em nossas operações. Promovemos um sistema de progressão justo, baseado no mérito, participação e dedicação.
                </p>
                <p>
                  Com foco em jogos como Squad, Arma Reforger e Hell Let Loose, buscamos a excelência em cada incursão, sempre priorizando a diversão e o espírito de corpo. Se você procura uma comunidade séria, organizada e pronta para enfrentar qualquer desafio, o Clã GERR é o seu lugar. Junte-se a nós e faça parte desta irmandade!
                </p>
              </motion.div>
            </motion.div>

            <motion.div 
              className="lg:w-2/5 w-full mt-10 lg:mt-0"
              variants={fadeInDelayed(0.5)}
            >
              <div className="bg-card/70 p-4 rounded-xl shadow-2xl border border-border/50 glassmorphic min-h-[400px] lg:min-h-[500px] flex flex-col items-center justify-center">
                <img  
                    alt="Imagem representativa do Clã GERR em ação" 
                    className="w-full h-auto max-h-[450px] object-contain rounded-lg shadow-lg"
                 src="discord-banner.jpg" />
                <p className="text-sm text-muted-foreground mt-4 text-center">Nossa força reside na união e na estratégia.</p>
              </div>
            </motion.div>
          </div>
        </motion.section>
      );
    };

    export default AboutSection;