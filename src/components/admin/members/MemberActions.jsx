import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

export const useMemberActions = (fetchMembersCallback) => {
  const { toast } = useToast();
  const [isProcessingMemberAction, setIsProcessingMemberAction] = useState(false);

  const logAdminAction = async (supabaseClient, user, actionType, description, tableAffected, recordId = null, details = null) => {
    if (!user || !supabaseClient) {
      console.error("User or Supabase client not available for logging.");
      return;
    }
    try {
      const { error } = await supabaseClient
        .from('action_logs')
        .insert([{ 
          user_id: user.id, 
          user_email: user.email,
          action_type: actionType, 
          action_description: description,
          table_affected: tableAffected,
          record_id: recordId,
          details: details
        }]);
      if (error) {
        console.error('Error logging admin action:', error);
      }
    } catch (e) {
      console.error('Exception while logging admin action:', e);
    }
  };

  const handleMemberSubmit = async (formData, currentMember) => {
    setIsProcessingMemberAction(true);
    const { id, ...dataToSave } = formData;
    const isUpdating = currentMember && currentMember.id;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado para submeter membro.");

      let error;
      if (isUpdating) {
        ({ error } = await supabase
          .from('members')
          .update(dataToSave)
          .eq('id', currentMember.id));
        if (!error) {
          await logAdminAction(supabase, user, 'UPDATE', `Atualizou membro: ${dataToSave.codinome || dataToSave.discord_id}`, 'members', currentMember.id, dataToSave);
        }
      } else {
        ({ error } = await supabase
          .from('members')
          .insert([dataToSave])
          .select());
        if (!error) {
          await logAdminAction(supabase, user, 'INSERT', `Adicionou novo membro: ${dataToSave.codinome || dataToSave.discord_id}`, 'members', null, dataToSave);
        }
      }

      if (error) {
        toast({ title: `Erro ao ${isUpdating ? 'atualizar' : 'adicionar'} membro`, description: error.message, variant: "destructive" });
        return false;
      } else {
        toast({ title: `Membro ${isUpdating ? 'atualizado' : 'adicionado'}!`, description: `${dataToSave.codinome || dataToSave.discord_id} foi ${isUpdating ? 'atualizado' : 'adicionado'} com sucesso.` });
        if (fetchMembersCallback) fetchMembersCallback();
        return true;
      }
    } catch (e) {
      toast({ title: "Erro inesperado", description: e.message, variant: "destructive" });
      return false;
    } finally {
      setIsProcessingMemberAction(false);
    }
  };
  
  const handleMarkAsLeft = async (member, dataSaida, observacoesSaida) => {
    if (!member || !member.id) {
      toast({ title: "Erro", description: "Membro inválido para registrar saída.", variant: "destructive" });
      return false;
    }
    setIsProcessingMemberAction(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado para registrar saída.");

      const { error } = await supabase
        .from('members')
        .update({ 
          data_saida: dataSaida,
          observacoes_saida: observacoesSaida,
          status: 'Desligado' 
        })
        .eq('id', member.id);

      if (error) {
        toast({ title: "Erro ao registrar saída", description: error.message, variant: "destructive" });
        return false;
      } else {
        toast({ title: "Saída Registrada!", description: `A saída de ${member.codinome || member.discord_id} foi registrada.` });
        await logAdminAction(supabase, user, 'UPDATE', `Registrou saída para ${member.codinome || member.discord_id}`, 'members', member.id, {data_saida: dataSaida, observacoes_saida: observacoesSaida, status: 'Desligado'});
        if (fetchMembersCallback) fetchMembersCallback();
        return true;
      }
    } catch (e) {
      toast({ title: "Erro inesperado", description: e.message, variant: "destructive" });
      return false;
    } finally {
      setIsProcessingMemberAction(false);
    }
  };

  const handleRejoinMember = async (member) => {
    if (!member || !member.id) {
        toast({ title: "Erro", description: "Membro inválido para reingresso.", variant: "destructive" });
        return false;
    }
    setIsProcessingMemberAction(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado para reingressar membro.");

        const today = new Date().toISOString().split('T')[0];
        const { error } = await supabase
            .from('members')
            .update({
                data_saida: null,
                observacoes_saida: null,
                status: 'Ativo', 
                data_ingresso: member.data_ingresso || today, 
                ultima_presenca: null, 
                penultima_presenca: null,
                total_presencas: member.total_presencas || 0,
                dias_inatividade: 0
            })
            .eq('id', member.id);

        if (error) {
            toast({ title: "Erro ao reingressar membro", description: error.message, variant: "destructive" });
            return false;
        } else {
            toast({ title: "Membro Reingressado!", description: `${member.codinome || member.discord_id} foi reingressado com sucesso.` });
            await logAdminAction(supabase, user, 'UPDATE', `Reingressou membro: ${member.codinome || member.discord_id}`, 'members', member.id, { status: 'Ativo', data_saida: null });
            if (fetchMembersCallback) fetchMembersCallback();
            return true;
        }
    } catch (e) {
        toast({ title: "Erro inesperado", description: e.message, variant: "destructive" });
        return false;
    } finally {
      setIsProcessingMemberAction(false);
    }
};

const handleDeleteMemberPermanently = async (memberId, memberName) => {
  if (!memberId) {
    toast({ title: "Erro", description: "ID do membro inválido para exclusão.", variant: "destructive" });
    return false;
  }
  setIsProcessingMemberAction(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado para excluir membro.");

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast({ title: "Erro ao excluir membro", description: error.message, variant: "destructive" });
      return false;
    } else {
      toast({ title: "Membro Excluído!", description: `${memberName || 'O membro'} foi apagado permanentemente do banco de dados.` });
      await logAdminAction(supabase, user, 'DELETE', `Apagou membro permanentemente: ${memberName || memberId}`, 'members', memberId);
      if (fetchMembersCallback) fetchMembersCallback(); 
      return true;
    }
  } catch (e) {
    toast({ title: "Erro inesperado", description: e.message, variant: "destructive" });
    return false;
  } finally {
    setIsProcessingMemberAction(false);
  }
};


  const handleConfirmPromotion = async (member, suggestedPatente) => {
    if (!member || !member.id || !suggestedPatente) {
      toast({ title: "Erro", description: "Dados inválidos para promoção.", variant: "destructive" });
      return false;
    }
    setIsProcessingMemberAction(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado para confirmar promoção.");

      const { error } = await supabase
        .from('members')
        .update({ 
          patente_atual: suggestedPatente,
          promocao_status: `Promovido para ${suggestedPatente}`
        })
        .eq('id', member.id);

      if (error) {
        toast({ title: "Erro ao promover membro", description: error.message, variant: "destructive" });
        return false;
      } else {
        toast({ title: "Promoção Confirmada!", description: `${member.codinome || member.discord_id} foi promovido para ${suggestedPatente}.` });
        await logAdminAction(supabase, user, 'UPDATE', `Promoveu ${member.codinome || member.discord_id} para ${suggestedPatente}`, 'members', member.id, {patente_atual: suggestedPatente, promocao_status: `Promovido para ${suggestedPatente}`});
        if (fetchMembersCallback) fetchMembersCallback();
        return true;
      }
    } catch (e) {
        toast({ title: "Erro inesperado", description: e.message, variant: "destructive" });
        return false;
    } finally {
      setIsProcessingMemberAction(false);
    }
  };


  return { 
    handleMemberSubmit, 
    handleMarkAsLeft, 
    handleConfirmPromotion, 
    handleRejoinMember,
    handleDeleteMemberPermanently,
    isProcessingMemberAction,
    logAdminAction
  };
};