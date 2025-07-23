import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, SearchSlash as UsersSlash, Search, Info, FileText, UserCheck, Trash2, RotateCcw, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useMemberActions } from '@/components/admin/members/MemberActions'; 
import { formatDate } from '@/components/admin/members/utils';

const DepartedMembersDialog = ({ isOpen, onOpenChange, onMemberRejoinedOrDeleted }) => {
  const { toast } = useToast();
  const { supabase, user } = useAuth();
  const [departedMembers, setDepartedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingObservations, setEditingObservations] = useState('');
  
  const { 
    handleRejoinMember, 
    handleDeleteMemberPermanently, 
    logAdminAction,
    isProcessingMemberAction 
  } = useMemberActions(() => {
    fetchDepartedMembers(); // Callback para atualizar a lista de membros inativos
    if (onMemberRejoinedOrDeleted) {
      onMemberRejoinedOrDeleted(); // Callback para atualizar a lista de membros ativos na MembersSection
    }
  });

  const fetchDepartedMembers = useCallback(async () => {
    if (!supabase || !isOpen) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .not('data_saida', 'is', null)
      .order('data_saida', { ascending: false });

    if (error) {
      toast({ title: "Erro ao buscar histórico de saídas", description: error.message, variant: "destructive" });
      setDepartedMembers([]);
    } else {
      setDepartedMembers(data || []);
    }
    setIsLoading(false);
  }, [supabase, toast, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchDepartedMembers();
    } else {
      setDepartedMembers([]);
      setSearchTerm('');
      setSelectedMember(null);
      setIsDetailModalOpen(false);
      setIsLoading(true);
    }
  }, [isOpen, fetchDepartedMembers]);

  const handleRowClick = (member) => {
    setSelectedMember(member);
    setEditingObservations(member.observacoes_saida || '');
    setIsDetailModalOpen(true);
  };

  const handleSaveObservations = async () => {
    if (!selectedMember || !supabase || !user) return;
    // setIsLoading(true); // Use isProcessingMemberAction se preferir um estado global
    const { error } = await supabase
      .from('members')
      .update({ observacoes_saida: editingObservations })
      .eq('id', selectedMember.id);

    if (error) {
      toast({ title: "Erro ao salvar observações", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Observações Salvas!", description: "As observações foram atualizadas." });
      logAdminAction(supabase, user, 'UPDATE', `Atualizou observações de saída para ${selectedMember.codinome}`, 'members', selectedMember.id, { observacoes_saida: editingObservations });
      fetchDepartedMembers(); 
      setSelectedMember(prev => ({...prev, observacoes_saida: editingObservations}));
    }
    // setIsLoading(false);
  };

  const processRejoin = async () => {
    if (!selectedMember) return;
    const success = await handleRejoinMember(selectedMember);
    if (success) {
      setIsDetailModalOpen(false);
      setSelectedMember(null);
    }
  };

  const processDeletePermanently = async () => {
    if (!selectedMember) return;
    const success = await handleDeleteMemberPermanently(selectedMember.id, selectedMember.codinome);
    if (success) {
      setIsDetailModalOpen(false);
      setSelectedMember(null);
    }
  };

  const filteredDepartedMembers = departedMembers.filter(member =>
    member.codinome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.discord_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.observacoes_saida?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary flex items-center">
              <UsersSlash className="mr-2 h-7 w-7" />
              Histórico de Saídas de Membros
            </DialogTitle>
            <DialogDescription>
              Clique em um membro para ver detalhes, reingressar ou apagar permanentemente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por codinome, ID Discord ou observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dark pl-10 w-full"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="ml-3 text-lg text-muted-foreground">Carregando histórico...</p>
            </div>
          ) : filteredDepartedMembers.length === 0 ? (
              <Card className="text-center glassmorphic">
                <CardContent className="p-10">
                  <Info size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-xl text-muted-foreground">Nenhum registro de saída encontrado.</p>
                  {searchTerm && <p className="text-sm text-muted-foreground">Tente um termo de busca diferente.</p>}
                </CardContent>
              </Card>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-2 rounded-md border border-border/50">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="border-b-primary/40">
                    <TableHead className="w-[150px]">Codinome</TableHead>
                    <TableHead>Data de Saída</TableHead>
                    <TableHead>Patente na Saída</TableHead>
                    <TableHead>Observações da Saída</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartedMembers.map((member) => (
                    <TableRow key={member.id} className="border-b border-primary/20 hover:bg-accent/10 cursor-pointer" onClick={() => handleRowClick(member)}>
                      <TableCell className="font-medium text-foreground/90">{member.codinome || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(member.data_saida)}</TableCell>
                      <TableCell className="text-muted-foreground">{member.patente_atual || 'N/A'}</TableCell>
                      <TableCell className="text-muted-foreground max-w-sm truncate" title={member.observacoes_saida}>{member.observacoes_saida || 'Nenhuma observação'}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="icon" className="text-primary hover:text-primary-light" title="Ver Detalhes / Ações">
                            <FileText className="h-4 w-4" />
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" className="btn-secondary-dark">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedMember && (
        <Dialog open={isDetailModalOpen} onOpenChange={() => {setIsDetailModalOpen(false); setSelectedMember(null);}}>
            <DialogContent className="sm:max-w-[525px] bg-card border-primary/50 glassmorphic">
            <DialogHeader>
                <DialogTitle className="text-2xl text-foreground">
                Detalhes de Saída: {selectedMember.codinome || selectedMember.discord_nick}
                </DialogTitle>
                <DialogDescription>
                Revise as informações, edite observações, reingresse ou apague o membro.
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
                <label htmlFor="editing_observacoes_detail" className="text-sm font-medium text-muted-foreground">Observações de Saída:</label>
                <Textarea
                    id="editing_observacoes_detail"
                    value={editingObservations}
                    onChange={(e) => setEditingObservations(e.target.value)}
                    placeholder="Adicione ou edite as observações aqui..."
                    className="input-dark mt-1 min-h-[100px]"
                    disabled={isProcessingMemberAction}
                />
                </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-2">
                <div className="flex flex-col sm:flex-row gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button 
                            variant="success" 
                            className="w-full sm:w-auto btn-success-dark" 
                            disabled={isProcessingMemberAction}
                        >
                            {isProcessingMemberAction && selectedMember?.action === 'rejoin' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                            Reingressar
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-primary/50">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Confirmar Reingresso?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Deseja realmente reingressar {selectedMember.codinome}? A data de saída será removida e o status será "Ativo".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="btn-outline-dark" disabled={isProcessingMemberAction}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => { setSelectedMember(prev => ({...prev, action: 'rejoin'})); processRejoin(); }} className="btn-success-dark" disabled={isProcessingMemberAction}>
                            {isProcessingMemberAction && selectedMember?.action === 'rejoin' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                            Confirmar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button 
                            variant="destructive" 
                            className="w-full sm:w-auto btn-destructive-dark" 
                            disabled={isProcessingMemberAction}
                        >
                           {isProcessingMemberAction && selectedMember?.action === 'delete' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :  <Trash2 className="mr-2 h-4 w-4" />}
                            Apagar
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-primary/50">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Confirmar Exclusão Permanente?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Tem certeza que deseja apagar {selectedMember.codinome} permanentemente? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="btn-outline-dark" disabled={isProcessingMemberAction}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => { setSelectedMember(prev => ({...prev, action: 'delete'})); processDeletePermanently();}} className="btn-destructive-dark" disabled={isProcessingMemberAction}>
                            {isProcessingMemberAction && selectedMember?.action === 'delete' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Confirmar Exclusão
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                    <Button onClick={handleSaveObservations} className="btn-primary-dark w-full sm:w-auto" disabled={isProcessingMemberAction}>
                    {isProcessingMemberAction && selectedMember?.action === 'save_obs' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Obs.
                    </Button>
                    <DialogClose asChild>
                    <Button type="button" variant="outline" className="btn-secondary-dark w-full sm:w-auto" disabled={isProcessingMemberAction}>
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

export default DepartedMembersDialog;