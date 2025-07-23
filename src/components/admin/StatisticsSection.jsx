import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users2, ListChecks, Target, ShieldAlert, BarChart3, Loader2, UserPlus, UserMinus, PieChart as PieIcon, AlertTriangle, Laptop as NotebookText } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { PATENTE_ORDER_MAP } from '@/components/admin/members/utils';
import StatCard from '@/components/admin/statistics/StatCard';
import RevenueChart from '@/components/admin/statistics/RevenueChart';

const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6'];
const VIBRANT_RED = '#ef4444';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" }
  })
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg">
        <p className="label text-primary font-semibold">{`${label}`}</p>
        {payload.map((pld, index) => (
          <p key={index} style={{ color: pld.color }} className="intro">{`${pld.name}: ${pld.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const StatisticsSection = () => {
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    averagePresence: 0,
    topPatente: "N/A",
    mostCommonWarningType: "N/A",
    totalWarnings: 0,
    totalClanRevenue: 0,
    patenteDistribution: [],
    revenueTrend: [],
    memberFlow: [],
    missionStatus: [],
    warningDistribution: [],
    openJustifications: 0,
    expiredJustifications: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [revenueFilterMonth, setRevenueFilterMonth] = useState('all');
  const [revenueFilterYear, setRevenueFilterYear] = useState(new Date().getFullYear().toString());

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const monthOptions = [
    { value: 'all', label: 'Todo o Ano' },
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];

  const fetchClanRevenue = useCallback(async (filterYear, filterMonth) => {
    if (!supabase) return { total: 0, trend: [] };
    let treasuryQuery = supabase.from('treasury_transactions').select('amount, treasury_categories(type), transaction_date').gt('amount', 0);
    let vipQuery = supabase.from('vip_purchases').select('total_amount, purchase_date');
    if (filterYear !== 'all') {
      const yearStart = `${filterYear}-01-01`;
      const yearEnd = `${filterYear}-12-31`;
      if (filterMonth !== 'all') {
        const monthStart = `${filterYear}-${filterMonth}-01`;
        const lastDayOfMonth = new Date(parseInt(filterYear), parseInt(filterMonth), 0).getDate();
        const monthEnd = `${filterYear}-${filterMonth}-${String(lastDayOfMonth).padStart(2, '0')}`;
        treasuryQuery = treasuryQuery.gte('transaction_date', monthStart).lte('transaction_date', monthEnd);
        vipQuery = vipQuery.gte('purchase_date', monthStart).lte('purchase_date', monthEnd);
      } else {
        treasuryQuery = treasuryQuery.gte('transaction_date', yearStart).lte('transaction_date', yearEnd);
        vipQuery = vipQuery.gte('purchase_date', yearStart).lte('purchase_date', yearEnd);
      }
    }
    const [{ data: treasuryData, error: treasuryError }, { data: vipData, error: vipError }] = await Promise.all([treasuryQuery, vipQuery]);
    if (treasuryError) throw new Error(`Erro na tesouraria: ${treasuryError.message}`);
    if (vipError) throw new Error(`Erro nas compras VIP: ${vipError.message}`);
    const totalTreasuryIncome = treasuryData?.filter(t => t.treasury_categories?.type === 'income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;
    const totalVipSales = vipData?.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0) || 0;
    const combinedData = [
      ...(treasuryData?.filter(t => t.treasury_categories?.type === 'income').map(t => ({ date: t.transaction_date, amount: parseFloat(t.amount) || 0 })) || []),
      ...(vipData?.map(p => ({ date: p.purchase_date, amount: parseFloat(p.total_amount) || 0 })) || [])
    ];
    const revenueByMonth = {};
    combinedData.forEach(item => {
      const monthYear = item.date.substring(0, 7);
      revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + item.amount;
    });
    const trendData = Object.entries(revenueByMonth).map(([monthYear, total]) => ({ name: monthYear, Receita: total })).sort((a, b) => a.name.localeCompare(b.name));
    return { total: totalTreasuryIncome + totalVipSales, trend: trendData };
  }, [supabase]);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const [
        { data: membersData, error: membersError },
        { data: missionsData, error: missionsError },
        { data: justificationsData, error: justificationsError },
      ] = await Promise.all([
        supabase.from('members').select('data_ingresso, data_saida, total_presencas, patente_atual, advertencias, ultima_presenca'),
        supabase.from('missions').select('status'),
        supabase.from('justifications').select('end_date'),
      ]);
      if (membersError) throw membersError;
      if (missionsError) throw missionsError;
      if (justificationsError) throw justificationsError;

      const { total: totalClanRevenue, trend: revenueTrend } = await fetchClanRevenue(revenueFilterYear, revenueFilterMonth);
      const activeMembersList = membersData.filter(m => !m.data_saida);
      const totalMembers = activeMembersList.length;
      const activeMembersCount = activeMembersList.filter(m => m.ultima_presenca && new Date(m.ultima_presenca) >= new Date(thirtyDaysAgo)).length;
      const averagePresence = totalMembers > 0 ? (activeMembersList.reduce((sum, m) => sum + (m.total_presencas || 0), 0) / totalMembers).toFixed(1) : 0;
      
      const patenteCounts = activeMembersList.reduce((acc, member) => {
        if (member.patente_atual) acc[member.patente_atual] = (acc[member.patente_atual] || 0) + 1;
        return acc;
      }, {});
      const patenteDistribution = Object.entries(patenteCounts).map(([name, value]) => ({ name, value })).sort((a, b) => (PATENTE_ORDER_MAP[b.name] || 0) - (PATENTE_ORDER_MAP[a.name] || 0));
      const topPatente = patenteDistribution.length > 0 ? patenteDistribution.reduce((a, b) => a.value > b.value ? a : b).name : "N/A";

      const warningTypeCounts = {};
      let totalWarnings = 0;
      membersData.forEach(member => {
        if (member.advertencias && Array.isArray(member.advertencias)) {
          totalWarnings += member.advertencias.length;
          member.advertencias.forEach(adv => {
            if (adv.tipo) warningTypeCounts[adv.tipo] = (warningTypeCounts[adv.tipo] || 0) + 1;
          });
        }
      });
      const warningDistribution = Object.entries(warningTypeCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
      const mostCommonWarningType = warningDistribution.length > 0 ? warningDistribution[0].name : "N/A";

      const memberFlow = Array.from({ length: 12 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { month: d.toISOString().substring(0, 7), new: 0, left: 0 };
      }).reverse();
      membersData.forEach(m => {
        const joinMonth = m.data_ingresso ? m.data_ingresso.substring(0, 7) : null;
        const leftMonth = m.data_saida ? m.data_saida.substring(0, 7) : null;
        const joinEntry = memberFlow.find(e => e.month === joinMonth);
        if (joinEntry) joinEntry.new++;
        const leftEntry = memberFlow.find(e => e.month === leftMonth);
        if (leftEntry) leftEntry.left++;
      });

      const missionStatusCounts = missionsData.reduce((acc, mission) => {
        if (mission.status) acc[mission.status] = (acc[mission.status] || 0) + 1;
        return acc;
      }, {});
      const missionStatus = Object.entries(missionStatusCounts).map(([name, value]) => ({ name, value }));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const openJustificationsCount = justificationsData.filter(j => new Date(j.end_date) >= today).length;
      const expiredJustificationsCount = justificationsData.length - openJustificationsCount;

      setStats({
        totalMembers, activeMembers: activeMembersCount, averagePresence, topPatente,
        mostCommonWarningType, totalWarnings, totalClanRevenue, patenteDistribution,
        revenueTrend, memberFlow, missionStatus, warningDistribution,
        openJustifications: openJustificationsCount,
        expiredJustifications: expiredJustificationsCount,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast({ title: "Erro ao buscar estatísticas", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast, fetchClanRevenue, revenueFilterYear, revenueFilterMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh] space-x-3">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-xl text-muted-foreground">Analisando dados do Clã...</p>
      </div>
    );
  }

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-semibold text-foreground mb-2 flex items-center">
          <BarChart3 className="mr-3 h-10 w-10 text-primary" /> Painel de Estatísticas GERR
        </h1>
        <p className="text-muted-foreground mb-6">Visão geral do desempenho e engajamento da comunidade.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Membros Ativos" value={stats.totalMembers} icon={<Users2 />} description={`${stats.activeMembers} ativos nos últimos 30d`} color="text-primary" delayIndex={1} />
        <StatCard title="Média de Presenças" value={stats.averagePresence} icon={<ListChecks />} description="Por membro ativo" color="text-green-400" delayIndex={2} />
        <StatCard title="Patente Mais Comum" value={stats.topPatente} icon={<Target />} description={`${stats.patenteDistribution.find(p => p.name === stats.topPatente)?.value || 0} membros`} color="text-yellow-400" delayIndex={3} />
        <StatCard title="Advertência Mais Comum" value={stats.mostCommonWarningType} icon={<ShieldAlert />} description={`Total: ${stats.totalWarnings} advertências`} color="text-orange-400" delayIndex={4} />
        <StatCard title="Justificativas Abertas" value={stats.openJustifications} icon={<NotebookText />} description="Atualmente em período de ausência" color="text-blue-400" delayIndex={5} />
        <StatCard title="Justificativas Vencidas" value={stats.expiredJustifications} icon={<NotebookText />} description="Período de ausência finalizado" color="text-gray-400" delayIndex={6} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div className="lg:col-span-3" variants={cardVariants} custom={5} initial="hidden" animate="visible">
          <RevenueChart stats={stats} revenueFilterMonth={revenueFilterMonth} setRevenueFilterMonth={setRevenueFilterMonth} revenueFilterYear={revenueFilterYear} setRevenueFilterYear={setRevenueFilterYear} monthOptions={monthOptions} yearOptions={yearOptions} />
        </motion.div>
        <motion.div className="lg:col-span-2" variants={cardVariants} custom={6} initial="hidden" animate="visible">
          <Card className="glassmorphic h-full border border-primary/30">
            <CardHeader><CardTitle className="text-xl text-primary flex items-center"><PieIcon className="mr-2 h-6 w-6"/>Distribuição por Patente</CardTitle><CardDescription>Distribuição dos membros ativos.</CardDescription></CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.patenteDistribution} cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" fill={VIBRANT_RED} dataKey="value" nameKey="name" paddingAngle={2}>
                    {stats.patenteDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{fontSize: "12px", lineHeight: "1.2"}}/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={cardVariants} custom={7} initial="hidden" animate="visible">
          <Card className="glassmorphic h-full border border-primary/30">
            <CardHeader><CardTitle className="text-xl text-primary flex items-center"><UserPlus className="mr-2 h-6 w-6"/>Fluxo de Membros (Últimos 12 Meses)</CardTitle><CardDescription>Novos recrutas vs. desligamentos.</CardDescription></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.memberFlow} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{fontSize: "12px"}}/>
                  <Bar dataKey="new" name="Novos Membros" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="left" name="Desligamentos" fill={VIBRANT_RED} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants} custom={8} initial="hidden" animate="visible">
          <Card className="glassmorphic h-full border border-primary/30">
            <CardHeader><CardTitle className="text-xl text-primary flex items-center"><Target className="mr-2 h-6 w-6"/>Status das Missões</CardTitle><CardDescription>Distribuição de todas as missões cadastradas.</CardDescription></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.missionStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" fill={VIBRANT_RED} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {stats.missionStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={cardVariants} custom={9} initial="hidden" animate="visible">
        <Card className="glassmorphic border border-primary/30">
          <CardHeader><CardTitle className="text-xl text-primary flex items-center"><AlertTriangle className="mr-2 h-6 w-6"/>Distribuição de Advertências</CardTitle><CardDescription>Contagem dos tipos de advertências aplicadas.</CardDescription></CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stats.warningDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Quantidade" fill={VIBRANT_RED} radius={[0, 4, 4, 0]} barSize={25}>
                  {stats.warningDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.section>
  );
};

export default StatisticsSection;