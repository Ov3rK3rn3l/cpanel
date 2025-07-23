import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Star, Award, Gamepad2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const GAME_ID_TO_NAME_MAP = {
  'squad': 'Squad',
  'hell-let-loose': 'Hell Let Loose',
  'ready-or-not': 'Ready Or Not',
  'arma-3': 'Arma 3',
  'arma-reforger': 'Arma Reforger',
  'squad-44': 'Squad 44',
};

const MotionCard = motion(Card);

const getInitials = (name = '') => {
  if (!name) return '';
  const words = name.split(' ');
  if (words.length > 1) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const FeaturedMembersCard = () => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [featuredMembers, setFeaturedMembers] = useState([]);
  const [gameDetails, setGameDetails] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchGameDetails = useCallback(async (gameIds) => {
    if (gameIds.length === 0 || !supabase) return;
    
    const gameNames = [...new Set(gameIds.map(id => GAME_ID_TO_NAME_MAP[id]).filter(Boolean))];
    if (gameNames.length === 0) return;

    try {
      const { data, error } = await supabase.functions.invoke('get-steam-game-details', {
        body: { gameNames }
      });

      if (error) throw new Error(`Steam API Error: ${error.message}`);
      if (data.error) throw new Error(`Steam Function Error: ${data.error}`);
      
      const detailsMap = {};
      Object.entries(data).forEach(([name, detail]) => {
        const gameId = Object.keys(GAME_ID_TO_NAME_MAP).find(key => GAME_ID_TO_NAME_MAP[key] === name);
        if (gameId) {
          detailsMap[gameId] = detail;
        }
      });
      setGameDetails(prev => ({ ...prev, ...detailsMap }));

    } catch (err) {
      console.error("Error fetching game details:", err);
    }
  }, [supabase]);

  const fetchFeaturedMembers = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_featured_members_with_effects');
      if (error) throw error;
      
      const members = data || [];
      setFeaturedMembers(members);

      if (members.length > 0) {
        const allGameIds = members.flatMap(m => m.profile_games || []);
        const uniqueGameIds = [...new Set(allGameIds)];
        await fetchGameDetails(uniqueGameIds);
      }
    } catch (error) {
      console.error('Erro ao buscar membros em destaque:', error);
      toast({
        title: 'Erro ao carregar destaques',
        description: 'Não foi possível buscar os membros em destaque.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast, fetchGameDetails]);

  useEffect(() => {
    fetchFeaturedMembers();
  }, [fetchFeaturedMembers]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      );
    }

    if (featuredMembers.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-48 text-center text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mb-3" />
          <p className="font-semibold">Nenhum membro em destaque no momento.</p>
          <p className="text-sm">Participe das atividades e seja o próximo!</p>
        </div>
      );
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        style={{ perspective: '1200px' }}
      >
        {featuredMembers.map((member, index) => (
          <MotionCard
            key={member.id}
            className={cn(
              "glassmorphic-dark border-primary/20 overflow-hidden group relative transition-all duration-300",
            )}
            initial={{ opacity: 0, y: 50, rotateY: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1, transition: { delay: index * 0.15, type: 'spring', stiffness: 80, damping: 15 } }}
            whileHover={{ y: -10, scale: 1.05, rotateY: 5, z: 20, boxShadow: '0px 20px 40px -10px rgba(var(--color-primary-rgb), 0.4)' }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className={cn("absolute inset-0", member.active_effect_css_class)}></div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 p-3 bg-gradient-to-bl from-yellow-400/80 to-yellow-600/80 rounded-bl-2xl shadow-lg">
              <Star className="h-6 w-6 text-white" fill="white" />
            </div>
            <CardContent className="pt-8 flex flex-col items-center text-center relative z-10">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={cn(
                    "w-28 h-28 rounded-full overflow-hidden border-4 border-primary/50 shadow-lg mb-4 bg-slate-700 flex items-center justify-center",
                     member.active_effect_css_class
                )}
                style={{ transform: 'translateZ(40px)' }}
              >
                {member.avatar_url ? (
                   <img
                    src={member.avatar_url}
                    alt={member.codinome}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src=`https://api.dicebear.com/7.x/initials/svg?seed=${getInitials(member.codinome)}`}}
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">{getInitials(member.codinome)}</span>
                )}
              </motion.div>
              <h3 
                className="text-2xl font-bold bg-gradient-to-r from-yellow-300 via-white to-yellow-400 text-transparent bg-clip-text"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
              >
                {member.codinome}
              </h3>
              <p className="text-muted-foreground font-semibold">{member.patente_atual}</p>
              
              <div className="mt-4 flex items-center gap-2 text-purple-300">
                <Award className="w-5 h-5" />
                <span className="font-bold">{member.points || 0} Pontos</span>
              </div>

              <div className="mt-5 pt-4 border-t border-primary/20 w-full">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Jogos Principais</h4>
                <div className="flex justify-center items-center gap-3 h-16">
                  {(member.profile_games || []).slice(0, 3).map((gameId) => {
                    const detail = gameDetails[gameId];
                    return (
                      <div key={gameId} className="w-24 h-full rounded-md overflow-hidden bg-slate-800 shadow-md transition-transform hover:scale-105">
                        {detail?.header_image ? (
                          <img
                            src={detail.header_image}
                            alt={GAME_ID_TO_NAME_MAP[gameId]}
                            title={GAME_ID_TO_NAME_MAP[gameId]}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 className="w-6 h-6 text-slate-600" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(member.profile_games || []).length === 0 && (
                     <Gamepad2 className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardContent>
          </MotionCard>
        ))}
      </motion.div>
    );
  };

  return (
    <Card className="glassmorphic border-primary/30 shadow-lg shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl text-primary-foreground/90 flex items-center gap-2">
          <Star className="h-7 w-7 text-yellow-400" />
          Membros em Destaque
        </CardTitle>
        <CardDescription>O reconhecimento aos nossos melhores operadores.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default FeaturedMembersCard;