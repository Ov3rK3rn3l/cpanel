import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { motion } from 'framer-motion';
    import { PlusCircle, Users, Loader2, History } from 'lucide-react';
    import { useAuth } from '@/contexts/AuthContext';
    import MemberFormDialog from '@/components/admin/MemberFormDialog';
    import MembersTable from '@/components/admin/MembersTable';
    import MemberManagementCard from '@/components/admin/members/MemberManagementCard';
    import ConfirmPromotionDialog from '@/components/admin/members/ConfirmPromotionDialog';
    import MarkAsLeftDialog from '@/components/admin/members/MarkAsLeftDialog';
    import MemberFilters from '@/components/admin/members/MemberFilters';
    import { useMemberActions } from '@/components/admin/members/MemberActions';
    import { JOGO_PRINCIPAL_OPTIONS, getPromotionDisplayInfo, YES_NO_OPTIONS_VALUES } from '@/components/admin/members/utils';
    import { Card, CardContent } from '@/components/ui/card';
    import DepartedMembersDialog from '@/components/admin/members/DepartedMembersDialog';

    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };
    
    const MembersSection = () => {
      const { toast } = useToast();
      const { supabase, user } = useAuth();
      const [allMembers, setAllMembers] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [isSyncingSheets, setIsSyncingSheets] = useState(false);
      const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
      const [currentMember, setCurrentMember] = useState(null);
      const [isDepartedMembersDialogOpen, setIsDepartedMembersDialogOpen] = useState(false);
      
      const [filters, setFilters] = useState({
        searchTerm: '',
        status: '',
        patente: '',
        esa: '',
        cfo: '',
        advertencia: '',
        promotionSuggested: 'all',
      });

      const [memberToMarkAsLeft, setMemberToMarkAsLeft] = useState(null);
      const [memberToPromote, setMemberToPromote] = useState(null);
      const [suggestedPatenteForPromotion, setSuggestedPatenteForPromotion] = useState(null);

      const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
      const sheetName = import.meta.env.VITE_GOOGLE_SHEET_NAME || 'BotAutomacao';
    
      const fetchMembers = useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .is('data_saida', null); // Apenas membros ativos

        if (error) {
          toast({ title: "Erro ao buscar membros", description: error.message, variant: "destructive" });
          setAllMembers([]);
        } else {
          setAllMembers(data || []);
        }
        setIsLoading(false);
      }, [supabase, toast]);
    
      useEffect(() => {
        fetchMembers();
      }, [fetchMembers]);

      const { 
        handleMemberSubmit: submitMemberAction, 
        handleMarkAsLeft: markAsLeftAction, 
        handleConfirmPromotion: confirmPromotionAction,
        isProcessingMemberAction 
      } = useMemberActions(fetchMembers);
    
      const handleOpenMemberDialog = (member = null) => {
        setCurrentMember(member);
        setIsMemberDialogOpen(true);
      };
    
      const handleConfirmMarkAsLeft = (member) => {
        setMemberToMarkAsLeft(member);
      };

      const processMarkAsLeft = async (member, dataSaida, observacoesSaida) => {
        if (member) {
          await markAsLeftAction(member, dataSaida, observacoesSaida);
          setMemberToMarkAsLeft(null);
          setIsMemberDialogOpen(false); // Fechar o diálogo de edição também, se estiver aberto.
        }
      };

      const handleOpenPromotionDialog = (member, suggestedPatente) => {
        setMemberToPromote(member);
        setSuggestedPatenteForPromotion(suggestedPatente);
      };

      const processConfirmPromotion = async () => {
        if (memberToPromote && suggestedPatenteForPromotion) {
          await confirmPromotionAction(memberToPromote, suggestedPatenteForPromotion);
          setMemberToPromote(null);
          setSuggestedPatenteForPromotion(null);
        }
      };

      const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
      };
      
      const handleSearchTermChange = (term) => {
        setFilters(prev => ({ ...prev, searchTerm: term }));
      };
    
      const filteredMembers = useMemo(() => {
        return allMembers.filter(member => {
          const searchTermLower = filters.searchTerm.toLowerCase();
          const matchesSearch = (
            (member.codinome?.toLowerCase() || '').includes(searchTermLower) ||
            (member.discord_id?.toLowerCase() || '').includes(searchTermLower)
          );
          const matchesStatus = filters.status ? member.status === filters.status : true;
          const matchesPatente = filters.patente ? member.patente_atual === filters.patente : true;
          const matchesEsa = filters.esa ? (member.esa || YES_NO_OPTIONS_VALUES.NOT_DEFINED) === filters.esa : true;
          const matchesCfo = filters.cfo ? (member.cfo || YES_NO_OPTIONS_VALUES.NOT_DEFINED) === filters.cfo : true;
          
          let matchesAdvertencia = true;
          if (filters.advertencia && filters.advertencia !== 'all') {
            if (filters.advertencia === 'none') {
              matchesAdvertencia = !member.advertencias || member.advertencias.length === 0;
            } else {
              matchesAdvertencia = member.advertencias && member.advertencias.some(adv => adv.tipo === filters.advertencia);
            }
          }

          let matchesPromotionSuggested = true;
          if (filters.promotionSuggested !== 'all') {
            const promotionInfo = getPromotionDisplayInfo(member);
            if (filters.promotionSuggested === 'yes') {
                matchesPromotionSuggested = promotionInfo.eligible === true;
            } else if (filters.promotionSuggested === 'no') {
                matchesPromotionSuggested = promotionInfo.eligible === false;
            }
          }
          
          return matchesSearch && matchesStatus && matchesPatente && matchesEsa && matchesCfo && matchesAdvertencia && matchesPromotionSuggested;
        });
      }, [allMembers, filters]);

      const handleSyncToSheets = async () => {
        if (!spreadsheetId) {
          toast({ title: "Configuração Incompleta", description: "ID da Planilha Google não configurado.", variant: "destructive"});
          return;
        }
        setIsSyncingSheets(true);
        toast({ title: "Sincronizando com Google Sheets...", description: "Invocando função..." });
        
        try {
          const { data, error: invokeError } = await supabase.functions.invoke('sync-members-to-google-sheets', {
            body: { 
              members: allMembers, 
              spreadsheetId: spreadsheetId,
              sheetName: sheetName 
            }
          });

          if (invokeError) throw invokeError;
          if (data?.error) throw new Error(data.error);

          toast({ title: "Sincronização Concluída!", description: data?.message || "Dados enviados para o Google Sheets." });

        } catch (error) {
          console.error("Erro ao sincronizar com Google Sheets:", error);
          toast({ title: "Erro ao sincronizar", description: error.message || "Falha ao invocar a Edge Function.", variant: "destructive" });
        } finally {
          setIsSyncingSheets(false);
        }
      };
    
      const handleLoadFromSheets = async () => {
        if (!spreadsheetId) {
          toast({ title: "Configuração Incompleta", description: "ID da Planilha Google não configurado.", variant: "destructive"});
          return;
        }
        setIsSyncingSheets(true);
        toast({ title: "Carregando do Google Sheets...", description: "Invocando função..." });

        try {
          const { data, error: invokeError } = await supabase.functions.invoke('load-members-from-google-sheets', {
            body: { 
              spreadsheetId: spreadsheetId,
              sheetName: sheetName
            }
          });

          if (invokeError) throw invokeError;
          if (data?.error) {
            const errorDetails = Array.isArray(data.details) ? data.details.join('; ') : data.error;
            throw new Error(errorDetails);
          }
          
          toast({ title: "Carregamento Concluído!", description: data?.message || "Dados processados. Atualizando lista local." });
          fetchMembers(); 

        } catch (error) {
          console.error("Erro ao carregar do Google Sheets:", error);
          toast({ title: "Erro ao carregar", description: error.message || "Falha ao invocar a Edge Function.", variant: "destructive" });
        } finally {
          setIsSyncingSheets(false);
        }
      };
      
      return (
        <motion.section variants={cardVariants} initial="hidden" animate="visible" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-semibold text-foreground flex items-center">
              <Users className="mr-3 h-8 w-8 text-primary" /> Gerenciamento de Membros Ativos
            </h1>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={() => setIsDepartedMembersDialogOpen(true)} variant="outline" className="btn-outline-dark w-full sm:w-auto" disabled={isProcessingMemberAction}>
                <History className="mr-2 h-5 w-5" /> Histórico de Saídas
              </Button>
              <Button onClick={() => handleOpenMemberDialog()} className="btn-primary-dark w-full sm:w-auto" disabled={isProcessingMemberAction}>
                <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Membro
              </Button>
            </div>
          </div>

          <MemberManagementCard 
            onSync={handleSyncToSheets}
            onLoad={handleLoadFromSheets}
            isSyncing={isSyncingSheets || isProcessingMemberAction}
            spreadsheetId={spreadsheetId}
            sheetName={sheetName}
          />
          
          <MemberFilters 
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearchTermChange={handleSearchTermChange}
          />
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 text-primary animate-spin" /> <p className="ml-4 text-xl text-muted-foreground">Carregando membros...</p></div>
          ) : filteredMembers.length === 0 && filters.searchTerm === '' && filters.status === '' && filters.patente === '' && filters.esa === '' && filters.cfo === '' && filters.advertencia === '' && filters.promotionSuggested === 'all' && allMembers.length === 0 ? (
             <Card className="text-center glassmorphic">
              <CardContent className="p-10">
                <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">Nenhum membro ativo cadastrado.</p>
                <p className="text-sm text-muted-foreground">Clique em "Adicionar Membro" para começar ou sincronize do Google Sheets.</p>
              </CardContent>
            </Card>
          ) : (
            <MembersTable 
              members={filteredMembers} 
              onRowClick={handleOpenMemberDialog} 
              onPromote={handleOpenPromotionDialog}
              searchTerm={filters.searchTerm}
              isProcessingAction={isProcessingMemberAction}
            />
          )}
    
          <MemberFormDialog
            isOpen={isMemberDialogOpen}
            onOpenChange={setIsMemberDialogOpen}
            member={currentMember}
            onSubmit={async (data) => {
                const success = await submitMemberAction(data, currentMember);
                if (success) {
                  setIsMemberDialogOpen(false);
                  setCurrentMember(null);
                }
            }}
            onMarkAsLeft={() => {
              if(currentMember) {
                handleConfirmMarkAsLeft(currentMember);
              }
            }}
            jogoOptions={JOGO_PRINCIPAL_OPTIONS}
          />

          <MarkAsLeftDialog
            isOpen={!!memberToMarkAsLeft}
            onOpenChange={() => setMemberToMarkAsLeft(null)}
            member={memberToMarkAsLeft}
            onConfirm={processMarkAsLeft}
            isProcessing={isProcessingMemberAction}
          />

          <ConfirmPromotionDialog 
            isOpen={!!memberToPromote}
            onOpenChange={() => { setMemberToPromote(null); setSuggestedPatenteForPromotion(null);}}
            member={memberToPromote}
            suggestedPatente={suggestedPatenteForPromotion}
            onConfirmPromotion={processConfirmPromotion}
            isProcessing={isProcessingMemberAction}
          />

          <DepartedMembersDialog
            isOpen={isDepartedMembersDialogOpen}
            onOpenChange={setIsDepartedMembersDialogOpen}
          />
        </motion.section>
      );
    };
    
    export default MembersSection;