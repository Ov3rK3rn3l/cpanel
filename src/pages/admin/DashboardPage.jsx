import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ShieldAlert, Megaphone, BarChart3, Wallet, FileText, ShoppingCart, Target as MissionIcon, UserCog, MessageSquare, Puzzle, Store, Settings, Menu, X, Laptop as NotebookText, UserPlus, DatabaseBackup, PanelLeft, PanelRight, Calendar } from 'lucide-react';
import MembersSection from '@/components/admin/MembersSection';
import WarningsManagementPage from '@/pages/admin/WarningsManagementPage';
import AnnouncementsSection from '@/components/admin/AnnouncementsSection';
import StatisticsSection from '@/components/admin/StatisticsSection';
import TreasuryPage from '@/pages/admin/TreasuryPage';
import LogsPage from '@/pages/admin/LogsPage';
import VipControlPage from '@/pages/admin/VipControlPage';
import MissionsSection from '@/components/admin/MissionsSection';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import MissionFeedbackPage from '@/pages/admin/MissionFeedbackPage'; 
import QuizManagementPage from '@/pages/admin/QuizManagementPage';
import StoreManagementPage from '@/pages/admin/StoreManagementPage';
import JustificationsPage from '@/pages/admin/JustificationsPage';
import RecruitmentManagementPage from '@/pages/admin/RecruitmentManagementPage';
import RecruiterStatisticsPage from '@/pages/admin/RecruiterStatisticsPage';
import BackupPage from '@/pages/admin/BackupPage';
import SchedulePage from '@/pages/admin/SchedulePage';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const allTabItems = [
  // Main Group
  { value: "recruitment", label: "Recrutamento", Icon: UserPlus, Component: RecruitmentManagementPage, roles: ['admin', 'recrutador'], group: 'main' },
  { value: "members", label: "Membros", Icon: User, Component: MembersSection, roles: ['admin', 'moderador'], group: 'main' },
  { value: "warnings", label: "Advertências", Icon: ShieldAlert, Component: WarningsManagementPage, roles: ['admin', 'moderador'], group: 'main' },
  { value: "missions", label: "Missões", Icon: MissionIcon, Component: MissionsSection, roles: ['admin', 'moderador'], group: 'main' },
  { value: "announcements", label: "Comunicados", Icon: Megaphone, Component: AnnouncementsSection, roles: ['admin', 'moderador'], group: 'main' },
  { value: "treasury", label: "Tesouraria", Icon: Wallet, Component: TreasuryPage, roles: ['admin'], group: 'main' },
  { value: "vip_control", label: "Controle de VIPs", Icon: ShoppingCart, Component: VipControlPage, roles: ['admin'], group: 'main' },
  { value: "user_management", label: "Usuários Painel", Icon: UserCog, Component: UserManagementPage, roles: ['admin'], group: 'main' },
  
  // More Tools Group (Sidebar)
  { value: "recruiter_stats", label: "Estatísticas Rec.", Icon: BarChart3, Component: RecruiterStatisticsPage, roles: ['admin', 'recrutador'], group: 'more' },
  { value: "statistics", label: "Estatísticas Gerais", Icon: BarChart3, Component: StatisticsSection, roles: ['admin', 'moderador'], group: 'more' },
  { value: "mission_feedback", label: "Feedback Missões", Icon: MessageSquare, Component: MissionFeedbackPage, roles: ['admin', 'moderador', 'recrutador'], group: 'more' },
  { value: "quiz_management", label: "Gerenciar Quiz", Icon: Puzzle, Component: QuizManagementPage, roles: ['admin', 'moderador'], group: 'more' },
  { value: "store_management", label: "Gerenciar Loja", Icon: Store, Component: StoreManagementPage, roles: ['admin'], group: 'more' },
  { value: "justifications", label: "Justificativas", Icon: NotebookText, Component: JustificationsPage, roles: ['admin', 'moderador'], group: 'more' },
  { value: "agenda", label: "Agenda", Icon: Calendar, Component: SchedulePage, roles: ['admin', 'moderador', 'recrutador'], group: 'more' },
  { value: "backup", label: "Backup", Icon: DatabaseBackup, Component: BackupPage, roles: ['admin'], group: 'more' },
  { value: "logs", label: "Logs de Ações", Icon: FileText, Component: LogsPage, roles: ['admin', 'moderador', 'recrutador'], group: 'more' },
];

const Sidebar = ({ isCollapsed, onToggle, activeTab, onTabChange, userRole }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const moreTabs = allTabItems.filter(tab => tab.group === 'more' && tab.roles.includes(userRole || 'member'));

  return (
    <>
      <AnimatePresence>
        {(isMobile && !isCollapsed) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
      <motion.aside
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={{
          expanded: { width: '16rem', x: 0 },
          collapsed: { width: isMobile ? '0rem' : '4.5rem', x: isMobile ? '-100%' : 0 },
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed top-[var(--navbar-height,5rem)] bottom-0 left-0 bg-card/90 backdrop-blur-lg z-50 overflow-hidden',
          'border-r border-primary/20 flex flex-col'
        )}
      >
        <div className={cn(
          "flex items-center justify-between p-4 border-b border-primary/20",
          isCollapsed ? "px-3" : "px-4"
        )}>
          {!isCollapsed && (
             <h3 className="text-lg font-semibold text-primary flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Ferramentas
            </h3>
          )}
          <Button variant="ghost" size="icon" onClick={onToggle} className="text-foreground">
            {isCollapsed ? <PanelRight className="h-6 w-6" /> : <PanelLeft className="h-6 w-6" />}
          </Button>
        </div>
        <nav className="flex-1 space-y-2 p-2 overflow-y-auto custom-scrollbar">
          {moreTabs.map(tab => (
            <Button
              key={tab.value}
              variant={activeTab === tab.value ? 'default' : 'ghost'}
              onClick={() => { onTabChange(tab.value); if (isMobile) onToggle(); }}
              className={cn(
                "w-full justify-start text-left h-auto py-2.5 transition-all duration-200",
                isCollapsed ? "px-3" : "px-4"
              )}
              title={tab.label}
            >
              <tab.Icon className={cn("h-5 w-5 flex-shrink-0", !isCollapsed && "mr-3")} />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-grow whitespace-nowrap overflow-hidden"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          ))}
        </nav>
      </motion.aside>
    </>
  );
};


const AdminDashboardPage = () => {
  const { userRole, loading: authLoading } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(!isDesktop);

  const mainTabs = allTabItems.filter(tab => tab.group === 'main' && tab.roles.includes(userRole || 'member'));
  
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (!authLoading) {
      const availableTabs = allTabItems.filter(tab => tab.roles.includes(userRole || 'member'));
      if (availableTabs.length > 0) {
        setActiveTab(availableTabs[0].value);
      }
    }
  }, [authLoading, userRole]);
  
  useEffect(() => {
    setIsSidebarCollapsed(!isDesktop);
  }, [isDesktop]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ width: 50, height: 50, border: "4px solid hsl(var(--primary))", borderTopColor: "transparent", borderRadius: "50%" }}
        />
        <p className="text-xl text-muted-foreground mt-4">Carregando Painel...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100vh_-_5rem)] bg-gradient-to-br from-background to-secondary/20">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(prev => !prev)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole}
      />
      <motion.main
        initial={false}
        animate={{ paddingLeft: isSidebarCollapsed ? (isDesktop ? '5.5rem' : '1rem') : (isDesktop ? '17rem' : '1rem') }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-y-auto"
      >
        {!isDesktop && !isSidebarCollapsed && (
          <Button variant="ghost" size="icon" className="md:hidden absolute top-4 right-4 z-50" onClick={() => setIsSidebarCollapsed(true)}>
            <X className="h-6 w-6" />
          </Button>
        )}
        {!isDesktop && isSidebarCollapsed && (
          <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-30" onClick={() => setIsSidebarCollapsed(false)}>
            <Menu className="h-6 w-6" />
          </Button>
        )}
        <div className="flex items-center mb-6 sm:mb-8">
            <motion.h1 
              className="text-3xl sm:text-4xl font-bold text-primary-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary via-red-400 to-primary-foreground w-full text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Painel Administrativo GERR
            </motion.h1>
        </div>

        {(mainTabs.length > 0 || allTabItems.filter(t=>t.group === 'more' && t.roles.includes(userRole || 'member')).length > 0) ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {mainTabs.length > 0 && (
              <div className="overflow-x-auto custom-scrollbar pb-2">
                <TabsList className="inline-flex w-max min-w-full bg-card p-1 sm:p-2 rounded-lg shadow-lg">
                  {mainTabs.map((tab) => (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value}
                      className="dashboard-tab-trigger"
                    >
                      <tab.Icon className="w-4 h-4 mr-1 sm:mr-2" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            )}
            
            <div className="flex-grow mt-4 sm:mt-6">
              {allTabItems.filter(tab => tab.roles.includes(userRole || 'member')).map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="h-full" forceMount={true}>
                  {activeTab === tab.value && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="h-full" 
                    >
                      <tab.Component />
                    </motion.div>
                  )}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        ) : (
          <div className="text-center py-10 flex-grow flex flex-col justify-center items-center">
            <p className="text-xl text-muted-foreground">Você não tem permissão para acessar nenhuma seção do painel.</p>
            <Button onClick={() => window.location.reload()} className="mt-4 btn-primary-dark">Tentar Recarregar</Button>
          </div>
        )}
      </motion.main>
    </div>
  );
};

export default AdminDashboardPage;