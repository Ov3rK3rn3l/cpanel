import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, UserPlus, Calendar, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const RecruiterStatisticsPage = () => {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [stats, setStats] = useState([]);
    const [personalStats, setPersonalStats] = useState({ count: 0, last_recruitment: 'N/A' });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            if (userRole === 'admin') {
                // Admin fetches all stats
                const { data, error } = await supabase
                    .from('applications')
                    .select('recruited_by, recruiter:recruited_by(email, nome)')
                    .eq('status', 'ACEITO')
                    .not('recruited_by', 'is', null);

                if (error) throw error;
                
                const groupedStats = data.reduce((acc, curr) => {
                    const recruiterName = curr.recruiter?.nome || curr.recruiter?.email || 'Desconhecido';
                    acc[recruiterName] = (acc[recruiterName] || 0) + 1;
                    return acc;
                }, {});

                const chartData = Object.entries(groupedStats).map(([name, count]) => ({ name, recrutamentos: count }));
                setStats(chartData);

            } else if (userRole === 'recrutador') {
                // Recruiter fetches personal stats
                const { data, error, count } = await supabase
                    .from('applications')
                    .select('created_at', { count: 'exact' })
                    .eq('recruited_by', user.id)
                    .eq('status', 'ACEITO')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;

                setPersonalStats({
                    count: count || 0,
                    last_recruitment: data.length > 0 ? new Date(data[0].created_at).toLocaleDateString('pt-BR') : 'N/A'
                });
            }
        } catch (error) {
            toast({ title: 'Erro ao buscar estatísticas', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [user, userRole, toast]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6">
            <Card className="glassmorphic-dark border-primary/40">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-primary flex items-center">
                        <BarChart3 className="mr-3 h-8 w-8" />
                        Estatísticas de Recrutamento
                    </CardTitle>
                    <CardDescription>
                        {userRole === 'admin' ? 'Desempenho de todos os recrutadores.' : 'Seu desempenho como recrutador.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {userRole === 'admin' ? (
                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer>
                                <BarChart data={stats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                    <XAxis dataKey="name" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(31, 41, 55, 0.8)',
                                            borderColor: 'hsl(var(--primary))',
                                            color: '#d1d5db'
                                        }}
                                        labelStyle={{ color: 'hsl(var(--primary-foreground))' }}
                                    />
                                    <Legend wrapperStyle={{ color: '#d1d5db' }}/>
                                    <Bar dataKey="recrutamentos" fill="hsl(var(--primary))" name="Recrutamentos" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <Card className="bg-background/30">
                               <CardHeader className="flex flex-row items-center justify-between pb-2">
                                   <CardTitle className="text-sm font-medium">Total de Recrutados</CardTitle>
                                   <UserPlus className="h-6 w-6 text-primary" />
                               </CardHeader>
                               <CardContent>
                                   <div className="text-4xl font-bold text-primary">{personalStats.count}</div>
                                   <p className="text-xs text-muted-foreground">Membros aceitos por você.</p>
                               </CardContent>
                           </Card>
                           <Card className="bg-background/30">
                               <CardHeader className="flex flex-row items-center justify-between pb-2">
                                   <CardTitle className="text-sm font-medium">Último Recrutamento</CardTitle>
                                   <Calendar className="h-6 w-6 text-accent" />
                               </CardHeader>
                               <CardContent>
                                   <div className="text-4xl font-bold text-accent">{personalStats.last_recruitment}</div>
                                   <p className="text-xs text-muted-foreground">Data do último membro aceito.</p>
                               </CardContent>
                           </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default RecruiterStatisticsPage;