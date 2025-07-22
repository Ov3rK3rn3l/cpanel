import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Loader2, Download, Upload, DatabaseBackup, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const BackupPage = () => {
    const { supabase, user } = useAuth();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [history, setHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
    const sheetName = import.meta.env.VITE_GOOGLE_SHEET_NAME || 'BotAutomacao';

    const logAction = async (actionType, status, details) => {
        await supabase.from('backup_history').insert({
            user_id: user?.id,
            user_email: user?.email,
            action_type: actionType,
            status,
            details,
        });
        fetchHistory(); // Refresh history after logging
    };

    const fetchHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        const { data, error } = await supabase
            .from('backup_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            toast({ title: "Erro ao buscar histórico", description: error.message, variant: "destructive" });
        } else {
            setHistory(data);
        }
        setIsLoadingHistory(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSyncToSheets = async () => {
        if (!spreadsheetId) {
            toast({ title: "Configuração Incompleta", description: "ID da Planilha Google não configurado.", variant: "destructive" });
            return;
        }
        setIsProcessing(true);
        toast({ title: "Sincronizando com Google Sheets...", description: "Isso pode levar alguns instantes." });

        try {
            const { data: members, error: membersError } = await supabase.from('members').select('*');
            if (membersError) throw membersError;

            const { data, error: invokeError } = await supabase.functions.invoke('sync-members-to-google-sheets', {
                body: { members, spreadsheetId, sheetName }
            });

            if (invokeError) throw invokeError;
            if (data?.error) throw new Error(data.error);

            toast({ title: "Sincronização Concluída!", description: data?.message || "Dados enviados para o Google Sheets." });
            await logAction('Sincronizar para Sheets', 'Sucesso', data?.message || `Total: ${members.length} membros.`);
        } catch (error) {
            console.error("Erro ao sincronizar com Google Sheets:", error);
            const errorMessage = error.message || "Falha ao invocar a Edge Function.";
            toast({ title: "Erro ao sincronizar", description: errorMessage, variant: "destructive" });
            await logAction('Sincronizar para Sheets', 'Falha', errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLoadFromSheets = async () => {
        if (!spreadsheetId) {
            toast({ title: "Configuração Incompleta", description: "ID da Planilha Google não configurado.", variant: "destructive" });
            return;
        }
        setIsProcessing(true);
        toast({ title: "Carregando do Google Sheets...", description: "Atualizando banco de dados. Isso pode demorar." });

        try {
            const { data, error: invokeError } = await supabase.functions.invoke('load-members-from-google-sheets', {
                body: { spreadsheetId, sheetName }
            });

            if (invokeError) throw invokeError;
            if (data?.error) {
                const errorDetails = Array.isArray(data.details) ? data.details.join('; ') : data.error;
                throw new Error(errorDetails);
            }
            
            toast({ title: "Carregamento Concluído!", description: data?.message || "Dados processados com sucesso." });
            await logAction('Carregar de Sheets', 'Sucesso', data?.message || 'Dados carregados e atualizados.');
        } catch (error) {
            console.error("Erro ao carregar do Google Sheets:", error);
            const errorMessage = error.message || "Falha ao invocar a Edge Function.";
            toast({ title: "Erro ao carregar", description: errorMessage, variant: "destructive" });
            await logAction('Carregar de Sheets', 'Falha', errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Sucesso': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'Falha': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return <Clock className="h-5 w-5 text-yellow-500" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center text-2xl text-primary">
                        <DatabaseBackup className="mr-3 h-7 w-7" />
                        Backup e Sincronização com Google Sheets
                    </CardTitle>
                    <CardDescription>
                        Sincronize os dados dos membros entre o painel e sua planilha do Google Sheets. As ações são registradas para auditoria.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-lg bg-card/50">
                        <h3 className="text-lg font-semibold mb-2">Enviar para Planilha</h3>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            Envia todos os dados atuais dos membros do painel para o Google Sheets, substituindo os dados existentes na planilha.
                        </p>
                        <Button onClick={handleSyncToSheets} disabled={isProcessing} className="w-full max-w-xs btn-primary-dark">
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Sincronizar para Sheets
                        </Button>
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-lg bg-card/50">
                        <h3 className="text-lg font-semibold mb-2">Carregar da Planilha</h3>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            Carrega os dados da planilha do Google Sheets para o painel. Isso irá atualizar ou criar novos membros no banco de dados.
                        </p>
                        <Button onClick={handleLoadFromSheets} disabled={isProcessing} className="w-full max-w-xs btn-outline-dark">
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Carregar de Sheets
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle>Histórico de Sincronizações</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingHistory ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : history.length > 0 ? (
                                history.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{new Date(item.created_at).toLocaleString('pt-BR')}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.action_type.includes('Sincronizar') ? 'default' : 'secondary'}>
                                                {item.action_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{item.user_email}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            {getStatusIcon(item.status)} {item.status}
                                        </TableCell>
                                        <TableCell>{item.details}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        Nenhuma atividade de backup registrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableCaption>Exibindo os 10 backups mais recentes.</TableCaption>
                    </Table>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default BackupPage;