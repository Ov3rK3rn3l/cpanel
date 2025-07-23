import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '@/components/admin/members/utils';

const LOGS_PER_PAGE = 20;

const ActionLogsPage = () => {
    const { supabase } = useAuth();
    const { toast } = useToast();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [count, setCount] = useState(0);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const from = page * LOGS_PER_PAGE;
            const to = from + LOGS_PER_PAGE - 1;

            let query = supabase
                .from('action_logs')
                .select('*', { count: 'exact' });

            if (searchTerm) {
                query = query.or(`user_email.ilike.%${searchTerm}%,action_type.ilike.%${searchTerm}%,action_description.ilike.%${searchTerm}%`);
            }
            
            query = query.order('created_at', { ascending: false }).range(from, to);

            const { data, error, count: totalCount } = await query;

            if (error) throw error;
            
            setLogs(data || []);
            setCount(totalCount || 0);

        } catch (error) {
            toast({ title: 'Erro ao buscar logs', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [supabase, toast, page, searchTerm]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);
    
    const handleSearch = (e) => {
      setSearchTerm(e.target.value);
      setPage(0);
    };

    return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="container mx-auto py-8 px-4"
        >
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-primary">Log de Ações do Sistema</CardTitle>
                    <CardDescription>Visualize todas as atividades importantes registradas na plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por email, tipo ou descrição..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-9 input-dark"
                            />
                        </div>
                    </div>
                    
                    <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Tipo de Ação</TableHead>
                                    <TableHead>Descrição</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Nenhum log encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-sm text-muted-foreground">{formatDate(log.created_at, "dd/MM/yyyy HH:mm")}</TableCell>
                                            <TableCell>{log.user_email || 'Sistema'}</TableCell>
                                            <TableCell>{log.action_type}</TableCell>
                                            <TableCell>{log.action_description}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <span className="text-sm text-muted-foreground">
                            Página {page + 1} de {Math.ceil(count / LOGS_PER_PAGE)}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p - 1)}
                            disabled={page === 0}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={(page + 1) * LOGS_PER_PAGE >= count}
                        >
                            Próxima <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ActionLogsPage;