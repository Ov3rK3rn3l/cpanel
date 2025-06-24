import React, { useState, useEffect, useCallback } from 'react';
    import { useAuth } from '@/contexts/AuthContext';
    import { useToast } from '@/components/ui/use-toast';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { Button } from '@/components/ui/button';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Loader2, ScrollText, Search, Filter } from 'lucide-react';
    import { motion } from 'framer-motion';

    const LogsPage = () => {
      const { supabase } = useAuth();
      const { toast } = useToast();
      const [logs, setLogs] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [searchTerm, setSearchTerm] = useState('');
      const [filterActionType, setFilterActionType] = useState('all_types'); 
      const [currentPage, setCurrentPage] = useState(1);
      const [logsPerPage] = useState(15);
      const [totalLogs, setTotalLogs] = useState(0);

      const fetchLogs = useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);

        let query = supabase
          .from('action_logs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.or(`action_description.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%,table_affected.ilike.%${searchTerm}%`);
        }
        if (filterActionType && filterActionType !== 'all_types') { 
          query = query.eq('action_type', filterActionType);
        }

        const from = (currentPage - 1) * logsPerPage;
        const to = from + logsPerPage - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
          toast({ title: "Erro ao buscar logs", description: error.message, variant: "destructive" });
          setLogs([]);
        } else {
          setLogs(data || []);
          setTotalLogs(count || 0);
        }
        setIsLoading(false);
      }, [supabase, toast, searchTerm, filterActionType, currentPage, logsPerPage]);

      useEffect(() => {
        fetchLogs();
      }, [fetchLogs]);

      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
      };

      const actionTypeOptions = ['CREATE', 'UPDATE', 'DELETE', 'SYNC_SHEETS', 'LOAD_SHEETS', 'LOGIN', 'LOGOUT', 'PRESENCE'];

      const totalPages = Math.ceil(totalLogs / logsPerPage);

      const handleNextPage = () => {
        if (currentPage < totalPages) {
          setCurrentPage(currentPage + 1);
        }
      };

      const handlePreviousPage = () => {
        if (currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      };


      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glassmorphic border border-primary/30 shadow-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <CardTitle className="text-3xl text-primary flex items-center">
                    <ScrollText className="mr-3 h-8 w-8" /> Logs de Atividade do Sistema
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Acompanhe as ações realizadas no painel administrativo.
                  </CardDescription>
                </div>
                 <Button onClick={fetchLogs} variant="outline" className="mt-3 sm:mt-0 btn-outline-dark" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Atualizar Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por descrição, email, tabela..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="input-dark pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <Select value={filterActionType} onValueChange={(value) => { setFilterActionType(value); setCurrentPage(1);}}>
                    <SelectTrigger className="w-full md:w-[200px] input-dark">
                      <SelectValue placeholder="Filtrar por Tipo de Ação" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all_types">Todos os Tipos</SelectItem>
                      {actionTypeOptions
                        .filter(type => type !== null && type !== undefined && type !== "")
                        .map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading && logs.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="ml-4 text-xl text-muted-foreground">Carregando logs...</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border border-border/50">
                  <Table>
                    <TableCaption>
                      {logs.length > 0 ? `Exibindo ${logs.length} de ${totalLogs} registros.` : 'Nenhum log encontrado.'}
                    </TableCaption>
                    <TableHeader>
                      <TableRow className="border-b-primary/40">
                        <TableHead className="w-[200px]">Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Tipo de Ação</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="hidden md:table-cell">Tabela Afetada</TableHead>
                        <TableHead className="hidden lg:table-cell">ID do Registro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} className="border-b border-primary/20 hover:bg-accent/10">
                          <TableCell className="font-medium text-muted-foreground">{formatDate(log.created_at)}</TableCell>
                          <TableCell>{log.user_email || 'Sistema'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              log.action_type === 'CREATE' ? 'bg-green-500/20 text-green-400' :
                              log.action_type === 'UPDATE' ? 'bg-yellow-500/20 text-yellow-400' :
                              log.action_type === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {log.action_type}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={log.action_description}>{log.action_description}</TableCell>
                          <TableCell className="hidden md:table-cell">{log.table_affected || 'N/A'}</TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground" title={log.record_id || ''}>{log.record_id ? `${log.record_id.substring(0,8)}...` : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
               <div className="flex items-center justify-between mt-6">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isLoading}
                    variant="outline"
                    className="btn-outline-dark"
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || isLoading}
                    variant="outline"
                    className="btn-outline-dark"
                  >
                    Próxima
                  </Button>
                </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    };

    export default LogsPage;