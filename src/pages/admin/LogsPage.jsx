import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ScrollText, Search, Filter, ChevronsRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const LogDetailsDialog = ({ log }) => {
  const renderDetails = (details) => {
    if (!details) return <p className="text-muted-foreground">Sem detalhes adicionais.</p>;
    
    const oldData = details.old_data;
    const newData = details.new_data;

    if (!oldData && !newData) return <pre className="text-sm bg-background/50 p-3 rounded-md overflow-x-auto">{JSON.stringify(details, null, 2)}</pre>;

    const allKeys = [...new Set([...(oldData ? Object.keys(oldData) : []), ...(newData ? Object.keys(newData) : [])])];
    
    return (
      <div className="space-y-4">
        {newData && !oldData && (
          <div>
            <h4 className="font-semibold text-green-400 mb-2">Dados Criados</h4>
            <pre className="text-sm bg-background/50 p-3 rounded-md overflow-x-auto">{JSON.stringify(newData, null, 2)}</pre>
          </div>
        )}
        {oldData && !newData && (
          <div>
            <h4 className="font-semibold text-red-400 mb-2">Dados Excluídos</h4>
            <pre className="text-sm bg-background/50 p-3 rounded-md overflow-x-auto">{JSON.stringify(oldData, null, 2)}</pre>
          </div>
        )}
        {oldData && newData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-orange-400 mb-2">Antes</h4>
              <pre className="text-sm bg-background/50 p-3 rounded-md overflow-x-auto h-64">{JSON.stringify(oldData, null, 2)}</pre>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">Depois</h4>
              <pre className="text-sm bg-background/50 p-3 rounded-md overflow-x-auto h-64">{JSON.stringify(newData, null, 2)}</pre>
            </div>
          </div>
        )}

        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 font-semibold">Campo</th>
              <th className="text-left p-2 font-semibold text-orange-400">Valor Antigo</th>
              <th className="text-left p-2 font-semibold text-green-400">Valor Novo</th>
            </tr>
          </thead>
          <tbody>
          {allKeys.map(key => {
            const oldValue = oldData?.[key];
            const newValue = newData?.[key];
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
              return (
                <tr key={key} className="border-b border-border/50">
                  <td className="p-2 font-mono text-muted-foreground">{key}</td>
                  <td className="p-2 max-w-xs truncate font-mono text-orange-400/80" title={typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue}>{String(oldValue)}</td>
                  <td className="p-2 max-w-xs truncate font-mono text-green-400/80" title={typeof newValue === 'object' ? JSON.stringify(newValue) : newValue}>{String(newValue)}</td>
                </tr>
              )
            }
            return null;
          })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Log</DialogTitle>
        </DialogHeader>
        <div className="py-4 max-h-[70vh] overflow-y-auto">
          {renderDetails(log.details)}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const LogsPage = () => {
  const { supabase, userRole } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActionType, setFilterActionType] = useState('all_types');
  const [filterUserRole, setFilterUserRole] = useState('all_roles');
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(15);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);

    let query = supabase.from('action_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.or(`action_description.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%,table_affected.ilike.%${searchTerm}%`);
    }
    if (filterActionType && filterActionType !== 'all_types') {
      query = query.eq('action_type', filterActionType);
    }
    if (filterUserRole && filterUserRole !== 'all_roles') {
      query = query.eq('user_role', filterUserRole);
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
  }, [supabase, toast, searchTerm, filterActionType, filterUserRole, currentPage, logsPerPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
  };

  const actionTypeOptions = ['INSERT', 'UPDATE', 'DELETE'];
  const userRoleOptions = ['admin', 'moderador', 'recrutador', 'member'];

  const totalPages = Math.ceil(totalLogs / logsPerPage);
  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  const handleSearchChange = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleActionTypeChange = (value) => { setFilterActionType(value); setCurrentPage(1); };
  const handleUserRoleChange = (value) => { setFilterUserRole(value); setCurrentPage(1); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="glassmorphic border border-primary/30 shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <CardTitle className="text-3xl text-primary flex items-center"><ScrollText className="mr-3 h-8 w-8" /> Logs de Atividade</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">Acompanhe todas as ações realizadas na plataforma.</CardDescription>
            </div>
            <Button onClick={fetchLogs} variant="outline" className="mt-3 sm:mt-0 btn-outline-dark" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Atualizar Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="relative flex-grow lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input type="text" placeholder="Buscar..." value={searchTerm} onChange={handleSearchChange} className="input-dark pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={filterActionType} onValueChange={handleActionTypeChange}>
                <SelectTrigger className="input-dark"><SelectValue placeholder="Tipo de Ação" /></SelectTrigger>
                <SelectContent><SelectItem value="all_types">Todos os Tipos</SelectItem>{actionTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {userRole === 'admin' && (
              <div className="flex items-center gap-2">
                 <Filter className="h-5 w-5 text-muted-foreground" />
                 <Select value={filterUserRole} onValueChange={handleUserRoleChange}>
                  <SelectTrigger className="input-dark"><SelectValue placeholder="Cargo do Usuário" /></SelectTrigger>
                  <SelectContent><SelectItem value="all_roles">Todos os Cargos</SelectItem>{userRoleOptions.map(role => <SelectItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</SelectItem>)}</SelectContent>
                 </Select>
              </div>
            )}
          </div>

          {isLoading && logs.length === 0 ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 text-primary animate-spin" /><p className="ml-4 text-xl text-muted-foreground">Carregando logs...</p></div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border/50">
              <Table>
                <TableCaption>{logs.length > 0 ? `Exibindo ${logs.length} de ${totalLogs} registros.` : 'Nenhum log encontrado para os filtros selecionados.'}</TableCaption>
                <TableHeader><TableRow className="border-b-primary/40">
                  <TableHead className="w-[180px]">Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead className="hidden md:table-cell">Tabela</TableHead>
                  <TableHead className="hidden lg:table-cell max-w-xs">Descrição</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-b border-primary/20 hover:bg-accent/10">
                      <TableCell className="font-medium text-muted-foreground">{formatDate(log.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{log.user_email || 'Sistema'}</span>
                          <span className="text-xs text-muted-foreground">{log.user_role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                          log.action_type === 'INSERT' ? 'bg-green-500/20 text-green-400' :
                          log.action_type === 'UPDATE' ? 'bg-yellow-500/20 text-yellow-400' :
                          log.action_type === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>{log.action_type}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{log.table_affected || 'N/A'}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-sm truncate" title={log.action_description}>{log.action_description}</TableCell>
                      <TableCell className="text-right">
                        {log.details && <LogDetailsDialog log={log} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex items-center justify-between mt-6">
            <Button onClick={handlePreviousPage} disabled={currentPage === 1 || isLoading} variant="outline" className="btn-outline-dark">Anterior</Button>
            <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
            <Button onClick={handleNextPage} disabled={currentPage === totalPages || isLoading} variant="outline" className="btn-outline-dark">Próxima</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LogsPage;