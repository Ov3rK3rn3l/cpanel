import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, UserX, ShieldAlert, PlusCircle } from 'lucide-react';
import { PATENTE_OPTIONS, STATUS_OPTIONS, JOGO_PRINCIPAL_OPTIONS, YES_NO_OPTIONS, YES_NO_OPTIONS_VALUES, formatDateForInput, formatDate } from './members/utils';
import AddWarningDialog from './AddWarningDialog';

const initialFormData = {
  codinome: '',
  discord_id: '',
  email: '',
  patente_atual: PATENTE_OPTIONS.find(p => p.value === 'Recruta')?.value || PATENTE_OPTIONS[PATENTE_OPTIONS.length - 1]?.value,
  status: STATUS_OPTIONS[0]?.value || 'Recruta',
  jogo_principal: JOGO_PRINCIPAL_OPTIONS[0]?.value || '',
  data_ingresso: formatDateForInput(new Date().toISOString()),
  total_presencas: 0,
  observacoes_saida: '',
  ultima_presenca: '',
  penultima_presenca: '',
  esa: YES_NO_OPTIONS_VALUES.NOT_DEFINED,
  cfo: YES_NO_OPTIONS_VALUES.NOT_DEFINED,
  promocao_status: '',
  data_saida: '',
  advertencias: [],
};

const MemberFormDialog = ({ isOpen, onOpenChange, member, onSave, onMarkAsLeft }) => {
  const { supabase, user, userRole } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [originalEmail, setOriginalEmail] = useState('');
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setFormData({
          codinome: member.codinome || '',
          discord_id: member.discord_id || '',
          email: member.email || '',
          patente_atual: member.patente_atual || PATENTE_OPTIONS[0]?.value,
          status: member.status || STATUS_OPTIONS[0]?.value,
          jogo_principal: member.jogo_principal || JOGO_PRINCIPAL_OPTIONS[0]?.value,
          data_ingresso: member.data_ingresso ? formatDateForInput(member.data_ingresso) : formatDateForInput(new Date().toISOString()),
          total_presencas: member.total_presencas || 0,
          observacoes_saida: member.observacoes_saida || '',
          ultima_presenca: member.ultima_presenca ? formatDateForInput(member.ultima_presenca) : '',
          penultima_presenca: member.penultima_presenca ? formatDateForInput(member.penultima_presenca) : '',
          esa: member.esa || YES_NO_OPTIONS_VALUES.NOT_DEFINED,
          cfo: member.cfo || YES_NO_OPTIONS_VALUES.NOT_DEFINED,
          promocao_status: member.promocao_status || '',
          data_saida: member.data_saida ? formatDateForInput(member.data_saida) : '',
          advertencias: Array.isArray(member.advertencias) ? member.advertencias : [],
        });
        setOriginalEmail(member.email || '');
      } else {
        setFormData(initialFormData);
        setOriginalEmail('');
      }
    }
  }, [member, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const linkOrCreatePanelUser = async (memberDataToLink) => {
    if (!memberDataToLink.email) {
        return null; 
    }
    try {
        const { data: existingPanelUser, error: findError } = await supabase
            .from('users')
            .select('id')
            .eq('email', memberDataToLink.email)
            .maybeSingle();
        if (findError) throw findError;

        if (existingPanelUser) {
            return existingPanelUser.id;
        } else {
            const defaultPassword = `Gerr@${new Date().getFullYear()}!P`;
            const { data: functionData, error: functionError } = await supabase.functions.invoke('create-update-panel-user', {
                body: JSON.stringify({
                    email: memberDataToLink.email,
                    password: defaultPassword, 
                    role: 'member',
                    nome: memberDataToLink.codinome,
                }),
            });
            if (functionError) throw functionError;
            if (functionData.error) throw new Error(functionData.error);
            
            const newPanelUserId = functionData.userId;
            if (!newPanelUserId) throw new Error("ID do usuário do painel não retornado pela função.");
            
            toast({ title: "Conta no Painel Criada", description: `Conta para ${memberDataToLink.email} criada. Senha padrão: ${defaultPassword}. Instrua a alteração.`, duration: 10000});
            return newPanelUserId;
        }
    } catch (err) {
        console.error("Erro ao vincular/criar conta para membro via MemberForm:", err);
        toast({ title: "Erro na Vinculação da Conta", description: `Não foi possível criar ou vincular a conta no painel para ${memberDataToLink.email}: ${err.message}`, variant: "destructive", duration: 10000 });
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.codinome || !formData.discord_id) {
      toast({ title: "Campos Obrigatórios", description: "Codinome e Discord ID são obrigatórios.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    const memberPayload = { ...formData };
    
    ['ultima_presenca', 'penultima_presenca', 'data_ingresso', 'data_saida'].forEach(dateField => {
      if (!memberPayload[dateField] || memberPayload[dateField] === '') {
        memberPayload[dateField] = null;
      } else {
        memberPayload[dateField] = formatDateForInput(memberPayload[dateField]);
      }
    });
    memberPayload.total_presencas = parseInt(memberPayload.total_presencas, 10) || 0;
    
    if (member) {
      memberPayload.id = member.id;
    }

    let panelUserIdToLink = member?.user_id || null;
    const emailChanged = formData.email !== originalEmail;
    const emailProvided = formData.email && formData.email.trim() !== '';

    if (emailProvided && (emailChanged || (!member && emailProvided) || (member && !member.user_id && emailProvided) ) ) {
        const newOrExistingPanelUserId = await linkOrCreatePanelUser(formData);
        if (newOrExistingPanelUserId) {
            panelUserIdToLink = newOrExistingPanelUserId;
        }
    }
    
    if (panelUserIdToLink) {
        memberPayload.user_id = panelUserIdToLink;
    } else {
        memberPayload.user_id = null; 
    }

    const { error } = await supabase.from('members').upsert(memberPayload).select().single();

    setIsLoading(false);
    if (error) {
      console.error("Erro ao salvar membro:", error);
      toast({ title: "Erro ao Salvar Membro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Membro Salvo!", description: `${member ? 'Dados atualizados' : 'Novo membro adicionado'} com sucesso.` });
      onSave(); 
      onOpenChange(false); 
    }
  };

  const handleSaveWarning = (newWarning) => {
    const newWarningWithAuthor = {
      ...newWarning,
      responsavel: user?.email || 'Admin',
      data: new Date().toISOString(),
    };
    const updatedWarnings = [...formData.advertencias, newWarningWithAuthor];
    setFormData(prev => ({ ...prev, advertencias: updatedWarnings }));
    toast({
      title: "Advertência Adicionada",
      description: "A nova advertência foi adicionada localmente. Clique em 'Salvar Alterações' para persistir.",
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!isLoading) onOpenChange(open); }}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl bg-card border-primary/30 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">{member ? 'Editar Membro' : 'Adicionar Novo Membro'}</DialogTitle>
            <DialogDescription>
              {member ? 'Atualize os dados do membro e gerencie advertências.' : 'Preencha os dados do novo membro do clã.'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar"> 
            <form onSubmit={handleSubmit} className="py-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label htmlFor="codinome" className="text-muted-foreground">Nome (Codinome)</Label>
                  <Input id="codinome" name="codinome" value={formData.codinome} onChange={handleChange} className="input-dark mt-1" required placeholder="Codinome"/>
                </div>
                <div>
                  <Label htmlFor="discord_id" className="text-muted-foreground">Discord ID</Label>
                  <Input id="discord_id" name="discord_id" value={formData.discord_id} onChange={handleChange} className="input-dark mt-1" required placeholder="ID Discord"/>
                </div>
                <div>
                  <Label htmlFor="ultima_presenca" className="text-muted-foreground">Última Presença</Label>
                  <Input id="ultima_presenca" name="ultima_presenca" type="date" value={formData.ultima_presenca} onChange={handleChange} className="input-dark mt-1" />
                </div>
                <div>
                  <Label htmlFor="total_presencas" className="text-muted-foreground">Total de Presenças</Label>
                  <Input id="total_presencas" name="total_presencas" type="number" min="0" value={formData.total_presencas} onChange={handleChange} className="input-dark mt-1" placeholder="0"/>
                </div>
                <div>
                  <Label htmlFor="penultima_presenca" className="text-muted-foreground">Penúltima Presença</Label>
                  <Input id="penultima_presenca" name="penultima_presenca" type="date" value={formData.penultima_presenca} onChange={handleChange} className="input-dark mt-1" />
                </div>
                <div>
                  <Label htmlFor="status" className="text-muted-foreground">Status</Label>
                  <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                    <SelectTrigger className="input-dark mt-1"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="esa" className="text-muted-foreground">Curso CIB (ESA)</Label>
                  <Select name="esa" value={formData.esa} onValueChange={(value) => handleSelectChange('esa', value)}>
                    <SelectTrigger className="input-dark mt-1"><SelectValue placeholder="Sim/Não" /></SelectTrigger>
                    <SelectContent>{YES_NO_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cfo" className="text-muted-foreground">Curso CFO</Label>
                  <Select name="cfo" value={formData.cfo} onValueChange={(value) => handleSelectChange('cfo', value)}>
                    <SelectTrigger className="input-dark mt-1"><SelectValue placeholder="Sim/Não" /></SelectTrigger>
                    <SelectContent>{YES_NO_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="patente_atual" className="text-muted-foreground">Patente Atual</Label>
                  <Select name="patente_atual" value={formData.patente_atual} onValueChange={(value) => handleSelectChange('patente_atual', value)}>
                    <SelectTrigger className="input-dark mt-1"><SelectValue placeholder="Patente" /></SelectTrigger>
                    <SelectContent>
                      {PATENTE_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="promocao_status" className="text-muted-foreground">Status Promoção (Interno)</Label>
                  <Input id="promocao_status" name="promocao_status" value={formData.promocao_status} onChange={handleChange} className="input-dark mt-1" placeholder="Ex: Promovido por mérito" disabled={userRole !== 'admin'}/>
                </div>
                <div>
                  <Label htmlFor="jogo_principal" className="text-muted-foreground">Jogo Principal</Label>
                  <Select name="jogo_principal" value={formData.jogo_principal} onValueChange={(value) => handleSelectChange('jogo_principal', value)}>
                    <SelectTrigger className="input-dark mt-1"><SelectValue placeholder="Jogo" /></SelectTrigger>
                    <SelectContent>
                      {JOGO_PRINCIPAL_OPTIONS.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="data_ingresso" className="text-muted-foreground">Data Ingresso</Label>
                  <Input id="data_ingresso" name="data_ingresso" type="date" value={formData.data_ingresso} onChange={handleChange} className="input-dark mt-1" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email" className="text-muted-foreground">Email (Login do Painel)</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="input-dark mt-1" placeholder="email.login@example.com"/>
                </div>
                {member && (
                  <div className="md:col-span-2">
                    <Label htmlFor="data_saida" className="text-muted-foreground">Data Saída (se aplicável)</Label>
                    <Input id="data_saida" name="data_saida" type="date" value={formData.data_saida} onChange={handleChange} className="input-dark mt-1" />
                  </div>
                )}
                {member && (
                  <div className="md:col-span-2">
                    <Label htmlFor="observacoes_saida" className="text-muted-foreground">Observações (Geral / Saída)</Label>
                    <Textarea id="observacoes_saida" name="observacoes_saida" value={formData.observacoes_saida} onChange={handleChange} className="input-dark mt-1 min-h-[60px] sm:min-h-[80px]" placeholder="Observações gerais ou motivo da saída"/>
                  </div>
                )}
              </div>

              {member && (
                <div className="mt-6 border-t border-border pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-destructive flex items-center">
                      <ShieldAlert className="mr-2 h-5 w-5" /> Advertências
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsWarningDialogOpen(true)} className="btn-destructive-outline">
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                    </Button>
                  </div>
                  {formData.advertencias && formData.advertencias.length > 0 ? (
                    <ul className="space-y-2 text-sm text-muted-foreground max-h-32 overflow-y-auto pr-1">
                      {formData.advertencias.map((adv, index) => (
                        <li key={index} className="p-2 border rounded-md bg-card/50">
                          <strong>{adv.tipo}</strong> ({formatDate(adv.data, 'dd/MM/yyyy')}): {adv.motivo}
                          {adv.responsavel && ` - Por: ${adv.responsavel}`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma advertência registrada.</p>
                  )}
                </div>
              )}
              
              <DialogFooter className="pt-8 flex flex-col sm:flex-row sm:justify-between items-center w-full gap-2 sticky bottom-0 bg-card pb-6 px-0 -mx-0"> 
                <div className="w-full sm:w-auto">
                  {member && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={onMarkAsLeft} 
                      className="w-full sm:w-auto btn-destructive-dark"
                      disabled={isLoading}
                    >
                      <UserX className="mr-2 h-4 w-4" /> Registrar Saída
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button type="button" variant="outline" className="w-full sm:w-auto btn-secondary-dark" onClick={() => onOpenChange(false)} disabled={isLoading}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto btn-primary" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      {member && (
        <AddWarningDialog
          isOpen={isWarningDialogOpen}
          onOpenChange={setIsWarningDialogOpen}
          onSave={handleSaveWarning}
        />
      )}
    </>
  );
};

export default MemberFormDialog;