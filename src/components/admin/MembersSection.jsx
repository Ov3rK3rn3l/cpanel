import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { PlusCircle, Users, Loader2, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MemberFormDialog from '@/components/admin/MemberFormDialog';
import MembersTable from '@/components/admin/MembersTable';
import ConfirmPromotionDialog from '@/components/admin/members/ConfirmPromotionDialog';
import MarkAsLeftDialog from '@/components/admin/members/MarkAsLeftDialog';
import MemberFilters from '@/components/admin/members/MemberFilters';
import { useMemberActions } from '@/components/admin/members/MemberActions';
import { getPromotionDisplayInfo, YES_NO_OPTIONS_VALUES } from '@/components/admin/members/utils';
import { Card, CardContent } from '@/components/ui/card';
import DepartedMembersDialog from '@/components/admin/members/DepartedMembersDialog';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const MembersSection = () => {
  const { supabase, userRole } = useAuth();
  const [allMembers, setAllMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [isDepartedMembersDialogOpen, setIsDepartedMembersDialogOpen] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState(null);

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
  const [promotionDetails, setPromotionDetails] = useState({ suggestedPatente: null, isMerit: false });

  const fetchMembers = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .is('data_saida', null);

    if (error) {
      console.error("Erro ao buscar membros:", error);
      setAllMembers([]);
    } else {
      setAllMembers(data || []);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchMembers();

    const channel = supabase.channel('realtime-members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, (payload) => {
        const updatedMember = payload.new;
        const oldMember = payload.old;
        const eventType = payload.eventType;

        setAllMembers(currentMembers => {
            if (eventType === 'INSERT') {
                return [...currentMembers, updatedMember];
            }
            if (eventType === 'UPDATE') {
                if (updatedMember.data_saida !== null) {
                    return currentMembers.filter(m => m.id !== updatedMember.id);
                }
                setHighlightedRow(updatedMember.id);
                setTimeout(() => setHighlightedRow(null), 3000);
                return currentMembers.map(m => (m.id === updatedMember.id ? updatedMember : m));
            }
            if (eventType === 'DELETE') {
                return currentMembers.filter(m => m.id !== oldMember.id);
            }
            return currentMembers;
        });

      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMembers, supabase]);

  const { 
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
      setIsMemberDialogOpen(false); 
    }
  };

  const handleOpenPromotionDialog = (member, suggestedPatente) => {
      const promotionInfo = getPromotionDisplayInfo(member, userRole);
      if (promotionInfo.eligible) {
          setMemberToPromote(member);
          setPromotionDetails({ suggestedPatente: promotionInfo.suggested, isMerit: promotionInfo.isMerit });
      }
  };

  const processConfirmPromotion = async () => {
    if (memberToPromote && promotionDetails.suggestedPatente) {
      await confirmPromotionAction(memberToPromote, promotionDetails.suggestedPatente);
      setMemberToPromote(null);
      setPromotionDetails({ suggestedPatente: null, isMerit: false });
    }
  };
  
  const closePromotionDialog = () => {
    setMemberToPromote(null);
    setPromotionDetails({ suggestedPatente: null, isMerit: false });
  }

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
        const promotionInfo = getPromotionDisplayInfo(member, userRole);
        if (filters.promotionSuggested === 'yes') {
            matchesPromotionSuggested = promotionInfo.eligible === true;
        } else if (filters.promotionSuggested === 'no') {
            matchesPromotionSuggested = promotionInfo.eligible === false;
        }
      }
      
      return matchesSearch && matchesStatus && matchesPatente && matchesEsa && matchesCfo && matchesAdvertencia && matchesPromotionSuggested;
    });
  }, [allMembers, filters, userRole]);
  
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
            <p className="text-sm text-muted-foreground">Clique em "Adicionar Membro" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <MembersTable 
          members={filteredMembers} 
          onRowClick={handleOpenMemberDialog} 
          onPromote={handleOpenPromotionDialog}
          searchTerm={filters.searchTerm}
          isProcessingAction={isProcessingMemberAction}
          highlightedRow={highlightedRow}
        />
      )}

      <MemberFormDialog
        isOpen={isMemberDialogOpen}
        onOpenChange={setIsMemberDialogOpen}
        member={currentMember}
        onSave={fetchMembers}
        onMarkAsLeft={() => {
          if(currentMember) {
            handleConfirmMarkAsLeft(currentMember);
          }
        }}
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
        onOpenChange={closePromotionDialog}
        member={memberToPromote}
        suggestedPatente={promotionDetails.suggestedPatente}
        isMeritPromotion={promotionDetails.isMerit}
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