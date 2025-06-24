import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ShieldAlert, Megaphone, BarChart3, Wallet, FileText, ShoppingCart, Target as MissionIcon, UserCog, MessageSquare, Puzzle, Store, Settings, Menu, X, Laptop as NotebookText } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const AdminDashboardPage = () => {
  const { userRole, loading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const allTabItems = [
    { value: "members", label: "Membros", Icon: User, Component: MembersSection, roles: ['admin', 'moderador', 'recrutador'], group: 'main' },
    { value: "warnings", label: "Advertências", Icon: ShieldAlert, Component: WarningsManagementPage, roles: ['admin', 'moderador'], group: 'main' },
    { value: "missions", label: "Missões", Icon: MissionIcon, Component: MissionsSection, roles: ['admin', 'moderador'], group: 'main' },
    { value: "announcements", label: "Comunicados", Icon: Megaphone, Component: AnnouncementsSection, roles: ['admin', 'moderador'], group: 'main' },
    { value: "treasury", label: "Tesouraria", Icon: Wallet, Component: TreasuryPage, roles: ['admin'], group: 'main' },
    { value: "vip_control", label: "Controle de VIPs", Icon: ShoppingCart, Component: VipControlPage, roles: ['admin'], group: 'main' },
    { value: "user_management", label: "Usuários Painel", Icon: UserCog, Component: UserManagementPage, roles: ['admin'], group: 'main' },
    { value: "logs", label: "Logs", Icon: FileText, Component: LogsPage, roles: ['admin', 'moderador', 'recrutador'], group: 'main' },
    { value: "mission_feedback", label: "Feedback Missões", Icon: MessageSquare, Component: MissionFeedbackPage, roles: ['admin', 'moderador', 'recrutador'], group: 'more' },
    { value: "quiz_management", label: "Gerenciar Quiz", Icon: Puzzle, Component: QuizManagementPage, roles: ['admin', 'moderador'], group: 'more' },
    { value: "store_management", label: "Gerenciar Loja", Icon: Store, Component: StoreManagementPage, roles: ['admin'], group: 'more' },
    { value: "justifications", label: "Justificativas", Icon: NotebookText, Component: JustificationsPage, roles: ['admin', 'moderador'], group: 'more' },
    { value: "statistics", label: "Estatísticas", Icon: BarChart3, Component: StatisticsSection, roles: ['admin', 'moderador'], group: 'more' },
  ];

  const getVisibleTabs = (group) => authLoading ? [] : allTabItems.filter(tab => tab.group === group && tab.roles.includes(userRole || 'member'));

  const mainTabs = getVisibleTabs('main');
  const moreTabs = getVisibleTabs('more');
  
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (!authLoading) {
      const visibleMain = getVisibleTabs('main');
      const visibleMore = getVisibleTabs('more');
      if (visibleMain.length > 0) {
        setActiveTab(visibleMain[0].value);
      } else if (visibleMore.length > 0) {
        setActiveTab(visibleMore[0].value);
      }
    }
  }, [authLoading, userRole]);

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
    <div className="relative flex min-h-[calc(100vh_-_5rem)] bg-gradient-to-br from-background to-secondary/30">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {moreTabs.length > 0 && (
        <>
          <Button variant="outline" size="icon" className="fixed top-24 left-4 z-50" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <aside className={`fixed inset-y-0 left-0 bg-card/95 backdrop-blur-lg z-50 w-64 p-4 border-r border-primary/20 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-primary flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Ferramentas
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="space-y-2">
              {moreTabs.map(tab => (
                <Button 
                  key={tab.value}
                  variant={activeTab === tab.value ? 'default' : 'ghost'}
                  onClick={() => { setActiveTab(tab.value); setIsSidebarOpen(false); }}
                  className="w-full justify-start text-left h-auto py-2"
                >
                  <tab.Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="flex-grow">{tab.label}</span>
                </Button>
              ))}
            </div>
          </aside>
        </>
      )}

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="flex items-center mb-6 sm:mb-8">
            <motion.h1 
              className="text-3xl sm:text-4xl font-bold text-primary-foreground bg-clip-text bg-gradient-to-r from-primary via-accent to-primary-foreground w-full text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Painel Administrativo
            </motion.h1>
        </div>

        {(mainTabs.length > 0 || moreTabs.length > 0) ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {mainTabs.length > 0 && (
              <div className="overflow-x-auto horizontal-scrollbar pb-2">
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
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
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
      </main>
    </div>
  );
};

export default AdminDashboardPage;