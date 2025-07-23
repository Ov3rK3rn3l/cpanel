import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { useAuth } from '@/contexts/AuthContext';
    import { useToast } from '@/components/ui/use-toast';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Button } from '@/components/ui/button';
    import { Loader2, ShieldAlert, UserCircle, Info, Filter, Trash2 } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { Badge } from '@/components/ui/badge';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


    const ADVERTENCIA_TIPOS = ["Verbal", "Nivel 1", "Nivel 2"];

    const WarningsManagementPage = () => {
      const { supabase, user } = useAuth();
      const { toast } = useToast();
      const [allMembersWithWarnings, setAllMembersWithWarnings] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [filters, setFilters] = useState({ memberName: '', warningType: 'all', appliedBy: 'all' });
      const [adminsList, setAdminsList] = useState([]);

      const fetchWarningsData = useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);

        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, codinome, advertencias')
          .not('advertencias', 'eq', '[]') 
          .order('codinome', { ascending: true });

        if (membersError) {
          toast({ title: "Erro ao buscar dados de advertências", description: membersError.message, variant: "destructive" });
          setIsLoading(false);
          return;
        }

        const uniqueAdminIds = new Set();
        membersData.forEach(member => {
            if(member.advertencias) {
                member.advertencias.forEach(adv => {
                    if(adv.aplicada_por_id) uniqueAdminIds.add(adv.aplicada_por_id);
                });
            }
        });
        
        if (uniqueAdminIds.size > 0) {
            const { data: adminUsers, error: adminError } = await supabase
                .from('users') 
                .select('id, email, nome')
                .in('id', Array.from(uniqueAdminIds));
            
            if (adminError) {
                console.error("Erro ao buscar nomes dos admins:", adminError.message);
            } else {
                setAdminsList(adminUsers || []);
            }
        }

        setAllMembersWithWarnings(membersData.filter(m => m.advertencias && m.advertencias.length > 0));
        setIsLoading(false);
      }, [supabase, toast]);

      useEffect(() => {
        fetchWarningsData();
      }, [fetchWarningsData]);

      const getAdminName = (adminId) => {
        const admin = adminsList.find(a => a.id === adminId);
        return admin ? (admin.nome || admin.email) : (user?.id === adminId ? (user.user_metadata?.name || user.email) : 'Desconhecido');
      };
      
      const filteredWarnings = useMemo(() => {
        let expandedWarnings = [];
        allMembersWithWarnings.forEach(member => {
            if(member.advertencias){
                member.advertencias.forEach((adv, index) => {
                    expandedWarnings.push({
                        memberId: member.id,
                        memberName: member.codinome,
                        warningId: `${member.id}-${index}`, 
                        ...adv
                    });
                });
            }
        });

        return expandedWarnings.filter(adv => {
            const matchesMemberName = filters.memberName ? adv.memberName.toLowerCase().includes(filters.memberName.toLowerCase()) : true;
            const matchesWarningType = filters.warningType !== 'all' ? adv.tipo === filters.warningType : true;
            const matchesAppliedBy = filters.appliedBy !== 'all' ? adv.aplicada_por_id === filters.appliedBy : true;
            return matchesMemberName && matchesWarningType && matchesAppliedBy;
        }).sort((a, b) => new Date(b.data) - new Date(a.data));
      }, [allMembersWithWarnings, filters, adminsList]);


      const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
      };
      
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', { dateStyle: 'short' });
      };

      const getAdvertenciaTipoBadge = (tipo) => {
          let variant = "secondary";
          if (tipo === "Nivel 1") variant = "warning";
          else if (tipo === "Nivel 2") variant = "destructive";
          return <Badge variant={variant} className="whitespace-nowrap text-xs">{tipo}</Badge>;
      }

      const handleDeleteWarning = async (memberId, warningIndexToDelete) => {
        if (!supabase) return;
        
        const memberToUpdate = allMembersWithWarnings.find(m => m.id === memberId);
        if (!memberToUpdate) {
            toast({ title: "Erro", description: "Membro não encontrado para remover advertência.", variant: "destructive" });
            return;
        }

        const updatedAdvertencias = memberToUpdate.advertencias.filter((_, index) => index !== warningIndexToDelete);

        const { error } = await supabase
            .from('members')
            .update({ advertencias: updatedAdvertencias })
            .eq('id', memberId);

        if (error) {
            toast({ title: "Erro ao remover advertência", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Advertência Removida", description: "A advertência foi removida com sucesso." });
            fetchWarningsData(); 
        }
      };


      if (isLoading) {
        return (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="ml-4 text-xl text-muted-foreground">Carregando advertências...</p>
          </div>
        );
      }

      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto py-8 px-2 sm:px-4"
        >
          <Card className="glassmorphic border border-primary/30 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl text-primary flex items-center">
                <ShieldAlert className="mr-3 h-8 w-8" /> Gerenciamento de Advertências
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Visualize e gerencie todas as advertências aplicadas aos membros.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-card/30 rounded-lg border border-border/20">
                <div>
                  <Label htmlFor="filter-memberName" className="text-sm text-muted-foreground">Nome do Membro</Label>
                  <Input
                    id="filter-memberName"
                    type="text"
                    placeholder="Buscar por nome..."
                    value={filters.memberName}
                    onChange={(e) => handleFilterChange('memberName', e.target.value)}
                    className="input-dark mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="filter-warningType" className="text-sm text-muted-foreground">Tipo de Advertência</Label>
                  <Select value={filters.warningType} onValueChange={(value) => handleFilterChange('warningType', value)}>
                    <SelectTrigger id="filter-warningType" className="input-dark mt-1">
                      <SelectValue placeholder="Todos os Tipos" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      {ADVERTENCIA_TIPOS
                        .filter(tipo => tipo !== null && tipo !== undefined && tipo !== "")
                        .map(tipo => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-appliedBy" className="text-sm text-muted-foreground">Aplicada Por</Label>
                   <Select value={filters.appliedBy} onValueChange={(value) => handleFilterChange('appliedBy', value)}>
                    <SelectTrigger id="filter-appliedBy" className="input-dark mt-1">
                      <SelectValue placeholder="Todos os Admins" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all">Todos os Admins</SelectItem>
                      {adminsList
                        .filter(admin => admin.id !== null && admin.id !== undefined && admin.id !== "")
                        .map(admin => <SelectItem key={admin.id} value={admin.id}>{admin.nome || admin.email}</SelectItem>)}
                       
                        {user && !adminsList.find(a => a.id === user.id) && 
                           <SelectItem key={user.id} value={user.id}>{user.user_metadata?.name || user.email} (Você)</SelectItem>
                        }
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredWarnings.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border border-border/50">
                    <Table>
                      <TableCaption>Total de {filteredWarnings.length} advertência(s) encontradas.</TableCaption>
                      <TableHeader>
                        <TableRow className="border-b-primary/40">
                          <TableHead>Data</TableHead>
                          <TableHead>Membro</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Observações</TableHead>
                          <TableHead>Aplicada Por</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWarnings.map((adv) => (
                          <TableRow key={adv.warningId} className="border-b border-primary/20 hover:bg-accent/10">
                            <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(adv.data)}</TableCell>
                            <TableCell className="font-medium">{adv.memberName}</TableCell>
                            <TableCell>{getAdvertenciaTipoBadge(adv.tipo)}</TableCell>
                            <TableCell className="max-w-xs truncate" title={adv.motivo}>{adv.motivo}</TableCell>
                            <TableCell className="max-w-xs truncate" title={adv.observacoes}>{adv.observacoes || '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">{adv.aplicada_por_discord_tag || getAdminName(adv.aplicada_por_id) || 'Sistema'}</TableCell>
                            <TableCell className="text-right">
                               <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-red-400" title="Remover Advertência">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tem certeza que deseja remover esta advertência de {adv.memberName} (Tipo: {adv.tipo}, Motivo: {adv.motivo})? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={() => {
                                            const member = allMembersWithWarnings.find(m => m.id === adv.memberId);
                                            if(member && member.advertencias) {
                                                const warningIndex = member.advertencias.findIndex(w => w.data === adv.data && w.motivo === adv.motivo && w.tipo === adv.tipo && w.observacoes === adv.observacoes);
                                                if(warningIndex !== -1) {
                                                   handleDeleteWarning(adv.memberId, warningIndex);
                                                } else {
                                                    toast({title: "Erro", description: "Não foi possível encontrar o índice da advertência para remoção. Verifique os dados.", variant: "destructive"});
                                                }
                                            } else {
                                                 toast({title: "Erro", description: "Membro ou advertências do membro não encontrados.", variant: "destructive"});
                                            }
                                        }}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Remover
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-secondary/20 rounded-md">
                    <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhuma advertência encontrada com os filtros atuais.</p>
                  </div>
                )}
            </CardContent>
          </Card>
        </motion.div>
      );
    };

    export default WarningsManagementPage;