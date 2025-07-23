import React, { useState, useEffect, useCallback } from 'react';
    import { useToast } from '@/components/ui/use-toast';
    import { motion } from 'framer-motion';
    import { UserX, Loader2, Search, Users, FileText, X, Save, UserCheck, RotateCcw } from 'lucide-react';
    import { useAuth } from '@/contexts/AuthContext';
    import { Input } from '@/components/ui/input';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import {
      Table,
      TableBody,
      TableCell,
      TableHead,
      TableHeader,
      TableRow,
      TableCaption,
    } from '@/components/ui/table';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
      DialogClose,
    } from '@/components/ui/dialog';
    import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
    } from "@/components/ui/alert-dialog";
    import { formatDate } from '@/components/admin/members/utils';
    import { useMemberActions } from '@/components/admin/members/MemberActions';

    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    const DepartedMembersSection = () => {
      const { toast } = useToast();
      const { supabase, user } = useAuth();
      const [departedMembers, setDepartedMembers] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [searchTerm, setSearchTerm] = useState('');
      const [selectedMember, setSelectedMember] = useState(null);
      const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
      const [editingObservations, setEditingObservations] = useState('');
      const [isSavingObservations, setIsSavingObservations] = useState(false);
      const [isRejoiningMember, setIsRejoiningMember] = useState(false);

      const fetchDepartedMembers = useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .not('data_saida', 'is', null) 
          .order('data_saida', { ascending: false });

        if (error) {
          toast({ title: "Erro ao buscar membros inativos", description: error.message, variant: "destructive" });
          setDepartedMembers([]);
        } else {
          setDepartedMembers(data || []);
        }
        setIsLoading(false);
      }, [supabase, toast]);
      
      const { logAdminAction, handleRejoinMember } = useMemberActions(fetchDepartedMembers);


      useEffect(() => {
        fetchDepartedMembers();
      }, [fetchDepartedMembers]);

      const handleOpenObservationModal = (member) => {
        setSelectedMember(member);
        setEditingObservations(member.observacoes_saida || '');
        setIsObservationModalOpen(true);
      };

      const handleSaveObservations = async () => {
        if (!selectedMember || !supabase || !user) return;
        setIsSavingObservations(true);
        const { error } = await supabase
          .from('members')
          .update({ observacoes_saida: editingObservations })
          .eq('id', selectedMember.id);

        if (error) {
          toast({ title: "Erro ao salvar observações", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Observações Salvas!", description: "As observações foram atualizadas." });
          if (typeof logAdminAction === 'function') {
            logAdminAction(supabase, user, 'UPDATE', `Atualizou observações de saída para ${selectedMember.codinome}`, 'members', selectedMember.id, { observacoes_saida: editingObservations });
          }
          fetchDepartedMembers(); 
        }
        setIsSavingObservations(false);
      };
      
      const processRejoinMember = async () => {
        if (!selectedMember) return;
        setIsRejoiningMember(true);
        const success = await handleRejoinMember(selectedMember);
        setIsRejoiningMember(false);
        if (success) {
          setIsObservationModalOpen(false);
          setSelectedMember(null);
          
        }
      };

      const filteredMembers = departedMembers.filter(member =>
        (member.codinome?.toLowerCase() || member.discord_nick?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (member.discord_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );

      return (
        <>
          <motion.section variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
            <Card className="glassmorphic">
              <CardHeader>
                <CardTitle className="text-3xl font-semibold text-foreground flex items-center">
                  <UserX className="mr-3 h-8 w-8 text-destructive" /> Histórico de Saídas de Membros
                </CardTitle>
                <CardDescription>
                  Lista de membros que não estão mais ativos na comunidade. Clique em uma linha para ver detalhes ou reingressar um membro.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 relative">
                  <Input 
                    type="text"
                    placeholder="Buscar por Codinome ou ID Discord..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 input-dark"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="ml-4 text-xl text-muted-foreground">Carregando histórico...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableCaption>
                        {filteredMembers.length > 0 ? `Exibindo ${filteredMembers.length} membro(s) inativo(s).` :
                         (searchTerm ? 'Nenhum membro inativo encontrado para sua busca.' : 'Nenhum membro no histórico de saídas.')}
                      </TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Codinome</TableHead>
                          <TableHead className="hidden md:table-cell min-w-[150px]">Discord ID</TableHead>
                          <TableHead className="min-w-[120px]">Data de Saída</TableHead>
                          <TableHead className="hidden sm:table-cell min-w-[100px]">Status Anterior</TableHead>
                          <TableHead className="hidden lg:table-cell min-w-[120px]">Data de Ingresso</TableHead>
                           <TableHead className="text-right min-w-[80px]">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMembers.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={6} className="text-center h-40">
                                <Users size={40} className="mx-auto text-muted-foreground mb-3"/>
                                <p className="text-lg">
                                  {searchTerm ? `Nenhum membro inativo encontrado com o termo "${searchTerm}".` : "Nenhum membro no histórico de saídas."}
                                </p>
                              </TableCell>
                            </TableRow>
                        ) : (
                          filteredMembers.map((member) => (
                            <motion.tr 
                              key={member.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              layout
                              className="hover:bg-accent/10 cursor-pointer"
                              onClick={() => handleOpenObservationModal(member)}
                            >
                              <TableCell className="font-medium text-foreground whitespace-nowrap py-3 px-2">{member.codinome || member.discord_nick}</TableCell>
                              <TableCell className="hidden md:table-cell py-3 px-2">{member.discord_id}</TableCell>
                              <TableCell className="py-3 px-2">{formatDate(member.data_saida)}</TableCell>
                              <TableCell className="hidden sm:table-cell py-3 px-2">{member.status || 'N/A'}</TableCell>
                              <TableCell className="hidden lg:table-cell py-3 px-2">{formatDate(member.data_ingresso)}</TableCell>
                              <TableCell className="text-right py-3 px-2">
                                <Button variant="ghost" size="icon" className="text-primary hover:text-primary-light" title="Ver Detalhes / Reingressar">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {selectedMember && (
            <Dialog open={isObservationModalOpen} onOpenChange={() => {setIsObservationModalOpen(false); setSelectedMember(null);}}>
              <DialogContent className="sm:max-w-[525px] bg-card border-primary/50 glassmorphic">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-foreground">
                    Detalhes de Saída: {selectedMember.codinome || selectedMember.discord_nick}
                  </DialogTitle>
                  <DialogDescription>
                    Revise as informações de saída e, se desejar, reingresse o membro.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Data de Saída:</span>
                    <p className="text-foreground">{formatDate(selectedMember.data_saida)}</p>
                  </div>
                   <div>
                    <span className="text-sm font-medium text-muted-foreground">Status Anterior:</span>
                    <p className="text-foreground">{selectedMember.status || 'N/A'}</p>
                  </div>
                  <div>
                    <label htmlFor="editing_observacoes" className="text-sm font-medium text-muted-foreground">Observações de Saída:</label>
                    <Textarea
                      id="editing_observacoes"
                      value={editingObservations}
                      onChange={(e) => setEditingObservations(e.target.value)}
                      placeholder="Adicione ou edite as observações aqui..."
                      className="input-dark mt-1 min-h-[100px]"
                      disabled={isSavingObservations || isRejoiningMember}
                    />
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="success" 
                        className="w-full sm:w-auto btn-success-dark" 
                        disabled={isSavingObservations || isRejoiningMember}
                      >
                        {isRejoiningMember ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                        Reingressar Membro
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-primary/50">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Confirmar Reingresso?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Deseja realmente reingressar {selectedMember.codinome || selectedMember.discord_nick}? A data de saída será removida e o status será "Ativo". As observações de saída atuais serão mantidas (mas você pode limpá-las manualmente após o reingresso se necessário).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="btn-outline-dark" disabled={isRejoiningMember}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={processRejoinMember} className="btn-success-dark" disabled={isRejoiningMember}>
                          {isRejoiningMember ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                          Confirmar Reingresso
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <div className="flex flex-col sm:flex-row gap-2">
                     <Button onClick={handleSaveObservations} className="btn-primary-dark w-full sm:w-auto" disabled={isSavingObservations || isRejoiningMember}>
                      {isSavingObservations ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salvar Observações
                    </Button>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="btn-outline-dark w-full sm:w-auto" disabled={isSavingObservations || isRejoiningMember}>
                        <X className="mr-2 h-4 w-4" /> Fechar
                      </Button>
                    </DialogClose>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      );
    };

    export default DepartedMembersSection;