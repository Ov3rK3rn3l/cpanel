import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Info, Loader2, ShieldCheck, CalendarDays, ShieldAlert, Coins, Menu, Award, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { PROMOTION_PATENTS, PATENTE_ORDER_MAP, YES_NO_OPTIONS_VALUES, MERIT_PATENTS_START_ORDER } from '@/components/admin/members/utils';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/member/StatCard';
import AnnouncementsCard from '@/components/member/AnnouncementsCard';
import MissionsCard from '@/components/member/MissionsCard';
import FeedbackCard from '@/components/member/FeedbackCard';
import CareerProgressCard from '@/components/member/dashboard/CareerProgressCard';
import ActivitySummaryCard from '@/components/member/dashboard/ActivitySummaryCard';
import ChallengesCard from '@/components/member/dashboard/ChallengesCard';
import WarningsHistoryCard from '@/components/member/dashboard/WarningsHistoryCard';
import RankingCard from '@/components/member/dashboard/RankingCard';
import MemberSidebar from '@/components/member/dashboard/MemberSidebar';
import ClanGamesCard from '@/components/member/dashboard/ClanGamesCard';
import FeaturedMembersCard from '@/components/member/dashboard/FeaturedMembersCard';
import EventsCard from '@/components/member/dashboard/EventsCard';
import OnlineMembersCard from '@/components/member/dashboard/OnlineMembersCard';

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const MemberDashboardPage = () => {
  const { user, supabase } = useAuth();
  const { toast } = useToast();
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialFetchAttempted, setInitialFetchAttempted] = useState(false);
  const [isMemberSidebarOpen, setIsMemberSidebarOpen] = useState(false);
  const [nextPatenteInfo, setNextPatenteInfo] = useState({
    nextPatente: 'N/A',
    presencesNeeded: 0,
    progressPercentage: 0,
    currentPatentePresences: 0,
    nextPatentePresences: 0,
  });
  const [courseAlertMessage, setCourseAlertMessage] = useState(null);
  const presenceChannelRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [onlineUsersLoading, setOnlineUsersLoading] = useState(true);

  const fetchMemberData = useCallback(async () => {
    if (!user || !supabase || !user.email) {
      if (initialFetchAttempted || !user) {
         setLoading(false);
      }
      return;
    }
    
    setLoading(true);
    let foundMember = null;

    try {
      const { data: dataByUserId, error: errorByUserId } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (errorByUserId) {
        console.error("Erro ao buscar membro por user_id:", errorByUserId.message);
      }
      
      if (dataByUserId) {
        foundMember = dataByUserId;
      } else { 
        const {data: dataByEmail, error: errorByEmail} = await supabase
          .from('members')
          .select('*')
          .eq('email', user.email) 
          .limit(1)
          .maybeSingle();
        
        if (errorByEmail) {
          console.error("Erro ao buscar membro por email:", errorByEmail.message);
        }

        if (dataByEmail) {
          foundMember = dataByEmail;
          const { error: userUpdateError } = await supabase
            .from('members')
            .update({ user_id: user.id })
            .eq('id', dataByEmail.id) 
            .eq('email', user.email)
            .is('user_id', null); 

          if (userUpdateError) {
            console.warn("Falha ao tentar vincular user_id ao membro:", userUpdateError.message);
          } else {
            console.log("Tentativa de vinculação do user_id ao membro encontrado por email foi enviada.");
          }
        }
      }
      setMemberData(foundMember);
    } catch (error) {
      console.error("Erro geral ao buscar dados do membro:", error);
      toast({ title: "Erro Crítico ao Carregar Dados", description: "Ocorreu um problema inesperado. Contate um administrador.", variant: "destructive" });
    } finally {
      setLoading(false);
      setInitialFetchAttempted(true);
    }
  }, [user, supabase, toast, initialFetchAttempted]);

  useEffect(() => {
    if (user && user.email && !initialFetchAttempted) {
      fetchMemberData();
    } else if (!user && !initialFetchAttempted) {
      setLoading(true); 
    } else if (user && !user.email && !initialFetchAttempted) {
      setLoading(false);
      setInitialFetchAttempted(true);
    }
  }, [user, fetchMemberData, initialFetchAttempted]);
  
  useEffect(() => {
    if (memberData && supabase) {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }

      const channel = supabase.channel(`online-members`, {
        config: {
          presence: {
            key: memberData.id,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const presences = channel.presenceState();
          setOnlineUsers(presences);
          if (onlineUsersLoading) setOnlineUsersLoading(false);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              online_at: new Date().toISOString(),
              codinome: memberData.codinome,
              avatar_url: memberData.avatar_url,
              patente: memberData.patente_atual,
            });
          }
        });

      presenceChannelRef.current = channel;

      return () => {
        if (presenceChannelRef.current) {
          supabase.removeChannel(presenceChannelRef.current);
          presenceChannelRef.current = null;
        }
      };
    }
  }, [memberData, supabase, onlineUsersLoading]);

  useEffect(() => {
    if (memberData) {
      const currentPatente = memberData.patente_atual || "Reservista";
      const currentPatenteOrder = PATENTE_ORDER_MAP[currentPatente] || 0;
      const currentPresences = memberData.total_presencas || 0;

      if (currentPatente === "General de Exército") {
        setNextPatenteInfo({
          nextPatente: "Patente Máxima",
          presencesNeeded: 0,
          progressPercentage: 100,
          currentPatentePresences: currentPresences,
          nextPatentePresences: currentPresences,
        });
        setCourseAlertMessage(null);
        return;
      }

      if (currentPatenteOrder >= MERIT_PATENTS_START_ORDER) {
        setNextPatenteInfo({
          nextPatente: "Promoção por Mérito",
          presencesNeeded: 0,
          progressPercentage: 100,
          currentPatentePresences: currentPresences,
          nextPatentePresences: currentPresences,
        });
      } else {
        const presenceThresholds = Object.entries(PROMOTION_PATENTS)
          .map(([pres, pat]) => ({ presences: parseInt(pres), patente: pat, order: PATENTE_ORDER_MAP[pat] }))
          .sort((a, b) => a.presences - b.presences);

        const currentPatenteReq = presenceThresholds.slice().reverse().find(p => p.order <= currentPatenteOrder);
        const currentPatentePresences = currentPatenteReq ? currentPatenteReq.presences : 0;

        const nextPatenteReq = presenceThresholds.find(p => p.order > currentPatenteOrder);

        if (nextPatenteReq) {
          const nextPatentePresences = nextPatenteReq.presences;
          const range = nextPatentePresences - currentPatentePresences;
          const presencesNeeded = nextPatentePresences - currentPresences;
          const progressPercentage = range > 0 ? ((currentPresences - currentPatentePresences) / range) * 100 : (currentPresences >= nextPatentePresences ? 100 : 0);
          
          setNextPatenteInfo({
            nextPatente: nextPatenteReq.patente,
            presencesNeeded: Math.max(0, presencesNeeded),
            progressPercentage: Math.max(0, Math.min(100, progressPercentage)),
            currentPatentePresences,
            nextPatentePresences,
          });
        } else {
          setNextPatenteInfo({
            nextPatente: "Promoção por Mérito",
            presencesNeeded: 0,
            progressPercentage: 100,
            currentPatentePresences,
            nextPatentePresences: currentPresences,
          });
        }
      }

      let alertMsg = null;
      if (currentPresences >= 120 && memberData.cfo !== YES_NO_OPTIONS_VALUES.SIM) {
        alertMsg = {
          type: "cfo",
          text: "🎖️ Rumo ao Oficialato! Para se tornar Aluno-Oficial, a conclusão do curso CFO é essencial. Procure a liderança!"
        };
      } else if (currentPresences >= 55 && memberData.esa !== YES_NO_OPTIONS_VALUES.SIM) {
         alertMsg = {
          type: "esa",
          text: "🎯 Atenção, Soldado! Para alcançar 3º Sargento, você precisa concluir o curso ESA (CIB). Fale com um oficial!"
        };
      }
      setCourseAlertMessage(alertMsg);
    }
  }, [memberData]);

  if (loading && !initialFetchAttempted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] bg-background">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-xl text-muted-foreground">Carregando seu QG...</p>
      </div>
    );
  }
  
  if (!memberData && initialFetchAttempted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4 bg-background">
        <Info className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive">Perfil Não Encontrado</h1>
        <p className="text-muted-foreground mt-2 max-w-md">Não conseguimos encontrar seus dados de membro. Verifique se o email <strong className="text-primary">{user?.email}</strong> está cadastrado corretamente no seu perfil por um administrador.</p>
        <Button onClick={() => { setInitialFetchAttempted(false); setLoading(true); fetchMemberData(); }} className="mt-6 btn-primary-dark">Tentar Novamente</Button>
      </div>
    );
  }
  
  if (!memberData) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] bg-background">
        <Info className="h-16 w-16 text-orange-500 mb-4" />
        <p className="mt-4 text-xl text-muted-foreground">Não foi possível carregar os dados do membro.</p>
        <Button onClick={() => { setInitialFetchAttempted(false); setLoading(true); fetchMemberData(); }} className="mt-6 btn-primary-dark">Tentar Novamente</Button>
      </div>
    );
  }

  const totalAdvertencias = memberData.advertencias ? memberData.advertencias.length : 0;
  const presencasData = [
    { name: 'Sua Patente', presencas: nextPatenteInfo.currentPatentePresences },
    { name: 'Suas Presenças', presencas: memberData.total_presencas || 0 },
    { name: 'Próxima Patente', presencas: nextPatenteInfo.nextPatentePresences },
  ];
  const memberCoins = memberData.coins || 0;
  const memberPoints = memberData.points || 0;
  const memberStatus = memberData.status || 'Indefinido';
  const isStatusActive = memberStatus.toLowerCase() === 'ativo';

  return (
    <div className="relative">
      <Button variant="outline" size="icon" className="fixed top-24 right-4 z-50" onClick={() => setIsMemberSidebarOpen(true)}>
        <Menu className="h-6 w-6" />
      </Button>
      <MemberSidebar isOpen={isMemberSidebarOpen} setIsOpen={setIsMemberSidebarOpen} memberData={memberData} />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto py-8 px-2 sm:px-4 bg-gradient-to-b from-background to-slate-900 min-h-full"
      >
        <div className="mb-10 text-center">
          <motion.h1 
            variants={cardVariants}
            className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-destructive to-red-400 mb-3"
          >
            Quartel General Pessoal
          </motion.h1>
          <motion.p 
            variants={cardVariants}
            className="text-lg text-muted-foreground"
          >
            Bem-vindo(a) de volta, <span className="font-semibold text-primary">{memberData.codinome || user.email}!</span>
          </motion.p>
        </div>

        <motion.div variants={cardVariants} className="mb-8">
            <FeaturedMembersCard />
        </motion.div>

        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-2 lg:grid-cols-6 gap-6 mb-8"
        >
          <StatCard title="Sua Patente" value={memberData.patente_atual || 'N/D'} icon={<ShieldCheck className="h-6 w-6 text-sky-400" />} />
          <StatCard title="Status" value={memberStatus} icon={<Activity className="h-6 w-6" />} valueClassName={isStatusActive ? 'text-green-400' : 'text-red-400'} />
          <StatCard title="Presenças" value={memberData.total_presencas || 0} icon={<CalendarDays className="h-6 w-6 text-green-400" />} />
          <StatCard title="Advertências" value={totalAdvertencias} icon={<ShieldAlert className={`h-6 w-6 ${totalAdvertencias > 0 ? 'text-destructive' : 'text-yellow-400'}`} />} />
          <StatCard title="Moedas" value={memberCoins} icon={<Coins className="h-6 w-6 text-yellow-500" />} />
          <StatCard title="Pontos" value={memberPoints} icon={<Award className="h-6 w-6 text-purple-400" />} />
        </motion.div>
          
        <motion.div variants={cardVariants} className="mb-8">
          <CareerProgressCard 
            nextPatenteInfo={nextPatenteInfo}
            memberData={memberData}
            courseAlertMessage={courseAlertMessage}
            presencasData={presencasData}
          />
        </motion.div>
        
        <motion.div className="mb-8">
            <ClanGamesCard />
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div variants={cardVariants} className="md:col-span-2">
            <AnnouncementsCard />
          </motion.div>
          <motion.div variants={cardVariants}>
            <OnlineMembersCard onlineUsers={onlineUsers} isLoading={onlineUsersLoading} />
          </motion.div>
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div variants={cardVariants}>
            <ActivitySummaryCard memberData={memberData} />
          </motion.div>
          <motion.div variants={cardVariants}>
            <MissionsCard />
          </motion.div>
          <motion.div variants={cardVariants}>
            <EventsCard />
          </motion.div>
        </motion.div>
        
        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div variants={cardVariants} className="lg:col-span-2">
              <RankingCard currentMemberId={memberData.id} />
          </motion.div>
           <motion.div variants={cardVariants}>
              <FeedbackCard memberData={memberData} />
          </motion.div>
        </motion.div>
        
        <motion.div variants={cardVariants}>
          <ChallengesCard />
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-1 gap-6 my-8">
          <motion.div variants={cardVariants}>
            <WarningsHistoryCard advertencias={memberData.advertencias} />
          </motion.div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default MemberDashboardPage;